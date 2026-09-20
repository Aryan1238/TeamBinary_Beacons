import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
try:
    from .temporal_analysis import TemporalAnalyzer
    from .spatial_analysis import SpatialAnalyzer
    from .multivariate_analysis import MultivariateAnalyzer
    from .explainability import ExplainabilityEngine
    from .imputation import DataHealingEngine
except ImportError:
    from temporal_analysis import TemporalAnalyzer
    from spatial_analysis import SpatialAnalyzer
    from multivariate_analysis import MultivariateAnalyzer
    from explainability import ExplainabilityEngine
    from imputation import DataHealingEngine

class AnomalyDetectionEngine:
    """
    Unified AI Anomaly Detection Engine for Automatic Weather Stations (AWS).
    Monitors Temperature (°C), Pressure (hPa), and Humidity (%).
    """
    def __init__(self):
        self.temporal = TemporalAnalyzer(window_size=15)
        self.spatial = SpatialAnalyzer(k_neighbors=4, max_radius_km=400.0)
        self.multivariate = MultivariateAnalyzer()
        self.explainer = ExplainabilityEngine()
        self.imputer = DataHealingEngine()

    def evaluate_station_reading(
        self,
        station: Dict[str, Any],
        all_stations: List[Dict[str, Any]],
        historical_series: Dict[str, List[float]],
        forced_anomaly_type: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Runs comprehensive analysis pipeline on a station observation.
        Returns an AnomalyRecord dict if an anomaly or genuine weather event is detected.
        """
        st_id = station["id"]
        temp = station.get("temperature", 28.5)
        press = station.get("pressure", 1010.0)
        rh = station.get("humidity", 65.0)

        # 1. Check Offline / Communication Failure
        if station.get("is_offline", False):
            return {
                "id": f"ANO-{uuid.uuid4().hex[:6].upper()}",
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "station_id": st_id,
                "station_name": station["name"],
                "parameter": "Communication",
                "observed_value": 0.0,
                "expected_value": 1.0,
                "deviation": -1.0,
                "anomaly_score": 0.98,
                "confidence": 99.0,
                "severity": "CRITICAL",
                "anomaly_type": "Communication Error",
                "root_cause": "Telemetry telemetry interruption / RTU power failure",
                "root_cause_breakdown": [
                    {"cause": "Communication glitch", "probability": 0.88},
                    {"cause": "RTU power failure", "probability": 0.08},
                    {"cause": "Network gateway timeout", "probability": 0.04}
                ],
                "is_genuine_weather": False,
                "feature_contributions": [
                    {"feature": "Heartbeat Failure", "importance": 0.85, "direction": "+"},
                    {"feature": "Packet Loss (100%)", "importance": 0.15, "direction": "+"}
                ],
                "explanation": f"Station {station['name']} has not transmitted telemetry packets for > 5 acquisition windows. RTU or GPRS uplink dropped.",
                "corrected_value": 0.0,
                "correction_confidence": 0.0,
                "status": "Active",
                "accepted_correction": False,
                "data_lineage": {"status": "Offline_No_Data"}
            }

        # 2. Check Frozen Sensor
        temp_history = historical_series.get(f"{st_id}_temp", [temp] * 5)
        is_frozen, frozen_count = self.temporal.check_frozen_sensor(temp_history)
        if station.get("is_frozen", False) or is_frozen:
            return {
                "id": f"ANO-{uuid.uuid4().hex[:6].upper()}",
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "station_id": st_id,
                "station_name": station["name"],
                "parameter": "Temperature",
                "observed_value": temp,
                "expected_value": round(temp + 1.8, 1),
                "deviation": -1.8,
                "anomaly_score": 0.89,
                "confidence": 94.5,
                "severity": "HIGH",
                "anomaly_type": "Frozen Sensor",
                "root_cause": "Stuck ADC / transducer freeze",
                "root_cause_breakdown": [
                    {"cause": "Sensor transducer stuck", "probability": 0.79},
                    {"cause": "Firmware buffer freeze", "probability": 0.15},
                    {"cause": "Extreme static condition", "probability": 0.06}
                ],
                "is_genuine_weather": False,
                "feature_contributions": [
                    {"feature": "Zero temporal variance", "importance": 0.62, "direction": "-"},
                    {"feature": "Diurnal cycle flattening", "importance": 0.24, "direction": "-"},
                    {"feature": "Neighbor variance mismatch", "importance": 0.14, "direction": "+"}
                ],
                "explanation": f"Station {station['name']} temperature has remained locked at {temp:.2f}°C without micro-variance for {max(6, frozen_count)} consecutive cycles. High probability of transducer lock.",
                "corrected_value": round(temp + 1.4, 1),
                "correction_confidence": 91.0,
                "status": "Active",
                "accepted_correction": False,
                "data_lineage": {"method": "Diurnal_Harmonic_Recovery"}
            }

        # 3. Analyze Temporal Consistency
        temporal_res = self.temporal.analyze_series(temp_history, temp)
        
        # 4. Analyze Spatial Consistency
        spatial_res = self.spatial.analyze_spatial_consistency(station, all_stations, "temperature")

        # 5. Analyze Multivariate Physical Consistency
        multivariate_res = self.multivariate.check_physical_envelope(temp, press, rh)

        # 6. Evaluate Genuine Weather Event vs Sensor Fault
        is_regional_weather = station.get("is_regional_event", False) or spatial_res["is_regional_weather_event"]

        # Composite anomaly score
        t_score = temporal_res["temporal_anomaly_score"]
        s_score = spatial_res["spatial_inconsistency_score"]
        m_score = multivariate_res["multivariate_anomaly_score"]

        # If it's a regional weather event, high spatial agreement overrides isolated sensor alarm!
        if is_regional_weather:
            composite_score = 0.42  # Warning/Informational rather than critical sensor alarm
            anomaly_type = "Genuine Weather Event"
            severity = "WARNING"
            confidence = 96.4
            root_cause = "Genuine regional meteorological event (convective system / squall)"
            root_cause_breakdown = [
                {"cause": "Extreme weather event", "probability": 0.92},
                {"cause": "Multi-station atmospheric wave", "probability": 0.06},
                {"cause": "Sensor malfunction", "probability": 0.02}
            ]
        elif t_score > 0.75 or s_score > 0.65 or multivariate_res["is_physically_impossible"]:
            # Critical sensor anomaly (e.g. 55°C spike!)
            composite_score = max(0.91, round((t_score * 0.4 + s_score * 0.4 + m_score * 0.2), 3))
            severity = "CRITICAL" if composite_score > 0.88 or temp > 50 else "HIGH"
            confidence = round(min(99.2, 92.0 + composite_score * 7.0), 1)
            
            if temp > 50.0 or abs(temporal_res["deviation"]) > 15:
                anomaly_type = "Sudden Spike"
            elif temporal_res["deviation"] < -12:
                anomaly_type = "Sudden Drop"
            elif multivariate_res["is_physically_impossible"]:
                anomaly_type = "Multivariate Inconsistency"
            else:
                anomaly_type = "Spatial Anomaly"

            root_cause = "Sensor malfunction"
            root_cause_breakdown = [
                {"cause": "Sensor malfunction", "probability": 0.82},
                {"cause": "Calibration drift", "probability": 0.11},
                {"cause": "Extreme weather event", "probability": 0.05},
                {"cause": "Communication issue", "probability": 0.02}
            ]
        elif t_score > 0.45 or s_score > 0.45:
            composite_score = round(max(t_score, s_score), 2)
            severity = "WARNING"
            confidence = 88.5
            anomaly_type = "Sensor Drift"
            root_cause = "Calibration drift"
            root_cause_breakdown = [
                {"cause": "Calibration drift", "probability": 0.68},
                {"cause": "Environmental boundary turbulence", "probability": 0.22},
                {"cause": "Sensor malfunction", "probability": 0.10}
            ]
        else:
            # Healthy reading - no active anomaly
            return None

        # Impute corrected value
        expected_val = spatial_res["regional_expected"] if spatial_res["regional_expected"] else temporal_res["expected"]
        healing = self.imputer.impute_value(
            raw_val=temp,
            temporal_expected=temporal_res["expected"],
            spatial_expected=expected_val,
            spatial_confidence=spatial_res["neighbor_agreement_ratio"]
        )

        explanation_data = self.explainer.generate_explanation(
            station_id=st_id,
            parameter="Temperature",
            observed=temp,
            expected=expected_val,
            temporal_res=temporal_res,
            spatial_res=spatial_res,
            multivariate_res=multivariate_res,
            is_regional=is_regional_weather
        )

        return {
            "id": f"ANO-{uuid.uuid4().hex[:6].upper()}",
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "station_id": st_id,
            "station_name": station["name"],
            "parameter": "Temperature",
            "observed_value": temp,
            "expected_value": expected_val,
            "deviation": round(temp - expected_val, 2),
            "anomaly_score": composite_score,
            "confidence": confidence,
            "severity": severity,
            "anomaly_type": anomaly_type,
            "root_cause": root_cause,
            "root_cause_breakdown": root_cause_breakdown,
            "is_genuine_weather": is_regional_weather,
            "feature_contributions": explanation_data["feature_contributions"],
            "explanation": explanation_data["summary"],
            "corrected_value": healing["corrected_value"],
            "correction_confidence": healing["confidence"],
            "status": "Active",
            "accepted_correction": False,
            "data_lineage": healing["lineage"]
        }
