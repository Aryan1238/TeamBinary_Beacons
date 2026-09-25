"""
SkyGuard AI — Simulation Lab & Fault Injection Service
Full pipeline testing engine:
Simulation -> Live Telemetry -> ML Inference -> Anomaly Alert -> Deep-Dive Triage
-> Spatial Intelligence -> Sensor Health -> Maintenance Ticket.

Features:
1. Live 24-hour LSTM buffer warm-up from historical dataset (read-only)
2. 3h synoptic station exclusion handling (routed to rule-based only)
3. 8 Standard Fault Scenarios matching empirical injection ranges
4. Real-time 8-stage pipeline progression tracking
5. Simulation ticket isolation (tagged is_simulation=True, excluded from prod KPIs)
6. Persistent simulation history in backend/data/simulation_history.json
7. Zero corruption of historical data or model files
"""

import os
import json
import time
import math
import random
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd

try:
    from ..ml.lstm_service import lstm_service
    from ..ml.investigation_service import investigation_service, STATION_METADATA
    from ..ml.sensor_health_service import sensor_health_service, STATION_CONFIGS, DEFAULT_TELEMETRY, SENSOR_INFO
    from ..ml.historical_drift_service import historical_drift_service
    from .maintenance_service import maintenance_service
except ImportError:
    from ml.lstm_service import lstm_service
    from ml.investigation_service import investigation_service, STATION_METADATA
    from ml.sensor_health_service import sensor_health_service, STATION_CONFIGS, DEFAULT_TELEMETRY, SENSOR_INFO
    from ml.historical_drift_service import historical_drift_service
    from services.maintenance_service import maintenance_service

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
SIM_HISTORY_FILE = os.path.join(DATA_DIR, "simulation_history.json")
HISTORICAL_CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "clean", "merged", "weather_merged.csv")

CITY_NAME_MAP = {
    "AWS-001": "Chennai",
    "AWS-002": "Bengaluru",
    "AWS-003": "Pune",
    "AWS-004": "Mumbai",
    "AWS-005": "Kolkata",
    "AWS-006": "Ahmedabad",
    "AWS-007": "Hyderabad"
}

# Empirical fault scenario parameter definitions
SCENARIO_CONFIGS = {
    "normal": {
        "label": "Normal Baseline",
        "default_magnitude": 0.0,
        "param": "temperature",
        "expected_detection": "Neither (Nominal)"
    },
    "temperature-spike": {
        "label": "Temperature Spike (+14.2°C)",
        "default_magnitude": 14.2,
        "param": "temperature",
        "expected_detection": "Both (Rule-Based + LSTM)"
    },
    "temperature-drift": {
        "label": "Temperature Drift (+5.0°C)",
        "default_magnitude": 5.0,
        "param": "temperature",
        "expected_detection": "Rule-Based (ROC/Range) or LSTM"
    },
    "frozen-sensor": {
        "label": "Frozen Sensor (Zero Variance)",
        "default_magnitude": 0.0,
        "param": "temperature",
        "expected_detection": "Rule-Based (Zero-Variance Freeze)"
    },
    "humidity-spike": {
        "label": "Humidity Anomaly (+25%)",
        "default_magnitude": 25.0,
        "param": "humidity",
        "expected_detection": "Rule-Based / LSTM"
    },
    "pressure-drop": {
        "label": "Pressure Drop (-18.0 hPa)",
        "default_magnitude": -18.0,
        "param": "pressure",
        "expected_detection": "Rule-Based / LSTM"
    },
    "wind-anomaly": {
        "label": "Wind Anomaly (+22.0 km/h)",
        "default_magnitude": 22.0,
        "param": "wind",
        "expected_detection": "Both (High LSTM sensitivity ~50.4%)"
    },
    "communication-failure": {
        "label": "Communication Failure (Link Lost)",
        "default_magnitude": 2.5,
        "param": "comm",
        "expected_detection": "Freshness / Link Availability Only (Never LSTM)"
    }
}


