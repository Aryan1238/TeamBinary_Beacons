import os
import asyncio
import json
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, BackgroundTasks, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

def resolve_session_id(request: Request, session_id: Optional[str] = None) -> str:
    """Resolves session ID from body/query, X-Session-ID header, or falls back to 'default'."""
    if session_id and session_id.strip():
        return session_id.strip()
    hdr = request.headers.get("x-session-id")
    if hdr and hdr.strip():
        return hdr.strip()
    return "default"

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
    from .ml.lstm_service import lstm_service
    from .ml.investigation_service import investigation_service
    from .ml.historical_drift_service import historical_drift_service
    from .ml.weather_analytics_service import weather_analytics_service
    from .ml.sensor_health_service import sensor_health_service
    from .services.maintenance_service import maintenance_service
    from .services.simulation_service import simulation_service
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
    from ml.lstm_service import lstm_service
    from ml.investigation_service import investigation_service
    from ml.historical_drift_service import historical_drift_service
    from ml.weather_analytics_service import weather_analytics_service
    from ml.sensor_health_service import sensor_health_service
    from services.maintenance_service import maintenance_service
    from services.simulation_service import simulation_service

app = FastAPI(
    title="SkyGuard AI API - MoES / IMD AWS Intelligence",
    version="2.5.0",
    description="Live Weather Data Anomaly Detection & Telemetry Assurance Platform for Automatic Weather Stations (Powered by Open-Meteo API)"
)

# Enable CORS for frontend and GitHub Pages production deployment
allowed_origins_env = os.environ.get("CORS_ALLOWED_ORIGINS", "")
custom_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

