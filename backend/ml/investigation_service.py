"""
Investigation Engine for SkyGuard AI Anomaly Detection & Forensic Triage.

Multi-layered diagnostic synthesizer that fuses:
1. LSTM Autoencoder sequence error (reconstruction MSE vs frozen threshold 0.24231)
2. Deterministic rule-based checks:
   - 1h Rate of change (|dT/dt| > 3.0°C/h)
   - Physical operational bounds [expectedMin, expectedMax]
   - Zero-variance sensor freeze (>= 3 consecutive identical readings)
3. Regional Spatial Consensus (IDW neighbor cluster check <= 150km)
4. Live External Weather Reference (Open-Meteo API queryable by station coordinates)

Produces structured InvestigationRecord objects with deterministic root-cause
attribution, severity classification, and actionable operational remedies.
"""

import math
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

try:
    from .lstm_service import lstm_service
    from ..services.weather_service import live_weather_service, haversine_km
except ImportError:
    from ml.lstm_service import lstm_service
    from services.weather_service import live_weather_service, haversine_km

# Monitored Station Metadata & Operational Climatic Envelopes
STATION_METADATA: Dict[str, Dict[str, Any]] = {
    # Chennai
    "AWS-001": {"name": "Chennai Minambakkam", "lat": 12.9900, "lon": 80.1693, "min_temp": 20.0, "max_temp": 38.0, "meteostat_id": "43279", "noaa_id": "43279099999"},
    "43279": {"name": "Chennai Minambakkam", "lat": 12.9900, "lon": 80.1693, "min_temp": 20.0, "max_temp": 38.0, "meteostat_id": "43279", "noaa_id": "43279099999"},
    "43279099999": {"name": "Chennai Minambakkam", "lat": 12.9900, "lon": 80.1693, "min_temp": 20.0, "max_temp": 38.0, "meteostat_id": "43279", "noaa_id": "43279099999"},

    # Kolkata
    "AWS-002": {"name": "Kolkata Dum Dum", "lat": 22.6547, "lon": 88.4467, "min_temp": 18.0, "max_temp": 36.5, "meteostat_id": "42809", "noaa_id": None},
    "42809": {"name": "Kolkata Dum Dum", "lat": 22.6547, "lon": 88.4467, "min_temp": 18.0, "max_temp": 36.5, "meteostat_id": "42809", "noaa_id": None},

    # Pune
    "AWS-003": {"name": "Pune", "lat": 18.5800, "lon": 73.9197, "min_temp": 18.0, "max_temp": 32.0, "meteostat_id": "43063", "noaa_id": "43063099999"},
    "43063": {"name": "Pune", "lat": 18.5800, "lon": 73.9197, "min_temp": 18.0, "max_temp": 32.0, "meteostat_id": "43063", "noaa_id": "43063099999"},
    "43063099999": {"name": "Pune", "lat": 18.5800, "lon": 73.9197, "min_temp": 18.0, "max_temp": 32.0, "meteostat_id": "43063", "noaa_id": "43063099999"},

    # Mumbai
    "AWS-004": {"name": "Mumbai Santacruz", "lat": 19.0886, "lon": 72.8679, "min_temp": 20.0, "max_temp": 35.0, "meteostat_id": "43057", "noaa_id": "43057099999"},
    "43057": {"name": "Mumbai Santacruz", "lat": 19.0886, "lon": 72.8679, "min_temp": 20.0, "max_temp": 35.0, "meteostat_id": "43057", "noaa_id": "43057099999"},
    "43057099999": {"name": "Mumbai Santacruz", "lat": 19.0886, "lon": 72.8679, "min_temp": 20.0, "max_temp": 35.0, "meteostat_id": "43057", "noaa_id": "43057099999"},

    # Ahmedabad
    "AWS-005": {"name": "Ahmedabad SVP", "lat": 23.0725, "lon": 72.6347, "min_temp": 20.0, "max_temp": 42.0, "meteostat_id": "42647", "noaa_id": "42647099999"},
    "42647": {"name": "Ahmedabad SVP", "lat": 23.0725, "lon": 72.6347, "min_temp": 20.0, "max_temp": 42.0, "meteostat_id": "42647", "noaa_id": "42647099999"},
    "42647099999": {"name": "Ahmedabad SVP", "lat": 23.0725, "lon": 72.6347, "min_temp": 20.0, "max_temp": 42.0, "meteostat_id": "42647", "noaa_id": "42647099999"},

    # Hyderabad
    "AWS-006": {"name": "Hyderabad Begumpet", "lat": 17.4531, "lon": 78.4676, "min_temp": 19.0, "max_temp": 37.0, "meteostat_id": "43128", "noaa_id": "43128099999"},
    "43128": {"name": "Hyderabad Begumpet", "lat": 17.4531, "lon": 78.4676, "min_temp": 19.0, "max_temp": 37.0, "meteostat_id": "43128", "noaa_id": "43128099999"},
    "43128099999": {"name": "Hyderabad Begumpet", "lat": 17.4531, "lon": 78.4676, "min_temp": 19.0, "max_temp": 37.0, "meteostat_id": "43128", "noaa_id": "43128099999"},

    # Bengaluru
    "AWS-007": {"name": "Bengaluru HAL", "lat": 12.9500, "lon": 77.6680, "min_temp": 16.0, "max_temp": 33.0, "meteostat_id": "43295", "noaa_id": "43295099999"},
    "43295": {"name": "Bengaluru HAL", "lat": 12.9500, "lon": 77.6680, "min_temp": 16.0, "max_temp": 33.0, "meteostat_id": "43295", "noaa_id": "43295099999"},
    "43295099999": {"name": "Bengaluru HAL", "lat": 12.9500, "lon": 77.6680, "min_temp": 16.0, "max_temp": 33.0, "meteostat_id": "43295", "noaa_id": "43295099999"},
}


