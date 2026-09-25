"""
SkyGuard AI — Historical Drift Analysis Service
Reuses real historical dataset (data/clean/merged/weather_merged.csv & data/ml_ready/)
to evaluate sensor calibration drift, diurnal moving averages, and long-term baselines.
"""

import os
import math
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd

# Fixed Reference Timestamp: Latest real timestamp in the historical dataset
REFERENCE_TIMESTAMP = pd.Timestamp("2025-12-31 23:00:00")
REFERENCE_TIMESTAMP_STR = "2025-12-31 23:00:00"

# Station ID mapping between Frontend AWS codes and Historical Station IDs
STATION_MAP = {
    "AWS-001": {"meteostat_id": "43279", "noaa_id": "43279099999", "name": "Chennai", "state": "Tamil Nadu"},
    "AWS-002": {"meteostat_id": "43295", "noaa_id": "43295099999", "name": "Bengaluru", "state": "Karnataka"},
    "AWS-003": {"meteostat_id": "43063", "noaa_id": "43063099999", "name": "Pune", "state": "Maharashtra"},
    "AWS-004": {"meteostat_id": "43057", "noaa_id": "43057099999", "name": "Mumbai", "state": "Maharashtra"},
    "AWS-005": {"meteostat_id": "42809", "noaa_id": "42809099999", "name": "Kolkata", "state": "West Bengal"},
    "AWS-006": {"meteostat_id": "42647", "noaa_id": "42647099999", "name": "Ahmedabad", "state": "Gujarat"},
    "AWS-007": {"meteostat_id": "43128", "noaa_id": "43128099999", "name": "Hyderabad", "state": "Telangana"},
}

# Empirical standard deviations across the 3-year historical dataset
HISTORICAL_STD = {
    "temperature": 4.87,
    "humidity": 20.40,
    "pressure": 4.86,
    "wind_speed": 1.77,
    "precipitation": 0.76,
}

# Units
SENSOR_UNITS = {
    "temperature": "°C",
    "humidity": "%",
    "pressure": "hPa",
    "wind_speed": "m/s",
    "precipitation": "mm",
}

# Physical single-step Rate of Change thresholds for transient spike detection
ROC_SPIKE_THRESHOLDS = {
    "temperature": 3.0,     # >3.0°C in 1 hour is an abrupt jump
    "humidity": 15.0,       # >15% in 1 hour
    "pressure": 3.5,        # >3.5 hPa in 1 hour
    "wind_speed": 4.0,      # >4.0 m/s in 1 hour
    "precipitation": 8.0,   # >8.0 mm in 1 hour
}


