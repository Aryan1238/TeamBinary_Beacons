# FAULT INJECTION & LABELED ANOMALY DATASET REPORT
**Source Input**: `data/ml_ready/weather_ml_ready_{train,val,test}.csv` (READ-ONLY, UNTOUCHED)  
**Output Directory**: `data/anomaly_labeled/`  
**Generated Files**:
* `data/anomaly_labeled/train_labeled.csv` (103.36 MB, 200,039 rows, 67 columns)
* `data/anomaly_labeled/val_labeled.csv` (25.85 MB, 49,864 rows, 67 columns)
* `data/anomaly_labeled/test_labeled.csv` (18.91 MB, 37,011 rows, 67 columns)
* `data/anomaly_labeled/fault_injection_summary.json` (Machine-readable breakdown)
**Pipeline Status**: COMPLETE & FULLY VERIFIED  

---

## 1. Executive Summary & Verification Checklist

Synthetic fault injection was executed independently across each chronological split to generate ground-truth labels for supervised anomaly classification without data contamination.

| Verification Item | Requirement / Target | Measured Result | Status |
| :--- | :--- | :--- | :---: |
| **Input File Immutability** | `data/ml_ready/*.csv` strictly untouched | Verified identical `mtime` & byte size before/after | **PASS** |
| **Split Boundary Isolation** | 0 fault windows cross train/val/test boundaries | Every fault block start & end is strictly within-split | **PASS** |
| **Native Reading Integrity** | Only inject on native valid readings (`_filled=False`, `_large_gap=False`) | 100% of injected rows were verified native readings | **PASS** |
| **Pre-Injection Value Audit** | Every injected row has `true_value_before_injection` | 7,852 / 7,852 anomaly rows have pre-injection values | **PASS** |
| **Normal Row Cleanliness** | Non-anomalous rows have `fault_type=NORMAL`, metadata null | 100% of non-anomaly rows have clean null metadata | **PASS** |
| **Target Anomaly Incidence** | ~2.0% to 4.0% of rows per split | Train: **2.78%**, Val: **2.61%**, Test: **2.67%** | **PASS** |
| **Minimum Representation** | $\ge 200\text{--}300$ examples per fault type in train | All 7 fault types have **$752\text{--}883$ rows** in train | **PASS** |
| **No Overlapping Faults** | Zero overlapping fault windows | Every row belongs to at most one fault block | **PASS** |

---

## 2. Overall Anomaly Distribution by Split

| Split | Date Range | Total Rows | Normal Rows | Anomaly Rows | Anomaly % | Target Range |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Train** | 2023-01-01 00:00 to 2024-12-31 23:00 | 200,039 | 194,474 | **5,565** | **2.78%** | 2.0% – 4.0% |
| **Validation** | 2025-01-01 00:00 to 2025-06-30 23:00 | 49,864 | 48,565 | **1,299** | **2.61%** | 2.0% – 4.0% |
| **Test** | 2025-07-01 00:00 to 2025-12-31 23:00 | 37,011 | 36,023 | **988** | **2.67%** | 2.0% – 4.0% |
| **Total Master** | **2023-01-01 00:00 to 2025-12-31 23:00** | **286,914** | **279,062** | **7,852** | **2.74%** | **2.0% – 4.0%** |

---

## 3. Breakdown by Fault Type per Split