class InvestigationService:
    def __init__(self):
        # Sliding buffer of recent temperature readings per station_id for ROC and Zero-Variance: list of (dt, temp)
        self.station_readings_history: Dict[str, List[Tuple[datetime, float]]] = {}
        # Active investigation records keyed by station_id
        self.active_investigations: Dict[str, Dict[str, Any]] = {}
        # Station current readings cache for spatial consensus
        self.latest_station_readings: Dict[str, Dict[str, Any]] = {}

    def get_metadata(self, station_id: str) -> Dict[str, Any]:
        sid = str(station_id)
        if sid in STATION_METADATA:
            return STATION_METADATA[sid]
        # Fallback default metadata
        return {
            "name": f"Station {station_id}",
            "lat": 19.0760,
            "lon": 72.8777,
            "min_temp": 18.0,
            "max_temp": 38.0,
            "meteostat_id": sid,
            "noaa_id": None,
        }

    def evaluate_telemetry(
        self,
        packet: Dict[str, Any],
        ml_result: Optional[Dict[str, Any]] = None,
        comm_failure_hours: float = 0.0
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluates a live telemetry packet against the 4 diagnostic layers.
        Builds and returns an InvestigationRecord if triggered, or None if pristine.
        """
        station_id = str(packet.get("station_id", "UNKNOWN"))
        source = str(packet.get("source", "Meteostat")).strip().upper()
        meta = self.get_metadata(station_id)
        station_name = meta["name"]

        # Parse timestamp
        raw_ts = packet.get("timestamp")
        if isinstance(raw_ts, datetime):
            dt = raw_ts
        elif isinstance(raw_ts, str):
            try:
                dt = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
            except Exception:
                try:
                    dt = datetime.strptime(raw_ts, "%Y-%m-%d %H:%M:%S")
                except Exception:
                    dt = datetime.now()
        else:
            dt = datetime.now()

        timestamp_str = dt.strftime("%Y-%m-%d %H:%M:%S")

        # Core temperature reading
        temp_val = packet.get("temperature")
        if temp_val is None:
            temp = 28.0
        else:
            try:
                temp = float(temp_val)
            except (ValueError, TypeError):
                temp = 28.0

        fault_type = packet.get("fault_type", "NORMAL")
        affected_var = packet.get("affected_feature", "temperature")
        if not affected_var or affected_var == "None":
            affected_var = "temperature"

        # Update sliding history for this station
        if station_id not in self.station_readings_history:
            self.station_readings_history[station_id] = []
        hist = self.station_readings_history[station_id]
        hist.append((dt, temp))
        if len(hist) > 24:
            hist.pop(0)

        # Cache latest station observation for spatial consensus
        self.latest_station_readings[station_id] = {
            "station_id": station_id,
            "name": station_name,
            "lat": meta["lat"],
            "lon": meta["lon"],
            "temperature": temp,
            "timestamp": timestamp_str
        }

        # -------------------------------------------------------------
        # LAYER 1: LSTM Autoencoder Results (Reused from ML Service)
        # -------------------------------------------------------------
        is_3h_cadence = lstm_service.is_series_excluded(station_id, source)
        
        if is_3h_cadence:
            lstm_mse = None
            lstm_threshold = round(lstm_service.threshold, 5)
            lstm_status = "NOT_APPLICABLE (3h cadence)"
            lstm_error_ratio = None
            dominant_feature = "Not applicable (3h cadence)"
        elif ml_result:
            lstm_mse = ml_result.get("reconstruction_error")
            lstm_threshold = ml_result.get("threshold", round(lstm_service.threshold, 5))
            lstm_status = ml_result.get("status", "NORMAL")
            lstm_error_ratio = ml_result.get("error_ratio")
            dominant_feature = ml_result.get("dominant_feature", "None")
        else:
            # Run inference via lstm_service if not precomputed
            infer_res = lstm_service.process_packet(packet, fault_type, affected_var)
            lstm_mse = infer_res.get("reconstruction_error")
            lstm_threshold = infer_res.get("threshold", round(lstm_service.threshold, 5))
            lstm_status = infer_res.get("status", "NORMAL")
            lstm_error_ratio = infer_res.get("error_ratio")
            dominant_feature = infer_res.get("dominant_feature", "None")

        # -------------------------------------------------------------
        # LAYER 2: Deterministic Rule-Based Checks
        # -------------------------------------------------------------
        # A. Physical Range Check
        exp_min = meta["min_temp"]
        exp_max = meta["max_temp"]
        range_pass = (exp_min <= temp <= exp_max)
        physical_range_check = {
            "status": "PASS" if range_pass else "FAIL",
            "value": round(temp, 2),
            "expected_min": exp_min,
            "expected_max": exp_max,
            "unit": "°C"
        }

        # B. 1h Rate of Change Check (|dT/dt|)
        roc_val = 0.0
        roc_threshold = 3.0 # Standard meteorological threshold 3.0°C/h
        if len(hist) >= 2:
            prev_temp = hist[-2][1]
            roc_val = abs(temp - prev_temp)
        roc_pass = (roc_val <= roc_threshold)
        rate_of_change_check = {
            "status": "PASS" if roc_pass else "FAIL",
            "value": round(roc_val, 2),
            "threshold": roc_threshold,
            "unit": "°C/h"
        }

        # C. Zero-Variance Sensor Freeze Check (>= 4 consecutive identical values or explicitly injected FREEZE)
        consecutive_frozen = 1
        if len(hist) >= 4:
            recent_temps = [t[1] for t in hist[-6:]]
            diffs = [abs(recent_temps[i] - recent_temps[i-1]) for i in range(1, len(recent_temps))]
            zero_diffs = sum(1 for d in diffs if d < 0.001)
            if zero_diffs >= 4 or fault_type == "FREEZE":
                consecutive_frozen = max(4, zero_diffs + 1)
        zero_variance_pass = (consecutive_frozen < 4 and fault_type != "FREEZE")
        zero_variance_check = {
            "status": "PASS" if zero_variance_pass else "FAIL",
            "consecutive_constant_readings": consecutive_frozen
        }

        # -------------------------------------------------------------
        # LAYER 3: Live External Weather Reference (Open-Meteo)
        # -------------------------------------------------------------
        ext_weather_check = self._check_external_weather(meta["lat"], meta["lon"], temp)

        # -------------------------------------------------------------
        # LAYER 4: Regional Spatial Consensus (Neighbors <= 250km)
        # -------------------------------------------------------------
        spatial_check = self._check_spatial_consensus(station_id, meta["lat"], meta["lon"], temp)

        # -------------------------------------------------------------
        # STEP 1: TRIGGER LOGIC EVALUATION
        # -------------------------------------------------------------
        triggers: List[str] = []

        # 1. LSTM Anomaly (hourly cadence stations only)
        if not is_3h_cadence and lstm_status == "ANOMALY":
            triggers.append("LSTM_ANOMALY")

        # 2. Rate-of-Change Breach (applies to ALL stations)
        if not roc_pass:
            triggers.append("RATE_OF_CHANGE_FAIL")

        # 3. Physical Range Breach (applies to ALL stations)
        if not range_pass:
            triggers.append("PHYSICAL_RANGE_FAIL")

        # 4. Zero-Variance Sensor Freeze (applies to ALL stations)
        if not zero_variance_pass:
            triggers.append("ZERO_VARIANCE_FROZEN")

        # 5. Spatial Consensus Mismatch
        if spatial_check["status"] == "MISMATCH":
            triggers.append("SPATIAL_MISMATCH")

        # 6. Communication Failure
        is_comm_fault = (
            fault_type in ("communication-failure", "communication_failure", "COMMUNICATION_FAILURE")
            or comm_failure_hours >= 2.0
        )
        if is_comm_fault:
            triggers.append("COMMUNICATION_FAILURE")

        # 7. Non-temperature sensor bounds or rate breaches
        is_other_fault = fault_type in ("SPIKE", "DRIFT", "HUMIDITY_SPIKE", "PRESSURE_DROP", "WIND_ANOMALY") and affected_var != "temperature"
        if is_other_fault:
            triggers.append("RATE_OF_CHANGE_FAIL")

        # 8. Sensor Drift
        if fault_type == "DRIFT":
            triggers.append("HISTORICAL_DRIFT_EXCESS")

        # If zero triggers fired, clear active investigation and return None
        if not triggers:
            if station_id in self.active_investigations:
                del self.active_investigations[station_id]
            return None

        # -------------------------------------------------------------
        # STEP 3: SEVERITY & ROOT-CAUSE SYNTHESIS
        # -------------------------------------------------------------
        severity, probable_cause, recommended_action = self._synthesize_verdict(
            triggers=triggers,
            is_3h_cadence=is_3h_cadence,
            lstm_status=lstm_status,
            lstm_error_ratio=lstm_error_ratio,
            physical_range_pass=range_pass,
            roc_val=roc_val,
            zero_variance_pass=zero_variance_pass,
            ext_weather_check=ext_weather_check,
            spatial_check=spatial_check,
            temp=temp,
            station_name=station_name,
            comm_failure_hours=comm_failure_hours,
            affected_var=affected_var
        )

        record_id = f"INV-{station_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"

        record: Dict[str, Any] = {
            "id": record_id,
            "station_id": station_id,
            "station_name": station_name,
            "timestamp": timestamp_str,
            "affected_variable": affected_var,
            "parameter": affected_var,
            "observed_value": round(temp, 2),
            "expected_range": f"{exp_min:.1f}°C — {exp_max:.1f}°C",
            "severity": severity,
            "fault_type_if_known": fault_type if fault_type != "NORMAL" else "ANOMALY",
            
            # LSTM block
            "lstm_reconstruction_error": round(lstm_mse, 5) if lstm_mse is not None else None,
            "lstm_threshold": lstm_threshold,
            "lstm_status": lstm_status,
            "lstm_error_ratio": round(lstm_error_ratio, 2) if lstm_error_ratio is not None else None,
            "dominant_feature": dominant_feature,

            # Deterministic rule checks
            "rate_of_change_check": rate_of_change_check,
            "physical_range_check": physical_range_check,
            "zero_variance_check": zero_variance_check,

            # Multi-layer reference checks
            "external_weather_comparison": ext_weather_check,
            "spatial_consensus": spatial_check,
            "historical_drift": self._get_drift_evidence(station_id, affected_var, temp),

            # Forensic verdict
            "probable_cause": probable_cause,
            "recommended_action": recommended_action,
            "trigger_source": triggers,
        }

        # Store in active registry
        self.active_investigations[station_id] = record
        return record

    def _check_external_weather(self, lat: float, lon: float, temp: float) -> Dict[str, Any]:
        """Compares reading with Open-Meteo external weather feed."""
        try:
            live_data = live_weather_service.fetch_live_weather(force=False)
            stations = live_data.get("stations", [])
            if not stations or live_data.get("api_status") != "ONLINE":
                return {
                    "status": "UNAVAILABLE",
                    "external_source": "Open-Meteo API",
                    "external_value": None,
                    "diff": None,
                    "distance_km": None
                }

            # Find closest Open-Meteo station
            closest_st = None
            min_dist = float("inf")
            for st in stations:
                st_lat = st.get("lat")
                st_lon = st.get("lon")
                if st_lat is not None and st_lon is not None:
                    d = haversine_km(lat, lon, st_lat, st_lon)
                    if d < min_dist:
                        min_dist = d
                        closest_st = st

            if not closest_st or min_dist > 80.0:
                return {
                    "status": "UNAVAILABLE",
                    "external_source": "Open-Meteo API (Out of range)",
                    "external_value": None,
                    "diff": None,
                    "distance_km": round(min_dist, 1) if closest_st else None
                }

            ext_temp = closest_st.get("temperature")
            if ext_temp is None:
                return {
                    "status": "UNAVAILABLE",
                    "external_source": f"Open-Meteo ({closest_st['name']})",
                    "external_value": None,
                    "diff": None,
                    "distance_km": round(min_dist, 1)
                }

            diff = round(abs(temp - ext_temp), 2)
            is_match = (diff <= 3.5) # Within 3.5°C is considered meteorologically matching

            return {
                "status": "MATCH" if is_match else "MISMATCH",
                "external_source": f"Open-Meteo API ({closest_st['name']})",
                "external_value": round(ext_temp, 2),
                "diff": diff,
                "distance_km": round(min_dist, 1)
            }
        except Exception:
            return {
                "status": "UNAVAILABLE",
                "external_source": "Open-Meteo API",
                "external_value": None,
                "diff": None,
                "distance_km": None
            }

    def _check_spatial_consensus(self, station_id: str, lat: float, lon: float, temp: float) -> Dict[str, Any]:
        """
        Compares reading with nearest operational stations using Inverse Distance Weighting (IDW)
        strictly within <= 150.0 km radius.
        
        Applies confidence-tiered 3-way classification:
        - 0 valid peers: INSUFFICIENT EVIDENCE (confidence: NONE)
        - 1 valid peer: REGIONAL EVENT or ISOLATED SENSOR ANOMALY (confidence: LOW, based on 1 peer station)
        - >=2 valid peers: REGIONAL EVENT or ISOLATED SENSOR ANOMALY (confidence: HIGH, based on N peer stations)
        
        Tolerance rule for REGIONAL EVENT confirmation:
        Same sign as target deviation AND |delta_peer| >= 0.50 * |delta_target| (the 50% rule).
        """
        SPATIAL_RADIUS_KM = 150.0
        
        target_meta = self.get_metadata(station_id)
        target_mid = (target_meta["min_temp"] + target_meta["max_temp"]) / 2.0
        target_delta = round(temp - target_mid, 2)
        
        neighbors = []
        
        # 1. Search active operational telemetry cache
        for sid, st_info in self.latest_station_readings.items():
            if sid == station_id:
                continue
            d = haversine_km(lat, lon, st_info["lat"], st_info["lon"])
            if d <= SPATIAL_RADIUS_KM:
                pmeta = self.get_metadata(sid)
                pmid = (pmeta["min_temp"] + pmeta["max_temp"]) / 2.0
                pval = round(st_info["temperature"], 2)
                pdelta = round(pval - pmid, 2)
                
                # The 50% Rule: same sign AND |delta_peer| >= 0.50 * |delta_target|
                if abs(target_delta) <= 2.0:
                    confirms = (abs(pdelta) <= 2.5)
                else:
                    same_sign = (target_delta * pdelta > 0)
                    sufficient_mag = (abs(pdelta) >= 0.50 * abs(target_delta))
                    confirms = (same_sign and sufficient_mag)
                
                neighbors.append({
                    "station_id": sid,
                    "station_name": st_info.get("name", pmeta["name"]),
                    "distance_km": round(d, 1),
                    "value": pval,
                    "expected_midpoint": round(pmid, 1),
                    "delta": pdelta,
                    "confirms_target": confirms,
                    "status": "Deviating with Target" if (confirms and abs(target_delta) > 2.0) else "Nominal / Baseline"
                })

        # 2. Fallback against station metadata baseline cluster if cache has no neighbors
        if not neighbors:
            for sid, meta in STATION_METADATA.items():
                if sid == station_id or sid.startswith("4"): # Avoid alias duplicates
                    continue
                d = haversine_km(lat, lon, meta["lat"], meta["lon"])
                if d <= SPATIAL_RADIUS_KM:
                    mid_temp = (meta["min_temp"] + meta["max_temp"]) / 2.0
                    pdelta = 0.0
                    confirms = (abs(target_delta) <= 2.0)
                    neighbors.append({
                        "station_id": sid,
                        "station_name": meta["name"],
                        "distance_km": round(d, 1),
                        "value": round(mid_temp, 2),
                        "expected_midpoint": round(mid_temp, 1),
                        "delta": pdelta,
                        "confirms_target": confirms,
                        "status": "Climatological Baseline"
                    })

        neighbors.sort(key=lambda x: x["distance_km"])
        k_neighbors = neighbors[:3]
        peer_count = len(k_neighbors)

        # CASE 1: 0 valid peers within <= 150km -> INSUFFICIENT EVIDENCE (confidence: NONE)
        if peer_count == 0:
            return {
                "status": "INSUFFICIENT_NEIGHBORS",
                "classification": "INSUFFICIENT EVIDENCE",
                "confidence": "NONE",
                "peer_basis": "no peer stations within 150km",
                "explanation": "No peer AWS stations within 150km radius. Spatial correlation cannot be evaluated.",
                "neighbor_count": 0,
                "expected_value": None,
                "diff": None,
                "target_delta": target_delta,
                "neighbors": []
            }

        # Calculate IDW expected temperature
        weights = [1.0 / max(n["distance_km"], 5.0) for n in k_neighbors]
        sum_w = sum(weights)
        idw_expected = sum(n["value"] * w for n, w in zip(k_neighbors, weights)) / sum_w
        diff = round(abs(temp - idw_expected), 2)

        # CASE 2: 1 valid peer within <= 150km -> Confidence: LOW
        if peer_count == 1:
            peer = k_neighbors[0]
            confidence = "LOW"
            peer_basis = "based on 1 peer station"
            
            if abs(target_delta) > 2.0 and peer["confirms_target"]:
                classification = "REGIONAL EVENT"
                status = "MATCH"
                explanation = f"Single peer {peer['station_name']} ({peer['distance_km']}km) confirms same-direction deviation ({peer['delta']:+.1f}°C vs target {target_delta:+.1f}°C, >=50% magnitude). Low confidence based on 1 peer station."
            elif abs(target_delta) <= 2.0 and diff <= 3.5:
                classification = "REGIONAL EVENT"
                status = "MATCH"
                explanation = f"Target and peer {peer['station_name']} ({peer['distance_km']}km) both report nominal diurnal baseline values."
            else:
                classification = "ISOLATED SENSOR ANOMALY"
                status = "MISMATCH"
                explanation = f"Single peer {peer['station_name']} ({peer['distance_km']}km) contradicts deviation (peer {peer['delta']:+.1f}°C vs target {target_delta:+.1f}°C). Low confidence based on 1 peer station."

            return {
                "status": status,
                "classification": classification,
                "confidence": confidence,
                "peer_basis": peer_basis,
                "explanation": explanation,
                "neighbor_count": 1,
                "expected_value": round(idw_expected, 2),
                "diff": diff,
                "target_delta": target_delta,
                "neighbors": k_neighbors
            }

        # CASE 3: >= 2 valid peers within <= 150km -> Confidence: HIGH
        confidence = "HIGH"
        peer_basis = f"based on {peer_count} peer stations"
        confirming_peers = sum(1 for n in k_neighbors if n["confirms_target"])

        if abs(target_delta) > 2.0 and confirming_peers >= 2:
            classification = "REGIONAL EVENT"
            status = "MATCH"
            explanation = f"{confirming_peers} of {peer_count} peers within 150km confirm same-direction deviation (>=50% magnitude). High confidence regional meteorological event."
        elif abs(target_delta) <= 2.0 and diff <= 3.5:
            classification = "REGIONAL EVENT"
            status = "MATCH"
            explanation = f"All {peer_count} peers within 150km demonstrate coherent regional atmospheric baseline."
        else:
            classification = "ISOLATED SENSOR ANOMALY"
            status = "MISMATCH"
            explanation = f"Peers within 150km remain nominal or contradict deviation. High confidence isolated sensor anomaly."

        return {
            "status": status,
            "classification": classification,
            "confidence": confidence,
            "peer_basis": peer_basis,
            "explanation": explanation,
            "neighbor_count": peer_count,
            "expected_value": round(idw_expected, 2),
            "diff": diff,
            "target_delta": target_delta,
            "neighbors": k_neighbors
        }

    def _get_drift_evidence(self, station_id: str, affected_var: str, temp: float) -> Optional[Dict[str, Any]]:
        """Queries historical drift service for 30-day baseline and drift trend."""
        try:
            from .historical_drift_service import historical_drift_service
            var_name = affected_var.lower()
            sensor_key = "temperature" if "temp" in var_name else ("humidity" if "hum" in var_name else ("pressure" if "press" in var_name else "temperature"))
            drift_res = historical_drift_service.analyze_drift(station_id, sensor=sensor_key, time_range="30d")
            if drift_res.get("status") == "SUCCESS":
                d = drift_res.get("drift", {})
                b = drift_res.get("baseline", {})
                return {
                    "classification": d.get("classification", "NORMAL"),
                    "confidence": d.get("confidence", "HIGH"),
                    "slope_per_day": d.get("slope_per_day", 0.0),
                    "rate_per_week": d.get("rate_per_week", 0.0),
                    "baseline_mean": b.get("mean", temp),
                    "baseline_std": b.get("std", 4.0),
                    "deviation_from_baseline": d.get("deviation_from_baseline", 0.0),
                    "duration_days": d.get("duration_days", 30.0),
                    "status_description": d.get("status_description", ""),
                    "reference_timestamp": drift_res.get("reference_timestamp", "2025-12-31 23:00:00")
                }
            return None
        except Exception:
            return None

    def _synthesize_verdict(
        self,
        triggers: List[str],
        is_3h_cadence: bool,
        lstm_status: Optional[str],
        lstm_error_ratio: Optional[float],
        physical_range_pass: bool,
        roc_val: float,
        zero_variance_pass: bool,
        ext_weather_check: Dict[str, Any],
        spatial_check: Dict[str, Any],
        temp: float,
        station_name: str,
        comm_failure_hours: float,
        affected_var: str = "temperature"
    ) -> Tuple[str, str, str]:
        """
        Synthesizes (severity, probable_cause, recommended_action) according to Step 3 Decision Table.
        """
        # COMMUNICATION FAILURE
        if "COMMUNICATION_FAILURE" in triggers:
            hours = max(2.0, round(comm_failure_hours, 1)) if comm_failure_hours > 0 else 2.5
            return (
                "CRITICAL",
                f"Telemetry telemetry link down for {hours}h. RTU modem offline or communication gateway unreachable.",
                "Create Maintenance Ticket"
            )

        # GENUINE WEATHER EVENT CHECK:
        ext_matches = ext_weather_check.get("status") == "MATCH"
        spatial_matches = spatial_check.get("status") == "MATCH"
        spatial_is_regional = spatial_check.get("classification") == "REGIONAL EVENT"

        if affected_var == "temperature" and (spatial_is_regional or (ext_matches and spatial_matches)) and ("PHYSICAL_RANGE_FAIL" in triggers or "RATE_OF_CHANGE_FAIL" in triggers or "LSTM_ANOMALY" in triggers):
            return (
                "LOW",
                f"Multi-station regional weather event confirmed by spatial peers ({spatial_check.get('explanation', '')}). Corroborated environmental front.",
                "Possible Genuine Weather Event"
            )

        # ZERO VARIANCE SENSOR FREEZE
        if "ZERO_VARIANCE_FROZEN" in triggers:
            return (
                "HIGH",
                f"Transducer freeze / stuck Analog-to-Digital Converter. Sensor reporting static {temp:.1f}°C across consecutive cycles while ambient diurnal profile varies.",
                "Sensor Inspection Required"
            )

        # SENSOR DRIFT
        if "HISTORICAL_DRIFT_EXCESS" in triggers:
            return (
                "HIGH",
                f"Progressive sensor drift detected on {station_name}. Persistent systematic offset diverging from historical baseline envelope.",
                "Sensor Inspection Required"
            )

        # CRITICAL SEVERITY: 2+ independent signals agree AND neither external nor spatial supports environmental
        independent_signals = 0
        if "LSTM_ANOMALY" in triggers:
            independent_signals += 1
        if "PHYSICAL_RANGE_FAIL" in triggers:
            independent_signals += 1
        if "RATE_OF_CHANGE_FAIL" in triggers and roc_val >= 4.5:
            independent_signals += 1
        if "SPATIAL_MISMATCH" in triggers:
            independent_signals += 1

        if independent_signals >= 2:
            return (
                "CRITICAL",
                f"Multi-layer anomaly confirmed: sequence reconstruction error and physical boundaries both breached. External weather and spatial peers confirm isolated instrument fault.",
                "Create Maintenance Ticket"
            )

        # HIGH SEVERITY: Deterministic rule confirmed even if LSTM stayed NORMAL
        if "RATE_OF_CHANGE_FAIL" in triggers:
            return (
                "HIGH",
                f"Rapid rate-of-change violation ({roc_val:.1f}°C/h > 3.0°C/h). Exceeds physical atmospheric gradient limit for station {station_name}.",
                "Sensor Inspection Required"
            )

        if "PHYSICAL_RANGE_FAIL" in triggers:
            return (
                "HIGH",
                f"Operational band breach: observed {temp:.1f}°C falls outside historical diurnal envelope.",
                "Sensor Inspection Required"
            )

        # MEDIUM SEVERITY: Exactly 1 isolated/weak signal
        if "LSTM_ANOMALY" in triggers:
            return (
                "MEDIUM",
                f"LSTM sequence anomaly detected (ratio {lstm_error_ratio:.2f}x > 1.0x). Mild sequence divergence without physical limit violation.",
                "Continue Monitoring"
            )

        # Default fallback
        return (
            "MEDIUM",
            f"Uncorrelated telemetry deviation flagged in {station_name}. Awaiting cross-layer confirmation.",
            "Verify with External Weather"
        )

    def get_active_investigations(self) -> List[Dict[str, Any]]:
        return list(self.active_investigations.values())

    def get_station_investigation(self, station_id: str) -> Optional[Dict[str, Any]]:
        return self.active_investigations.get(str(station_id))

    def clear_investigation(self, station_id: str) -> bool:
        sid = str(station_id)
        if sid in self.active_investigations:
            del self.active_investigations[sid]
        if sid in self.station_readings_history:
            del self.station_readings_history[sid]
        return True

    def clear_all(self):
        self.active_investigations.clear()
        self.station_readings_history.clear()
        self.latest_station_readings.clear()


# Singleton investigation engine instance
investigation_service = InvestigationService()
