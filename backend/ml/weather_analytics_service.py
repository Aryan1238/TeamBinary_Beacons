"""
SkyGuard AI — Weather Analytics Service
Reuses the shared historical dataset (HistoricalDriftService) and station metadata
to compute climatological weather patterns, multi-station comparisons,
bivariate correlations, percentile distributions, diurnal/monthly cycles,
and live-vs-historical climatological comparisons.

DO NOT retrain or alter ML models.
DO NOT fabricate numbers: missing data is reported as unavailable.
"""

import os
import math
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd

from .historical_drift_service import (
    HistoricalDriftService,
    REFERENCE_TIMESTAMP,
    REFERENCE_TIMESTAMP_STR,
    STATION_MAP,
    HISTORICAL_STD,
    SENSOR_UNITS,
)

try:
    from ..services.weather_service import live_weather_service
except ImportError:
    from services.weather_service import live_weather_service

# Sensor display labels
SENSOR_LABELS = {
    "temperature": "Temperature",
    "humidity": "Relative Humidity",
    "pressure": "Barometric Pressure",
    "wind_speed": "Wind Speed",
    "precipitation": "Precipitation",
}

# Month names
MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]


class WeatherAnalyticsService:
    def __init__(self, drift_service: Optional[HistoricalDriftService] = None):
        if drift_service is not None:
            self.drift_service = drift_service
        else:
            self.drift_service = HistoricalDriftService()

    @property
    def df_merged(self) -> Optional[pd.DataFrame]:
        return self.drift_service.df_merged

    @property
    def df_ml_ready(self) -> Optional[pd.DataFrame]:
        return self.drift_service.df_ml_ready

    def get_station_info(self, station_id: str) -> Dict[str, Any]:
        return self.drift_service.get_station_info(station_id)

    def _get_window_bounds(
        self,
        time_range: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Tuple[pd.Timestamp, pd.Timestamp]:
        """Calculates window start and end anchored to REFERENCE_TIMESTAMP or custom."""
        ref_ts = REFERENCE_TIMESTAMP
        if time_range == "24h":
            return ref_ts - pd.Timedelta(hours=23), ref_ts
        elif time_range == "7d":
            return ref_ts - pd.Timedelta(days=7) + pd.Timedelta(hours=1), ref_ts
        elif time_range == "30d":
            return ref_ts - pd.Timedelta(days=30) + pd.Timedelta(hours=1), ref_ts
        elif time_range == "90d":
            return ref_ts - pd.Timedelta(days=90) + pd.Timedelta(hours=1), ref_ts
        elif time_range == "custom" and start_date and end_date:
            try:
                return pd.to_datetime(start_date), pd.to_datetime(end_date)
            except Exception:
                return ref_ts - pd.Timedelta(days=30) + pd.Timedelta(hours=1), ref_ts
        else:
            return ref_ts - pd.Timedelta(days=30) + pd.Timedelta(hours=1), ref_ts

    def _get_station_dataframe(self, station_id: str, source: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Filters merged dataset for station and source."""
        if self.df_merged is None:
            return pd.DataFrame(), {}
        meta = self.get_station_info(station_id)
        db_id = meta["meteostat_id"] if source == "Meteostat" else meta["noaa_id"]

        st_df = self.df_merged[
            (self.df_merged["station_id_str"] == db_id) & (self.df_merged["source"] == source)
        ].copy()

        if len(st_df) == 0:
            st_df = self.df_merged[
                (self.df_merged["city"].str.lower() == meta["name"].lower()) & (self.df_merged["source"] == source)
            ].copy()

        return st_df, meta

    def get_weather_analytics(
        self,
        station_id: str = "AWS-003",
        sensor: str = "temperature",
        time_range: str = "30d",
        source: str = "Meteostat",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Computes comprehensive meteorological weather analytics:
        - KPIs across all variables
        - Downsampled time-series trend with 24h rolling average
        - Binned distribution and percentiles
        - Diurnal (hourly) and monthly climatological patterns
        - Precipitation metrics distinguishing 0.0mm dry from unrecorded
        - Live vs Historical baseline comparison
        - Data-backed analytical insights
        - Data quality indicator
        """
        if self.df_merged is None:
            return {"status": "ERROR", "message": "Historical dataset not loaded"}

        station_df, meta = self._get_station_dataframe(station_id, source)
        w_start, w_end = self._get_window_bounds(time_range, start_date, end_date)
        unit = SENSOR_UNITS.get(sensor, "")

        # Degradation checks
        if len(station_df) == 0:
            return {
                "status": "INSUFFICIENT_HISTORY",
                "station_id": station_id,
                "station_name": meta.get("name", station_id),
                "degradation_reason": "NO_STATION_DATA",
                "explanation": f"No historical records found for station {meta.get('name', station_id)} with source {source}.",
            }

        st_max_t = station_df["timestamp"].max()
        st_min_t = station_df["timestamp"].min()

        # NOAA truncation check
        if source == "NOAA" and w_start > st_max_t:
            return {
                "status": "INSUFFICIENT_HISTORY",
                "station_id": station_id,
                "station_name": meta["name"],
                "sensor": sensor,
                "time_range": time_range,
                "source": source,
                "degradation_reason": "NOAA_STREAM_ENDED",
                "explanation": f"NOAA station stream ends on {st_max_t.strftime('%Y-%m-%d')} (insufficient history for ranges relative to {REFERENCE_TIMESTAMP_STR}). Meteostat ground truth provides continuous coverage.",
                "latest_available_timestamp": str(st_max_t),
            }

        if w_end < st_min_t:
            return {
                "status": "INSUFFICIENT_HISTORY",
                "station_id": station_id,
                "station_name": meta["name"],
                "sensor": sensor,
                "degradation_reason": "BEFORE_RECORD_START",
                "explanation": f"Requested window precedes earliest historical record ({st_min_t.strftime('%Y-%m-%d')}).",
            }

        # Window slice
        window_df = station_df[(station_df["timestamp"] >= w_start) & (station_df["timestamp"] <= w_end)].copy()
        window_df.sort_values("timestamp", inplace=True)
        actual_rows = len(window_df)
        expected_hours = max(1, int((w_end - w_start).total_seconds() / 3600.0) + 1)
        coverage_pct = round((actual_rows / expected_hours) * 100.0, 1)

        sensor_null_pct = window_df[sensor].isnull().mean() * 100.0 if (actual_rows > 0 and sensor in window_df.columns) else 100.0
        if sensor_null_pct > 60.0 or actual_rows < 5:
            return {
                "status": "INSUFFICIENT_HISTORY",
                "station_id": station_id,
                "station_name": meta["name"],
                "sensor": sensor,
                "time_range": time_range,
                "source": source,
                "coverage_pct": coverage_pct,
                "null_pct": round(sensor_null_pct, 1),
                "degradation_reason": "SEVERE_SENSOR_GAPS",
                "explanation": f"Historical sensor data for '{sensor}' at {meta['name']} ({source}) has {sensor_null_pct:.1f}% missing readings in this window.",
            }

        # Long-term 3-year baseline (reused identically from HistoricalDriftService)
        valid_station_s = station_df[sensor].dropna()
        baseline_mean = round(float(valid_station_s.mean()), 2)
        baseline_std = round(float(valid_station_s.std()), 2)

        # -------------------------------------------------------------
        # 1. KPI Cards (Period Aggregates)
        # -------------------------------------------------------------
        kpis: Dict[str, Any] = {}
        for var in ["temperature", "humidity", "pressure", "wind_speed", "precipitation"]:
            if var in window_df.columns:
                s_valid = window_df[var].dropna()
                if len(s_valid) > 0:
                    kpis[var] = {
                        "available": True,
                        "mean": round(float(s_valid.mean()), 2),
                        "min": round(float(s_valid.min()), 2),
                        "max": round(float(s_valid.max()), 2),
                        "range": round(float(s_valid.max() - s_valid.min()), 2),
                        "unit": SENSOR_UNITS.get(var, ""),
                    }
                    if var == "precipitation":
                        kpis[var]["total"] = round(float(s_valid.sum()), 2)
                else:
                    kpis[var] = {"available": False, "status": "Data unavailable"}
            else:
                kpis[var] = {"available": False, "status": "Data unavailable"}

        # -------------------------------------------------------------
        # 2. Trend Series & Downsampling (Step 2 & 11)
        # -------------------------------------------------------------
        s_series = window_df[[sensor, "timestamp"]].copy()
        s_series[sensor] = s_series[sensor].ffill().bfill()
        computed_roll_24h = s_series[sensor].rolling(window=24, min_periods=1).mean()

        N = len(s_series)
        step = max(1, math.ceil(N / 450)) if N > 450 else 1

        chart_series = []
        for i in range(0, N, step):
            row = s_series.iloc[i]
            t_str = row["timestamp"].strftime("%Y-%m-%d %H:%M")
            val = round(float(row[sensor]), 2)
            m_avg = round(float(computed_roll_24h.iloc[i]), 2)
            chart_series.append({
                "time": t_str,
                "value": val,
                "moving_avg_24h": m_avg,
            })

        period_values = s_series[sensor].values.astype(float)
        period_min = round(float(np.min(period_values)), 2) if len(period_values) > 0 else 0.0
        period_max = round(float(np.max(period_values)), 2) if len(period_values) > 0 else 0.0
        period_avg = round(float(np.mean(period_values)), 2) if len(period_values) > 0 else 0.0

        # -------------------------------------------------------------
        # 3. Distribution Analysis (Step 5)
        # -------------------------------------------------------------
        clean_s = window_df[sensor].dropna().values.astype(float)
        if len(clean_s) >= 5:
            p25 = round(float(np.percentile(clean_s, 25)), 2)
            median = round(float(np.percentile(clean_s, 50)), 2)
            p75 = round(float(np.percentile(clean_s, 75)), 2)
            std_dev = round(float(np.std(clean_s)), 2)
            skewness = round(float(pd.Series(clean_s).skew()), 2)

            # 10 Bins
            min_v = float(np.min(clean_s))
            max_v = float(np.max(clean_s))
            bin_width = max(0.01, (max_v - min_v) / 10.0)
            hist_counts, bin_edges = np.histogram(clean_s, bins=10)
            
            histogram = []
            for b_idx in range(len(hist_counts)):
                b_start = round(float(bin_edges[b_idx]), 1)
                b_end = round(float(bin_edges[b_idx + 1]), 1)
                cnt = int(hist_counts[b_idx])
                pct = round((cnt / len(clean_s)) * 100.0, 1)
                histogram.append({
                    "bin_label": f"{b_start} - {b_end} {unit}",
                    "bin_start": b_start,
                    "bin_end": b_end,
                    "count": cnt,
                    "pct": pct,
                })

            distribution = {
                "available": True,
                "min": period_min,
                "p25": p25,
                "median": median,
                "p75": p75,
                "max": period_max,
                "mean": period_avg,
                "std": std_dev,
                "skewness": skewness,
                "histogram": histogram,
            }
        else:
            distribution = {"available": False, "reason": "Insufficient observations for distribution"}

        # -------------------------------------------------------------
        # 4. Hourly Diurnal & Monthly Climatological Patterns (Step 6)
        # -------------------------------------------------------------
        diurnal: Dict[str, Any] = {}
        if actual_rows >= 168:
            w_copy = window_df[[sensor, "timestamp"]].dropna().copy()
            w_copy["hour"] = w_copy["timestamp"].dt.hour
            hourly_grp = w_copy.groupby("hour")[sensor]
            h_means = hourly_grp.mean()
            h_stds = hourly_grp.std().fillna(0.0)
            h_mins = hourly_grp.min()
            h_maxs = hourly_grp.max()

            hourly_profile = []
            for h in range(24):
                if h in h_means:
                    hourly_profile.append({
                        "hour": h,
                        "hour_label": f"{h:02d}:00",
                        "mean": round(float(h_means[h]), 2),
                        "std": round(float(h_stds[h]), 2),
                        "min": round(float(h_mins[h]), 2),
                        "max": round(float(h_maxs[h]), 2),
                    })

            peak_h = int(h_means.idxmax())
            trough_h = int(h_means.idxmin())
            diurnal = {
                "available": True,
                "hourly_profile": hourly_profile,
                "peak_hour": f"{peak_h:02d}:00",
                "peak_value": round(float(h_means[peak_h]), 2),
                "trough_hour": f"{trough_h:02d}:00",
                "trough_value": round(float(h_means[trough_h]), 2),
                "diurnal_swing": round(float(h_means[peak_h] - h_means[trough_h]), 2),
            }
        else:
            diurnal = {
                "available": False,
                "reason": "Diurnal hourly cycle requires at least 7 days of historical coverage.",
            }

        monthly: Dict[str, Any] = {}
        if len(station_df) > 500:
            st_copy = station_df[[sensor, "timestamp"]].dropna().copy()
            st_copy["month"] = st_copy["timestamp"].dt.month
            m_grp = st_copy.groupby("month")[sensor]
            m_means = m_grp.mean()
            m_stds = m_grp.std().fillna(0.0)

            monthly_profile = []
            for m in range(1, 13):
                if m in m_means:
                    monthly_profile.append({
                        "month_num": m,
                        "month_name": MONTH_NAMES[m - 1],
                        "mean": round(float(m_means[m]), 2),
                        "std": round(float(m_stds[m]), 2),
                    })

            hottest_m = int(m_means.idxmax())
            coolest_m = int(m_means.idxmin())
            monthly = {
                "available": True,
                "monthly_profile": monthly_profile,
                "highest_month": f"{MONTH_NAMES[hottest_m - 1]} ({round(float(m_means[hottest_m]), 1)}{unit})",
                "lowest_month": f"{MONTH_NAMES[coolest_m - 1]} ({round(float(m_means[coolest_m]), 1)}{unit})",
            }
        else:
            monthly = {"available": False, "reason": "Insufficient station history for monthly climatology."}

        # -------------------------------------------------------------
        # 5. Precipitation Analytics (Step 7)
        # -------------------------------------------------------------
        precip_analytics: Dict[str, Any] = {}
        if "precipitation" in window_df.columns:
            precip_s = window_df["precipitation"]
            total_readings = len(precip_s)
            missing_hours = int(precip_s.isnull().sum())
            valid_p = precip_s.dropna()

            dry_hours = int((valid_p == 0.0).sum())
            rain_hours = int((valid_p > 0.1).sum())
            total_rain = round(float(valid_p.sum()), 2)
            max_1h = round(float(valid_p.max()), 2) if len(valid_p) > 0 else 0.0
            avg_rain_intensity = round(float(valid_p[valid_p > 0.1].mean()), 2) if rain_hours > 0 else 0.0

            w_p = window_df[["timestamp", "precipitation"]].dropna().copy()
            w_p["date"] = w_p["timestamp"].dt.strftime("%Y-%m-%d")
            daily_agg = w_p.groupby("date")["precipitation"].sum().reset_index()
            daily_totals = [
                {"date": row["date"], "rainfall_mm": round(float(row["precipitation"]), 2)}
                for _, row in daily_agg.iterrows()
            ]

            precip_analytics = {
                "available": True,
                "total_rain_mm": total_rain,
                "max_hourly_event_mm": max_1h,
                "avg_rain_intensity_mm_h": avg_rain_intensity,
                "rain_events_count": rain_hours,
                "confirmed_dry_hours": dry_hours,
                "unrecorded_missing_hours": missing_hours,
                "dry_ratio_pct": round((dry_hours / max(1, len(valid_p))) * 100.0, 1),
                "daily_totals": daily_totals[-30:],
                "data_integrity_note": "Distinguishes confirmed 0.0mm dry hours from missing/unrecorded sensor streams.",
            }
        else:
            precip_analytics = {"available": False, "reason": "Precipitation stream unavailable"}

        # -------------------------------------------------------------
        # 6. Live vs Historical Baseline Context (Step 8)
        # -------------------------------------------------------------
        live_vs_hist: Dict[str, Any] = {}
        try:
            live_data = live_weather_service.fetch_live_weather(force=False)
            live_st = next((s for s in live_data.get("stations", []) if s.get("name", "").lower() == meta["name"].lower()), None)
            if not live_st:
                live_st = next((s for s in live_data.get("stations", []) if s.get("id") == station_id), None)

            if live_st and sensor in live_st and live_st[sensor] is not None:
                live_val = float(live_st[sensor])
                delta = round(live_val - baseline_mean, 2)
                z_dist = delta / max(0.1, baseline_std)

                if delta > 0.5 * baseline_std:
                    comparison_label = "Above historical baseline"
                    badge_style = "amber"
                elif delta < -0.5 * baseline_std:
                    comparison_label = "Below historical baseline"
                    badge_style = "sky"
                else:
                    comparison_label = "Near historical baseline"
                    badge_style = "emerald"

                live_vs_hist = {
                    "available": True,
                    "live_value": live_val,
                    "baseline_mean": baseline_mean,
                    "baseline_std": baseline_std,
                    "delta": delta,
                    "delta_z": round(z_dist, 2),
                    "comparison": comparison_label,
                    "badge_style": badge_style,
                    "unit": unit,
                    "last_update": live_st.get("last_update", "Live"),
                    "context_label": "Contextual Climatological Comparison (Not an anomaly alert — monitored by ML engine)",
                }
            else:
                live_vs_hist = {
                    "available": False,
                    "baseline_mean": baseline_mean,
                    "baseline_std": baseline_std,
                    "unit": unit,
                    "reason": "Live sensor reading temporarily unavailable from Open-Meteo feed.",
                    "context_label": "Contextual Climatological Comparison (Not an anomaly alert — monitored by ML engine)",
                }
        except Exception as e:
            live_vs_hist = {"available": False, "reason": f"Live feed query error: {str(e)}"}

        # -------------------------------------------------------------
        # 7. Data-Backed Weather Insights (Step 9)
        # -------------------------------------------------------------
        insights = []
        delta_period_base = round(period_avg - baseline_mean, 2)
        direction_word = "above" if delta_period_base > 0 else "below"
        insights.append(
            f"Average {SENSOR_LABELS.get(sensor, sensor)} over the {time_range.upper()} period was {period_avg}{unit}, "
            f"which is {abs(delta_period_base)}{unit} {direction_word} the 3-year station baseline ({baseline_mean}{unit})."
        )

        if diurnal.get("available"):
            insights.append(
                f"Diurnal cycle exhibits a {diurnal['diurnal_swing']}{unit} swing, reaching peak intensity at {diurnal['peak_hour']} IST "
                f"({diurnal['peak_value']}{unit}) and lowest trough at {diurnal['trough_hour']} IST ({diurnal['trough_value']}{unit})."
            )

        insights.append(
            f"Observed {SENSOR_LABELS.get(sensor, sensor)} spanned from a minimum of {period_min}{unit} to a peak of {period_max}{unit} "
            f"(total dynamic range: {round(period_max - period_min, 2)}{unit})."
        )

        if precip_analytics.get("available") and precip_analytics.get("total_rain_mm", 0) > 0:
            insights.append(
                f"Cumulative precipitation totaled {precip_analytics['total_rain_mm']} mm across {precip_analytics['rain_events_count']} rain hours, "
                f"with peak hourly downpour reaching {precip_analytics['max_hourly_event_mm']} mm."
            )
        elif precip_analytics.get("available") and precip_analytics.get("confirmed_dry_hours", 0) > 0:
            insights.append(
                f"Confirmed dry meteorological conditions: 100% of recorded intervals ({precip_analytics['confirmed_dry_hours']} hours) recorded 0.0 mm rainfall."
            )

        # -------------------------------------------------------------
        # 8. Data Quality Indicator (Step 10)
        # -------------------------------------------------------------
        last_t = window_df["timestamp"].max().strftime("%Y-%m-%d %H:%M") if actual_rows > 0 else "N/A"
        data_quality = {
            "total_expected_hours": expected_hours,
            "recorded_readings": actual_rows,
            "missing_readings": max(0, expected_hours - actual_rows),
            "coverage_pct": coverage_pct,
            "last_observation_timestamp": last_t,
            "source": source,
            "status": "NOMINAL" if coverage_pct >= 90.0 else "PARTIAL",
        }

        return {
            "status": "SUCCESS",
            "station_id": station_id,
            "station_name": meta["name"],
            "state": meta["state"],
            "sensor": sensor,
            "sensor_label": SENSOR_LABELS.get(sensor, sensor.title()),
            "unit": unit,
            "time_range": time_range,
            "source": source,
            "reference_timestamp": REFERENCE_TIMESTAMP_STR,
            "window_start": w_start.strftime("%Y-%m-%d %H:%M"),
            "window_end": w_end.strftime("%Y-%m-%d %H:%M"),
            "kpis": kpis,
            "trend": {
                "period_min": period_min,
                "period_max": period_max,
                "period_avg": period_avg,
                "baseline_mean": baseline_mean,
                "baseline_std": baseline_std,
                "data_points": len(chart_series),
                "series": chart_series,
            },
            "distribution": distribution,
            "diurnal_pattern": diurnal,
            "monthly_pattern": monthly,
            "precipitation_analytics": precip_analytics,
            "live_vs_historical": live_vs_hist,
            "insights": insights,
            "data_quality": data_quality,
        }

    def get_correlations(
        self,
        station_id: str = "AWS-003",
        time_range: str = "30d",
        source: str = "Meteostat",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Computes bivariate relationships and Pearson correlation coefficients:
        - Temp <-> Humidity
        - Temp <-> Pressure
        - Wind <-> Pressure
        - Temp <-> Precipitation
        Drops nulls strictly (no imputation). Shows 'Insufficient data' if < 10 valid paired rows.
        Explicitly does not claim causation.
        """
        if self.df_merged is None:
            return {"status": "ERROR", "message": "Dataset not loaded"}

        station_df, meta = self._get_station_dataframe(station_id, source)
        w_start, w_end = self._get_window_bounds(time_range, start_date, end_date)

        if len(station_df) == 0:
            return {"status": "INSUFFICIENT_HISTORY", "message": "No station data"}

        window_df = station_df[(station_df["timestamp"] >= w_start) & (station_df["timestamp"] <= w_end)].copy()

        pairs_config = [
            ("temp_vs_humidity", "temperature", "humidity", "Temperature (°C)", "Relative Humidity (%)"),
            ("temp_vs_pressure", "temperature", "pressure", "Temperature (°C)", "Barometric Pressure (hPa)"),
            ("wind_vs_pressure", "wind_speed", "pressure", "Wind Speed (m/s)", "Barometric Pressure (hPa)"),
            ("temp_vs_precip", "temperature", "precipitation", "Temperature (°C)", "Precipitation (mm)"),
        ]

        results = {}
        for key, var_x, var_y, label_x, label_y in pairs_config:
            if var_x not in window_df.columns or var_y not in window_df.columns:
                results[key] = {
                    "available": False,
                    "reason": "Insufficient data: One or both variables not in dataset.",
                    "label_x": label_x,
                    "label_y": label_y,
                }
                continue

            pair_df = window_df[[var_x, var_y]].dropna()
            N = len(pair_df)

            if N < 10:
                results[key] = {
                    "available": False,
                    "status": "INSUFFICIENT_DATA",
                    "reason": f"Insufficient paired data ({N} valid observations, minimum 10 required).",
                    "label_x": label_x,
                    "label_y": label_y,
                    "sample_size": N,
                }
                continue

            x = pair_df[var_x].values.astype(float)
            y = pair_df[var_y].values.astype(float)

            # Check zero variance
            if np.std(x) < 1e-6 or np.std(y) < 1e-6:
                results[key] = {
                    "available": False,
                    "status": "ZERO_VARIANCE",
                    "reason": "Zero variance in one of the variables (e.g. constant 0.0mm dry rainfall).",
                    "label_x": label_x,
                    "label_y": label_y,
                    "sample_size": N,
                }
                continue

            r = float(np.corrcoef(x, y)[0, 1])
            r2 = round(r ** 2, 3)

            x_m, y_m = np.mean(x), np.mean(y)
            denom = np.sum((x - x_m) ** 2)
            slope = float(np.sum((x - x_m) * (y - y_m)) / denom) if denom > 1e-9 else 0.0
            intercept = float(y_m - slope * x_m)

            abs_r = abs(r)
            if abs_r >= 0.7:
                strength = "Strong"
            elif abs_r >= 0.4:
                strength = "Moderate"
            elif abs_r >= 0.2:
                strength = "Weak"
            else:
                strength = "Negligible"

            direction = "positive" if r > 0 else "inverse"
            desc = f"{strength} {direction} correlation (r = {r:+.2f}, R² = {r2:.3f})"

            step_scat = max(1, math.ceil(N / 80))
            scatter_pts = [
                {"x": round(float(x[i]), 2), "y": round(float(y[i]), 2)}
                for i in range(0, N, step_scat)
            ]

            results[key] = {
                "available": True,
                "r": round(r, 3),
                "r_squared": r2,
                "slope": round(slope, 3),
                "intercept": round(intercept, 2),
                "strength": strength,
                "direction": direction,
                "description": desc,
                "label_x": label_x,
                "label_y": label_y,
                "unit_x": SENSOR_UNITS.get(var_x, ""),
                "unit_y": SENSOR_UNITS.get(var_y, ""),
                "sample_size": N,
                "scatter": scatter_pts,
                "disclaimer": "Correlation does not imply causation. Meteorological relationships are subject to local topography and macro-synoptic conditions.",
            }

        return {
            "status": "SUCCESS",
            "station_id": station_id,
            "station_name": meta["name"],
            "time_range": time_range,
            "source": source,
            "correlations": results,
        }

    def compare_stations(
        self,
        station_ids: List[str],
        sensor: str = "temperature",
        time_range: str = "30d",
        source: str = "Meteostat",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Computes multi-station comparison overlay series and station comparative metrics.
        Reuses shared station list and coordinate geometry.
        """
        if self.df_merged is None:
            return {"status": "ERROR", "message": "Dataset not loaded"}

        w_start, w_end = self._get_window_bounds(time_range, start_date, end_date)
        unit = SENSOR_UNITS.get(sensor, "")

        station_summaries = []
        station_series_map: Dict[str, Dict[str, float]] = {}
        all_timestamps = set()

        for sid in station_ids:
            st_df, meta = self._get_station_dataframe(sid, source)
            if len(st_df) == 0:
                continue

            w_df = st_df[(st_df["timestamp"] >= w_start) & (st_df["timestamp"] <= w_end)].copy()
            if len(w_df) == 0 or sensor not in w_df.columns:
                continue

            clean_s = w_df[[sensor, "timestamp"]].dropna()
            if len(clean_s) == 0:
                continue

            vals = clean_s[sensor].values.astype(float)
            st_mean = round(float(np.mean(vals)), 2)
            st_min = round(float(np.min(vals)), 2)
            st_max = round(float(np.max(vals)), 2)
            st_std = round(float(np.std(vals)), 2)

            station_summaries.append({
                "station_id": sid,
                "station_name": meta["name"],
                "state": meta["state"],
                "mean": st_mean,
                "min": st_min,
                "max": st_max,
                "range": round(st_max - st_min, 2),
                "std": st_std,
                "unit": unit,
            })

            t_map = {}
            for _, r in clean_s.iterrows():
                t_str = r["timestamp"].strftime("%Y-%m-%d %H:%M")
                t_map[t_str] = round(float(r[sensor]), 2)
                all_timestamps.add(t_str)
            station_series_map[sid] = t_map

        if not station_summaries:
            return {
                "status": "INSUFFICIENT_HISTORY",
                "message": "No valid observations for selected stations in this window.",
            }

        network_mean = round(float(np.mean([s["mean"] for s in station_summaries])), 2)
        for s in station_summaries:
            s["delta_vs_network_mean"] = round(s["mean"] - network_mean, 2)

        sorted_times = sorted(list(all_timestamps))
        N_times = len(sorted_times)
        step = max(1, math.ceil(N_times / 400)) if N_times > 400 else 1

        aligned_series = []
        for i in range(0, N_times, step):
            t_str = sorted_times[i]
            entry: Dict[str, Any] = {"time": t_str}
            row_vals = []
            for sid in station_ids:
                if sid in station_series_map and t_str in station_series_map[sid]:
                    val = station_series_map[sid][t_str]
                    entry[sid] = val
                    row_vals.append(val)
                else:
                    entry[sid] = None
            if row_vals:
                entry["network_avg"] = round(float(np.mean(row_vals)), 2)
            aligned_series.append(entry)

        return {
            "status": "SUCCESS",
            "sensor": sensor,
            "sensor_label": SENSOR_LABELS.get(sensor, sensor.title()),
            "unit": unit,
            "time_range": time_range,
            "source": source,
            "network_mean": network_mean,
            "station_summaries": station_summaries,
            "series": aligned_series,
        }


weather_analytics_service = WeatherAnalyticsService()
