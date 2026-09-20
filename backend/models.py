from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

class TelemetryReading(BaseModel):
    station_id: str
    station_name: str
    region: str
    timestamp: str
    temperature: float  # °C
    pressure: float     # hPa
    humidity: float     # %
    battery_voltage: float = 3.95
    signal_rssi: int = -68

class Station(BaseModel):
    id: str
    name: str
    state: str
    region: str
    lat: float
    lon: float
    elevation: float
    status: str  # "healthy", "warning", "critical", "offline", "suspicious"
    last_update: str
    temperature: float
    pressure: float
    humidity: float
    sensor_health: float
    risk_level: str
    ai_confidence: float
    is_frozen: bool = False
    is_offline: bool = False
    is_regional_event: bool = False

class FeatureContribution(BaseModel):
    feature: str
    importance: float  # e.g., 0.42 for 42%
    direction: str     # "+", "-"

class RootCauseProbability(BaseModel):
    cause: str
    probability: float

class AnomalyRecord(BaseModel):
    id: str
    timestamp: str
    station_id: str
    station_name: str
    parameter: str  # "Temperature", "Atmospheric Pressure", "Relative Humidity", "Multivariate"
    observed_value: float
    expected_value: float
    deviation: float
    anomaly_score: float  # 0.0 to 1.0
    confidence: float     # % (e.g., 97.2)
    severity: str         # "INFO", "WARNING", "HIGH", "CRITICAL"
    anomaly_type: str     # "Sudden Spike", "Sudden Drop", "Frozen Sensor", "Sensor Drift", "Communication Error", "Multivariate Inconsistency", "Spatial Anomaly", "Genuine Weather Event"
    root_cause: str       # "Sensor malfunction", "Calibration drift", "Genuine meteorological event", "Communication glitch"
    root_cause_breakdown: List[RootCauseProbability]
    is_genuine_weather: bool = False
    feature_contributions: List[FeatureContribution]
    explanation: str
    corrected_value: float
    correction_confidence: float
    status: str = "Active"  # "Active", "Investigating", "Acknowledged", "Corrected", "Dismissed"
    accepted_correction: bool = False
    data_lineage: Dict[str, Any] = Field(default_factory=dict)

class SensorHealthMetric(BaseModel):
    station_id: str
    station_name: str
    overall_health: float  # 0 to 100
    data_reliability: float
    sensor_stability: float
    communication_quality: float
    drift_score: float
    anomaly_frequency: str  # "Low", "Moderate", "High", "Critical"
    calibration_confidence: float
    status: str  # "Excellent", "Healthy", "Degraded", "Critical"
    trend: List[float] = Field(default_factory=list)
    recommendation: str

class MaintenanceTicket(BaseModel):
    id: str
    station_id: str
    station_name: str
    sensor: str
    health: float
    priority: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    anomaly_frequency: str
    drift_status: str
    recommended_action: str
    created_at: str
    status: str = "Open"  # "Open", "Scheduled", "Resolved"

class AnomalyInjectionRequest(BaseModel):
    station_id: str
    anomaly_type: str  # "spike", "drop", "freeze", "drift", "pressure_spike", "humidity_spike", "communication_failure", "multivariate", "regional_weather"
    parameter: Optional[str] = "Temperature"
    value: Optional[float] = None
    duration_seconds: Optional[int] = 30

class CopilotQueryRequest(BaseModel):
    query: str
    context_station_id: Optional[str] = None
