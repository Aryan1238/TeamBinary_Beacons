# ML-READY DATASET REPORT
**Source Input**: `data/clean/merged/weather_merged.csv` (READ-ONLY, UNTOUCHED)  
**Output Directory**: `data/ml_ready/`  
**Generated Files**:
* `data/ml_ready/weather_ml_ready_master.csv` (145.33 MB, 286,914 rows, 59 columns)
* `data/ml_ready/weather_ml_ready_train.csv` (101.45 MB, 200,039 rows)
* `data/ml_ready/weather_ml_ready_val.csv` (25.37 MB, 49,864 rows)
* `data/ml_ready/weather_ml_ready_test.csv` (18.51 MB, 37,011 rows)
**Pipeline Status**: COMPLETE & FULLY VERIFIED  

---

## 1. Pipeline Overview & Input File Immutability

The ML-ready feature generation pipeline was executed on the dual-source merged dataset across the 7 representative Indian weather stations (Ahmedabad, Bengaluru, Chennai, Hyderabad, Kolkata, Mumbai, Pune) covering 2023–2025.

| Verification Item | Requirement | Measured Result | Status |
| :--- | :--- | :--- | :---: |
| **Input File Read-Only Status** | `data/clean/merged/weather_merged.csv` untouched | `mtime` & byte size identical pre/post execution | **PASS** |
| **Master Row Conservation** | Exact match with input merged rows | 286,914 rows | **PASS** |
| **Temporal Split Sum** | `len(train) + len(val) + len(test) == len(master)` | `200,039 + 49,864 + 37,011 == 286,914` | **PASS** |
| **Split Exclusivity** | 0 overlapping timestamps between splits | 0 overlaps across train, val, and test | **PASS** |

---

## 2. Invalid Value Re-Scan & Extreme Event Preservation (Step 1)

Physical meteorological range bounds were applied to every observation row:
* **Temperature**: $[-10.0, 55.0]\ ^\circ\text{C}$
* **Humidity**: $[0.0, 100.0]\ \%$
* **Pressure**: $[850.0, 1080.0]\ \text{hPa}$
* **Wind Speed**: $[0.0, 160.0\ \text{km/h}] \equiv [0.0, 44.44\ \text{m/s}]$
* **Precipitation**: $[0.0, 300.0]\ \text{mm/hr}$

### Preservation of Known Genuine Extreme Events
As mandated by prior audits, genuine atmospheric extremes were explicitly protected from range filtering:
1. **Mumbai Monsoon Cyclonic Squall** (2023-09-27 03:00:00): Wind speeds up to $49.4\ \text{m/s}$ ($177.8\ \text{km/h}$ / $162\ \text{km/h}$ gust) were preserved in both Meteostat and NOAA streams.
2. **Ahmedabad Cloudburst** (2024-10-11 00:00:00): $911.0\ \text{mm}$ NOAA burst precipitation entry preserved.
3. **Chennai & Bengaluru Isolated Pulses**:
   * Chennai: $362.0\ \text{mm}$ precipitation (2023-03-09 15:00:00) and $28.8\ \text{m/s}$ wind gust (2025-04-25 06:00:00) preserved.
   * Bengaluru: $405.0\ \text{mm}$ precipitation (2025-05-19 03:00:00) and $41.2\ \text{m/s}$ wind pulse (2023-09-26 09:00:00) preserved.

### Invalid Values Removed
All remaining observations across all 7 cities and both sources fell cleanly inside physical range bounds.
* **Temperature**: 0 removed
* **Humidity**: 0 removed
* **Pressure**: 0 removed
* **Wind Speed**: 0 removed
* **Precipitation**: 0 removed

*(All boolean flags `{variable}_invalid_removed` were recorded as `False` across the dataset).*

---

## 3. Missing Value Handling & Gap Provenance Flags (Step 2)

Every filled or imputed value has a corresponding boolean flag (`{variable}_filled = True`) ensuring complete distinction from native raw observations.

### Gap Handling Summary Table

| Variable | Native Missing Before Fill | Filled / Imputed | Method | Large Gap Stays Null ($> 3\text{h}$) | Large Gap Flag |
| :--- | :---: | :---: | :--- | :---: | :--- |
| **Temperature** | 65 | **30** | Linear Interpolation ($\le 3\text{h}$) | 35 | `temperature_large_gap = True` |
| **Humidity** | 59 | **9** | Linear Interpolation ($\le 3\text{h}$) | 50 | `humidity_large_gap = True` |
| **Wind Speed** | 53 | **40** | Linear Interpolation ($\le 3\text{h}$) | 13 | `wind_speed_large_gap = True` |
| **Pressure (NOAA)** | 62,543 | **53,988** | Forward-fill $\le 3\text{h}$ (synoptic cadence) | 8,555 | `pressure_large_gap = True` |
| **Pressure (Meteostat)** | 83 | **0** | Linear Interpolation ($\le 3\text{h}$) | 83 | `pressure_large_gap = True` |
| **Pressure (Bengaluru NOAA)** | 7,415 | **0** | **Exception: Unreliable Source** | 7,415 | `pressure_unreliable_source = True` |
| **Wind Direction (Meteostat)** | 1,261 | **539** | Circular Sin/Cos Interpolation ($\le 3\text{h}$) | 722 | `wind_direction_large_gap = True` |
| **Wind Direction (NOAA)** | 23,454 | **0** | None (do not fabricate direction) | 23,454 | `wind_direction_missing = True` |
| **Precipitation** | 93,584 | **0** | **None (Zero Heuristic Imputation)** | 93,584 | `precipitation_missing = True` |