class HistoricalDriftService:
    def __init__(self, data_dir: Optional[str] = None):
        if not data_dir:
            # Default to skyguard_ai/data
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            self.data_dir = os.path.join(base_dir, "data")
        else:
            self.data_dir = data_dir

        self.merged_csv_path = os.path.join(self.data_dir, "clean", "merged", "weather_merged.csv")
        self.ml_ready_test_path = os.path.join(self.data_dir, "ml_ready", "weather_ml_ready_test.csv")
        
        self.df_merged: Optional[pd.DataFrame] = None
        self.df_ml_ready: Optional[pd.DataFrame] = None
        self._load_datasets()

    def _load_datasets(self):
        """Loads and pre-indexes historical datasets into memory."""
        if os.path.exists(self.merged_csv_path):
            print(f"[HistoricalDriftService] Loading {self.merged_csv_path}...")
            df = pd.read_csv(self.merged_csv_path)
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            df["station_id_str"] = df["station_id"].astype(str)
            self.df_merged = df
            print(f"[HistoricalDriftService] Loaded {len(self.df_merged):,} records.")
        else:
            print(f"[HistoricalDriftService] WARNING: {self.merged_csv_path} not found.")

        if os.path.exists(self.ml_ready_test_path):
            print(f"[HistoricalDriftService] Loading {self.ml_ready_test_path}...")
            # Load only flags and timestamp
            cols = ["timestamp", "station_id", "source"]
            # Add filled and gap columns if available
            sample = pd.read_csv(self.ml_ready_test_path, nrows=5)
            flag_cols = [c for c in sample.columns if any(k in c for k in ["filled", "large_gap", "roll_mean_24h"])]
            cols.extend(flag_cols)
            df_ml = pd.read_csv(self.ml_ready_test_path, usecols=cols)
            df_ml["timestamp"] = pd.to_datetime(df_ml["timestamp"])
            df_ml["station_id_str"] = df_ml["station_id"].astype(str)
            self.df_ml_ready = df_ml
            print(f"[HistoricalDriftService] Loaded {len(self.df_ml_ready):,} ML-ready flag records.")

    def get_station_info(self, station_id: str) -> Dict[str, Any]:
        """Maps AWS-XXX or numeric station ID to station metadata."""
        if station_id in STATION_MAP:
            return STATION_MAP[station_id]
        for sid, meta in STATION_MAP.items():
            if meta["meteostat_id"] == station_id or meta["noaa_id"] == station_id:
                return meta
        return {"meteostat_id": station_id, "noaa_id": station_id, "name": station_id, "state": "India"}

    def analyze_drift(
        self,
        station_id: str,
        sensor: str = "temperature",
        time_range: str = "30d",
        source: str = "Meteostat",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        test_injected_drift: Optional[Dict[str, Any]] = None,
        test_injected_spike: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Computes historical trend, moving average, long-term baseline, and drift classification.
        
        Parameters:
        - station_id: 'AWS-001' .. 'AWS-007' or numeric ID
        - sensor: 'temperature', 'humidity', 'pressure', 'wind_speed', 'precipitation'
        - time_range: '24h', '7d', '30d', '90d', 'custom'
        - source: 'Meteostat' (recommended continuous) or 'NOAA'
        - start_date / end_date: for 'custom' range
        - test_injected_drift: optional dict with {'slope_per_day': float, 'duration_days': int}
        - test_injected_spike: optional dict with {'magnitude': float, 'duration_hours': int, 'offset_from_end_hours': int}
        """
        if self.df_merged is None:
            return {"status": "ERROR", "message": "Historical dataset not loaded"}

        meta = self.get_station_info(station_id)
        db_id = meta["meteostat_id"] if source == "Meteostat" else meta["noaa_id"]
        unit = SENSOR_UNITS.get(sensor, "")
        sigma_hist = HISTORICAL_STD.get(sensor, 4.0)

        # 1. Determine Window Boundaries relative to REFERENCE_TIMESTAMP
        ref_ts = REFERENCE_TIMESTAMP
        if time_range == "24h":
            w_start = ref_ts - pd.Timedelta(hours=23)
            w_end = ref_ts
        elif time_range == "7d":
            w_start = ref_ts - pd.Timedelta(days=7) + pd.Timedelta(hours=1)
            w_end = ref_ts
        elif time_range == "30d":
            w_start = ref_ts - pd.Timedelta(days=30) + pd.Timedelta(hours=1)
            w_end = ref_ts
        elif time_range == "90d":
            w_start = ref_ts - pd.Timedelta(days=90) + pd.Timedelta(hours=1)
            w_end = ref_ts
        elif time_range == "custom" and start_date and end_date:
            try:
                w_start = pd.to_datetime(start_date)
                w_end = pd.to_datetime(end_date)
            except Exception:
                w_start = ref_ts - pd.Timedelta(days=30)
                w_end = ref_ts
        else:
            w_start = ref_ts - pd.Timedelta(days=30) + pd.Timedelta(hours=1)
            w_end = ref_ts

        # 2. Filter Station Records
        station_df = self.df_merged[
            (self.df_merged["station_id_str"] == db_id) & (self.df_merged["source"] == source)
        ].copy()

        # If empty by db_id, try by city name
        if len(station_df) == 0:
            station_df = self.df_merged[
                (self.df_merged["city"].str.lower() == meta["name"].lower()) & (self.df_merged["source"] == source)
            ].copy()

        # 3. Check Coverage & Graceful Degradation
        if len(station_df) == 0:
            return {
                "status": "INSUFFICIENT_HISTORY",
                "station_id": station_id,
                "station_name": meta["name"],
                "sensor": sensor,
                "time_range": time_range,
                "source": source,
                "classification": "INSUFFICIENT DATA",
                "confidence": "NONE",
                "explanation": f"No historical records found for station {meta['name']} with source {source}.",
                "coverage_pct": 0.0,
                "degradation_reason": "NO_STATION_DATA",
                "series": [],
            }

        # Check latest timestamp for this station+source
        st_max_t = station_df["timestamp"].max()
        st_min_t = station_df["timestamp"].min()

        # Extract Window Slice
        window_df = station_df[(station_df["timestamp"] >= w_start) & (station_df["timestamp"] <= w_end)].copy()
        window_df.sort_values("timestamp", inplace=True)

        expected_hours = max(1, int((w_end - w_start).total_seconds() / 3600.0) + 1)
        actual_rows = len(window_df)
        coverage_pct = round((actual_rows / expected_hours) * 100.0, 1)

        # Check Degradation: NOAA stream ends in August 2025
        if source == "NOAA" and w_start > st_max_t:
            return {
                "status": "INSUFFICIENT_HISTORY",
                "station_id": station_id,
                "station_name": meta["name"],
                "sensor": sensor,
                "time_range": time_range,
                "source": source,
                "reference_timestamp": REFERENCE_TIMESTAMP_STR,
                "classification": "INSUFFICIENT DATA",
                "confidence": "NONE",
                "coverage_pct": 0.0,
                "degradation_reason": "NOAA_STREAM_ENDED",
                "explanation": f"NOAA station stream ends on {st_max_t.strftime('%Y-%m-%d')} (insufficient history for ranges relative to {REFERENCE_TIMESTAMP_STR}). Meteostat ground truth provides continuous coverage.",
                "latest_available_timestamp": str(st_max_t),
                "series": [],
            }

        if sensor not in station_df.columns:
            return {
                "status": "INSUFFICIENT_HISTORY",
                "station_id": station_id,
                "station_name": meta["name"],
                "sensor": sensor,
                "classification": "INSUFFICIENT DATA",
                "confidence": "NONE",
                "coverage_pct": 0.0,
                "degradation_reason": "SENSOR_NOT_IN_DATASET",
                "explanation": f"Sensor '{sensor}' is not present in the historical schema.",
                "series": [],
            }

        # Check null rate for the sensor
        sensor_null_pct = window_df[sensor].isnull().mean() * 100.0 if actual_rows > 0 else 100.0
        if sensor_null_pct > 60.0 or actual_rows < 5:
            return {
                "status": "INSUFFICIENT_HISTORY",
                "station_id": station_id,
                "station_name": meta["name"],
                "sensor": sensor,
                "time_range": time_range,
                "source": source,
                "reference_timestamp": REFERENCE_TIMESTAMP_STR,
                "classification": "INSUFFICIENT DATA",
                "confidence": "NONE",
                "coverage_pct": coverage_pct,
                "null_pct": round(sensor_null_pct, 1),
                "degradation_reason": "SEVERE_SENSOR_GAPS",
                "explanation": f"Historical sensor data for '{sensor}' at {meta['name']} ({source}) has {sensor_null_pct:.1f}% missing readings in this window. Baseline analysis cannot be computed reliably.",
                "series": [],
            }

        # 4. Long-Term Baseline Computation (3-year record for this station & sensor)
        valid_station_s = station_df[sensor].dropna()
        baseline_mean = round(float(valid_station_s.mean()), 2)
        baseline_std = round(float(valid_station_s.std()), 2)
        baseline_min = round(float(valid_station_s.quantile(0.01)), 2)
        baseline_max = round(float(valid_station_s.quantile(0.99)), 2)

        # 5. Extract series and flags
        # Prepare working series
        s_series = window_df[[sensor, "timestamp"]].copy()
        s_series[sensor] = s_series[sensor].ffill().bfill()

        # Check ML-ready flags if available
        filled_col = f"{sensor}_filled"
        gap_col = f"{sensor}_large_gap"
        roll_col = f"{sensor}_roll_mean_24h"

        has_ml = False
        if self.df_ml_ready is not None:
            ml_sub = self.df_ml_ready[
                (self.df_ml_ready["station_id_str"] == db_id) &
                (self.df_ml_ready["timestamp"] >= w_start) &
                (self.df_ml_ready["timestamp"] <= w_end)
            ]
            if len(ml_sub) > 0:
                has_ml = True
                s_series = pd.merge(s_series, ml_sub, on=["timestamp"], how="left")

        # Fallback computed rolling mean 24h
        computed_roll_24h = s_series[sensor].rolling(window=24, min_periods=1).mean()
        if roll_col in s_series.columns and s_series[roll_col].notnull().sum() > 0:
            roll_values = s_series[roll_col].fillna(computed_roll_24h).values
        else:
            roll_values = computed_roll_24h.values

        # 6. Apply Test Injections if requested (for Test B / Test C)
        raw_values = s_series[sensor].values.astype(float).copy()
        timestamps = s_series["timestamp"].tolist()
        N = len(raw_values)

        injected_drift_applied = False
        injected_spike_applied = False

        if test_injected_drift:
            injected_drift_applied = True
            # Progressive linear drift: slope_per_day
            rate_per_hour = test_injected_drift.get("slope_per_day", 0.5) / 24.0
            drift_hours = min(N, test_injected_drift.get("duration_hours", N))
            start_idx = N - drift_hours
            for i in range(start_idx, N):
                raw_values[i] += rate_per_hour * (i - start_idx + 1)

        if test_injected_spike:
            injected_spike_applied = True
            spike_mag = test_injected_spike.get("magnitude", 8.0)
            spike_dur = min(test_injected_spike.get("duration_hours", 2), N)
            offset = test_injected_spike.get("offset_from_end_hours", 3)
            spike_start = max(0, N - offset - spike_dur)
            for i in range(spike_start, spike_start + spike_dur):
                raw_values[i] += spike_mag

        # Recompute rolling mean on actual tested values
        s_work = pd.Series(raw_values)
        roll_values = s_work.rolling(window=24, min_periods=1).mean().values

        # 7. Spike vs. Drift Filtering (Step 3 Correctness Rule)
        roc_limit = ROC_SPIKE_THRESHOLDS.get(sensor, 3.0)
        clean_values = raw_values.copy()
        spike_indices = []

        # Use 7-hour centered rolling median to reliably detect abrupt transient excursions
        s_series_eval = pd.Series(raw_values)
        local_median = s_series_eval.rolling(window=7, center=True, min_periods=3).median()
        diff_from_median = (s_series_eval - local_median).abs()
        spike_threshold = max(roc_limit, 3.5)
        is_spike_mask = diff_from_median >= spike_threshold

        current_streak = []
        for idx, is_spk in enumerate(is_spike_mask):
            if is_spk:
                current_streak.append(idx)
            else:
                if 0 < len(current_streak) <= 4:  # Short abrupt spike of 1-4 hours
                    spike_indices.extend(current_streak)
                current_streak = []
        if 0 < len(current_streak) <= 4:
            spike_indices.extend(current_streak)

        # Filter out short transient spikes before computing drift regression
        for idx in spike_indices:
            surrounding = [raw_values[j] for j in range(max(0, idx - 3), min(N, idx + 4)) if j not in spike_indices]
            if surrounding:
                clean_values[idx] = float(np.median(surrounding))
            else:
                clean_values[idx] = baseline_mean

        has_transient_spikes = len(spike_indices) > 0
        spike_filter_note = (
            f"Detected {len(spike_indices)} abrupt transient spike point(s) (ROC >= {roc_limit} {unit}/h). "
            f"Filtered out to prevent transient events from falsifying gradual calibration drift."
            if has_transient_spikes else "No transient spikes detected; signal gradient is smooth."
        )

        # 8. Drift Detection via Linear Regression (OLS on Cleaned Series)
        # Time array in days: x_days from 0 to T
        if N >= 2:
            time_deltas_days = np.array([(t - timestamps[0]).total_seconds() / 86400.0 for t in timestamps])
            total_duration_days = max(0.1, time_deltas_days[-1])

            x_mean = np.mean(time_deltas_days)
            y_mean = np.mean(clean_values)

            denom = np.sum((time_deltas_days - x_mean) ** 2)
            if denom > 1e-9:
                slope_per_day = float(np.sum((time_deltas_days - x_mean) * (clean_values - y_mean)) / denom)
            else:
                slope_per_day = 0.0

            rate_per_week = slope_per_day * 7.0
            cumulative_drift = slope_per_day * total_duration_days
            direction = "+" if slope_per_day >= 0 else "-"
            drift_trend_line = (y_mean + slope_per_day * (time_deltas_days - x_mean)).tolist()
        else:
            slope_per_day = 0.0
            rate_per_week = 0.0
            cumulative_drift = 0.0
            direction = "+"
            total_duration_days = 1.0
            drift_trend_line = clean_values.tolist()

        # Recent window mean vs baseline
        recent_window_size = min(24, N)
        recent_mean = float(np.mean(clean_values[-recent_window_size:]))
        deviation_from_baseline = round(recent_mean - baseline_mean, 2)

        # Normalized drift metric relative to historical std (Z_drift)
        z_drift = abs(cumulative_drift) / max(0.1, sigma_hist)

        # 4-Tier Drift Classification
        if z_drift < 0.35:
            classification = "NORMAL"
            confidence = "HIGH"
            status_desc = f"Sensor trend nominal within natural variance ({cumulative_drift:+.2f} {unit} over {total_duration_days:.1f}d, <0.35 std)."
        elif z_drift < 0.75:
            classification = "WATCH"
            confidence = "MEDIUM"
            status_desc = f"Moderate persistent trend observed ({cumulative_drift:+.2f} {unit} over {total_duration_days:.1f}d, 0.35-0.75 std). Continue monitoring."
        elif z_drift < 1.50:
            classification = "DRIFT DETECTED"
            confidence = "HIGH"
            status_desc = f"Progressive calibration drift detected ({cumulative_drift:+.2f} {unit} over {total_duration_days:.1f}d, 0.75-1.50 std). Rate: {slope_per_day:+.2f} {unit}/day."
        else:
            classification = "SIGNIFICANT DRIFT"
            confidence = "HIGH"
            status_desc = f"Severe transducer calibration drift confirmed ({cumulative_drift:+.2f} {unit} over {total_duration_days:.1f}d, >=1.50 std). Physical inspection required."

        # Environmental/Seasonal caveat
        seasonal_note = (
            "Notice: Observed drift may correlate with genuine macro-meteorological seasonal shifts "
            "(e.g. monsoon retreat, synoptic trough). Cross-corroborate with proximate AWS peer nodes."
        )

        # 9. Format Series Data for Recharts
        chart_series = []
        for i in range(N):
            t_str = timestamps[i].strftime("%Y-%m-%d %H:%M")
            val = round(float(raw_values[i]), 2)
            m_avg = round(float(roll_values[i]), 2) if i < len(roll_values) else val
            trend_val = round(float(drift_trend_line[i]), 2) if i < len(drift_trend_line) else val
            
            is_filled = bool(s_series[filled_col].iloc[i] == 1) if (has_ml and filled_col in s_series.columns) else False
            is_large_gap = bool(s_series[gap_col].iloc[i] == 1) if (has_ml and gap_col in s_series.columns) else False
            is_spike = i in spike_indices

            chart_series.append({
                "time": t_str,
                "value": val,
                "moving_avg_24h": m_avg,
                "baseline_mean": baseline_mean,
                "trend": trend_val,
                "is_filled": is_filled,
                "is_large_gap": is_large_gap,
                "is_spike": is_spike,
            })

        return {
            "status": "SUCCESS",
            "station_id": station_id,
            "station_name": meta["name"],
            "state": meta["state"],
            "sensor": sensor,
            "unit": unit,
            "time_range": time_range,
            "source": source,
            "reference_timestamp": REFERENCE_TIMESTAMP_STR,
            "window_start": w_start.strftime("%Y-%m-%d %H:%M"),
            "window_end": w_end.strftime("%Y-%m-%d %H:%M"),
            "data_points": N,
            "coverage_pct": coverage_pct,
            
            # Baseline Stats
            "baseline": {
                "mean": baseline_mean,
                "std": baseline_std,
                "expected_min": baseline_min,
                "expected_max": baseline_max,
                "historical_std": sigma_hist,
            },

            # Drift Metrics
            "drift": {
                "classification": classification,
                "confidence": confidence,
                "status_description": status_desc,
                "slope_per_day": round(slope_per_day, 3),
                "rate_per_week": round(rate_per_week, 2),
                "magnitude": round(abs(cumulative_drift), 2),
                "signed_magnitude": round(cumulative_drift, 2),
                "direction": direction,
                "duration_days": round(total_duration_days, 1),
                "deviation_from_baseline": deviation_from_baseline,
                "normalized_z_score": round(z_drift, 2),
                "seasonal_caveat": seasonal_note,
            },

            # Spike Filter Diagnostics
            "spike_filter": {
                "spikes_detected": len(spike_indices),
                "has_transient_spikes": has_transient_spikes,
                "spike_indices": spike_indices,
                "explanation": spike_filter_note,
                "roc_limit": roc_limit,
            },

            # Test injection flags
            "injected_drift_applied": injected_drift_applied,
            "injected_spike_applied": injected_spike_applied,

            # Chart series
            "series": chart_series,
        }


# Singleton service instance
historical_drift_service = HistoricalDriftService()
