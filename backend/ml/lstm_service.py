"""
LSTM Autoencoder Live Telemetry Inference Service.

Isolated inference service running against frozen artifacts:
- ml/models/lstm_autoencoder.keras
- ml/models/scaler.pkl
- ml/models/anomaly_threshold.json
- ml/features/lstm_feature_config.json
- Append-only log: ml/logs/inference.log

Enforces:
1. Series exclusion: NOAA Mumbai (43057099999), NOAA Pune (43063099999), NOAA Bengaluru (43295099999)
   -> Always NOT_APPLICABLE (3h cadence)
2. Warm-up state: WARMING_UP (n/24) until 24 consecutive gap-free, NaN-free hourly packets.
3. Gap/NaN handling: Reset buffer, log transition, re-enter WARMING_UP.
4. Scale with frozen scaler, run frozen model, compare MSE with threshold (0.24231) -> NORMAL / ANOMALY.
5. Append-only logging on every inference call.
"""

import os
import json
import pickle
import math
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
import numpy as np

# Excluded 3-hourly synoptic series (Mumbai, Pune, Bengaluru on NOAA)
EXCLUDED_SERIES = {
    ("43057099999", "NOAA"),
    ("43063099999", "NOAA"),
    ("43295099999", "NOAA"),
    ("AWS-003", "NOAA"), # Pune
    ("AWS-004", "NOAA"), # Mumbai
    ("AWS-007", "NOAA"), # Bengaluru
    ("43063", "NOAA"),
    ("43057", "NOAA"),
    ("43295", "NOAA"),
    (43057099999, "NOAA"),
    (43063099999, "NOAA"),
    (43295099999, "NOAA"),
}

EXCLUDED_STATION_IDS = {
    "43057099999", "43063099999", "43295099999",
    "AWS-003", "AWS-004", "AWS-007",
    "43063", "43057", "43295",
}


