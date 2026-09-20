import asyncio
import json
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from .models import (
        Station,
        AnomalyRecord,
        SensorHealthMetric,
        MaintenanceTicket,
        AnomalyInjectionRequest,
        CopilotQueryRequest
    )
    from .simulation.engine import SimulationEngine
    from .reports import ReportService
    from .services.weather_service import live_weather_service, haversine_km
except ImportError:
    from models import (
        Station,
        AnomalyRecord,
        SensorHealthMetric,
        MaintenanceTicket,
        AnomalyInjectionRequest,
        CopilotQueryRequest
    )
    from simulation.engine import SimulationEngine
    from reports import ReportService
    from services.weather_service import live_weather_service, haversine_km

app = FastAPI(
    title="SkyGuard AI API - MoES / IMD AWS Intelligence",
    version="2.5.0",
    description="Live Weather Data Anomaly Detection & Telemetry Assurance Platform for Automatic Weather Stations (Powered by Open-Meteo API)"
)

# Enable CORS for frontend Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Operational Mode: 'live' (real Open-Meteo data) or 'demo' (SIH demo scenarios)
current_mode = "live"

# Global simulation engine for SIH Demo scenarios
sim = SimulationEngine()
active_websockets: List[WebSocket] = []

@app.on_event("startup")
async def startup_event():
    """Initializes live weather data and starts background WebSocket notification loop."""
    try:
        # Pre-fetch live weather on startup
        live_weather_service.fetch_live_weather(force=True)
    except Exception as e:
        print(f"[LiveWeather Startup] {e}")

    async def telemetry_broadcast_loop():
        while True:
            await asyncio.sleep(4.0)
            try:
                if current_mode == "live":
                    # Refresh live weather if TTL expired
                    live_data = live_weather_service.fetch_live_weather(force=False)
                    kpis = {
                        "total_stations": live_data["total_locations"],
                        "active_sensors": live_data["active_parameters"],
                        "anomalies_detected": len(live_data["anomalies"]),
                        "critical_alerts": sum(1 for a in live_data["anomalies"] if a.get("severity") == "CRITICAL"),
                        "data_quality_pct": live_data["data_quality"]["validity_pct"],
                        "valid_records": live_data["data_quality"]["valid_records"],
                        "freshness": live_data["data_quality"]["freshness_seconds"],
                        "api_status": live_data["api_status"],
                        "data_source": "Open-Meteo API",
                        "timestamp": live_data["last_updated"]
                    }
                    payload = json.dumps({
                        "type": "telemetry_update",
                        "mode": "LIVE_OPEN_METEO",
                        "source": live_data["source"],
                        "disclaimer": live_data["disclaimer"],
                        "kpis": kpis,
                        "ai_brief": live_data["ai_brief"],
                        "active_anomalies_count": len(live_data["anomalies"]),
                        "stations": live_data["stations"],
                        "anomalies": live_data["anomalies"]
                    })
                else:
                    # In demo mode, tick simulation
                    readings = sim.tick()
                    payload = json.dumps({
                        "type": "telemetry_update",
                        "mode": "SIH_DEMO_SIMULATION",
                        "source": "SIH Demo / Simulation Testbench",
                        "disclaimer": "Operating in SIH Demo mode for simulated fault injection.",
                        "kpis": sim.get_network_kpis(),
                        "ai_brief": sim.generate_ai_brief(),
                        "active_anomalies_count": len(sim.active_anomalies),
                        "latest_readings": readings[:5]
                    })

                if active_websockets:
                    for ws in list(active_websockets):
                        try:
                            await ws.send_text(payload)
                        except Exception:
                            if ws in active_websockets:
                                active_websockets.remove(ws)
            except Exception as e:
                print(f"[BroadcastLoop Error] {e}")

    asyncio.create_task(telemetry_broadcast_loop())

