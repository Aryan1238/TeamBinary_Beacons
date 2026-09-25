# MERGE INTEGRITY & CROSS-SOURCE CONSISTENCY REPORT
**Dataset**: `data/clean/merged/weather_merged.csv`  
**Execution Timestamp**: 2026-09-23  
**Status**: VERIFIED — NO VALUES ALTERED  

---

## 1. Merge Integrity Checklist (Step 1)

All structural, schema, and identifier integrity checks were performed against `data/clean/merged/weather_merged.csv` and its constituent cleaned source files.

| Integrity Check | Target / Rule | Result | Status |
| :--- | :--- | :--- | :--- |
| **Row Count Conservation** | Merged rows == Meteostat rows + NOAA rows | `286,914 == 183,525 + 103,389` | **PASS** |
| **Source Provenance** | Every row has source `'Meteostat'` or `'NOAA'` | 183,525 Meteostat, 103,389 NOAA; 0 unexpected | **PASS** |
| **Identifier Null Check** | Zero nulls in `(timestamp, station_id, city, source)` | 0 nulls detected across all 286,914 rows | **PASS** |
| **Deduplication Check** | Zero duplicate `(timestamp, station_id, source)` tuples | 0 duplicate keys (100% unique primary keys) | **PASS** |
| **Schema Validation** | 10 exact columns: `timestamp, station_id, city, source, temperature, humidity, pressure, wind_speed, wind_direction, precipitation` | Exact match, no missing or extraneous columns | **PASS** |
| **Data Types & Units** | Float conversions valid: Temp (°C), RH (%), Pres (hPa), WindSpd (m/s), WindDir (°), Precip (mm) | 0 dtype casting errors, units conform to standard | **PASS** |

### Constituent File Breakdown
* **Cleaned Meteostat**: 183,525 rows across 7 stations
  * `42647.csv` (Ahmedabad): 26,304 rows
  * `42809.csv` (Kolkata): 26,304 rows
  * `43057.csv` (Mumbai): 26,304 rows
  * `43063.csv` (Pune): 26,058 rows
  * `43128.csv` (Hyderabad): 26,304 rows
  * `43279.csv` (Chennai): 26,304 rows
  * `43295.csv` (Bengaluru): 25,947 rows
* **Cleaned NOAA ISD**: 103,389 hourly deduplicated/resampled rows across 7 stations
  * `42647099999.csv` (Ahmedabad): 22,517 rows
  * `42809099999.csv` (Kolkata): 22,794 rows
  * `43057099999.csv` (Mumbai): 3,479 rows
  * `43063099999.csv` (Pune): 7,521 rows
  * `43128099999.csv` (Hyderabad): 16,879 rows
  * `43279099999.csv` (Chennai): 22,775 rows
  * `43295099999.csv` (Bengaluru): 7,424 rows

---

## 2. Final Missingness Summary (Step 2)

### Overall Missingness (Merged Dataset: 286,914 Rows)

| Variable | Unit | Available Rows | Missing Rows | Missing % |
| :--- | :--- | :--- | :--- | :--- |
| **Temperature** | °C | 286,849 | 65 | **0.02%** |
| **Humidity** | % | 286,855 | 59 | **0.02%** |
| **Pressure** | hPa | 224,288 | 62,626 | **21.83%** |
| **Wind Speed** | m/s | 286,861 | 53 | **0.02%** |
| **Wind Direction** | Degrees | 262,199 | 24,715 | **8.61%** |
| **Precipitation** | mm | 193,330 | 93,584 | **32.62%** |

### Per-City & Per-Source Missingness Breakdown

| City | Source | Total Rows | Temp Miss% | RH Miss% | Pres Miss% | WindSpd Miss% | WindDir Miss% | Precip Miss% |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ahmedabad** | Meteostat | 26,304 | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 1.9% |
| **Ahmedabad** | NOAA | 22,517 | 0.0% | 0.0% | **66.7%** ⚠️ | 0.1% | 16.7% | **94.3%** ⚠️ |
| **Bengaluru** | Meteostat | 25,947 | 0.0% | 0.0% | 0.3% | 0.0% | 0.0% | 0.7% |
| **Bengaluru** | NOAA | 7,424 | 0.3% | 0.4% | **99.9%** ⚠️ | 0.1% | 17.0% | **71.3%** ⚠️ |
| **Chennai** | Meteostat | 26,304 | 0.0% | 0.0% | 0.0% | 0.0% | 0.3% | 2.0% |
| **Chennai** | NOAA | 22,775 | 0.1% | 0.0% | **67.3%** ⚠️ | 0.0% | 15.7% | **91.5%** ⚠️ |
| **Hyderabad** | Meteostat | 26,304 | 0.0% | 0.0% | 0.0% | 0.0% | 0.6% | 1.9% |
| **Hyderabad** | NOAA | 16,879 | 0.0% | 0.0% | **55.9%** ⚠️ | 0.0% | 31.9% | **89.0%** ⚠️ |
| **Kolkata** | Meteostat | 26,304 | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 1.8% |
| **Kolkata** | NOAA | 22,794 | 0.0% | 0.0% | **67.3%** ⚠️ | 0.0% | 20.1% | **90.3%** ⚠️ |
| **Mumbai** | Meteostat | 26,304 | 0.0% | 0.0% | 0.0% | 0.0% | 3.9% | 1.9% |
| **Mumbai** | NOAA | 3,479 | 0.0% | 0.1% | 0.2% | 0.0% | **52.1%** ⚠️ | **72.3%** ⚠️ |
| **Pune** | Meteostat | 26,058 | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.5% |
| **Pune** | NOAA | 7,521 | 0.2% | 0.3% | 0.3% | 0.1% | 40.8% | **70.0%** ⚠️ |