| Fault Type | Target Variable | Block Duration | Train Rows | Val Rows | Test Rows | Total Rows | Injected Profile |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **`TEMP_SPIKE`** | `temperature` | 1–3 hours | 770 | 179 | 134 | **1,083** | Abrupt $\pm [8, 15]^\circ\text{C}$ step offset, reverts exactly |
| **`TEMP_DRIFT`** | `temperature` | 12–36 hours | 883 | 170 | 155 | **1,208** | Linearly ramping $\pm [3, 8]^\circ\text{C}$ calibration drift |
| **`FROZEN_SENSOR`** | T, RH, P, or WS | 4–20 hours | 752 | 179 | 114 | **1,045** | Stuck at initial block reading for entire duration |
| **`HUMIDITY_ANOMALY`** | `humidity` | 2–6 hours | 805 | 191 | 150 | **1,146** | $\pm [20, 40]\%$ offset or saturated stuck at 0%/100% |
| **`PRESSURE_ANOMALY`** | `pressure` | 2–8 hours | 783 | 189 | 137 | **1,109** | Abrupt offset or gradual drift of $\pm [5, 20]\ \text{hPa}$ |
| **`WIND_ANOMALY`** | WS or WD | 1–4 hours | 762 | 193 | 151 | **1,106** | Abrupt $+30\text{--}60\ \text{km/h}$ ($+8.3\text{--}16.7\text{ m/s}$) jump or stuck WD |
| **`COMMUNICATION_FAILURE`**| `ALL` | 2–8 hours | 810 | 198 | 147 | **1,155** | Simultaneous null telemetry drop across all sensors |
| **TOTAL** | — | — | **5,565** | **1,299** | **988** | **7,852** | — |

---

## 4. Detailed Breakdown per City & Source

### A. Train Split (200,039 Rows, 5,565 Anomalies — 2.78%)

| City & Source | `TEMP_SPIKE` | `TEMP_DRIFT` | `FROZEN_SENSOR` | `HUMIDITY_ANOMALY` | `PRESSURE_ANOMALY` | `WIND_ANOMALY` | `COMMUNICATION_FAILURE` | Total Anomalies |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ahmedabad Meteostat** | 49 | 70 | 119 | 44 | 87 | 52 | 100 | **521** |
| **Ahmedabad NOAA** | 51 | 41 | 100 | 85 | 0 * | 83 | 0 * | **360** |
| **Bengaluru Meteostat** | 74 | 143 | 133 | 73 | 136 | 70 | 109 | **738** |
| **Bengaluru NOAA** | 12 | 0 | 0 | 0 | 0 * | 6 | 0 * | **18** |
| **Chennai Meteostat** | 84 | 50 | 44 | 70 | 126 | 73 | 127 | **574** |
| **Chennai NOAA** | 70 | 97 | 84 | 81 | 0 * | 50 | 0 * | **382** |
| **Hyderabad Meteostat** | 82 | 149 | 70 | 66 | 121 | 93 | 145 | **726** |
| **Hyderabad NOAA** | 37 | 0 | 9 | 75 | 0 * | 57 | 0 * | **178** |
| **Kolkata Meteostat** | 78 | 28 | 29 | 68 | 106 | 70 | 100 | **479** |
| **Kolkata NOAA** | 85 | 68 | 55 | 79 | 0 * | 48 | 0 * | **335** |
| **Mumbai Meteostat** | 60 | 77 | 40 | 94 | 110 | 81 | 117 | **579** |
| **Mumbai NOAA** | 8 | 0 | 0 | 0 | 0 * | 3 | 0 * | **11** |
| **Pune Meteostat** | 68 | 160 | 69 | 70 | 97 | 68 | 112 | **644** |
| **Pune NOAA** | 12 | 0 | 0 | 0 | 0 * | 8 | 0 * | **20** |
| **TOTAL** | **770** | **883** | **752** | **805** | **783** | **762** | **810** | **5,565** |

*\* In NOAA airport stations, pressure was forward-filled up to 3h during ml-ready preparation. In accordance with Rule 1 ("Never inject on top of already-imputed or already-flagged data"), pressure anomalies and full-station communication drops were injected exclusively into native, unimputed sensor series (Meteostat), preserving the integrity of ground-truth labels.*

---

### B. Validation Split (49,864 Rows, 1,299 Anomalies — 2.61%)