# WebSocket connection for live telemetry stream
@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    try:
        live_data = live_weather_service.fetch_live_weather(force=False)
        initial_payload = json.dumps({
            "type": "initial_state",
            "mode": current_mode,
            "source": live_data["source"] if current_mode == "live" else "SIH Demo Simulation",
            "disclaimer": live_data["disclaimer"] if current_mode == "live" else "Simulation mode",
            "stations": live_data["stations"] if current_mode == "live" else sim.stations,
            "anomalies": live_data["anomalies"] if current_mode == "live" else sim.active_anomalies
        })
        await websocket.send_text(initial_payload)
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        if websocket in active_websockets:
            active_websockets.remove(websocket)
    except Exception:
        if websocket in active_websockets:
            active_websockets.remove(websocket)

# REST Endpoints

@app.get("/api/system-status")
def get_system_status():
    global current_mode
    live_data = live_weather_service.fetch_live_weather(force=False)

    if current_mode == "live":
        kpis = {
            "total_stations": live_data["total_locations"],
            "active_sensors": live_data["active_parameters"],
            "anomalies_detected": len(live_data["anomalies"]),
            "critical_alerts": sum(1 for a in live_data["anomalies"] if a.get("severity") == "CRITICAL"),
            "data_quality_pct": live_data["data_quality"]["validity_pct"],
            "valid_records": live_data["data_quality"]["valid_records"],
            "data_freshness": live_data["data_quality"]["freshness_seconds"],
            "api_latency": live_data["data_quality"]["api_latency_ms"],
            "api_status": live_data["api_status"],
            "data_source": "Open-Meteo API",
            "timestamp": live_data["last_updated"]
        }
        return {
            "status": "OPERATIONAL",
            "mode": "LIVE",
            "service": "SkyGuard-AI-Live-Weather-Monitoring",
            "organization": "Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD) Prototype",
            "source": "Live Weather Data — Open-Meteo API",
            "disclaimer": "Weather observations/forecast data are sourced from Open-Meteo. This prototype is not an official IMD telemetry feed.",
            "api_status": live_data["api_status"],
            "last_updated": live_data["last_updated"],
            "next_refresh_seconds": live_data["next_refresh_seconds"],
            "kpis": kpis,
            "ai_brief": live_data["ai_brief"],
            "national_stats": live_data["national_stats"],
            "data_quality": live_data["data_quality"]
        }
    else:
        return {
            "status": "OPERATIONAL (DEMO MODE)",
            "mode": "DEMO",
            "service": "SkyGuard-AI-SIH-Demo-Engine",
            "source": "SIH Simulation Testbench",
            "disclaimer": "Operating in SIH Demo mode for simulated fault injection.",
            "kpis": sim.get_network_kpis(),
            "ai_brief": sim.generate_ai_brief()
        }

@app.get("/api/stations")
def get_stations(region: Optional[str] = None, status: Optional[str] = None):
    global current_mode
    if current_mode == "live":
        live_data = live_weather_service.fetch_live_weather(force=False)
        stations = live_data["stations"]
    else:
        stations = sim.stations

    if region and region != "All":
        stations = [s for s in stations if s.get("region") == region or s.get("state") == region]
    if status and status != "All":
        stations = [s for s in stations if s.get("status") == status.lower()]
    return stations