### Key Handling Specifics
1. **NOAA Synoptic Pressure Forward-Fill**:
   * NOAA's natural 3-hourly synoptic cadence results in 2 missing hourly slots between consecutive 3-hourly observations. Forward-filling up to 3 hours successfully reconstructed **53,988 hours** with verified pressure telemetry.
   * Dropouts $> 3\text{ hours}$ (8,555 rows) were preserved as null.
2. **Bengaluru NOAA Pressure Exception**:
   * In Bengaluru NOAA (`43295099999`), only 9 observations over 3 years contained valid pressure. As instructed, forward-filling was completely disabled for Bengaluru NOAA pressure.
   * All **7,424 Bengaluru NOAA rows** were flagged `pressure_unreliable_source = True`, preventing downstream ML models from ingesting sparse, biased altimeter reductions.
3. **Meteostat Bengaluru Pressure**:
   * The 83 missing pressure rows in Bengaluru Meteostat occurred in 6-hour gap blocks during August–September 2024. Because each gap exceeded the $\le 3\text{h}$ threshold, all 83 rows remained null with `pressure_large_gap = True`.
4. **Precipitation Integrity (Zero Heuristic Imputation)**:
   * **Confirmed zero heuristic or humidity-proxy imputation used**. All 93,584 missing precipitation values remain strictly `NaN` with `precipitation_missing = True`.
   * Meteostat serves as the primary precipitation signal ($\approx 98.1\text{–}99.5\%$ complete); NOAA precipitation serves solely as an event cross-validation secondary signal.

---

## 4. Feature Engineering (Step 3)

The dataset contains **59 lean, mathematically sound features and provenance flags**:

### A. Core & Secondary Telemetry
* `temperature` (°C, native or $\le 3\text{h}$ interpolated)
* `humidity` (%, native or $\le 3\text{h}$ interpolated)
* `pressure` (hPa, native, interpolated, or NOAA forward-filled $\le 3\text{h}$)
* `wind_speed` (m/s, native or $\le 3\text{h}$ interpolated)
* `wind_direction` (raw degrees kept for reference)
* `wind_dir_sin`: $\sin(\theta_{\text{rad}})$ (cyclical component)
* `wind_dir_cos`: $\cos(\theta_{\text{rad}})$ (cyclical component)
* `precipitation` (mm, native only)

### B. Cyclical Temporal Encodings
* `hour_sin`: $\sin(2\pi \cdot \text{hour} / 24)$
* `hour_cos`: $\cos(2\pi \cdot \text{hour} / 24)$
* `day_of_year`: $1 \dots 366$
* `month`: $1 \dots 12$

### C. Rate of Change (`_roc`) & Rolling Statistics
Rate of change and rolling windows are evaluated chronologically per station+source series.
* `{variable}_roc = value(t) - value(t-1)`: Strictly null across time jumps $> 1\text{ hour}$, missing values, or large gaps.
* `{variable}_roll_mean_3h`, `{variable}_roll_std_3h`: 3-hour moving window.
* `{variable}_roll_mean_24h`: 24-hour moving window.

#### Rolling Window Gap-Reset Counters

| Variable | ROC Null Spans | 3-Hour Window Resets | 24-Hour Window Resets |
| :--- | :---: | :---: | :---: |
| **Temperature** | 22,819 | 24,200 | 40,269 |
| **Humidity** | 22,819 | 24,200 | 40,269 |
| **Pressure** | 24,220 | 25,852 | 46,001 |
| **Wind Speed** | 22,819 | 24,200 | 40,269 |

*Note: In synoptic-only NOAA series (e.g., Mumbai NOAA with 3-hourly intervals), the 1-hour step condition cleanly prevents fabricating 1-hour rates of change or bridging rolling stats across missing intermediate hours.*

### D. Cross-Source Discrepancies (`_diff_other_source`)
Self-joined on `(city, timestamp)` where the peer source has a **valid native (unfilled)** observation:
$$\{variable\}\_\text{diff\_other\_source} = \text{this\_row\_value} - \text{other\_source\_value}$$
Accompanying boolean flags `cross_verified_{variable} = True/False` mark every verified hour.

#### Cross-Source Verified Hours by City