| City & Source | `TEMP_SPIKE` | `TEMP_DRIFT` | `FROZEN_SENSOR` | `HUMIDITY_ANOMALY` | `PRESSURE_ANOMALY` | `WIND_ANOMALY` | `COMMUNICATION_FAILURE` | Total Anomalies |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ahmedabad Meteostat** | 21 | 0 | 33 | 23 | 21 | 34 | 16 | **148** |
| **Ahmedabad NOAA** | 15 | 15 | 0 | 21 | 0 | 10 | 0 | **61** |
| **Bengaluru Meteostat** | 12 | 14 | 0 | 11 | 45 | 10 | 43 | **135** |
| **Bengaluru NOAA** | 3 | 0 | 0 | 0 | 0 | 0 | 0 | **3** |
| **Chennai Meteostat** | 13 | 0 | 11 | 30 | 37 | 16 | 36 | **143** |
| **Chennai NOAA** | 8 | 0 | 16 | 16 | 0 | 19 | 0 | **59** |
| **Hyderabad Meteostat** | 23 | 38 | 13 | 25 | 18 | 17 | 30 | **164** |
| **Hyderabad NOAA** | 13 | 0 | 0 | 4 | 0 | 6 | 0 | **23** |
| **Kolkata Meteostat** | 13 | 0 | 16 | 19 | 36 | 25 | 18 | **127** |
| **Kolkata NOAA** | 10 | 0 | 21 | 10 | 0 | 21 | 0 | **62** |
| **Mumbai Meteostat** | 27 | 80 | 50 | 14 | 21 | 12 | 20 | **224** |
| **Mumbai NOAA** | 1 | 0 | 0 | 0 | 0 | 1 | 0 | **2** |
| **Pune Meteostat** | 19 | 23 | 19 | 18 | 11 | 20 | 35 | **145** |
| **Pune NOAA** | 1 | 0 | 0 | 0 | 0 | 2 | 0 | **3** |
| **TOTAL** | **179** | **170** | **179** | **191** | **189** | **193** | **198** | **1,299** |

---

### C. Test Split (37,011 Rows, 988 Anomalies — 2.67%)

| City & Source | `TEMP_SPIKE` | `TEMP_DRIFT` | `FROZEN_SENSOR` | `HUMIDITY_ANOMALY` | `PRESSURE_ANOMALY` | `WIND_ANOMALY` | `COMMUNICATION_FAILURE` | Total Anomalies |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ahmedabad Meteostat** | 13 | 19 | 10 | 3 | 14 | 21 | 25 | **105** |
| **Ahmedabad NOAA** | 8 | 26 | 14 | 12 | 0 | 7 | 0 | **67** |
| **Bengaluru Meteostat** | 5 | 0 | 5 | 15 | 14 | 13 | 16 | **68** |
| **Bengaluru NOAA** | 2 | 0 | 0 | 0 | 0 | 0 | 0 | **2** |
| **Chennai Meteostat** | 10 | 67 | 5 | 26 | 19 | 14 | 13 | **154** |
| **Chennai NOAA** | 16 | 21 | 5 | 3 | 0 | 5 | 0 | **50** |
| **Hyderabad Meteostat** | 11 | 0 | 38 | 24 | 26 | 15 | 46 | **160** |
| **Hyderabad NOAA** | 16 | 0 | 0 | 13 | 0 | 6 | 0 | **35** |
| **Kolkata Meteostat** | 3 | 0 | 11 | 4 | 20 | 26 | 8 | **72** |
| **Kolkata NOAA** | 12 | 0 | 7 | 11 | 0 | 14 | 0 | **44** |
| **Mumbai Meteostat** | 19 | 22 | 19 | 14 | 22 | 10 | 13 | **119** |
| **Mumbai NOAA** | 3 | 0 | 0 | 0 | 0 | 2 | 0 | **5** |
| **Pune Meteostat** | 11 | 0 | 0 | 25 | 22 | 18 | 26 | **102** |
| **Pune NOAA** | 5 | 0 | 0 | 0 | 0 | 0 | 0 | **5** |
| **TOTAL** | **134** | **155** | **114** | **150** | **137** | **151** | **147** | **988** |

---

## 5. Single-Source Cross-Verification Realism

