import copy
import random
import math
from datetime import datetime
from typing import List, Dict, Any, Optional
try:
    from ..ml.anomaly_engine import AnomalyDetectionEngine
except ImportError:
    from ml.anomaly_engine import AnomalyDetectionEngine

INITIAL_STATIONS = [
    {"id": "AWS-001", "name": "Chennai Meenambakkam", "state": "Tamil Nadu", "region": "Southern", "lat": 12.9900, "lon": 80.1693, "elevation": 16, "temp_base": 29.8, "press_base": 1009.4, "rh_base": 78.0},
    {"id": "AWS-002", "name": "Bengaluru HAL Airport", "state": "Karnataka", "region": "Southern", "lat": 12.9500, "lon": 77.6680, "elevation": 888, "temp_base": 24.6, "press_base": 1012.4, "rh_base": 65.0},
    {"id": "AWS-003", "name": "Pune Pashan", "state": "Maharashtra", "region": "Western", "lat": 18.5800, "lon": 73.9197, "elevation": 592, "temp_base": 27.8, "press_base": 1011.6, "rh_base": 58.0},
    {"id": "AWS-004", "name": "Mumbai Santacruz", "state": "Maharashtra", "region": "Western", "lat": 19.0886, "lon": 72.8679, "elevation": 14, "temp_base": 30.5, "press_base": 1008.2, "rh_base": 79.0},
    {"id": "AWS-005", "name": "Kolkata Dum Dum Intl", "state": "West Bengal", "region": "Eastern", "lat": 22.6547, "lon": 88.4467, "elevation": 6, "temp_base": 31.2, "press_base": 1010.5, "rh_base": 82.0},
    {"id": "AWS-006", "name": "Ahmedabad Sardar Patel", "state": "Gujarat", "region": "Western", "lat": 23.0725, "lon": 72.6347, "elevation": 55, "temp_base": 33.4, "press_base": 1004.8, "rh_base": 42.0},
    {"id": "AWS-007", "name": "Hyderabad Begumpet", "state": "Telangana", "region": "Southern", "lat": 17.4531, "lon": 78.4676, "elevation": 531, "temp_base": 28.9, "press_base": 1010.8, "rh_base": 61.0},
]