| City | Temperature Verified Hours | Humidity Verified Hours | Pressure Verified Hours | Wind Speed Verified Hours |
| :--- | :---: | :---: | :---: | :---: |
| **Ahmedabad** | 45,024 | 45,031 | 29,760 | 45,013 |
| **Bengaluru** | 14,806 | 14,790 | 18 * | 14,838 |
| **Chennai** | 45,536 | 45,550 | 29,880 | 45,542 |
| **Hyderabad** | 33,757 | 33,756 | 24,149 | 33,754 |
| **Kolkata** | 45,583 | 45,584 | 29,906 | 45,581 |
| **Mumbai** | 6,956 | 6,954 | 6,949 | 6,958 |
| **Pune** | 15,016 | 15,004 | 15,018 | 15,026 |

*\* In Bengaluru, NOAA SLP is 99.9% missing; only the 9 native co-located hours were verified (producing 18 verified row entries across the two sources), correctly reflecting the absence of ground truth barometric redundancy.*

---

## 5. Time-Based Dataset Splits (Step 4)

The dataset is partitioned chronologically to prevent temporal data leakage:

| Split | Start Timestamp | End Timestamp | Row Count | % of Master | File Path |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Train** | 2023-01-01 00:00:00 | 2024-12-31 23:00:00 | **200,039** | 69.72% | `data/ml_ready/weather_ml_ready_train.csv` |
| **Validation** | 2025-01-01 00:00:00 | 2025-06-30 23:00:00 | **49,864** | 17.38% | `data/ml_ready/weather_ml_ready_val.csv` |
| **Test** | 2025-07-01 00:00:00 | 2025-12-31 23:00:00 | **37,011** | 12.90% | `data/ml_ready/weather_ml_ready_test.csv` |
| **Total** | **2023-01-01 00:00:00** | **2025-12-31 23:00:00** | **286,914** | **100.00%** | `data/ml_ready/weather_ml_ready_master.csv` |

### Exclusivity Check
* `train ∩ val`: **0 overlapping timestamps**
* `val ∩ test`: **0 overlapping timestamps**
* `train ∩ test`: **0 overlapping timestamps**

---

## 6. Complete Schema Listing (59 Columns)

```
1.  timestamp                     (string: YYYY-MM-DD HH:MM:SS)
2.  station_id                    (string)
3.  city                          (string)
4.  source                        (string: Meteostat | NOAA)
5.  temperature                   (float: °C)
6.  humidity                      (float: %)
7.  pressure                      (float: hPa)
8.  wind_speed                    (float: m/s)
9.  wind_direction                (float: degrees, raw reference)
10. wind_dir_sin                  (float: sin component)
11. wind_dir_cos                  (float: cos component)
12. precipitation                 (float: mm)
13. hour_sin                      (float: cyclical hour)
14. hour_cos                      (float: cyclical hour)
15. day_of_year                   (int: 1-366)
16. month                         (int: 1-12)
17. temperature_roc               (float: 1h delta)
18. humidity_roc                  (float: 1h delta)
19. pressure_roc                  (float: 1h delta)
20. wind_speed_roc                (float: 1h delta)
21. temperature_roll_mean_3h      (float: 3h rolling mean)
22. temperature_roll_std_3h       (float: 3h rolling sample std)
23. temperature_roll_mean_24h     (float: 24h rolling mean)
24. humidity_roll_mean_3h         (float: 3h rolling mean)
25. humidity_roll_std_3h          (float: 3h rolling sample std)
26. humidity_roll_mean_24h        (float: 24h rolling mean)
27. pressure_roll_mean_3h         (float: 3h rolling mean)
28. pressure_roll_std_3h          (float: 3h rolling sample std)
29. pressure_roll_mean_24h        (float: 24h rolling mean)
30. wind_speed_roll_mean_3h       (float: 3h rolling mean)
31. wind_speed_roll_std_3h        (float: 3h rolling sample std)
32. wind_speed_roll_mean_24h       (float: 24h rolling mean)
33. temperature_diff_other_source (float: diff vs peer native)
34. cross_verified_temperature    (bool)
35. humidity_diff_other_source    (float: diff vs peer native)
36. cross_verified_humidity       (bool)
37. pressure_diff_other_source    (float: diff vs peer native)
38. cross_verified_pressure       (bool)
39. wind_speed_diff_other_source  (float: diff vs peer native)
40. cross_verified_wind_speed     (bool)
41. temperature_invalid_removed   (bool)
42. humidity_invalid_removed      (bool)
43. pressure_invalid_removed      (bool)
44. wind_speed_invalid_removed    (bool)
45. precipitation_invalid_removed (bool)
46. temperature_filled            (bool)
47. temperature_large_gap         (bool)
48. humidity_filled               (bool)
49. humidity_large_gap            (bool)
50. pressure_filled               (bool)
51. pressure_large_gap            (bool)
52. pressure_unreliable_source    (bool)
53. wind_speed_filled             (bool)
54. wind_speed_large_gap          (bool)
55. wind_direction_filled         (bool)
56. wind_direction_large_gap      (bool)
57. wind_direction_missing        (bool)
58. precipitation_missing         (bool)
59. split                         (string: train | validation | test)
```

---

## 7. Sign-Off Confirmation

**ML-ready feature dataset successfully generated and verified. All gaps, features, time splits, and data provenance flags conform strictly to requirements.**