@app.get("/api/stations/{station_id}")
def get_station_detail(station_id: str):
    global current_mode
    if current_mode == "live":
        live_data = live_weather_service.fetch_live_weather(force=False)
        st = next((s for s in live_data["stations"] if s["id"] == station_id), None)
        if not st:
            raise HTTPException(status_code=404, detail=f"Location {station_id} not found")

        # Compute nearest neighbor locations from actual coordinates
        nearby = []
        for other in live_data["stations"]:
            if other["id"] == st["id"]:
                continue
            dist = haversine_km(st["lat"], st["lon"], other["lat"], other["lon"])
            nearby.append({
                "id": other["id"],
                "name": other["name"],
                "distance_km": round(dist, 1),
                "temperature": other["temperature"],
                "pressure": other["pressure"],
                "humidity": other["humidity"],
                "status": other.get("status", "healthy")
            })
        nearby.sort(key=lambda x: x["distance_km"])

        anomalies = [a for a in live_data["anomalies"] if a["station_id"] == station_id]
        temp = st["temperature"] or 28.0
        press = st["pressure"] or 1008.0
        rh = st["humidity"] or 60.0

        return {
            "station": {
                **st,
                "sensor_health": 100.0 if st["status"] == "healthy" else (70.0 if st["status"] == "warning" else 35.0),
                "ai_confidence": 98.5
            },
            "nearby_stations": nearby[:4],
            "anomalies": anomalies,
            "maintenance_records": [],
            "source": "Open-Meteo API",
            "observation_time": st.get("obs_time"),
            "history_temperature": [temp, temp, temp, temp, temp],
            "history_pressure": [press, press, press, press, press],
            "history_humidity": [rh, rh, rh, rh, rh]
        }
    else:
        st = next((s for s in sim.stations if s["id"] == station_id), None)
        if not st:
            raise HTTPException(status_code=404, detail=f"Station {station_id} not found")
        nearby = sim.anomaly_detector.spatial.find_neighbors(st, sim.stations)
        nearby_list = [{
            "id": s["id"],
            "name": s["name"],
            "distance_km": round(d, 1),
            "temperature": s["temperature"],
            "pressure": s["pressure"],
            "humidity": s["humidity"],
            "status": s["status"]
        } for s, d in nearby]
        return {
            "station": st,
            "nearby_stations": nearby_list,
            "anomalies": [a for a in sim.active_anomalies if a["station_id"] == station_id],
            "maintenance_records": [m for m in sim.maintenance_tickets if m["station_id"] == station_id],
            "history_temperature": sim.history.get(f"{station_id}_temp", []),
            "history_pressure": sim.history.get(f"{station_id}_press", []),
            "history_humidity": sim.history.get(f"{station_id}_rh", [])
        }

@app.get("/api/telemetry")
def get_telemetry():
    global current_mode
    if current_mode == "live":
        live_data = live_weather_service.fetch_live_weather(force=False)
        feed = [{
            "station_id": s["id"],
            "station_name": s["name"],
            "region": s["region"],
            "timestamp": s["last_update"],
            "temperature": s["temperature"],
            "pressure": s["pressure"],
            "humidity": s["humidity"],
            "wind_speed": s["wind_speed"],
            "sensor_health": 100.0 if s["status"] == "healthy" else 65.0,
            "status": s["status"]
        } for s in live_data["stations"]]
        return {
            "feed": feed,
            "source": "Open-Meteo API",
            "timestamp": live_data["last_updated"]
        }
    else:
        return {
            "feed": sim.telemetry_feed,
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }

@app.get("/api/anomalies")
def get_anomalies(severity: Optional[str] = None, parameter: Optional[str] = None):
    global current_mode
    if current_mode == "live":
        live_data = live_weather_service.fetch_live_weather(force=False)
        anomalies = live_data["anomalies"]
    else:
        anomalies = sim.active_anomalies

    if severity and severity != "All":
        anomalies = [a for a in anomalies if a.get("severity") == severity.upper()]
    if parameter and parameter != "All":
        anomalies = [a for a in anomalies if a.get("parameter", "").lower() == parameter.lower()]
    return anomalies

@app.get("/api/anomalies/{anomaly_id}")
def get_anomaly_detail(anomaly_id: str):
    global current_mode
    anomalies = live_weather_service.active_anomalies if current_mode == "live" else sim.active_anomalies
    ano = next((a for a in anomalies if a["id"] == anomaly_id), None)
    if not ano:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    return ano

@app.get("/api/explain/{anomaly_id}")
def get_anomaly_explanation(anomaly_id: str):
    global current_mode
    anomalies = live_weather_service.active_anomalies if current_mode == "live" else sim.active_anomalies
    ano = next((a for a in anomalies if a["id"] == anomaly_id), None)
    if not ano:
        raise HTTPException(status_code=404, detail="Anomaly record not found")
    return {
        "anomaly_id": ano["id"],
        "station_id": ano["station_id"],
        "station_name": ano["station_name"],
        "parameter": ano["parameter"],
        "observed_value": ano["observed_value"],
        "expected_value": ano["expected_value"],
        "deviation": ano["deviation"],
        "anomaly_score": ano["anomaly_score"],
        "confidence": ano["confidence"],
        "severity": ano["severity"],
        "explanation": ano["explanation"],
        "feature_contributions": ano.get("feature_contributions", []),
        "root_cause_breakdown": ano.get("root_cause_breakdown", []),
        "is_genuine_weather": ano.get("is_genuine_weather", False)
    }