default_origins = [
    "https://aryan1238.github.io",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

all_allowed_origins = list(set(default_origins + custom_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=all_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
@app.get("/api/health")
def health_check():
    """Lightweight health check endpoint for Render / monitoring services."""
    return {
        "status": "healthy",
        "service": "skyguard-ai-backend",
        "timestamp": datetime.now().isoformat()
    }

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

    try:
        # Pre-warm live LSTM buffers for all 7 stations so startup telemetry starts fully warmed (24/24)
        for st_id in ["AWS-001", "AWS-002", "AWS-003", "AWS-004", "AWS-005", "AWS-006", "AWS-007"]:
            simulation_service.warmup_station_buffer(st_id, "Meteostat")
    except Exception as e:
        print(f"[Buffer Warmup Startup] {e}")

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
                        "anomalies": live_data["anomalies"],
                        "ml_status": {
                            "active_buffers": len(lstm_service.buffers),
                            "threshold": round(lstm_service.threshold, 5)
                        },
                        "active_investigations": investigation_service.get_active_investigations()
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
                        "latest_readings": readings[:5],
                        "ml_status": {
                            "active_buffers": len(lstm_service.buffers),
                            "threshold": round(lstm_service.threshold, 5)
                        },
                        "active_investigations": investigation_service.get_active_investigations()
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
    try:
        live_data = live_weather_service.fetch_live_weather(force=False)
    except Exception as e:
        print(f"[get_system_status error] {e}")
        live_data = live_weather_service._build_response()

    if current_mode == "live":
        kpis = {
            "total_stations": live_data.get("total_locations", len(live_weather_service.cached_stations)),
            "active_sensors": live_data.get("active_parameters", len(live_weather_service.cached_stations) * 3),
            "anomalies_detected": len(live_data.get("anomalies", [])),
            "critical_alerts": sum(1 for a in live_data.get("anomalies", []) if a.get("severity") == "CRITICAL"),
            "data_quality_pct": live_data.get("data_quality", {}).get("validity_pct", "100%"),
            "valid_records": live_data.get("data_quality", {}).get("valid_records", f"{len(live_weather_service.cached_stations)} / {len(live_weather_service.cached_stations)}"),
            "data_freshness": live_data.get("data_quality", {}).get("freshness_seconds", "0s ago"),
            "api_latency": live_data.get("data_quality", {}).get("api_latency_ms", "250 ms"),
            "api_status": live_data.get("api_status", "ONLINE"),
            "data_source": "Open-Meteo API",
            "timestamp": live_data.get("last_updated", live_weather_service.last_sync_timestamp)
        }
        return {
            "status": "OPERATIONAL",
            "mode": "LIVE",
            "service": "SkyGuard-AI-Live-Weather-Monitoring",
            "organization": "Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD) Prototype",
            "source": "Live Weather Data — Open-Meteo API",
            "disclaimer": "Weather observations/forecast data are sourced from Open-Meteo. This prototype is not an official IMD telemetry feed.",
            "api_status": live_data.get("api_status", "ONLINE"),
            "last_updated": live_data.get("last_updated", live_weather_service.last_sync_timestamp),
            "next_refresh_seconds": live_data.get("next_refresh_seconds", 300),
            "kpis": kpis,
            "ai_brief": live_data.get("ai_brief", "Operational nominal telemetry."),
            "national_stats": live_data.get("national_stats", {}),
            "data_quality": live_data.get("data_quality", {})
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
    try:
        if current_mode == "live":
            live_data = live_weather_service.fetch_live_weather(force=False)
            stations = live_data.get("stations", live_weather_service.cached_stations)
        else:
            stations = sim.stations
    except Exception as e:
        print(f"[get_stations error] {e}")
        stations = live_weather_service.cached_stations

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
        st = next((s for s in live_data["stations"] if s["id"] == station_id or s.get("code") == station_id or s.get("meteostat_id") == station_id or s.get("name", "").lower() == station_id.lower()), None)
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

        anomalies = [a for a in live_data["anomalies"] if a["station_id"] in (st["id"], st.get("code"), st.get("meteostat_id"))]
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
        try:
            live_data = live_weather_service.fetch_live_weather(force=False)
            stations = live_data.get("stations", live_weather_service.cached_stations)
        except Exception as e:
            print(f"[get_sensor_health error] {e}")
            stations = live_weather_service.cached_stations
        health_list = []
        for s in stations:
            is_healthy = s.get("status") == "healthy"
            score = 100.0 if is_healthy else (70.0 if s.get("status") == "warning" else 40.0)
            health_list.append({
                "station_id": s["id"],
                "station_name": s["name"],
                "region": s["region"],
                "overall_health": score,
                "data_reliability": 100.0 if s.get("temperature") is not None else 0.0,
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
        sim.inject_scenario_1_spike("AWS-001")
        investigation_service.evaluate_telemetry({
            "station_id": "AWS-001",
            "source": "Meteostat",
            "timestamp": datetime.now().isoformat(),
            "temperature": 55.0,
            "humidity": 78.0,
            "pressure": 1009.4,
            "wind_speed": 15.2,
            "wind_direction": 180.0,
            "fault_type": "SPIKE",
            "affected_feature": "temperature",
        })
        return {
            "success": True,
            "mode": "demo",
            "scenario": "Scenario 1: 55°C Catastrophic Spike",
            "target": "AWS-001",
            "message": "Switched to DEMO mode. 55°C temperature spike injected on AWS-001 (Chennai)."
        }
    elif scenario_name == "scenario_2_regional":
        sim.inject_scenario_2_regional()
        investigation_service.latest_station_readings["AWS-004"] = {
            "station_id": "AWS-004",
            "name": "Mumbai / Santacruz Intl",
            "lat": 19.0886,
            "lon": 72.8679,
            "temperature": 23.0,
            "timestamp": datetime.now().isoformat()
        }
        investigation_service.evaluate_telemetry({
            "station_id": "AWS-003",
            "source": "Meteostat",
            "timestamp": datetime.now().isoformat(),
            "temperature": 20.3,
            "humidity": 82.0,
            "pressure": 1002.6,
            "wind_speed": 18.5,
            "wind_direction": 240.0,
            "fault_type": "REGIONAL_EVENT",
            "affected_feature": "temperature",
        })
        return {
            "success": True,
            "mode": "demo",
            "scenario": "Scenario 2: Regional Genuine Weather Event",
            "cluster": "Pune & Mumbai Corridor (AWS-003 & AWS-004)",
            "message": "Switched to DEMO mode. Regional squall front injected across Pune & Mumbai."
        }
    elif scenario_name == "scenario_freeze":
        sim.inject_custom("AWS-002", "freeze")
        investigation_service.evaluate_telemetry({
            "station_id": "AWS-002",
            "source": "Meteostat",
            "timestamp": datetime.now().isoformat(),
            "temperature": 24.6,
            "humidity": 65.0,
            "pressure": 1012.4,
            "wind_speed": 11.8,
            "wind_direction": 180.0,
            "fault_type": "FREEZE",
            "affected_feature": "temperature",
        })
        return {"success": True, "mode": "demo", "scenario": "Frozen Sensor", "target": "AWS-002"}
    elif scenario_name == "scenario_drift":
        sim.inject_custom("AWS-007", "drift")
        investigation_service.evaluate_telemetry({
            "station_id": "AWS-007",
            "source": "NOAA",
            "timestamp": datetime.now().isoformat(),
            "temperature": 34.2,
            "humidity": 61.0,
            "pressure": 1010.8,
            "wind_speed": 10.5,
            "wind_direction": 180.0,
            "fault_type": "DRIFT",
            "affected_feature": "temperature",
        })
        return {"success": True, "mode": "demo", "scenario": "Sensor Drift", "target": "AWS-007"}
    elif scenario_name == "scenario_offline":
        sim.inject_custom("AWS-005", "offline")
        investigation_service.evaluate_telemetry({
            "station_id": "AWS-005",
            "source": "Meteostat",
            "timestamp": datetime.now().isoformat(),
            "temperature": 31.2,
            "humidity": 82.0,
            "pressure": 1010.5,
            "wind_speed": 9.4,
            "wind_direction": 180.0,
            "fault_type": "COMMUNICATION_FAILURE",
            "affected_feature": "temperature",
            "comm_failure_hours": 3.0,
        }, comm_failure_hours=3.0)
        return {"success": True, "mode": "demo", "scenario": "Communication Failure", "target": "AWS-005"}
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
def reset_simulation(request: Request, session_id: Optional[str] = None):
    """Resets simulation and returns system to LIVE OPEN-METEO mode."""
    global current_mode
    current_mode = "live"
    sid = resolve_session_id(request, session_id)
    sim.reset()
    investigation_service.clear_all(session_id=sid)
    lstm_service.reset_session_buffers(sid, "Simulation Reset")
    live_weather_service.fetch_live_weather(force=True)
    return {
        "success": True,
        "mode": "live",
        "session_id": sid,
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
                f"You can ask me about any specific station (e.g., Pune, Chennai, Mumbai, Bengaluru), query highest/lowest values, "
                f"or run SIH Demo scenarios."
            )
        }
    else:
        # In Demo Mode, answer based on the simulated scenarios
        if "why" in q and ("flagged" in q or "aws-001" in q or "chennai" in q or "spike" in q):
            return {
                "answer": (
                    "In SIH Demo Mode: AWS-001 (Chennai) was flagged because an artificial 55.0°C thermal spike was injected. "
                    "The spatial engine compared neighboring stations which showed 0% agreement, "
                    "classifying it as an Isolated Sensor Malfunction with 98% confidence. Estimated corrected value: 29.8°C."
                )
            }
        return {
            "answer": "Operating in SIH Demo Mode. You can ask about the 55°C spike on Chennai (AWS-001), or click 'Return to Live Weather Data' to return to live Open-Meteo weather data."
        }


# =====================================================================
# LSTM Autoencoder Inference Endpoints
# =====================================================================

class MLInferPacket(BaseModel):
    station_id: str
    source: str = "Meteostat"
    timestamp: Optional[str] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    pressure: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[float] = 0.0
    fault_type: Optional[str] = None
    affected_feature: Optional[str] = None
    session_id: Optional[str] = None


@app.post("/api/ml/infer")
def ml_infer_packet(packet: MLInferPacket, request: Request):
    """
    Submits a telemetry packet to the LSTM Autoencoder rolling buffer.
    Returns status: NORMAL, ANOMALY, WARMING_UP (n/24), or NOT_APPLICABLE (3h cadence).
    """
    sid = resolve_session_id(request, packet.session_id)
    result = lstm_service.process_packet(
        packet.dict(),
        fault_type=packet.fault_type,
        affected_feature=packet.affected_feature,
        session_id=sid
    )
    return result


@app.get("/api/ml/threshold")
def ml_get_threshold():
    """Returns the frozen anomaly threshold and model feature list."""
    return {
        "threshold": round(lstm_service.threshold, 5),
        "method": "percentile_grid_search_max_f1",
        "validation_f1": 0.339,
        "feature_count": len(lstm_service.feature_list),
        "features": lstm_service.feature_list,
        "disclaimer": "Test recall ~26.5%, Precision ~43%, F1 ~0.33. Misses expected especially for TEMP_DRIFT (11.5%) and TEMP_SPIKE (14.7%)."
    }


@app.get("/api/ml/status")
def ml_get_status(request: Request, station_id: Optional[str] = None, source: str = "Meteostat", session_id: Optional[str] = None):
    """Returns buffer and inference status for a station or all buffers for the current session."""
    sid = resolve_session_id(request, session_id)
    buffers = lstm_service.get_session_buffers(sid)
    if station_id:
        key = (str(station_id), source)
        buf = buffers.get(key, [])
        is_excluded = lstm_service.is_series_excluded(station_id, source)
        return {
            "session_id": sid,
            "station_id": station_id,
            "source": source,
            "is_excluded": is_excluded,
            "buffer_length": len(buf),
            "status": "NOT_APPLICABLE (3h cadence)" if is_excluded else ("NORMAL" if len(buf) >= 24 else f"WARMING_UP ({len(buf)}/24)"),
            "threshold": round(lstm_service.threshold, 5)
        }
    else:
        status_map = {}
        for (st_id, src), buf in buffers.items():
            status_map[f"{st_id}_{src}"] = {
                "station_id": st_id,
                "source": src,
                "buffer_length": len(buf),
                "status": "NORMAL" if len(buf) >= 24 else f"WARMING_UP ({len(buf)}/24)"
            }
        return {
            "session_id": sid,
            "active_buffers": len(buffers),
            "buffers": status_map,
            "threshold": round(lstm_service.threshold, 5)
        }


@app.post("/api/ml/reset")
def ml_reset_buffers(request: Request, station_id: Optional[str] = None, source: str = "Meteostat", session_id: Optional[str] = None):
    """Resets the rolling buffer for a station or all stations for this session."""
    sid = resolve_session_id(request, session_id)
    if station_id:
        lstm_service.reset_buffer(station_id, source, "API Reset Request", session_id=sid)
    else:
        lstm_service.reset_session_buffers(sid, "Global Reset Request")
    return {"success": True, "message": f"ML buffers reset successfully for session {sid}"}


@app.get("/api/ml/logs")
def ml_get_recent_logs(limit: int = 50):
    """Returns recent lines from the append-only inference log."""
    log_path = lstm_service.log_file_path
    if not os.path.exists(log_path):
        return {"logs": [], "total": 0}
    
    logs = []
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    logs.append(json.loads(line))
    except Exception as e:
        return {"logs": [], "error": str(e)}
    
    return {
        "log_file": log_path,
        "total": len(logs),
        "recent": logs[-limit:]
    }


# =====================================================================
# Anomaly Investigation & Forensic Triage Endpoints
# =====================================================================

class InvestigationEvaluationRequest(BaseModel):
    station_id: str
    source: str = "Meteostat"
    timestamp: Optional[str] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    pressure: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[float] = 0.0
    fault_type: Optional[str] = None
    affected_feature: Optional[str] = None
    comm_failure_hours: Optional[float] = 0.0
    ml_result: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None


@app.get("/api/investigation/active")
def api_get_active_investigations(request: Request, session_id: Optional[str] = None):
    """Returns all currently active investigation records across the network for this session."""
    sid = resolve_session_id(request, session_id)
    investigations = investigation_service.get_active_investigations(session_id=sid)
    return {
        "session_id": sid,
        "total": len(investigations),
        "investigations": investigations
    }


@app.get("/api/investigation/{station_id}")
def api_get_station_investigation(station_id: str, request: Request, session_id: Optional[str] = None):
    """Returns the active investigation record for a specific station, or null."""
    sid = resolve_session_id(request, session_id)
    record = investigation_service.get_station_investigation(station_id, session_id=sid)
    return {
        "session_id": sid,
        "station_id": station_id,
        "investigation": record
    }


@app.post("/api/investigation/evaluate")
def api_evaluate_investigation(req: InvestigationEvaluationRequest, request: Request):
    """
    Evaluates an incoming telemetry packet across ML sequence error, deterministic rule checks,
    external weather, and spatial consensus. Returns an InvestigationRecord if triggered.
    """
    sid = resolve_session_id(request, req.session_id)
    packet = req.dict()
    record = investigation_service.evaluate_telemetry(
        packet,
        ml_result=req.ml_result,
        comm_failure_hours=req.comm_failure_hours or 0.0,
        session_id=sid
    )
    return {
        "session_id": sid,
        "has_investigation": record is not None,
        "investigation": record
    }


@app.post("/api/investigation/clear")
def api_clear_investigation(request: Request, station_id: Optional[str] = None, session_id: Optional[str] = None):
    """Clears active investigations for a station or all stations for this session."""
    sid = resolve_session_id(request, session_id)
    if station_id:
        investigation_service.clear_investigation(station_id, session_id=sid)
    else:
        investigation_service.clear_all(session_id=sid)
    return {"success": True, "message": "Investigations cleared successfully"}


# =====================================================================
# Historical Drift & Trend Analysis Endpoints
# =====================================================================

class HistoricalDriftTestRequest(BaseModel):
    station_id: str = "AWS-003"
    sensor: str = "temperature"
    time_range: str = "30d"
    source: str = "Meteostat"
    injected_drift: Optional[Dict[str, Any]] = None
    injected_spike: Optional[Dict[str, Any]] = None


@app.get("/api/historical/drift")
def api_get_historical_drift(
    station_id: str = "AWS-003",
    sensor: str = "temperature",
    time_range: str = "30d",
    source: str = "Meteostat",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Computes real historical trend, moving average, long-term baseline,
    and 4-tier drift classification anchored to 2025-12-31 23:00:00.
    """
    result = historical_drift_service.analyze_drift(
        station_id=station_id,
        sensor=sensor,
        time_range=time_range,
        source=source,
        start_date=start_date,
        end_date=end_date
    )
    return result


@app.post("/api/historical/test-inject")
def api_test_injected_historical_drift(req: HistoricalDriftTestRequest):
    """
    Simulates drift or transient spike injection over a real historical window
    without mutating the underlying CSV on disk.
    """
    result = historical_drift_service.analyze_drift(
        station_id=req.station_id,
        sensor=req.sensor,
        time_range=req.time_range,
        source=req.source,
        test_injected_drift=req.injected_drift,
        test_injected_spike=req.injected_spike
    )
    return result


# =====================================================================
# Weather Analytics Endpoints
# =====================================================================

class MultiStationCompareRequest(BaseModel):
    station_ids: List[str] = ["AWS-003", "AWS-004"]
    sensor: str = "temperature"
    time_range: str = "30d"
    source: str = "Meteostat"
    start_date: Optional[str] = None
    end_date: Optional[str] = None


@app.get("/api/analytics/weather")
def api_get_weather_analytics(
    station_id: str = "AWS-003",
    sensor: str = "temperature",
    time_range: str = "30d",
    source: str = "Meteostat",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Returns comprehensive weather analytics including KPIs, trend series,
    percentile distribution, diurnal & monthly patterns, precipitation analysis,
    live vs historical context, insights, and data quality.
    """
    return weather_analytics_service.get_weather_analytics(
        station_id=station_id,
        sensor=sensor,
        time_range=time_range,
        source=source,
        start_date=start_date,
        end_date=end_date
    )


@app.get("/api/analytics/correlations")
def api_get_weather_correlations(
    station_id: str = "AWS-003",
    time_range: str = "30d",
    source: str = "Meteostat",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Returns bivariate correlations (Pearson r, R2, OLS fit, scatter points)
    for Temp<->Humidity, Temp<->Pressure, Wind<->Pressure, Temp<->Precip.
    """
    return weather_analytics_service.get_correlations(
        station_id=station_id,
        time_range=time_range,
        source=source,
        start_date=start_date,
        end_date=end_date
    )


@app.post("/api/analytics/compare")
def api_compare_weather_stations(req: MultiStationCompareRequest):
    """
    Compares 2+ stations across time series and comparative metrics
    for the selected sensor and window.
    """
    return weather_analytics_service.compare_stations(
        station_ids=req.station_ids,
        sensor=req.sensor,
        time_range=req.time_range,
        source=req.source,
        start_date=req.start_date,
        end_date=req.end_date
    )


# =====================================================================
# Sensor Health Matrix & Maintenance Endpoints
# =====================================================================

class TicketCreateRequest(BaseModel):
    station_id: str
    station_name: Optional[str] = None
    station_location: Optional[str] = None
    sensor: str
    issue: Optional[str] = None
    priority: Optional[str] = "HIGH"
    status: Optional[str] = "OPEN"
    assigned_to: Optional[str] = None
    evidence: Optional[Dict[str, Any]] = None
    recommended_action: Optional[str] = None
    notes: Optional[List[Dict[str, Any]]] = None
    session_id: Optional[str] = None


class TicketUpdateRequest(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[List[Dict[str, Any]]] = None
    note: Optional[str] = None
    author: Optional[str] = "Operator"
    resolution: Optional[str] = None
    session_id: Optional[str] = None


@app.get("/api/sensor-health/matrix")
def api_get_sensor_health_matrix(request: Request, session_id: Optional[str] = None):
    """
    Returns full Station x Sensor Health Matrix (7 stations x 5 sensors),
    along with Station Overall Health and live summary KPIs for this session.
    """
    sid = resolve_session_id(request, session_id)
    return sensor_health_service.get_station_health_matrix(session_id=sid)


@app.get("/api/sensor-health/sensor")
def api_get_single_sensor_health(request: Request, station_id: str = "AWS-003", sensor: str = "temperature", session_id: Optional[str] = None):
    """
    Returns granular diagnostic record for a single probe including
    'Why this status?', active investigation root cause, drift metrics, and event timeline.
    """
    sid = resolve_session_id(request, session_id)
    return sensor_health_service.get_single_sensor_detail(station_id=station_id, sensor=sensor, session_id=sid)


@app.get("/api/maintenance/tickets")
def api_get_maintenance_tickets(
    request: Request,
    status: Optional[str] = None,
    station_id: Optional[str] = None,
    sensor: Optional[str] = None,
    priority: Optional[str] = None,
    session_id: Optional[str] = None
):
    """
    Returns persistent list of maintenance work orders filtered by status/station/sensor/priority,
    plus live maintenance KPIs (open, high priority, in progress, awaiting verification, resolved, overdue).
    """
    sid = resolve_session_id(request, session_id)
    tickets = maintenance_service.list_tickets(status=status, station_id=station_id, sensor=sensor, priority=priority, session_id=sid)
    kpis = maintenance_service.get_kpis(session_id=sid)
    return {
        "session_id": sid,
        "kpis": kpis,
        "tickets": tickets
    }


@app.post("/api/maintenance/tickets")
def api_create_maintenance_ticket(req: TicketCreateRequest, request: Request):
    """
    Creates a new maintenance ticket with automatic priority/evidence mapping.
    """
    sid = resolve_session_id(request, req.session_id)
    ticket = maintenance_service.create_ticket(req.dict(), session_id=sid)
    return ticket


@app.patch("/api/maintenance/tickets/{ticket_id}")
def api_update_maintenance_ticket(ticket_id: str, req: TicketUpdateRequest, request: Request):
    """
    Updates maintenance ticket status, assignee, notes, or resolution.
    Moving status to RESOLVED flags ticket into AWAITING VERIFICATION per the Verification Rule.
    """
    sid = resolve_session_id(request, req.session_id)
    updated = maintenance_service.update_ticket(ticket_id, req.dict(exclude_unset=True), session_id=sid)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    return updated


@app.post("/api/maintenance/tickets/{ticket_id}/verify")
def api_verify_maintenance_ticket(ticket_id: str, request: Request, session_id: Optional[str] = None):
    """
    Step 7 & 10 Verification Endpoint:
    Re-evaluates live sensor health and telemetry for the ticket's station and sensor.
    - If nominal, closes ticket and restores sensor to HEALTHY.
    - If fault is still active, verification fails and sensor remains in non-healthy status.
    """
    sid = resolve_session_id(request, session_id)
    ticket = maintenance_service.get_ticket(ticket_id, session_id=sid)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")

    station_id = ticket["station_id"]
    sensor = ticket["sensor"]

    sensor_detail = sensor_health_service.get_single_sensor_detail(station_id, sensor, session_id=sid)
    current_sensor_status = sensor_detail["status"]
    active_invs = investigation_service.get_active_investigations(session_id=sid)

    res = maintenance_service.verify_ticket(
        ticket_id=ticket_id,
        active_investigations=active_invs,
        current_sensor_status=current_sensor_status,
        session_id=sid
    )
    return res


# =====================================================================
# Full Pipeline Simulation Lab Endpoints
# =====================================================================

class SimulationStartRequest(BaseModel):
    station_id: str = "AWS-003"
    sensor: str = "temperature"
    scenario: str = "temperature-spike"
    magnitude: Optional[float] = None
    duration: int = 12
    noise_level: str = "MEDIUM"
    auto_warmup: bool = True
    session_id: Optional[str] = None


class SimulationWarmupRequest(BaseModel):
    station_id: str = "AWS-003"
    source: str = "Meteostat"
    session_id: Optional[str] = None


@app.post("/api/simulation/warmup")
def api_warmup_simulation_buffer(req: SimulationWarmupRequest, request: Request):
    """
    Pre-seeds live LSTM buffer with last 24 real consecutive hourly readings
    from the historical dataset without modifying CSV files.
    """
    sid = resolve_session_id(request, req.session_id)
    return simulation_service.warmup_station_buffer(req.station_id, req.source, session_id=sid)


@app.post("/api/simulation/start")
def api_start_simulation(req: SimulationStartRequest, request: Request):
    """
    Executes full pipeline testbench:
    Simulation -> Telemetry -> ML Inference -> Alert -> Triage -> Spatial -> Sensor Health -> Ticket.
    """
    sid = resolve_session_id(request, req.session_id)
    return simulation_service.start_simulation(
        station_id=req.station_id,
        sensor=req.sensor,
        scenario=req.scenario,
        magnitude=req.magnitude,
        duration=req.duration,
        noise_level=req.noise_level,
        auto_warmup=req.auto_warmup,
        session_id=sid
    )


@app.post("/api/simulation/clear")
def api_clear_simulation_fault():
    """
    Restores live simulated stream to nominal without modifying historical files or model weights.
    """
    return simulation_service.clear_fault()


@app.post("/api/simulation/reset-lab")
def api_reset_simulation_lab():
    """
    Resets the simulation harness, clears active fault and in-memory states.
    """
    return simulation_service.reset_simulation()


@app.get("/api/simulation/status")
def api_get_simulation_status():
    """
    Returns current active simulation state, pipeline checklist, and live result summary.
    """
    return simulation_service.get_status()


@app.get("/api/simulation/history")
def api_get_simulation_history():
    """
    Returns list of past simulation runs with pass/fail verdicts and detection mechanisms.
    """
    return {
        "history": simulation_service.get_history()
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)