Wherever co-located native observations were present (`cross_verified_{var} == True`), synthetic faults were injected into **only one source**, leaving the peer source untouched:
* **Single-Source Injections**: Over **85.3%** of single-sensor anomalies in dual-source cities (Ahmedabad, Chennai, Kolkata, Hyderabad, Mumbai, Pune) were injected as single-source faults (`single_source_fault = True`).
* **Discrepancy Signal Update**: For all single-source injections, `{variable}_diff_other_source` was adjusted by the exact applied anomaly offset:
  $$\Delta_{\text{new}} = \Delta_{\text{orig}} + \Delta_{\text{fault}}$$
  This creates a distinctive, learnable cross-source divergence signal that mirrors real-world instrument calibration failures and hardware drift.
* **Standalone Injections**: For communication drops or times where the peer sensor was in a natural gap, `single_source_fault = False` was assigned.

---

## 6. Schema of the Labeled Dataset (67 Columns)

Each labeled split contains the 59 features from `weather_ml_ready_*.csv` plus the 8 standardized ground-truth label columns:

```
Columns 1–59:  Original ML-Ready Features & Provenance Flags
------------------------------------------------------------
1.  timestamp                     21. temperature_roll_mean_3h      41. temperature_invalid_removed
2.  station_id                    22. temperature_roll_std_3h       42. humidity_invalid_removed
3.  city                          23. temperature_roll_mean_24h     43. pressure_invalid_removed
4.  source                        24. humidity_roll_mean_3h         44. wind_speed_invalid_removed
5.  temperature                   25. humidity_roll_std_3h          45. precipitation_invalid_removed
6.  humidity                      26. humidity_roll_mean_24h        46. temperature_filled
7.  pressure                      27. pressure_roll_mean_3h         47. temperature_large_gap
8.  wind_speed                    28. pressure_roll_std_3h          48. humidity_filled
9.  wind_direction                29. pressure_roll_mean_24h        49. humidity_large_gap
10. wind_dir_sin                  30. wind_speed_roll_mean_3h       50. pressure_filled
11. wind_dir_cos                  31. wind_speed_roll_std_3h        51. pressure_large_gap
12. precipitation                 32. wind_speed_roll_mean_24h      52. pressure_unreliable_source
13. hour_sin                      33. temperature_diff_other_source 53. wind_speed_filled
14. hour_cos                      34. cross_verified_temperature    54. wind_speed_large_gap
15. day_of_year                   35. humidity_diff_other_source    55. wind_direction_filled
16. month                         36. cross_verified_humidity       56. wind_direction_large_gap
17. temperature_roc               37. pressure_diff_other_source    57. wind_direction_missing
18. humidity_roc                  38. cross_verified_pressure       58. precipitation_missing
19. pressure_roc                  39. wind_speed_diff_other_source  59. split
20. wind_speed_roc                40. cross_verified_wind_speed

Columns 60–67: Added Ground-Truth Label Columns
------------------------------------------------------------
60. fault_type                    (string: NORMAL | TEMP_SPIKE | TEMP_DRIFT | FROZEN_SENSOR |
                                           HUMIDITY_ANOMALY | PRESSURE_ANOMALY | WIND_ANOMALY |
                                           COMMUNICATION_FAILURE)
61. is_anomaly                    (bool: True if fault injected, False for NORMAL)
62. affected_variable             (string: temperature | humidity | pressure | wind_speed |
                                           wind_direction | ALL | None)
63. fault_start                   (string: YYYY-MM-DD HH:MM:SS of block start, or None)
64. fault_end                     (string: YYYY-MM-DD HH:MM:SS of block end, or None)
65. fault_magnitude               (string: numerical offset / fault description, or None)
66. true_value_before_injection   (string: pre-injection raw reading(s), or None)
67. single_source_fault           (bool: True if peer source native & clean, False if standalone, or None)
```

---

## 7. Sign-Off Confirmation

**Synthetic fault injection and anomaly dataset labeling complete and fully verified. No machine learning models were trained. Ground-truth labels are clean, auditable, and ready for model development.**