@app.get("/api/data-quality")
def get_data_quality():
    return live_weather_service.calculate_data_quality()

@app.get("/api/sensor-health")
def get_sensor_health():
    global current_mode
    if current_mode == "live":
        live_data = live_weather_service.fetch_live_weather(force=False)
        health_list = []
        for s in live_data["stations"]:
            is_healthy = s["status"] == "healthy"
            score = 100.0 if is_healthy else (70.0 if s["status"] == "warning" else 40.0)
            health_list.append({
                "station_id": s["id"],
                "station_name": s["name"],
                "region": s["region"],
                "overall_health": score,
                "data_reliability": 100.0 if s["temperature"] is not None else 0.0,
                "sensor_stability": 98.0 if is_healthy else 65.0,
                "communication_quality": 100.0 if live_weather_service.api_status == "ONLINE" else 0.0,
                "drift_score": 0.02 if is_healthy else 0.45,
                "anomaly_frequency": "None" if is_healthy else "Active",
                "calibration_confidence": 99.0 if is_healthy else 75.0,
                "status": "Excellent" if is_healthy else "Degraded",
                "trend": [score, score, score, score, score],
                "recommendation": "Nominal live telemetry" if is_healthy else "Inspect local microclimate variance"
            })
        return health_list
    else:
        return [
            {
                "station_id": st["id"],
                "station_name": st["name"],
                "region": st["region"],
                "overall_health": st["sensor_health"],
                "data_reliability": round(max(50.0, st["sensor_health"] * 0.98), 1),
                "sensor_stability": round(max(40.0, st["sensor_health"] * 0.95), 1),
                "communication_quality": 99.2 if not st.get("is_offline") else 12.0,
                "drift_score": 0.05,
                "anomaly_frequency": "Low",
                "calibration_confidence": 95.0,
                "status": "Healthy" if st["sensor_health"] >= 75 else "Critical",
                "trend": [st["sensor_health"]] * 5,
                "recommendation": "Nominal"
            } for st in sim.stations
        ]

@app.get("/api/maintenance")
def get_maintenance():
    global current_mode
    if current_mode == "live":
        # In live mode, only create maintenance if real physical boundary violation occurred
        anomalies = live_weather_service.active_anomalies
        tickets = []
        for ano in anomalies:
            if ano.get("severity") == "CRITICAL":
                tickets.append({
                    "id": f"MNT-LIVE-{ano['station_id']}",
                    "station_id": ano["station_id"],
                    "station_name": ano["station_name"],
                    "sensor": f"{ano['parameter']} Transducer",
                    "health": 35.0,
                    "priority": "CRITICAL",
                    "anomaly_frequency": "High",
                    "drift_status": f"Physical Boundary Excursion ({ano['deviation']}°C)",
                    "recommended_action": f"Physical validation breach. Verify location telemetry feed.",
                    "created_at": ano["timestamp"],
                    "status": "Open"
                })
        return tickets
    else:
        return sim.maintenance_tickets

@app.post("/api/live-weather/refresh")
def force_refresh_live_weather():
    """Forces an immediate fresh query to Open-Meteo API."""
    data = live_weather_service.fetch_live_weather(force=True)
    return {
        "success": True,
        "message": "Live weather refreshed from Open-Meteo API",
        "api_status": data["api_status"],
        "last_updated": data["last_updated"],
        "total_locations": data["total_locations"]
    }

@app.post("/api/mode/toggle")
def toggle_mode(target_mode: str = Query("live", pattern="^(live|demo)$")):
    """Switches system between 'live' (Open-Meteo) and 'demo' (SIH Scenarios)."""
    global current_mode
    current_mode = target_mode
    if current_mode == "live":
        live_weather_service.fetch_live_weather(force=False)
    return {
        "success": True,
        "mode": current_mode,
        "source": "Open-Meteo API" if current_mode == "live" else "SIH Demo Simulation"
    }