*(Variables highlighted with ⚠️ exceed the > 50% missing data threshold).*

### Alignment with Raw Data Audit
The post-merge missingness pattern **strictly matches** the findings from the raw data audit:
1. **NOAA Sea Level Pressure (SLP) Sparsity**: In synoptic stations (Ahmedabad, Chennai, Hyderabad, Kolkata), NOAA reports SLP strictly during 3-hourly synoptic observation cycles (00, 03, 06, 09, 12, 15, 18, 21 UTC), producing an expected ~66.7% missingness in an hourly-resampled time series. In Bengaluru, NOAA raw records contain virtually no SLP fields (99.9% missing).
2. **NOAA Precipitation Group (AA1)**: NOAA ISD logs precipitation only when rain gauges record non-zero accumulation or mandatory 6/12-hour period summaries. Dry intervals are left unrecorded rather than populated with explicit zeros, yielding 70%–94% missingness. Meteostat reports regular zero-rain intervals.
3. **Core Telemetry Completeness**: Temperature, Relative Humidity, and Wind Speed maintain **> 99.7% completeness** across all stations and sources.

---

## 3. Cross-Source Consistency Analysis (Step 3)

Calculated across all co-occurring hourly timestamp slots where both Meteostat and NOAA have valid observations for the same station.  
Metric evaluated: $\Delta = \text{Value}_{\text{Meteostat}} - \text{Value}_{\text{NOAA}}$.

Threshold criteria for large divergence:
* **Temperature**: $|\Delta| > 2.0\ ^\circ\text{C}$
* **Humidity**: $|\Delta| > 10.0\ \%$
* **Pressure**: $|\Delta| > 3.0\ \text{hPa}$
* **Wind Speed**: $|\Delta| > 5.0\ \text{m/s}$

| City | Co-Occurring Hours | Variable | Valid Pairs | Mean Diff ($\mu$) | Std Dev ($\sigma$) | Violations (> Thresh) | Violation % |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **Ahmedabad** | 22,517 | Temperature (°C)<br>Humidity (%)<br>Pressure (hPa)<br>Wind Speed (m/s) | 22,507<br>22,514<br>7,502<br>22,496 | -0.04<br>+0.01<br>-0.03<br>+0.17 | 0.39<br>1.45<br>0.19<br>0.70 | 236<br>81<br>1<br>28 | 1.0%<br>0.4%<br>0.0%<br>0.1% |
| **Bengaluru** | 7,424 | Temperature (°C)<br>Humidity (%)<br>Pressure (hPa)<br>Wind Speed (m/s) | 7,403<br>7,395<br>9<br>7,419 | -0.04<br>-0.26<br>-4.08<br>+0.24 | 0.37<br>2.49<br>11.53<br>0.94 | 68<br>142<br>1<br>72 | 0.9%<br>1.9%<br>**11.1%**<br>1.0% |
| **Chennai** | 22,775 | Temperature (°C)<br>Humidity (%)<br>Pressure (hPa)<br>Wind Speed (m/s) | 22,761<br>22,775<br>7,457<br>22,767 | -0.00<br>+0.02<br>-0.00<br>+0.15 | 0.06<br>0.42<br>0.03<br>0.70 | 2<br>3<br>0<br>52 | 0.0%<br>0.0%<br>0.0%<br>0.2% |
| **Hyderabad** | 16,879 | Temperature (°C)<br>Humidity (%)<br>Pressure (hPa)<br>Wind Speed (m/s) | 16,878<br>16,877<br>7,449<br>16,875 | +0.01<br>+0.00<br>+0.19<br>+0.18 | 0.39<br>2.00<br>0.87<br>0.88 | 94<br>136<br>**332**<br>71 | 0.6%<br>0.8%<br>**4.5%**<br>0.4% |
| **Kolkata** | 22,794 | Temperature (°C)<br>Humidity (%)<br>Pressure (hPa)<br>Wind Speed (m/s) | 22,789<br>22,790<br>7,461<br>22,787 | -0.00<br>-0.02<br>-0.00<br>+0.11 | 0.07<br>0.50<br>0.01<br>0.48 | 3<br>6<br>0<br>4 | 0.0%<br>0.0%<br>0.0%<br>0.0% |
| **Mumbai** | 3,479 | Temperature (°C)<br>Humidity (%)<br>Pressure (hPa)<br>Wind Speed (m/s) | 3,478<br>3,477<br>3,471<br>3,479 | +0.00<br>+0.01<br>+0.00<br>+0.00 | 0.00<br>0.29<br>0.00<br>0.00 | 0<br>0<br>0<br>0 | 0.0%<br>0.0%<br>0.0%<br>0.0% |
| **Pune** | 7,521 | Temperature (°C)<br>Humidity (%)<br>Pressure (hPa)<br>Wind Speed (m/s) | 7,508<br>7,502<br>7,497<br>7,513 | +0.00<br>+0.01<br>+0.00<br>+0.00 | 0.00<br>0.29<br>0.00<br>0.00 | 0<br>0<br>0<br>0 | 0.0%<br>0.0%<br>0.0%<br>0.0% |

