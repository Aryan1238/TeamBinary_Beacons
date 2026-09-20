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
    # Maharashtra cluster
    {"id": "AWS-MH-042", "name": "Pune Pashan", "state": "Maharashtra", "region": "Western", "lat": 18.5362, "lon": 73.8052, "elevation": 560, "temp_base": 28.5, "press_base": 955.0, "rh_base": 62.0},
    {"id": "AWS-MH-001", "name": "Mumbai Santacruz", "state": "Maharashtra", "region": "Western", "lat": 19.0896, "lon": 72.8656, "elevation": 14, "temp_base": 31.2, "press_base": 1008.5, "rh_base": 78.0},
    {"id": "AWS-MH-019", "name": "Mahabaleshwar Observatory", "state": "Maharashtra", "region": "Western", "lat": 17.9237, "lon": 73.6586, "elevation": 1372, "temp_base": 21.0, "press_base": 865.0, "rh_base": 88.0},
    {"id": "AWS-MH-014", "name": "Nashik Ozar", "state": "Maharashtra", "region": "Western", "lat": 20.1199, "lon": 73.9135, "elevation": 579, "temp_base": 29.1, "press_base": 952.0, "rh_base": 58.0},
    {"id": "AWS-MH-033", "name": "Kolhapur Ujalaiwadi", "state": "Maharashtra", "region": "Western", "lat": 16.6644, "lon": 74.2817, "elevation": 570, "temp_base": 29.8, "press_base": 954.0, "rh_base": 65.0},
    {"id": "AWS-MH-088", "name": "Nagpur Sonegaon", "state": "Maharashtra", "region": "Central", "lat": 21.0922, "lon": 79.0511, "elevation": 310, "temp_base": 33.5, "press_base": 982.0, "rh_base": 45.0},

    # Delhi NCR cluster
    {"id": "AWS-DL-001", "name": "Delhi Safdarjung", "state": "Delhi", "region": "Northern", "lat": 28.5843, "lon": 77.2066, "elevation": 216, "temp_base": 30.5, "press_base": 992.0, "rh_base": 52.0},
    {"id": "AWS-DL-004", "name": "Delhi Lodhi Road", "state": "Delhi", "region": "Northern", "lat": 28.5910, "lon": 77.2270, "elevation": 211, "temp_base": 30.8, "press_base": 992.5, "rh_base": 50.0},
    {"id": "AWS-DL-008", "name": "Delhi Ridge", "state": "Delhi", "region": "Northern", "lat": 28.6732, "lon": 77.1643, "elevation": 230, "temp_base": 31.2, "press_base": 990.0, "rh_base": 48.0},

    # Rajasthan cluster
    {"id": "AWS-RJ-012", "name": "Jaipur Sanganer", "state": "Rajasthan", "region": "Northern", "lat": 26.8242, "lon": 75.8122, "elevation": 385, "temp_base": 34.0, "press_base": 974.0, "rh_base": 38.0},
    {"id": "AWS-RJ-045", "name": "Jodhpur Airport", "state": "Rajasthan", "region": "Northern", "lat": 26.2510, "lon": 73.0485, "elevation": 218, "temp_base": 35.8, "press_base": 988.0, "rh_base": 30.0},
    {"id": "AWS-RJ-078", "name": "Bikaner PBM", "state": "Rajasthan", "region": "Northern", "lat": 28.0180, "lon": 73.3175, "elevation": 242, "temp_base": 36.2, "press_base": 986.0, "rh_base": 28.0},

    # Gujarat
    {"id": "AWS-GJ-022", "name": "Ahmedabad Hansol", "state": "Gujarat", "region": "Western", "lat": 23.0734, "lon": 72.6347, "elevation": 55, "temp_base": 33.2, "press_base": 1004.0, "rh_base": 55.0},
    {"id": "AWS-GJ-051", "name": "Surat Dumas", "state": "Gujarat", "region": "Western", "lat": 21.1126, "lon": 72.7411, "elevation": 12, "temp_base": 32.0, "press_base": 1009.0, "rh_base": 74.0},

    # Karnataka
    {"id": "AWS-KA-007", "name": "Bengaluru HAL", "state": "Karnataka", "region": "Southern", "lat": 12.9500, "lon": 77.6680, "elevation": 888, "temp_base": 26.2, "press_base": 920.0, "rh_base": 68.0},
    {"id": "AWS-KA-034", "name": "Mangaluru Panambur", "state": "Karnataka", "region": "Southern", "lat": 12.9510, "lon": 74.8080, "elevation": 18, "temp_base": 30.2, "press_base": 1009.0, "rh_base": 82.0},

    # Tamil Nadu
    {"id": "AWS-TN-003", "name": "Chennai Meenambakkam", "state": "Tamil Nadu", "region": "Southern", "lat": 12.9941, "lon": 80.1809, "elevation": 16, "temp_base": 32.8, "press_base": 1008.0, "rh_base": 75.0},
    {"id": "AWS-TN-026", "name": "Coimbatore Peelamedu", "state": "Tamil Nadu", "region": "Southern", "lat": 11.0297, "lon": 77.0434, "elevation": 409, "temp_base": 28.9, "press_base": 969.0, "rh_base": 62.0},

    # Kerala
    {"id": "AWS-KL-002", "name": "Kochi Naval Base", "state": "Kerala", "region": "Southern", "lat": 9.9312, "lon": 76.2673, "elevation": 3, "temp_base": 29.5, "press_base": 1010.0, "rh_base": 84.0},
    {"id": "AWS-KL-018", "name": "Thiruvananthapuram VSSC", "state": "Kerala", "region": "Southern", "lat": 8.5241, "lon": 76.9366, "elevation": 29, "temp_base": 30.1, "press_base": 1008.0, "rh_base": 80.0},

    # West Bengal
    {"id": "AWS-WB-005", "name": "Kolkata Alipore", "state": "West Bengal", "region": "Eastern", "lat": 22.5312, "lon": 88.3278, "elevation": 6, "temp_base": 31.5, "press_base": 1007.5, "rh_base": 79.0},
    {"id": "AWS-WB-021", "name": "Siliguri Matigara", "state": "West Bengal", "region": "Eastern", "lat": 26.7162, "lon": 88.3953, "elevation": 122, "temp_base": 27.2, "press_base": 998.0, "rh_base": 76.0},

    # Assam
    {"id": "AWS-AS-010", "name": "Guwahati Borjhar", "state": "Assam", "region": "North-Eastern", "lat": 26.1061, "lon": 91.5859, "elevation": 54, "temp_base": 28.0, "press_base": 1003.0, "rh_base": 81.0},

    # Uttar Pradesh
    {"id": "AWS-UP-014", "name": "Lucknow Amausi", "state": "Uttar Pradesh", "region": "Northern", "lat": 26.7606, "lon": 80.8893, "elevation": 123, "temp_base": 31.8, "press_base": 999.0, "rh_base": 56.0},
    {"id": "AWS-UP-038", "name": "Varanasi Babatpur", "state": "Uttar Pradesh", "region": "Northern", "lat": 25.4497, "lon": 82.8596, "elevation": 81, "temp_base": 32.2, "press_base": 1002.0, "rh_base": 58.0}
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

        # Inject 1 mild realistic warning anomaly in background for demonstration
        self._inject_seed_anomalies()

    def _inject_seed_anomalies(self):
        # Mild drift on AWS-RJ-045 (Jodhpur) for initial realism
        for st in self.stations:
            if st["id"] == "AWS-RJ-045":
                st["sensor_health"] = 81.0
                st["status"] = "warning"
                st["risk_level"] = "MODERATE"
                seed_ano = {
                    "id": "ANO-INIT01",
                    "timestamp": datetime.now().strftime("%H:%M:%S"),
                    "station_id": st["id"],
                    "station_name": st["name"],
                    "parameter": "Temperature",
                    "observed_value": 39.8,
                    "expected_value": 35.8,
                    "deviation": 4.0,
                    "anomaly_score": 0.56,
                    "confidence": 88.2,
                    "severity": "WARNING",
                    "anomaly_type": "Sensor Drift",
                    "root_cause": "Calibration drift",
                    "root_cause_breakdown": [
                        {"cause": "Calibration drift", "probability": 0.65},
                        {"cause": "Environmental boundary turbulence", "probability": 0.25},
                        {"cause": "Sensor malfunction", "probability": 0.10}
                    ],
                    "is_genuine_weather": False,
                    "feature_contributions": [
                        {"feature": "Temporal deviation", "importance": 0.40, "direction": "+"},
                        {"feature": "Spatial inconsistency", "importance": 0.35, "direction": "+"},
                        {"feature": "Humidity mismatch", "importance": 0.15, "direction": "+"},
                        {"feature": "Pressure relationship", "importance": 0.10, "direction": "+"}
                    ],
                    "explanation": "Observed gradual positive drift (+4.0°C) over 48 hours relative to regional IDW baseline. Thermistor calibration required.",
                    "corrected_value": 36.2,
                    "correction_confidence": 91.5,
                    "status": "Investigating",
                    "accepted_correction": False,
                    "data_lineage": {"method": "Drift_Bias_Offset"}
                }
                self.active_anomalies.append(seed_ano)

                self.maintenance_tickets.append({
                    "id": "MNT-001",
                    "station_id": st["id"],
                    "station_name": st["name"],
                    "sensor": "Temperature Sensor (PT100)",
                    "health": 81.0,
                    "priority": "MEDIUM",
                    "anomaly_frequency": "Moderate",
                    "drift_status": "Progressive Positive (+0.12°C/day)",
                    "recommended_action": "Schedule field calibration during monthly cycle",
                    "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
                    "status": "Open"
                })

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

    def inject_scenario_1_spike(self, target_id: str = "AWS-MH-042"):
        """SIH Scenario 1: Catastrophic 55°C temperature spike on AWS-MH-042."""
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
        SIH Scenario 2: Coordinated regional weather phenomenon across 5 neighboring
        Western Ghats / Maharashtra stations (Pune, Mumbai, Mahabaleshwar, Nashik, Kolhapur).
        All 5 stations drop temperature by ~7-8°C, spike humidity to 92-98%, and drop pressure by 9 hPa.
        AI compares spatial consensus and marks it as 'Genuine Meteorological Event' with 96% confidence!
        """
        regional_targets = ["AWS-MH-042", "AWS-MH-001", "AWS-MH-019", "AWS-MH-014", "AWS-MH-033"]
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
            brief += "1 regional pattern (Western Ghats) appears spatially consistent with a genuine meteorological front. "

        if any(s["id"] == "AWS-MH-042" and s["status"] == "critical" for s in self.stations):
            brief += "AWS-MH-042 (Pune Pashan) requires immediate inspection due to an extreme +23.8°C thermal excursion."
        else:
            brief += "Automated spatial-temporal self-healing is active."

        return brief