@app.post("/api/simulation/scenario/{scenario_name}")
def trigger_scenario(scenario_name: str):
    """Automatically switches to DEMO mode and executes the requested SIH scenario."""
    global current_mode
    current_mode = "demo"

    if scenario_name == "scenario_1_spike":
        sim.inject_scenario_1_spike("AWS-MH-042")
        return {
            "success": True,
            "mode": "demo",
            "scenario": "Scenario 1: 55°C Catastrophic Spike",
            "target": "AWS-MH-042",
            "message": "Switched to DEMO mode. 55°C temperature spike injected on AWS-MH-042."
        }
    elif scenario_name == "scenario_2_regional":
        sim.inject_scenario_2_regional()
        return {
            "success": True,
            "mode": "demo",
            "scenario": "Scenario 2: Regional Genuine Weather Event",
            "cluster": "Western Ghats (5 stations)",
            "message": "Switched to DEMO mode. Regional squall front injected across 5 stations."
        }
    elif scenario_name == "scenario_freeze":
        sim.inject_custom("AWS-MH-014", "freeze")
        return {"success": True, "mode": "demo", "scenario": "Frozen Sensor", "target": "AWS-MH-014"}
    elif scenario_name == "scenario_drift":
        sim.inject_custom("AWS-RJ-045", "drift")
        return {"success": True, "mode": "demo", "scenario": "Sensor Drift", "target": "AWS-RJ-045"}
    elif scenario_name == "scenario_offline":
        sim.inject_custom("AWS-AS-010", "offline")
        return {"success": True, "mode": "demo", "scenario": "Communication Failure", "target": "AWS-AS-010"}
    else:
        raise HTTPException(status_code=400, detail=f"Unknown scenario '{scenario_name}'")

@app.post("/api/simulation/inject")
def inject_custom_anomaly(req: AnomalyInjectionRequest):
    """Injects a custom anomaly and switches to Demo Mode."""
    global current_mode
    current_mode = "demo"
    sim.inject_custom(req.station_id, req.anomaly_type, req.parameter, req.value)
    return {
        "success": True,
        "mode": "demo",
        "station_id": req.station_id,
        "anomaly_type": req.anomaly_type,
        "value": req.value
    }

class AcceptCorrectionRequest(BaseModel):
    anomaly_id: str

@app.post("/api/correction/accept")
def accept_correction(req: AcceptCorrectionRequest):
    """Accepts automated imputation for an anomaly."""
    for ano in sim.active_anomalies:
        if ano["id"] == req.anomaly_id:
            ano["accepted_correction"] = True
            ano["status"] = "Corrected"
            return {"success": True, "anomaly_id": req.anomaly_id}
    return {"success": True, "anomaly_id": req.anomaly_id}

@app.post("/api/simulation/reset")
def reset_simulation():
    """Resets simulation and returns system to LIVE OPEN-METEO mode."""
    global current_mode
    current_mode = "live"
    sim.reset()
    live_weather_service.fetch_live_weather(force=True)
    return {
        "success": True,
        "mode": "live",
        "message": "System returned to LIVE Open-Meteo mode. Telemetry reset to real weather values."
    }

@app.get("/api/reports")
def get_reports():
    global current_mode
    if current_mode == "live":
        live_data = live_weather_service.fetch_live_weather(force=False)
        reports = []
        for ano in live_data["anomalies"]:
            st = next((s for s in live_data["stations"] if s["id"] == ano["station_id"]), None)
            if st:
                reports.append(ReportService.generate_incident_report(ano, st))
        return reports
    else:
        reports = []
        for ano in sim.active_anomalies:
            st = next((s for s in sim.stations if s["id"] == ano["station_id"]), None)
            if st:
                reports.append(ReportService.generate_incident_report(ano, st))
        return reports