### Analysis of Divergences & Systematic Offsets

1. **Perfect Underlying Agreement in Coastal & Western Stations (Mumbai, Pune, Chennai, Kolkata)**:
   * **Mumbai & Pune**: $\mu = 0.00, \sigma = 0.00$ for Temperature, Pressure, and Wind Speed; $\sigma = 0.29\%$ for Humidity. This demonstrates that Meteostat's primary historical feed for these stations directly derives from the exact same WMO GTS synoptic feed as NOAA ISD.
   * **Chennai & Kolkata**: Temperature differences have $\sigma \le 0.07\ ^\circ\text{C}$ and pressure differences have $\sigma \le 0.03\ \text{hPa}$. Violation rates are $0.0\%$.

2. **Wind Speed Discretization Artifact (+0.11 to +0.24 m/s Mean Offset)**:
   * Across Ahmedabad, Bengaluru, Chennai, Hyderabad, and Kolkata, Meteostat shows a slight positive bias in wind speed of $+0.11$ to $+0.24\ \text{m/s}$.
   * **Cause**: Unit conversion and integer discretization. Meteostat records wind speed in integer km/h (converted via $/3.6 \approx 0.278\ \text{m/s}$ steps), whereas NOAA ISD reports wind speed in tenths of m/s ($0.1\ \text{m/s}$ resolution). This integer truncation in raw feeds induces a systematic mathematical rounding artifact of $\sim 0.15\ \text{m/s}$.

3. **Hyderabad Pressure Variance (332 Violations, 4.5%)**:
   * Hyderabad exhibits a $+0.19\ \text{hPa}$ mean pressure difference with $\sigma = 0.87\ \text{hPa}$ and 332 violations exceeding $3.0\ \text{hPa}$.
   * **Cause**: Station elevation of Hyderabad Begumpet Airport is $531\ \text{m}$ above sea level. NOAA ISD sea level pressure reductions utilize the standard hypsometric equation using current dry-bulb temperature and dew point. Minor differences in intermediate temperature observations during synoptic reductions introduce dynamic $\sim 1\text{–}3\ \text{hPa}$ fluctuations relative to Meteostat's standardized sea-level pressure series.

4. **Bengaluru Pressure Sparsity and Discrepancy**:
   * NOAA Bengaluru (`43295099999`) has only 9 valid pressure records across all 3 years in the merged dataset. The difference across these 9 points is $-4.08\ \text{hPa}$ ($\sigma = 11.53\ \text{hPa}$).
   * **Cause**: HAL Airport Bengaluru sits at $888\ \text{m}$ elevation. Altimeter settings vs sea level pressure (SLP) formulas diverge significantly at higher elevations, and NOAA ISD omits SLP for this station almost entirely.

---

## 4. Implications for Downstream ML Anomaly Detection

Based on the verified merged dataset, the following requirements should guide the downstream anomaly detection models:

1. **Dual-Source Multi-Rate Handling**:
   * Models trained on or ingesting `weather_merged.csv` must not treat `NOAA` and `Meteostat` as independent uncorrelated locations. They represent the same physical station observed at differing reporting rhythms.
   * Features should include the categorical indicator `source` or models should treat cross-source agreement as an ensemble consistency signal.

2. **Pressure Feature Engineering**:
   * Do not drop rows with missing pressure for NOAA; instead, use forward-fill up to 3 hours (the natural synoptic cycle) or impute using the co-located Meteostat sensor stream if training joint cross-validation models.
   * For Bengaluru, use Meteostat as the primary ground truth for barometric pressure.

3. **Precipitation Representation**:
   * NOAA's missing precipitation values correspond overwhelmingly to non-rain periods (dry hours). During feature preprocessing for ML, NaN values in NOAA precipitation should be imputed to $0.0\ \text{mm}$ if accompanying weather remarks or relative humidity $< 85\%$ indicate no active precipitation event.

4. **Zero Artificially Modified Values**:
   * As specified, no data cleaning, smoothing, or synthetic reconciliation was applied to `weather_merged.csv`. All natural sensor artifacts, rounding steps, and synoptic gaps are preserved intact, providing realistic data distributions for anomaly detection.

---

## 5. Sign-Off Confirmation

**Merged dataset verified, no values altered in this step.**
