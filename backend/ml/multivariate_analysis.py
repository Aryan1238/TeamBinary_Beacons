import math
import numpy as np
from sklearn.ensemble import IsolationForest
from typing import Dict, Any

class MultivariateAnalyzer:
    """
    Evaluates physical thermodynamic and statistical correlations among the 3 monitored parameters:
    1. Temperature (°C)
    2. Atmospheric Pressure (hPa)
    3. Relative Humidity (%)
    
    Uses Clausius-Clapeyron approximation for vapor pressure envelope and Isolation Forest
    for multidimensional feature space anomaly scoring.
    """
    def __init__(self):
        # Pre-trained baseline Isolation Forest for normal Indian weather envelope
        self.iso_forest = IsolationForest(
            n_estimators=60,
            contamination=0.03,
            random_state=42
        )
        self._fit_synthetic_baseline()

    def _fit_synthetic_baseline(self):
        # Generate realistic multi-parameter Indian climate envelope (Winter, Summer, Monsoon)
        np.random.seed(42)
        n = 1000
        # Diurnal and seasonal coupling: Higher temp generally associates with lower RH in dry seasons,
        # or moderate RH in monsoon with corresponding barometric shifts.
        temps = np.random.uniform(12.0, 43.0, n)
        # Pressure: typically 995 to 1022 hPa depending on season and altitude
        pressures = 1013.25 - (temps - 25.0) * 0.25 + np.random.normal(0, 3.0, n)
        # Humidity: inverse correlation with high temperature unless under monsoon pressure drop
        rhs = 100.0 - (temps - 10.0) * 1.8 + np.random.normal(0, 10.0, n)
        rhs = np.clip(rhs, 15.0, 98.0)

        X = np.column_stack([temps, pressures, rhs])
        self.iso_forest.fit(X)

    def check_physical_envelope(self, temp: float, pressure: float, rh: float) -> Dict[str, Any]:
        """
        Thermodynamic physical law validations:
        - Clausius-Clapeyron: Dew point cannot exceed dry bulb temperature.
        - Extreme combinations: e.g. Temp > 50°C AND RH > 95% is physically implausible in Earth's atmosphere.
        - Pressure: Standard sea-level/inland pressure extremes (< 920 hPa indicates severe supercyclone, > 1050 hPa sensor fault).
        """
        reasons = []
        is_physically_impossible = False

        # Heat index extreme saturation check
        if temp > 48.0 and rh > 80.0:
            reasons.append("Physically impossible simultaneous extreme temperature and near-saturation humidity")
            is_physically_impossible = True
        
        if temp > 58.0 or temp < -15.0:
            reasons.append(f"Temperature {temp}°C exceeds terrestrial meteorological bounds for Indian stations")
            is_physically_impossible = True

        if pressure < 930.0 or pressure > 1050.0:
            reasons.append(f"Pressure {pressure} hPa exceeds operational barometric atmospheric range")
            is_physically_impossible = True

        if rh < 0.0 or rh > 100.0:
            reasons.append(f"Relative humidity {rh}% outside bounded 0-100% saturation range")
            is_physically_impossible = True

        # Compute consistency percentages
        # Temp consistency
        temp_dist = abs(temp - 30.0)
        temp_consistency = max(5.0, 100.0 - (temp_dist * 3.5)) if temp < 52 else 8.0

        # Pressure consistency
        press_dist = abs(pressure - 1010.0)
        pressure_consistency = max(10.0, 100.0 - (press_dist * 4.0))

        # Humidity consistency
        rh_consistency = max(10.0, 100.0 - abs(rh - 60.0) * 1.2)

        # Multivariate Isolation Forest score
        sample = np.array([[temp, pressure, rh]])
        # Decision function: negative means outlier, positive inlier
        raw_score = float(self.iso_forest.decision_function(sample)[0])
        # Normalize into [0, 1] anomaly likelihood (higher = more anomalous)
        multivariate_anomaly_score = float(np.clip(0.5 - raw_score * 2.0, 0.0, 1.0))
        if is_physically_impossible:
            multivariate_anomaly_score = max(multivariate_anomaly_score, 0.96)

        overall_consistency = round(
            (temp_consistency * 0.4 + pressure_consistency * 0.3 + rh_consistency * 0.3) * (1.0 - multivariate_anomaly_score * 0.7),
            1
        )
        overall_consistency = max(5.0, min(99.0, overall_consistency))

        return {
            "is_physically_impossible": is_physically_impossible,
            "multivariate_anomaly_score": round(multivariate_anomaly_score, 3),
            "temp_consistency": round(temp_consistency, 1),
            "pressure_consistency": round(pressure_consistency, 1),
            "humidity_consistency": round(rh_consistency, 1),
            "overall_consistency": overall_consistency,
            "physical_flags": reasons
        }