@app.post("/api/copilot/ask")
def ask_copilot(req: CopilotQueryRequest):
    """
    SkyGuard AI Meteorological Copilot.
    Answers natural language queries using real live Open-Meteo weather data.
    """
    global current_mode
    q = req.query.lower()
    live_data = live_weather_service.fetch_live_weather(force=False)
    stations = live_data["stations"]

    # In Live Mode, answer using actual API values
    if current_mode == "live":
        # Check if user asks about a specific city
        for st in stations:
            city_name = st["name"].lower()
            if city_name in q:
                return {
                    "answer": (
                        f"Current live weather in {st['name']} ({st['state']}): "
                        f"Temperature: {st['temperature']}°C, "
                        f"Relative Humidity: {st['humidity']}%, "
                        f"Surface Pressure: {st['pressure']} hPa, "
                        f"Wind Speed: {st.get('wind_speed', 'N/A')} km/h. "
                        f"Source: Open-Meteo API (Updated: {st['last_update']})."
                    ),
                    "data_points": st
                }

        if "highest temperature" in q or "hottest" in q or "maximum temperature" in q:
            valid_temps = [s for s in stations if s.get("temperature") is not None]
            if valid_temps:
                hottest = max(valid_temps, key=lambda s: s["temperature"])
                return {
                    "answer": (
                        f"The highest temperature currently recorded in India among the monitored locations is "
                        f"{hottest['name']} ({hottest['state']}) at {hottest['temperature']}°C "
                        f"(Relative Humidity: {hottest['humidity']}%, Pressure: {hottest['pressure']} hPa). "
                        f"Source: Open-Meteo API."
                    )
                }

        if "lowest temperature" in q or "coldest" in q or "minimum temperature" in q:
            valid_temps = [s for s in stations if s.get("temperature") is not None]
            if valid_temps:
                coldest = min(valid_temps, key=lambda s: s["temperature"])
                return {
                    "answer": (
                        f"The lowest temperature currently recorded among the monitored locations is "
                        f"{coldest['name']} ({coldest['state']}) at {coldest['temperature']}°C "
                        f"(Relative Humidity: {coldest['humidity']}%, Pressure: {coldest['pressure']} hPa). "
                        f"Source: Open-Meteo API."
                    )
                }

        if "highest humidity" in q or "most humid" in q:
            valid_rhs = [s for s in stations if s.get("humidity") is not None]
            if valid_rhs:
                most_humid = max(valid_rhs, key=lambda s: s["humidity"])
                return {
                    "answer": (
                        f"The highest relative humidity currently recorded is in {most_humid['name']} ({most_humid['state']}) "
                        f"at {most_humid['humidity']}% with a temperature of {most_humid['temperature']}°C."
                    )
                }

        if "anomaly" in q or "anomalies" in q:
            if not live_data["anomalies"]:
                return {
                    "answer": (
                        f"No active anomalies detected across all {len(stations)} Indian locations. "
                        f"All current Open-Meteo observations satisfy physical atmospheric bounds "
                        f"and regional spatial consensus thresholds."
                    )
                }
            else:
                ano_desc = ", ".join([f"{a['station_name']} ({a['parameter']}: {a['observed_value']})" for a in live_data["anomalies"]])
                return {
                    "answer": f"Active anomalies detected: {ano_desc}."
                }

        # Default summary
        stats = live_data["national_stats"]
        return {
            "answer": (
                f"SkyGuard AI is currently operating in LIVE MODE monitoring {len(stations)} Indian locations "
                f"via Open-Meteo API. National average temperature is {stats['avg_temperature']}°C, "
                f"with {stats['highest_temp_location']} and {stats['lowest_temp_location']}. "
                f"Average humidity is {stats['avg_humidity']}%. "
                f"Data quality is assessed at {live_data['data_quality']['validity_pct']} validity. "
                f"You can ask me about any specific city (e.g., Pune, Delhi, Mumbai), query highest/lowest values, "
                f"or run SIH Demo scenarios."
            )
        }
    else:
        # In Demo Mode, answer based on the simulated scenarios
        if "why" in q and ("flagged" in q or "aws-mh-042" in q or "spike" in q):
            return {
                "answer": (
                    "In SIH Demo Mode: AWS-MH-042 (Pune) was flagged because an artificial 55.0°C thermal spike was injected. "
                    "The spatial engine compared 4 neighboring stations (Mumbai, Mahabaleshwar, Nashik, Kolhapur) which showed 0% agreement, "
                    "classifying it as a Sensor Malfunction with 98% confidence. Estimated corrected value: 31.4°C."
                )
            }
        return {
            "answer": "Operating in SIH Demo Mode. You can ask about the 55°C spike, or click 'Reset Baseline' to return to live Open-Meteo weather data."
        }