class SimulationEngine:
    """
    Stateful real-time AWS simulation engine for SkyGuard AI.
    Generates telemetry updates, handles dynamic anomaly injection, and maintains
    sensor health and predictive maintenance registries.
    """
    def __init__(self):
        self.anomaly_detector = AnomalyDetectionEngine()
        self.stations: List[Dict[str, Any]] = []
        self.history: Dict[str, List[float]] = {}
        self.telemetry_feed: List[Dict[str, Any]] = []
        self.active_anomalies: List[Dict[str, Any]] = []
        self.maintenance_tickets: List[Dict[str, Any]] = []
        self.injected_overrides: Dict[str, Dict[str, Any]] = {}
        self.step_counter = 0
        self.reset()

    def reset(self):
        """Resets the simulation to pristine healthy state."""
        self.stations = []
        self.history = {}
        self.telemetry_feed = []
        self.active_anomalies = []
        self.maintenance_tickets = []
        self.injected_overrides = {}
        self.step_counter = 0

        now_str = datetime.now().strftime("%H:%M:%S")

        for item in INITIAL_STATIONS:
            st = {
                "id": item["id"],
                "name": item["name"],
                "state": item["state"],
                "region": item["region"],
                "lat": item["lat"],
                "lon": item["lon"],
                "elevation": item["elevation"],
                "status": "healthy",
                "last_update": now_str,
                "temperature": round(item["temp_base"] + random.uniform(-0.4, 0.4), 1),
                "pressure": round(item["press_base"] + random.uniform(-0.5, 0.5), 1),
                "humidity": round(item["rh_base"] + random.uniform(-1.0, 1.0), 1),
                "sensor_health": 98.0,
                "risk_level": "LOW",
                "ai_confidence": 98.5,
                "is_frozen": False,
                "is_offline": False,
                "is_regional_event": False,
                "temp_base": item["temp_base"],
                "press_base": item["press_base"],
                "rh_base": item["rh_base"]
            }
            self.stations.append(st)
            self.history[f"{st['id']}_temp"] = [st["temperature"]] * 10
            self.history[f"{st['id']}_press"] = [st["pressure"]] * 10
            self.history[f"{st['id']}_rh"] = [st["humidity"]] * 10

    def _inject_seed_anomalies(self):
        # Pristine baseline: no spurious or fabricated seed anomalies
        pass

    def tick(self) -> List[Dict[str, Any]]:
        """
        Executes one real-time simulation cycle (called every 2-3s).
        Updates telemetry, runs ML anomaly detection, degrades health on faults, and records history.
        """
        self.step_counter += 1
        now_str = datetime.now().strftime("%H:%M:%S")
        updated_readings = []

        for st in self.stations:
            st_id = st["id"]

            # Check if an override is active
            if st_id in self.injected_overrides:
                override = self.injected_overrides[st_id]
                o_type = override.get("type")
                if o_type == "spike":
                    st["temperature"] = override.get("value", 55.0)
                    st["status"] = "critical"
                    st["sensor_health"] = max(24.0, st["sensor_health"] - 12.0)
                elif o_type == "drop":
                    st["temperature"] = override.get("value", 10.0)
                    st["status"] = "warning"
                    st["sensor_health"] = max(45.0, st["sensor_health"] - 8.0)
                elif o_type == "freeze":
                    st["is_frozen"] = True
                    st["status"] = "warning"
                    st["sensor_health"] = max(55.0, st["sensor_health"] - 5.0)
                elif o_type == "drift":
                    st["temperature"] = round(st["temperature"] + 0.3, 1)
                    st["status"] = "warning"
                elif o_type == "pressure_spike":
                    st["pressure"] = override.get("value", 1048.0)
                    st["status"] = "critical"
                elif o_type == "humidity_spike":
                    st["humidity"] = override.get("value", 98.0)
                    st["status"] = "warning"
                elif o_type == "offline":
                    st["is_offline"] = True
                    st["status"] = "offline"
                    st["sensor_health"] = 12.0
                elif o_type == "multivariate":
                    st["temperature"] = 54.0
                    st["humidity"] = 99.0
                    st["pressure"] = 940.0
                    st["status"] = "critical"
                    st["sensor_health"] = 20.0
                elif o_type == "regional":
                    st["is_regional_event"] = True
                    st["temperature"] = round(st["temp_base"] - 7.5, 1)
                    st["humidity"] = min(98.0, round(st["rh_base"] + 24.0, 1))
                    st["pressure"] = round(st["press_base"] - 9.0, 1)
                    st["status"] = "warning"
            else:
                # Normal live telemetry micro-fluctuations
                if not st.get("is_frozen", False) and not st.get("is_offline", False):
                    # Slight diurnal harmonic oscillation
                    temp_noise = random.gauss(0, 0.08)
                    press_noise = random.gauss(0, 0.12)
                    rh_noise = random.gauss(0, 0.25)
                    st["temperature"] = round(st["temperature"] + temp_noise, 1)
                    st["pressure"] = round(st["pressure"] + press_noise, 1)
                    st["humidity"] = round(max(10.0, min(99.0, st["humidity"] + rh_noise)), 1)
                    
                    # Recover health gradually if no faults
                    if st["status"] == "healthy" and st["sensor_health"] < 99.0:
                        st["sensor_health"] = min(99.0, round(st["sensor_health"] + 0.1, 1))

            st["last_update"] = now_str

            # Update historical series
            t_key = f"{st_id}_temp"
            p_key = f"{st_id}_press"
            r_key = f"{st_id}_rh"

            self.history.setdefault(t_key, []).append(st["temperature"])
            self.history.setdefault(p_key, []).append(st["pressure"])
            self.history.setdefault(r_key, []).append(st["humidity"])

            if len(self.history[t_key]) > 40:
                self.history[t_key].pop(0)
            if len(self.history[p_key]) > 40:
                self.history[p_key].pop(0)
            if len(self.history[r_key]) > 40:
                self.history[r_key].pop(0)

            # Run ML Evaluation
            ano = self.anomaly_detector.evaluate_station_reading(
                station=st,
                all_stations=self.stations,
                historical_series=self.history
            )

            if ano:
                # Avoid duplicates: update or add
                existing_idx = next((i for i, a in enumerate(self.active_anomalies) if a["station_id"] == st_id), None)
                if existing_idx is not None:
                    self.active_anomalies[existing_idx] = ano
                else:
                    self.active_anomalies.insert(0, ano)
                    # Trigger maintenance recommendation if critical
                    if ano["severity"] == "CRITICAL" and not ano["is_genuine_weather"]:
                        self._create_maintenance_ticket(st, ano)
            else:
                # Clear resolved anomaly if station is now healthy
                if st["status"] == "healthy":
                    self.active_anomalies = [a for a in self.active_anomalies if a["station_id"] != st_id]

            reading = {
                "station_id": st["id"],
                "station_name": st["name"],
                "region": st["region"],
                "timestamp": now_str,
                "temperature": st["temperature"],
                "pressure": st["pressure"],
                "humidity": st["humidity"],
                "sensor_health": st["sensor_health"],
                "status": st["status"]
            }
            updated_readings.append(reading)

        # Retain last 50 readings in stream
        self.telemetry_feed = (updated_readings[:6] + self.telemetry_feed)[:50]
        return updated_readings

    def _create_maintenance_ticket(self, station: Dict[str, Any], anomaly: Dict[str, Any]):
        # Check if open ticket exists
        exists = any(t["station_id"] == station["id"] and t["status"] == "Open" for t in self.maintenance_tickets)
        if not exists:
            self.maintenance_tickets.insert(0, {
                "id": f"MNT-{random.randint(100, 999)}",
                "station_id": station["id"],
                "station_name": station["name"],
                "sensor": f"{anomaly['parameter']} Transducer",
                "health": station["sensor_health"],
                "priority": "CRITICAL" if anomaly["severity"] == "CRITICAL" else "HIGH",
                "anomaly_frequency": "High (Sudden Deviation)",
                "drift_status": f"Acute Deviation ({anomaly['deviation']:+.1f})",
                "recommended_action": f"Immediate site visit recommended: Inspect {anomaly['parameter']} sensor calibration & wiring harness within next maintenance cycle.",
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "status": "Open"
            })

    def inject_scenario_1_spike(self, target_id: str = "AWS-001"):
        """SIH Scenario 1: Catastrophic 55°C temperature spike on AWS-001 (Chennai)."""
        self.injected_overrides[target_id] = {
            "type": "spike",
            "value": 55.0,
            "created_at": datetime.now()
        }
        for st in self.stations:
            if st["id"] == target_id:
                st["temperature"] = 55.0
                st["status"] = "critical"
                st["sensor_health"] = 38.0
                st["risk_level"] = "CRITICAL"
        self.tick()

    def inject_scenario_2_regional(self):
        """
        SIH Scenario 2: Coordinated regional weather phenomenon across neighboring
        Pune & Mumbai corridor stations (AWS-003 & AWS-004, within 125km separation).
        Both stations drop temperature by ~7.5°C, surge humidity to 82-98%, and drop pressure by 9 hPa.
        AI compares spatial consensus and marks it as 'Genuine Meteorological Event'!
        """
        regional_targets = ["AWS-003", "AWS-004"]
        for target_id in regional_targets:
            self.injected_overrides[target_id] = {
                "type": "regional",
                "created_at": datetime.now()
            }
            for st in self.stations:
                if st["id"] == target_id:
                    st["is_regional_event"] = True
                    st["temperature"] = round(st["temp_base"] - 7.5, 1)
                    st["humidity"] = min(98.0, round(st["rh_base"] + 24.0, 1))
                    st["pressure"] = round(st["press_base"] - 9.0, 1)
                    st["status"] = "warning"
                    st["sensor_health"] = 94.0  # Sensor is actually healthy!
        self.tick()

    def inject_custom(self, station_id: str, anomaly_type: str, parameter: str = "Temperature", value: Optional[float] = None):
        """Custom anomaly injection handler."""
        val = value
        if val is None:
            if anomaly_type == "spike":
                val = 55.0
            elif anomaly_type == "drop":
                val = 9.0
            elif anomaly_type == "pressure_spike":
                val = 1046.0
            elif anomaly_type == "humidity_spike":
                val = 98.5

        if anomaly_type == "regional_weather":
            self.inject_scenario_2_regional()
            return

        self.injected_overrides[station_id] = {
            "type": anomaly_type,
            "parameter": parameter,
            "value": val,
            "created_at": datetime.now()
        }
        self.tick()

    def accept_correction(self, anomaly_id: str) -> bool:
        """Applies corrected value and logs data lineage."""
        for ano in self.active_anomalies:
            if ano["id"] == anomaly_id:
                ano["accepted_correction"] = True
                ano["status"] = "Corrected"
                # Update station telemetry to healed value
                for st in self.stations:
                    if st["id"] == ano["station_id"]:
                        if ano["parameter"] == "Temperature":
                            st["temperature"] = ano["corrected_value"]
                        st["status"] = "healthy"
                        st["sensor_health"] = min(95.0, st["sensor_health"] + 25.0)
                        # Remove override if active
                        self.injected_overrides.pop(st["id"], None)
                return True
        return False

    def get_network_kpis(self) -> Dict[str, Any]:
        """Calculates dynamic real-time KPIs."""
        total_stations = len(self.stations)
        total_sensors = total_stations * 3
        active_anomalies_count = len(self.active_anomalies)
        critical_count = sum(1 for a in self.active_anomalies if a.get("severity") == "CRITICAL")
        offline_count = sum(1 for s in self.stations if s.get("status") == "offline")
        
        avg_health = sum(s["sensor_health"] for s in self.stations) / max(1, total_stations)
        # Data quality index formula
        dq_score = max(70.0, min(99.4, 99.2 - (active_anomalies_count * 0.45) - (offline_count * 1.5)))

        return {
            "total_stations": total_stations,
            "active_sensors": total_sensors,
            "anomalies_detected": active_anomalies_count,
            "critical_alerts": critical_count,
            "network_health_pct": round(avg_health, 1),
            "data_quality_pct": round(dq_score, 1),
            "offline_stations": offline_count,
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }

    def generate_ai_brief(self) -> str:
        """Generates dynamic AI Network Briefing summary."""
        kpis = self.get_network_kpis()
        anomalies_cnt = kpis["anomalies_detected"]
        crit_cnt = kpis["critical_alerts"]
        degraded = [s["id"] for s in self.stations if s["sensor_health"] < 70]
        has_regional = any(s.get("is_regional_event", False) for s in self.stations)

        brief = f"{anomalies_cnt} anomalies detected across the national AWS grid. "
        brief += f"{crit_cnt} critical alert{'s' if crit_cnt != 1 else ''} requiring operator triage. "
        
        if len(degraded) > 0:
            brief += f"{len(degraded)} station{'s' if len(degraded) > 1 else ''} show sensor degradation ({', '.join(degraded[:3])}). "
        else:
            brief += "Sensor transducers operating within nominal tolerances. "

        if has_regional:
            brief += "1 regional pattern (Pune-Mumbai corridor) appears spatially consistent with a genuine meteorological front. "

        if any(s["id"] == "AWS-001" and s["status"] == "critical" for s in self.stations):
            brief += "AWS-001 (Chennai Meenambakkam) requires immediate inspection due to an extreme +25.2°C thermal excursion."
        else:
            brief += "Automated spatial-temporal self-healing is active."

        return brief
