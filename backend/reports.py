from typing import Dict, Any, List
from datetime import datetime

class ReportService:
    """Generates official IMD/MoES incident and audit reports for AWS anomalies."""
    @staticmethod
    def generate_incident_report(anomaly: Dict[str, Any], station: Dict[str, Any]) -> Dict[str, Any]:
        report_id = f"IMD-REP-{datetime.now().strftime('%Y%m%d')}-{anomaly['id'].replace('ANO-', '')}"
        
        return {
            "report_id": report_id,
            "title": f"AUTOMATIC WEATHER STATION ANOMALY AUDIT: {station['name']} ({station['id']})",
            "organization": "Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)",
            "classification": "OFFICIAL - METEOROLOGICAL TELEMETRY AUDIT",
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
            "station_info": {
                "station_id": station["id"],
                "name": station["name"],
                "region": station.get("region", "Regional"),
                "state": station.get("state", "State"),
                "coordinates": f"{station.get('lat', 0.0)}°N, {station.get('lon', 0.0)}°E",
                "elevation_m": station.get("elevation", 0)
            },
            "anomaly_details": {
                "parameter": anomaly.get("parameter", "Temperature"),
                "observed_value": anomaly.get("observed_value"),
                "expected_value": anomaly.get("expected_value"),
                "deviation": anomaly.get("deviation"),
                "severity": anomaly.get("severity"),
                "confidence_pct": anomaly.get("confidence"),
                "anomaly_score": anomaly.get("anomaly_score"),
                "classification_type": anomaly.get("anomaly_type")
            },
            "ai_attribution": {
                "probable_root_cause": anomaly.get("root_cause"),
                "event_authenticity": "Genuine Meteorological Phenomenon" if anomaly.get("is_genuine_weather") else "Sensor Malfunction / Data Anomaly",
                "feature_weights": anomaly.get("feature_contributions", []),
                "scientific_explanation": anomaly.get("explanation")
            },
            "self_healing": {
                "imputed_value": anomaly.get("corrected_value"),
                "imputation_confidence": anomaly.get("correction_confidence"),
                "data_lineage": anomaly.get("data_lineage", {}),
                "action_status": anomaly.get("status")
            },
            "maintenance": {
                "recommended_action": f"Field inspection of {anomaly.get('parameter')} sensor assembly and calibration audit.",
                "dispatch_priority": anomaly.get("severity")
            }
        }