class SimulationService:
    def __init__(self):
        self._lock = threading.Lock()
        os.makedirs(DATA_DIR, exist_ok=True)
        if not os.path.exists(SIM_HISTORY_FILE):
            self._save_history([])

        self.active_simulation: Optional[Dict[str, Any]] = None
        self._historical_df: Optional[pd.DataFrame] = None

    def _load_history(self) -> List[Dict[str, Any]]:
        with self._lock:
            if not os.path.exists(SIM_HISTORY_FILE):
                return []
            try:
                with open(SIM_HISTORY_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return []

    def _save_history(self, history: List[Dict[str, Any]]):
        with self._lock:
            temp_path = SIM_HISTORY_FILE + ".tmp"
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(history, f, indent=2, ensure_ascii=False)
            os.replace(temp_path, SIM_HISTORY_FILE)

    def _get_historical_df(self) -> pd.DataFrame:
        if self._historical_df is None:
            if os.path.exists(HISTORICAL_CSV_PATH):
                self._historical_df = pd.read_csv(HISTORICAL_CSV_PATH)
            else:
                self._historical_df = pd.DataFrame()
        return self._historical_df

    def warmup_station_buffer(self, station_id: str, source: str = "Meteostat") -> Dict[str, Any]:
        """
        Step 1: Live Buffer Warm-Up.
        Pre-seeds station's live LSTM buffer with its last 24 real consecutive hourly readings.
        For 3h cadence (NOAA) stations, skips LSTM warm-up and marks NOT_APPLICABLE.
        """
        st_config = next((s for s in STATION_CONFIGS if s["id"] == station_id), None)
        city = CITY_NAME_MAP.get(station_id, "Pune")
        
        # Check exclusion: NOAA stations are 3h synoptic cadence
        is_3h = (source.upper() == "NOAA") or (st_config and st_config.get("cadence") == "3h")
        if is_3h or lstm_service.is_series_excluded(station_id, source):
            return {
                "station_id": station_id,
                "city": city,
                "source": source,
                "warmed": False,
                "status": "NOT_APPLICABLE (3h cadence)",
                "reason": "3-hourly cadence series excluded from 24-step LSTM Autoencoder. Handled via deterministic rules and drift.",
                "buffer_length": 0
            }

        df = self._get_historical_df()
        if df.empty:
            return {
                "station_id": station_id,
                "warmed": False,
                "status": "ERROR",
                "reason": "Historical dataset unavailable"
            }

        # Filter last 24 consecutive hourly readings for this city and Meteostat
        subset = df[(df["city"] == city) & (df["source"] == "Meteostat")].sort_values("timestamp").tail(24)
        if len(subset) < 24:
            subset = df[(df["source"] == "Meteostat")].sort_values("timestamp").tail(24)

        now = datetime.now()
        readings = []
        hist_readings = []
        total_rows = len(subset)

        for i, (_, row) in enumerate(subset.iterrows()):
            hour_offset = total_rows - i
            reading_dt = now - timedelta(hours=hour_offset)
            ts_str = reading_dt.strftime("%Y-%m-%d %H:%M:%S")
            readings.append({
                "dt": reading_dt,
                "station_id": station_id,
                "source": source,
                "timestamp": ts_str,
                "temperature": float(row["temperature"]),
                "humidity": float(row["humidity"]),
                "pressure": float(row["pressure"]),
                "wind_speed": float(row["wind_speed"]),
                "wind_direction": float(row.get("wind_direction", 180.0)),
                "fault_type": "NORMAL",
                "affected_feature": "None"
            })
            hist_readings.append((reading_dt, float(row["temperature"])))

        # Pre-seed buffer in lstm_service
        key = (str(station_id), source)
        lstm_service.buffers[key] = readings.copy()
        # Also alias numeric id if mapped
        if st_config and st_config.get("meteostat_id"):
            lstm_service.buffers[(str(st_config["meteostat_id"]), source)] = readings.copy()

        # Pre-seed investigation_service history
        investigation_service.station_readings_history[station_id] = hist_readings.copy()

        start_time = readings[0]["timestamp"]
        end_time = readings[-1]["timestamp"]

        return {
            "station_id": station_id,
            "city": city,
            "source": source,
            "warmed": True,
            "count": len(readings),
            "start_timestamp": start_time,
            "end_timestamp": end_time,
            "status": "WARMED (24/24)",
            "message": f"Pre-seeded 24 consecutive hourly readings from {start_time} to {end_time}. Ready for immediate inference."
        }

    def start_simulation(
        self,
        station_id: str = "AWS-003",
        sensor: str = "temperature",
        scenario: str = "temperature-spike",
        magnitude: Optional[float] = None,
        duration: int = 12,
        noise_level: str = "MEDIUM",
        auto_warmup: bool = True
    ) -> Dict[str, Any]:
        """
        Steps 2–7: Executes full simulation test across all real services.
        Produces complete verification checklist and result summary.
        """
        now = datetime.now()
        now_iso = now.isoformat()
        now_str = now.strftime("%Y-%m-%d %H:%M:%S")

        sc_info = SCENARIO_CONFIGS.get(scenario, SCENARIO_CONFIGS["temperature-spike"])
        mag = magnitude if magnitude is not None else sc_info["default_magnitude"]
        
        st_config = next((s for s in STATION_CONFIGS if s["id"] == station_id), STATION_CONFIGS[0])
        city = st_config["location"]
        source = st_config.get("source", "Meteostat")
        is_3h = (st_config.get("cadence") == "3h") or lstm_service.is_series_excluded(station_id, source)

        # Baseline reading
        base_vals = DEFAULT_TELEMETRY.get(station_id, {"temperature": 27.8, "humidity": 58.0, "pressure": 948.5, "wind": 8.6, "rainfall": 0.0})
        ref_val = base_vals.get(sensor, 25.0)

        # Pre-seed buffer if auto_warmup requested and not 3h
        warmup_res = None
        if auto_warmup and not is_3h:
            warmup_res = self.warmup_station_buffer(station_id, source)
            key = (str(station_id), source)
            buf = lstm_service.buffers.get(key, [])
            if buf:
                last_b = buf[-1]
                base_vals = {
                    "temperature": last_b["temperature"],
                    "humidity": last_b["humidity"],
                    "pressure": last_b["pressure"],
                    "wind": last_b["wind_speed"],
                    "rainfall": 0.0
                }
                ref_val = base_vals.get(sensor, 25.0)

        # ------------------------------------------------------------------
        # PIPELINE EXECUTION
        # ------------------------------------------------------------------
        steps = {
            "fault_injected": {"complete": True, "timestamp": now_iso, "detail": f"Injected {sc_info['label']} (mag: {mag}) on {station_id} {sensor}."},
            "telemetry_updated": {"complete": False, "timestamp": None, "detail": "Pending"},
            "ml_or_rule_inference": {"complete": False, "timestamp": None, "detail": "Pending"},
            "anomaly_alert_generated": {"complete": False, "timestamp": None, "detail": "Pending"},
            "deep_dive_evidence_available": {"complete": False, "timestamp": None, "detail": "Pending"},
            "spatial_analysis_available": {"complete": False, "timestamp": None, "detail": "Pending"},
            "sensor_health_updated": {"complete": False, "timestamp": None, "detail": "Pending"},
            "maintenance_ticket_created": {"complete": False, "timestamp": None, "detail": "Pending"}
        }

        # 1. Telemetry Updated
        sim_val = ref_val
        is_comm = (scenario == "communication-failure")
        
        if scenario == "normal":
            sim_val = ref_val
        elif scenario in ("temperature-spike", "temperature-drift"):
            sim_val = round(ref_val + mag, 2)
        elif scenario == "frozen-sensor":
            sim_val = ref_val # Same frozen value
        elif scenario == "humidity-spike":
            sim_val = round(min(100.0, max(0.0, base_vals.get("humidity", 60.0) + mag)), 1)
        elif scenario == "pressure-drop":
            sim_val = round(base_vals.get("pressure", 1010.0) + mag, 1)
        elif scenario == "wind-anomaly":
            sim_val = round(max(0.0, base_vals.get("wind", 10.0) + mag), 1)

        steps["telemetry_updated"] = {
            "complete": True,
            "timestamp": datetime.now().isoformat(),
            "value": sim_val if not is_comm else "OFFLINE (No signal)",
            "normal_reference": ref_val,
            "detail": f"Stream reading shifted from {ref_val} to {sim_val}." if not is_comm else "Telemetry transmission interrupted (0 packets received)."
        }

        # 2. ML / Rule-based Inference Execution
        lstm_error = None
        lstm_threshold = round(lstm_service.threshold, 5)
        lstm_detected = False
        rule_detected = False
        detection_mechanism = "Neither"
        
        fault_type_map = {
            "normal": "NORMAL",
            "temperature-spike": "SPIKE",
            "temperature-drift": "DRIFT",
            "frozen-sensor": "FREEZE",
            "humidity-spike": "HUMIDITY_SPIKE",
            "pressure-drop": "PRESSURE_DROP",
            "wind-anomaly": "WIND_ANOMALY",
            "communication-failure": "COMMUNICATION_FAILURE"
        }

        packet = {
            "station_id": station_id,
            "source": source,
            "timestamp": now_str,
            "temperature": sim_val if sensor == "temperature" else base_vals.get("temperature", 28.0),
            "humidity": sim_val if sensor == "humidity" else base_vals.get("humidity", 60.0),
            "pressure": sim_val if sensor == "pressure" else base_vals.get("pressure", 1010.0),
            "wind_speed": sim_val if sensor == "wind" else base_vals.get("wind", 10.0),
            "wind_direction": 180.0,
            "fault_type": fault_type_map.get(scenario, "NORMAL"),
            "affected_feature": sensor,
            "comm_failure_hours": mag if is_comm else 0.0
        }

        # Handle frozen sensor consecutive history in investigation service
        if scenario == "frozen-sensor":
            frozen_hist = []
            for k in range(5, 0, -1):
                frozen_hist.append((now - timedelta(hours=k), ref_val))
            investigation_service.station_readings_history[station_id] = frozen_hist

        # Run ML Inference if applicable
        infer_res = None
        if not is_3h and not is_comm and scenario != "normal":
            infer_res = lstm_service.process_packet(packet, fault_type=packet["fault_type"], affected_feature=sensor)
            lstm_error = infer_res.get("reconstruction_error")
            if infer_res.get("status") == "ANOMALY":
                lstm_detected = True

        # Run Investigation Evaluation (Multi-layer rules + Spatial + External)
        if scenario == "normal":
            investigation_service.clear_investigation(station_id)
            inv_record = None
        else:
            inv_record = investigation_service.evaluate_telemetry(
                packet,
                ml_result=infer_res,
                comm_failure_hours=mag if is_comm else 0.0
            )

        if inv_record:
            rule_detected = True
            inv_triggers = inv_record.get("triggers", [])
            # If LSTM also triggered
            if "LSTM_ANOMALY" in inv_triggers:
                lstm_detected = True

        if lstm_detected and rule_detected:
            detection_mechanism = "Both"
        elif lstm_detected:
            detection_mechanism = "LSTM"
        elif rule_detected:
            detection_mechanism = "Rule-Based"
        else:
            detection_mechanism = "Neither"

        if is_comm:
            detection_mechanism = "Link Freshness / Availability"

        steps["ml_or_rule_inference"] = {
            "complete": True,
            "timestamp": datetime.now().isoformat(),
            "detection_mechanism": detection_mechanism,
            "reconstruction_error": round(lstm_error, 4) if lstm_error is not None else None,
            "threshold": lstm_threshold,
            "detail": f"Inference executed. Detection mechanism: {detection_mechanism}."
        }

        # 3. Anomaly Alert & Deep-Dive Evidence
        has_alert = (inv_record is not None)
        severity = inv_record.get("severity", "NORMAL") if inv_record else "NORMAL"
        alert_title = f"{sc_info['label']} detected on {station_id}" if has_alert else "Nominal Conditions"

        if has_alert or scenario == "normal":
            steps["anomaly_alert_generated"] = {
                "complete": has_alert,
                "timestamp": datetime.now().isoformat() if has_alert else None,
                "title": alert_title,
                "severity": severity,
                "detail": f"Alert generated with severity {severity}." if has_alert else "No anomaly alert generated (Nominal baseline)."
            }

            steps["deep_dive_evidence_available"] = {
                "complete": has_alert,
                "timestamp": datetime.now().isoformat() if has_alert else None,
                "investigation_id": inv_record.get("investigation_id") if inv_record else None,
                "probable_cause": inv_record.get("root_cause_analysis", {}).get("probable_cause") if inv_record else "None",
                "detail": "Forensic evidence populated across LSTM, deterministic bounds, and spatial layers." if has_alert else "Evidence nominal."
            }

            # Spatial Consensus
            spatial_class = "N/A"
            if inv_record:
                spatial_info = inv_record.get("layers", {}).get("spatial_consensus", {})
                spatial_class = spatial_info.get("classification", "ISOLATED SENSOR ANOMALY")
            steps["spatial_analysis_available"] = {
                "complete": has_alert,
                "timestamp": datetime.now().isoformat() if has_alert else None,
                "classification": spatial_class,
                "detail": f"Regional spatial consensus evaluated: {spatial_class}." if has_alert else "Spatial consensus baseline nominal."
            }

        # 4. Sensor Health Matrix Update
        sh_detail = sensor_health_service.evaluate_sensor(station_id, sensor, current_val=sim_val if not is_comm else None)
        sensor_health_status = sh_detail["status"]
        steps["sensor_health_updated"] = {
            "complete": True,
            "timestamp": datetime.now().isoformat(),
            "status": sensor_health_status,
            "health_score": sh_detail["health_score"],
            "why_this_status": sh_detail["why_this_status"],
            "detail": f"Sensor Health Matrix updated to {sensor_health_status} ({sh_detail['health_score']}%)."
        }

        # 5. Maintenance Ticket Creation (Tagged as Simulation Origin)
        created_ticket = None
        if has_alert and scenario != "normal":
            t_payload = {
                "station_id": station_id,
                "station_name": st_config["name"],
                "station_location": st_config["location"],
                "sensor": sensor,
                "issue": f"[SIMULATION] {sc_info['label']}: {sh_detail['why_this_status']}",
                "priority": severity if severity in ("CRITICAL", "HIGH", "MEDIUM", "LOW") else "HIGH",
                "is_simulation": True,
                "source": "simulation",
                "assigned_to": "Simulation Testbench Engine",
                "evidence": {
                    "scenario": scenario,
                    "magnitude": mag,
                    "triggers": inv_record.get("triggers", []) if inv_record else [],
                    "detection_mechanism": detection_mechanism
                },
                "recommended_action": inv_record.get("recommended_action", "Probe recalibration") if inv_record else "Probe inspection"
            }
            created_ticket = maintenance_service.create_ticket(t_payload)
            steps["maintenance_ticket_created"] = {
                "complete": True,
                "timestamp": datetime.now().isoformat(),
                "ticket_id": created_ticket["id"],
                "priority": created_ticket["priority"],
                "status": created_ticket["status"],
                "detail": f"Simulation ticket {created_ticket['id']} logged (isolated from production KPIs)."
            }
        else:
            steps["maintenance_ticket_created"] = {
                "complete": False,
                "timestamp": None,
                "detail": "No ticket created (Nominal baseline or non-qualifying event)."
            }

        # ------------------------------------------------------------------
        # PASS / FAIL DETERMINATION (Step 7)
        # ------------------------------------------------------------------
        if scenario == "normal":
            verdict = "PASS" if not has_alert and sensor_health_status == "HEALTHY" else "FAILED"
            verdict_reason = "Nominal telemetry generated zero false alarms and preserved HEALTHY status."
        elif is_comm:
            verdict = "PASS" if (sensor_health_status in ("CRITICAL", "DEGRADED", "OFFLINE") and has_alert) else "FAILED"
            verdict_reason = "Communication failure correctly surfaced via link freshness/timeout without false LSTM attribution."
        else:
            if has_alert and sensor_health_status in ("CRITICAL", "DEGRADED", "WATCH"):
                verdict = "PASS"
                verdict_reason = f"Anomaly successfully surfaced via {detection_mechanism}; downstream pipeline verified end-to-end."
            else:
                verdict = "FAILED"
                verdict_reason = "Neither LSTM nor deterministic rules surfaced the fault."

        result_summary = {
            "scenario": sc_info["label"],
            "target": f"{station_id} ({st_config['location']}) — {sensor.capitalize()}",
            "detection_mechanism": detection_mechanism,
            "reconstruction_error": round(lstm_error, 4) if lstm_error is not None else None,
            "threshold": lstm_threshold,
            "severity": severity,
            "sensor_health_result": sensor_health_status,
            "spatial_result": steps["spatial_analysis_available"].get("classification", "N/A"),
            "recommended_action": inv_record.get("recommended_action") if inv_record else "Nominal",
            "maintenance_outcome": f"Ticket {created_ticket['id']} ({created_ticket['priority']})" if created_ticket else "No ticket logged",
            "verdict": verdict,
            "verdict_reason": verdict_reason
        }

        # Active simulation state
        test_id = f"SIM-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        sim_state = {
            "test_id": test_id,
            "station_id": station_id,
            "station_name": st_config["name"],
            "location": st_config["location"],
            "sensor": sensor,
            "scenario": scenario,
            "scenario_label": sc_info["label"],
            "magnitude": mag,
            "noise_level": noise_level,
            "duration": duration,
            "start_time": now_iso,
            "current_simulated_value": sim_val if not is_comm else "OFFLINE",
            "normal_reference_value": ref_val,
            "unit": SENSOR_INFO.get(sensor, {}).get("unit", ""),
            "pipeline_steps": steps,
            "result_summary": result_summary,
            "ticket": created_ticket
        }

        self.active_simulation = sim_state

        # Persist to history
        history = self._load_history()
        history.insert(0, {
            "test_id": test_id,
            "timestamp": now_iso,
            "station_id": station_id,
            "sensor": sensor,
            "scenario": sc_info["label"],
            "magnitude": mag,
            "detection_mechanism": detection_mechanism,
            "severity": severity,
            "sensor_health": sensor_health_status,
            "ticket_id": created_ticket["id"] if created_ticket else None,
            "verdict": verdict,
            "verdict_reason": verdict_reason
        })
        self._save_history(history[:50]) # keep last 50 tests

        return sim_state

    def clear_fault(self) -> Dict[str, Any]:
        """
        Step 10: Clear Fault.
        Restores only the live simulated stream to nominal.
        Never modifies historical data or model files.
        """
        if self.active_simulation:
            sid = self.active_simulation["station_id"]
            investigation_service.clear_investigation(sid)
            self.active_simulation = None

        return {
            "success": True,
            "status": "FAULT_CLEARED",
            "message": "Simulated fault cleared. Live telemetry stream returned to nominal baseline."
        }

    def reset_simulation(self) -> Dict[str, Any]:
        """
        Step 10: Reset Simulation.
        Clears active fault and in-memory simulation states only.
        Historical files, model weights, and production records remain pristine.
        """
        self.active_simulation = None
        investigation_service.clear_all()
        # Reset ML rolling buffers
        for key in list(lstm_service.buffers.keys()):
            lstm_service.reset_buffer(key[0], key[1], "Simulation Reset")

        return {
            "success": True,
            "status": "SIMULATION_RESET",
            "message": "Simulation harness reset to pristine clean state."
        }

    def get_status(self) -> Dict[str, Any]:
        return {
            "active": self.active_simulation is not None,
            "simulation": self.active_simulation
        }

    def get_history(self) -> List[Dict[str, Any]]:
        return self._load_history()


# Singleton simulation service
simulation_service = SimulationService()