class LSTMInferenceService:
    def __init__(self, repo_root: Optional[str] = None):
        if repo_root is None:
            # Default to skyguard_ai repo root
            curr_dir = os.path.dirname(os.path.abspath(__file__))
            self.repo_root = os.path.abspath(os.path.join(curr_dir, "..", ".."))
        else:
            self.repo_root = repo_root

        self.model_path = os.path.join(self.repo_root, "ml", "models", "lstm_autoencoder.keras")
        self.scaler_path = os.path.join(self.repo_root, "ml", "models", "scaler.pkl")
        self.threshold_path = os.path.join(self.repo_root, "ml", "models", "anomaly_threshold.json")
        self.feature_config_path = os.path.join(self.repo_root, "ml", "features", "lstm_feature_config.json")
        self.log_file_path = os.path.join(self.repo_root, "ml", "logs", "inference.log")

        os.makedirs(os.path.dirname(self.log_file_path), exist_ok=True)

        self._load_artifacts()

        # Rolling buffers per (station_id, source): list of raw reading dicts
        self.buffers: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}

    def _load_artifacts(self):
        """Loads frozen model, scaler, threshold, and feature config."""
        import keras

        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model not found at {self.model_path}")
        self.model = keras.models.load_model(self.model_path)

        if not os.path.exists(self.scaler_path):
            raise FileNotFoundError(f"Scaler not found at {self.scaler_path}")
        with open(self.scaler_path, "rb") as f:
            self.scaler = pickle.load(f)

        if not os.path.exists(self.threshold_path):
            raise FileNotFoundError(f"Threshold config not found at {self.threshold_path}")
        with open(self.threshold_path, "r", encoding="utf-8") as f:
            thresh_data = json.load(f)
            self.threshold = float(thresh_data["threshold"])

        if not os.path.exists(self.feature_config_path):
            raise FileNotFoundError(f"Feature config not found at {self.feature_config_path}")
        with open(self.feature_config_path, "r", encoding="utf-8") as f:
            feat_data = json.load(f)
            self.feature_list = feat_data.get("features", [])

    def is_series_excluded(self, station_id: Any, source: str) -> bool:
        """Checks if the series is excluded (3-hourly NOAA Mumbai, Pune, Bengaluru)."""
        sid_str = str(station_id).strip()
        src_str = str(source).strip().upper()
        if (sid_str, src_str) in EXCLUDED_SERIES:
            return True
        if sid_str in EXCLUDED_STATION_IDS and src_str == "NOAA":
            return True
        # Also check by common names if passed
        if "MUMBAI" in sid_str.upper() and src_str == "NOAA":
            return True
        if "PUNE" in sid_str.upper() and src_str == "NOAA":
            return True
        if "BENGALURU" in sid_str.upper() and src_str == "NOAA":
            return True
        return False

    def log_inference(
        self,
        timestamp: str,
        station_id: str,
        source: str,
        reconstruction_error: Optional[float],
        threshold: float,
        prediction: str,
        fault_type: Optional[str] = None,
        affected_feature: Optional[str] = None,
    ):
        """Appends one record to ml/logs/inference.log."""
        record = {
            "timestamp": timestamp,
            "station_id": str(station_id),
            "source": source,
            "reconstruction_error": round(reconstruction_error, 5) if reconstruction_error is not None else None,
            "threshold": round(threshold, 5),
            "prediction": prediction,
            "fault_type": fault_type or "NORMAL",
            "affected_feature": affected_feature or "None",
        }
        with open(self.log_file_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")

    def log_transition(self, station_id: str, source: str, event_type: str, reason: str):
        """Logs buffer resets or state transitions."""
        timestamp = datetime.now().isoformat()
        self.log_inference(
            timestamp=timestamp,
            station_id=station_id,
            source=source,
            reconstruction_error=None,
            threshold=self.threshold,
            prediction=f"TRANSITION_{event_type}",
            fault_type=reason,
            affected_feature="BUFFER_CONTROL",
        )

    def reset_buffer(self, station_id: str, source: str, reason: str = "Manual reset"):
        """Clears the series buffer and logs transition."""
        key = (str(station_id), str(source).upper())
        if key in self.buffers:
            self.buffers[key].clear()
        self.log_transition(str(station_id), str(source).upper(), "RESET", reason)

    def process_packet(
        self,
        packet: Dict[str, Any],
        fault_type: Optional[str] = None,
        affected_feature: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Processes an incoming live telemetry packet for a specific series.
        Expected keys in packet:
        - station_id: str / int
        - source: 'Meteostat' | 'NOAA'
        - timestamp: datetime or ISO str or '%Y-%m-%d %H:%M:%S'
        - temperature: float
        - humidity: float
        - pressure: float
        - wind_speed: float
        - wind_direction: float (optional, degrees 0-360)
        """
        station_id = str(packet.get("station_id", "UNKNOWN"))
        source = str(packet.get("source", "Meteostat")).strip().upper()
        key = (station_id, source)

        # 1. Series exclusion check
        if self.is_series_excluded(station_id, source):
            return {
                "status": "NOT_APPLICABLE (3h cadence)",
                "reconstruction_error": None,
                "threshold": round(self.threshold, 5),
                "error_ratio": None,
                "warmup_step": 0,
                "dominant_feature": "Not applicable (3h cadence)",
                "prediction": "NOT_APPLICABLE",
                "message": f"Series ({station_id}, {source}) is 3-hourly cadence and excluded from LSTM Autoencoder. Routed to rule-based checks.",
            }

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

        iso_ts = dt.strftime("%Y-%m-%d %H:%M:%S")

        # 2. Extract core variables
        temp = packet.get("temperature")
        hum = packet.get("humidity")
        press = packet.get("pressure")
        wind = packet.get("wind_speed")
        wind_dir = packet.get("wind_direction", 0.0)
        if wind_dir is None:
            wind_dir = 0.0

        # 3. Check for NaNs in core variables
        has_nan = any(
            v is None or (isinstance(v, (int, float)) and (math.isnan(v) or math.isinf(v)))
            for v in (temp, hum, press, wind)
        )
        if has_nan:
            if key in self.buffers and len(self.buffers[key]) > 0:
                self.buffers[key].clear()
                self.log_transition(station_id, source, "RESET", "NaN in core variables")
            return {
                "status": "WARMING_UP (0/24)",
                "reconstruction_error": None,
                "threshold": round(self.threshold, 5),
                "error_ratio": None,
                "warmup_step": 0,
                "dominant_feature": "NaN in telemetry",
                "prediction": "WARMING_UP",
                "message": "Encountered NaN in core telemetry packet. Buffer reset.",
            }

        # Convert to float
        temp = float(temp)
        hum = float(hum)
        press = float(press)
        wind = float(wind)
        wind_dir = float(wind_dir)

        # 4. Check hourly continuity (dt spacing <= 1.05h)
        if key not in self.buffers:
            self.buffers[key] = []

        buf = self.buffers[key]
        if len(buf) > 0:
            prev_dt = buf[-1]["dt"]
            diff_hours = (dt - prev_dt).total_seconds() / 3600.0
            if diff_hours > 1.05 or diff_hours < 0.0:
                buf.clear()
                self.log_transition(station_id, source, "RESET", f"Time gap ({diff_hours:.2f}h > 1.0h)")

        # Append new reading to raw buffer
        reading = {
            "dt": dt,
            "temperature": temp,
            "humidity": hum,
            "pressure": press,
            "wind_speed": wind,
            "wind_direction": wind_dir,
        }
        buf.append(reading)

        # Cap raw buffer at 48 items
        if len(buf) > 48:
            buf.pop(0)

        # 5. Check warm-up state
        n_available = len(buf)
        if n_available < 24:
            status_str = f"WARMING_UP ({n_available}/24)"
            return {
                "status": status_str,
                "reconstruction_error": None,
                "threshold": round(self.threshold, 5),
                "error_ratio": None,
                "warmup_step": n_available,
                "dominant_feature": "Warming up",
                "prediction": "WARMING_UP",
                "message": f"Buffering hourly packets: {n_available}/24.",
            }

        # 6. We have at least 24 consecutive valid hourly readings!
        # Construct the (24, 25) feature window for the last 24 steps
        target_readings = buf[-24:]
        window_features = []

        for idx, item in enumerate(target_readings):
            c_dt = item["dt"]
            c_temp = item["temperature"]
            c_hum = item["humidity"]
            c_press = item["pressure"]
            c_wind = item["wind_speed"]
            c_wd = item["wind_direction"]

            # Cyclical wind & time
            wd_rad = math.radians(c_wd)
            wd_sin = math.sin(wd_rad)
            wd_cos = math.cos(wd_rad)
            h_sin = math.sin(2.0 * math.pi * c_dt.hour / 24.0)
            h_cos = math.cos(2.0 * math.pi * c_dt.hour / 24.0)
            day_of_yr = float(c_dt.timetuple().tm_yday)

            # Rates of change (from previous reading in buf)
            # Find item's index in buf
            buf_idx = len(buf) - 24 + idx
            if buf_idx > 0:
                p_item = buf[buf_idx - 1]
                t_roc = c_temp - p_item["temperature"]
                h_roc = c_hum - p_item["humidity"]
                p_roc = c_press - p_item["pressure"]
                w_roc = c_wind - p_item["wind_speed"]
            else:
                t_roc = 0.0
                h_roc = 0.0
                p_roc = 0.0
                w_roc = 0.0

            # 3h rolling stats (using available readings up to 3)
            start_3h = max(0, buf_idx - 2)
            slice_3h = buf[start_3h : buf_idx + 1]
            t_vals_3h = [s["temperature"] for s in slice_3h]
            h_vals_3h = [s["humidity"] for s in slice_3h]
            p_vals_3h = [s["pressure"] for s in slice_3h]
            w_vals_3h = [s["wind_speed"] for s in slice_3h]

            t_m3 = float(np.mean(t_vals_3h))
            t_s3 = float(np.std(t_vals_3h, ddof=1)) if len(t_vals_3h) > 1 else 0.0

            h_m3 = float(np.mean(h_vals_3h))
            h_s3 = float(np.std(h_vals_3h, ddof=1)) if len(h_vals_3h) > 1 else 0.0

            p_m3 = float(np.mean(p_vals_3h))
            p_s3 = float(np.std(p_vals_3h, ddof=1)) if len(p_vals_3h) > 1 else 0.0

            w_m3 = float(np.mean(w_vals_3h))
            w_s3 = float(np.std(w_vals_3h, ddof=1)) if len(w_vals_3h) > 1 else 0.0

            # 24h rolling mean (using available readings up to 24)
            start_24h = max(0, buf_idx - 23)
            slice_24h = buf[start_24h : buf_idx + 1]
            t_m24 = float(np.mean([s["temperature"] for s in slice_24h]))
            h_m24 = float(np.mean([s["humidity"] for s in slice_24h]))
            p_m24 = float(np.mean([s["pressure"] for s in slice_24h]))
            w_m24 = float(np.mean([s["wind_speed"] for s in slice_24h]))

            step_feat = [
                c_temp,
                c_hum,
                c_press,
                c_wind,
                wd_sin,
                wd_cos,
                h_sin,
                h_cos,
                day_of_yr,
                t_roc,
                h_roc,
                p_roc,
                w_roc,
                t_m3,
                t_s3,
                t_m24,
                h_m3,
                h_s3,
                h_m24,
                p_m3,
                p_s3,
                p_m24,
                w_m3,
                w_s3,
                w_m24,
            ]
            window_features.append(step_feat)

        # Shape (24, 25)
        X_arr = np.array(window_features, dtype=np.float32)

        # 7. Scale with frozen scaler
        X_scaled_flat = self.scaler.transform(X_arr)
        X_scaled = X_scaled_flat.reshape(1, 24, 25)

        # 8. Run frozen model
        X_pred = self.model.predict(X_scaled, verbose=0)

        # 9. Compute MSE
        diff = X_scaled - X_pred
        mse = float(np.mean(np.square(diff)))
        prediction = "ANOMALY" if mse > self.threshold else "NORMAL"
        error_ratio = round(mse / self.threshold, 4)

        # Feature attribution
        feat_mse = np.mean(np.square(diff), axis=(0, 1))
        dominant_idx = int(np.argmax(feat_mse))
        dominant_feature = self.feature_list[dominant_idx]

        # 10. Log inference call
        self.log_inference(
            timestamp=iso_ts,
            station_id=station_id,
            source=source,
            reconstruction_error=mse,
            threshold=self.threshold,
            prediction=prediction,
            fault_type=fault_type,
            affected_feature=affected_feature or dominant_feature,
        )

        return {
            "status": prediction,
            "reconstruction_error": round(mse, 5),
            "threshold": round(self.threshold, 5),
            "error_ratio": error_ratio,
            "warmup_step": 24,
            "dominant_feature": dominant_feature,
            "prediction": prediction,
            "message": f"Inference complete: MSE={mse:.5f}, Threshold={self.threshold:.5f} -> {prediction}",
        }


# Global singleton instance
lstm_service = LSTMInferenceService()
