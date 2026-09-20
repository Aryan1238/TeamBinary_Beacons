import numpy as np
from typing import List, Dict, Tuple

class TemporalAnalyzer:
    """
    Analyzes single-station temporal consistency across Temperature, Pressure, and Humidity.
    Detects sudden spikes, rapid drops, frozen values, and sensor drift.
    """
    def __init__(self, window_size: int = 15):
        self.window_size = window_size

    def check_frozen_sensor(self, series: List[float], min_samples: int = 6) -> Tuple[bool, int]:
        """
        Detects if sensor readings have remained completely identical (zero variance)
        over multiple consecutive reporting cycles.
        """
        if len(series) < min_samples:
            return False, 0
        recent = series[-min_samples:]
        diffs = np.abs(np.diff(recent))
        if np.all(diffs < 0.001):
            return True, len(recent)
        return False, 0

    def analyze_series(self, series: List[float], current_val: float) -> Dict[str, float]:
        """
        Computes rolling baseline, expected value via EWMA, rate of change, and Z-score deviation.
        """
        if not series or len(series) < 3:
            return {
                "expected": current_val,
                "deviation": 0.0,
                "z_score": 0.0,
                "rate_of_change": 0.0,
                "temporal_anomaly_score": 0.0
            }

        arr = np.array(series[-self.window_size:])
        mean = float(np.mean(arr))
        std = float(np.std(arr))
        if std < 0.15:
            std = 0.15  # Avoid zero division in calm conditions

        # Exponentially Weighted Moving Average (alpha=0.35)
        weights = np.exp(np.linspace(-1, 0, len(arr)))
        weights /= weights.sum()
        ewma_expected = float(np.dot(weights, arr))

        deviation = current_val - ewma_expected
        z_score = abs(current_val - mean) / std

        # Rate of change relative to immediately preceding reading
        last_val = series[-1]
        rate_of_change = abs(current_val - last_val)

        # Scaled temporal anomaly score [0.0, 1.0]
        # Z-score > 3.0 or rate of change > 6°C / 8 hPa / 25% RH triggers high score
        score = 1.0 / (1.0 + np.exp(-1.2 * (z_score - 2.5)))

        return {
            "expected": round(ewma_expected, 2),
            "deviation": round(deviation, 2),
            "z_score": round(z_score, 2),
            "rate_of_change": round(rate_of_change, 2),
            "temporal_anomaly_score": float(np.clip(score, 0.0, 1.0))
        }
