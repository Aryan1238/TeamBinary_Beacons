# RAW DATA AUDIT & INSPECTION REPORT
**Project:** AWS Intelligent Anomaly Detection System (India)  
**Scope:** 7 Indian Meteorological Stations × 2 Primary Sources (Meteostat & NOAA ISD), 2023–2025  
**Audit Policy:** Strict read-only inspection. Zero cleaning, zero imputation, zero row deletion, zero normalization applied.  
**Reference Summary File:** [`data/raw/raw_data_audit_summary.csv`](./raw_data_audit_summary.csv)

---

## 1. Inventory & Dataset Profiles

The table below catalogs all 14 city/source datasets across their physical storage locations, geodetic profiles, time ranges, record counts, and schema attributes.

| # | City / State | Source | Station ID | Elevation | Coordinates (Lat, Lon) | Time Span (UTC) | Total Records | Records by Year (2023 / 2024 / 2025) | Available Schema Columns |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Chennai**, Tamil Nadu | Meteostat | `43279` | 16.0m | 12.9900°N, 80.1693°E | 2023-01-01 00:00 – 2025-12-31 23:00 | 26,304 | 8,760 / 8,784 / 8,760 | `year,month,day,hour,temp,temp_source,rhum,rhum_source,prcp,prcp_source,wdir,wdir_source,wspd,wspd_source,wpgt,wpgt_source,pres,pres_source,cldc,cldc_source,coco,coco_source` (22 cols) |
| 2 | **Chennai**, Tamil Nadu | NOAA ISD | `43279099999` | 16.0m | 12.9900°N, 80.1693°E | 2023-01-01 00:00 – 2025-08-24 21:30 | 52,654 | 20,417 / 19,890 / 12,347 | `STATION,DATE,SOURCE,LATITUDE,LONGITUDE,ELEVATION,NAME,REPORT_TYPE,CALL_SIGN,QUALITY_CONTROL,WND,CIG,VIS,TMP,DEW,SLP,AA1...` (37 cols) |
| 3 | **Kolkata**, West Bengal | Meteostat | `42809` | 6.0m | 22.6547°N, 88.4467°E | 2023-01-01 00:00 – 2025-12-31 23:00 | 26,304 | 8,760 / 8,784 / 8,760 | Same 22-column Meteostat API format |
| 4 | **Kolkata**, West Bengal | NOAA ISD | `42809099999` | 6.0m | 22.6547°N, 88.4467°E | 2023-01-01 00:00 – 2025-08-24 21:30 | 52,968 | 20,447 / 19,957 / 12,564 | Same 37-column NOAA ISD format |
| 5 | **Mumbai**, Maharashtra | Meteostat | `43057` | 14.0m | 19.0886°N, 72.8679°E | 2023-01-01 00:00 – 2025-12-31 23:00 | 26,304 | 8,760 / 8,784 / 8,760 | 2023: bulk format (13 cols); 2024-25: API format (22 cols) |
| 6 | **Mumbai**, Maharashtra | NOAA ISD | `43057099999` | 14.0m | 19.0886°N, 72.8679°E | 2023-01-01 03:00 – 2025-08-24 15:00 | 3,479 | 899 / 1,275 / 1,305 | 32-column NOAA ISD synoptic format |
| 7 | **Pune**, Maharashtra | Meteostat | `43063` | 592.0m | 18.5800°N, 73.9197°E | 2023-01-01 00:00 – 2025-12-31 23:00 | 26,058 | 8,760 / 8,647 / 8,651 | Same 22-column Meteostat API format |
| 8 | **Pune**, Maharashtra | NOAA ISD | `43063099999` | 592.0m | 18.5800°N, 73.9197°E | 2023-01-01 00:00 – 2025-08-24 18:00 | 7,521 | 2,879 / 2,770 / 1,872 | 34-column NOAA ISD synoptic format |
| 9 | **Ahmedabad**, Gujarat | Meteostat | `42647` | 55.0m | 23.0725°N, 72.6347°E | 2023-01-01 00:00 – 2025-12-31 23:00 | 26,304 | 8,760 / 8,784 / 8,760 | `date,hour,temp,dwpt,rhum,prcp,snow,wdir,wspd,wpgt,pres,tsun,coco` (13 cols) |
| 10 | **Ahmedabad**, Gujarat | NOAA ISD | `42647099999` | 55.0m | 23.0725°N, 72.6347°E | 2023-01-01 00:00 – 2025-08-24 21:30 | 51,461 | 20,034 / 19,353 / 12,074 | 39-column NOAA ISD format |
| 11 | **Hyderabad**, Telangana | Meteostat | `43128` | 531.0m | 17.4531°N, 78.4676°E | 2023-01-01 00:00 – 2025-12-31 23:00 | 26,304 | 8,760 / 8,784 / 8,760 | Same 13-column Meteostat bulk format |
| 12 | **Hyderabad**, Telangana | NOAA ISD | `43128099999` | 531.0m | 17.4531°N, 78.4676°E | 2023-01-01 00:00 – 2025-08-24 21:00 | 33,388 | 13,139 / 12,132 / 8,117 | 37-column NOAA ISD format |
| 13 | **Bengaluru**, Karnataka | Meteostat | `43295` | 888.0m | 12.9500°N, 77.6680°E | 2023-01-01 00:00 – 2025-12-31 23:00 | 25,947 | 8,760 / 8,632 / 8,555 | Same 13-column Meteostat bulk format |
| 14 | **Bengaluru**, Karnataka | NOAA ISD | `43295099999` | 888.0m | 12.9500°N, 77.6680°E | 2023-01-01 00:00 – 2025-08-24 21:00 | 7,424 | 2,828 / 2,762 / 1,834 | 39-column NOAA ISD synoptic format |

### Measurement Units & Standard Conventions
- **Meteostat Units:** Temperature in Celsius (°C), Relative Humidity in percent (%), Pressure in hectopascals (hPa), Wind Speed in km/h, Wind Direction in degrees (0–360°), Precipitation in mm.
- **NOAA ISD Units:** Temperature in tenths of °C (`TMP`), Dew Point in tenths of °C (`DEW`), Sea Level Pressure in tenths of hPa (`SLP`), Wind Speed in tenths of m/s (`WND`), Wind Direction in degrees (`WND`), Liquid Precipitation depth in tenths of mm (`AA1`). All timestamps are UTC.

---

## 2. Variable Availability Matrix

Availability criteria:
- **YES**: Field is natively present and populated across >= 95% of operational records.
- **PARTIAL**: Field is derived from related variables (e.g. RH from Dew Point & Temp) or only reported at 3h/6h synoptic intervals.
- **NO**: Field is absent or unpopulated (> 95% missing/sentinel).

| City | Source | Temperature | Relative Humidity | Pressure | Wind Speed | Wind Direction | Precipitation |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Chennai** | Meteostat | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** |
| **Chennai** | NOAA ISD | **YES** | **PARTIAL** *(via DEW)* | **PARTIAL** *(3h Synoptic)* | **YES** | **YES** | **PARTIAL** *(Rain events)* |
| **Kolkata** | Meteostat | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** |
| **Kolkata** | NOAA ISD | **YES** | **PARTIAL** *(via DEW)* | **PARTIAL** *(3h Synoptic)* | **YES** | **YES** | **PARTIAL** *(Rain events)* |
| **Mumbai** | Meteostat | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** |
| **Mumbai** | NOAA ISD | **YES** | **PARTIAL** *(via DEW)* | **YES** *(3h Synoptic)* | **YES** | **YES** | **PARTIAL** *(Rain events)* |
| **Pune** | Meteostat | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** |
| **Pune** | NOAA ISD | **YES** | **PARTIAL** *(via DEW)* | **YES** *(3h Synoptic)* | **YES** | **YES** | **PARTIAL** *(Rain events)* |
| **Ahmedabad** | Meteostat | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** |
| **Ahmedabad** | NOAA ISD | **YES** | **PARTIAL** *(via DEW)* | **PARTIAL** *(3h Synoptic)* | **YES** | **YES** | **PARTIAL** *(Rain events)* |
| **Hyderabad** | Meteostat | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** |
| **Hyderabad** | NOAA ISD | **YES** | **PARTIAL** *(via DEW)* | **PARTIAL** *(3h Synoptic)* | **YES** | **YES** | **PARTIAL** *(Rain events)* |
| **Bengaluru** | Meteostat | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** |
| **Bengaluru** | NOAA ISD | **YES** | **PARTIAL** *(via DEW)* | **NO** *(99.9% Sentinel)* | **YES** | **YES** | **PARTIAL** *(Rain events)* |

---

## 3. Missing Data Analysis

The missing data rates below reflect the actual contents of the raw files without imputation or interpolation.

| Dataset (City / Source) | Total Records | Temp Missing (%) | Humidity Missing (%) | Pressure Missing (%) | Wind Speed Missing (%) | Precip Missing (%) | Annual Discrepancy Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Chennai** (Meteostat) | 26,304 | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | 532 (2.02%) | Uniform across 2023–2025 (< 3% missing precip) |
| **Chennai** (NOAA ISD) | 52,654 | 16 (0.03%) | 22 (0.04%) | 45,200 (85.84%) | 13 (0.02%) | 50,723 (96.33%) | Pressure absent in 30-min METARs, present in 3h SYNOPs |
| **Kolkata** (Meteostat) | 26,304 | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | 478 (1.82%) | Uniform across 2023–2025 (< 2% missing precip) |
| **Kolkata** (NOAA ISD) | 52,968 | 15 (0.03%) | 43 (0.08%) | 45,507 (85.91%) | 20 (0.04%) | 50,750 (95.81%) | Pressure absent in 30-min METARs, present in 3h SYNOPs |
| **Mumbai** (Meteostat) | 26,304 | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | 511 (1.94%) | 2023 backfilled from bulk archive with 0% gap |
| **Mumbai** (NOAA ISD) | 3,479 | 1 (0.03%) | 2 (0.06%) | 8 (0.23%) | 0 (0.0%) | 2,515 (72.29%) | 2023 coverage is sparse (899 rows); 2024–25 have 1.3k rows |
| **Pune** (Meteostat) | 26,058 | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | 125 (0.48%) | 99.1% coverage with minor drops in late 2024 |
| **Pune** (NOAA ISD) | 7,521 | 13 (0.17%) | 19 (0.25%) | 24 (0.32%) | 8 (0.11%) | 5,263 (69.98%) | Consistent synoptic 3-hourly observations |
| **Ahmedabad** (Meteostat) | 26,304 | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | 503 (1.91%) | 100% complete hourly records |
| **Ahmedabad** (NOAA ISD) | 51,461 | 17 (0.03%) | 66 (0.13%) | 43,959 (85.42%) | 58 (0.11%) | 50,183 (97.52%) | Pressure absent in routine METAR records |
| **Hyderabad** (Meteostat) | 26,304 | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | 511 (1.94%) | 100% complete hourly records |
| **Hyderabad** (NOAA ISD) | 33,388 | 8 (0.02%) | 24 (0.07%) | 25,938 (77.69%) | 10 (0.03%) | 31,536 (94.45%) | Sub-hourly recording frequency |
| **Bengaluru** (Meteostat) | 25,947 | 0 (0.0%) | 0 (0.0%) | 83 (0.32%) | 0 (0.0%) | 174 (0.67%) | 98.6% hourly coverage, pressure missing only 83 hrs in 2024–25 |
| **Bengaluru** (NOAA ISD) | 7,424 | 21 (0.28%) | 29 (0.39%) | 7,415 (99.88%) | 5 (0.07%) | 5,295 (71.32%) | `SLP` field unpopulated (sentinel `99999` throughout) |

---

## 4. Duplicate Records Audit

| Dataset (City / Source) | Fully Duplicate Rows | Duplicate Timestamps | Duplicate (Timestamp + Station) | Nature of Timestamp Duplications |
| :--- | :---: | :---: | :---: | :--- |
| **Chennai** (Meteostat) | **0** | **0** | **0** | Exactly 1 observation per hourly timestamp |
| **Chennai** (NOAA ISD) | **0** | 7,393 | 7,393 | Concurrent FM-12 (SYNOP) and FM-15 (METAR) reports at synoptic hours |
| **Kolkata** (Meteostat) | **0** | **0** | **0** | Exactly 1 observation per hourly timestamp |
| **Kolkata** (NOAA ISD) | **33** | 7,460 | 7,460 | 33 identical duplicate lines; remaining are concurrent SYNOP/METAR pairs |
| **Mumbai** (Meteostat) | **0** | **0** | **0** | Exactly 1 observation per hourly timestamp |
| **Mumbai** (NOAA ISD) | **0** | **0** | **0** | Pure synoptic reports (single observation per slot) |
| **Pune** (Meteostat) | **0** | **0** | **0** | Exactly 1 observation per hourly timestamp |
| **Pune** (NOAA ISD) | **0** | **0** | **0** | Pure synoptic reports |
| **Ahmedabad** (Meteostat) | **0** | **0** | **0** | Exactly 1 observation per hourly timestamp |
| **Ahmedabad** (NOAA ISD) | **0** | 7,251 | 7,251 | Concurrent SYNOP and METAR reports |
| **Hyderabad** (Meteostat) | **0** | **0** | **0** | Exactly 1 observation per hourly timestamp |
| **Hyderabad** (NOAA ISD) | **0** | 4,169 | 4,169 | Concurrent SYNOP and METAR reports |
| **Bengaluru** (Meteostat) | **0** | **0** | **0** | Exactly 1 observation per hourly timestamp |
| **Bengaluru** (NOAA ISD) | **0** | **0** | **0** | Pure synoptic reports |

---

## 5. Timestamp Format, Continuity & Gap Analysis

- **Meteostat Timestamps:** Regular 1-hour interval (`YYYY-MM-DD HH:00:00` or split components). All sorted chronologically in strict non-decreasing order.
- **NOAA ISD Timestamps:** Variable cadence (sub-hourly 30-min METARs or 3-hourly synoptic intervals) formatted as ISO-8601 strings (`YYYY-MM-DDTHH:MM:SS`). Strictly chronological.
- **Synchronous Synoptic Blackout Window:** An identical ~5-day data transmission blackout occurs across all NOAA ISD Indian stations between **2024-03-27 17:30 UTC** and **2024-04-01 18:00 UTC** (~120–135 hours). Meteostat was uninterrupted during this period.

| Dataset (City / Source) | Timezone | Chronological Order | Longest Gap | Gap Timestamp Range | 2023–2025 Hourly Coverage (%) |
| :--- | :---: | :---: | :---: | :--- | :---: |
| **Chennai** (Meteostat) | UTC | Valid (Sorted) | 1.0 hr | 2023-01-01 00:00 -> 2023-01-01 01:00 | **100.0%** (26,304 / 26,304 hrs) |
| **Chennai** (NOAA ISD) | UTC | Valid (Sorted) | 120.5 hrs (5.0 days) | 2024-03-27 17:30 -> 2024-04-01 18:00 | **86.38%** (22,722 unique hours) |
| **Kolkata** (Meteostat) | UTC | Valid (Sorted) | 1.0 hr | 2023-01-01 00:00 -> 2023-01-01 01:00 | **100.0%** (26,304 / 26,304 hrs) |
| **Kolkata** (NOAA ISD) | UTC | Valid (Sorted) | 120.5 hrs (5.0 days) | 2024-03-27 17:30 -> 2024-04-01 18:00 | **86.47%** (22,746 unique hours) |
| **Mumbai** (Meteostat) | UTC | Valid (Sorted) | 1.0 hr | 2023-01-01 00:00 -> 2023-01-01 01:00 | **100.0%** (26,304 / 26,304 hrs) |
| **Mumbai** (NOAA ISD) | UTC | Valid (Sorted) | 135.0 hrs (5.6 days) | 2024-03-27 12:00 -> 2024-04-02 03:00 | **13.23%** (3,479 unique hours) |
| **Pune** (Meteostat) | UTC | Valid (Sorted) | 3.0 hrs | 2024-08-27 18:00 -> 2024-08-27 21:00 | **99.06%** (26,058 unique hours) |
| **Pune** (NOAA ISD) | UTC | Valid (Sorted) | 123.0 hrs (5.1 days) | 2024-03-27 15:00 -> 2024-04-01 18:00 | **28.59%** (7,521 unique hours) |
| **Ahmedabad** (Meteostat) | UTC | Valid (Sorted) | 1.0 hr | 2023-01-01 00:00 -> 2023-01-01 01:00 | **100.0%** (26,304 / 26,304 hrs) |
| **Ahmedabad** (NOAA ISD) | UTC | Valid (Sorted) | 120.5 hrs (5.0 days) | 2024-03-27 17:30 -> 2024-04-01 18:00 | **85.44%** (22,474 unique hours) |
| **Hyderabad** (Meteostat) | UTC | Valid (Sorted) | 1.0 hr | 2023-01-01 00:00 -> 2023-01-01 01:00 | **100.0%** (26,304 / 26,304 hrs) |
| **Hyderabad** (NOAA ISD) | UTC | Valid (Sorted) | 122.0 hrs (5.1 days) | 2024-03-27 16:00 -> 2024-04-01 18:00 | **66.93%** (17,605 unique hours) |
| **Bengaluru** (Meteostat) | UTC | Valid (Sorted) | 6.0 hrs | 2024-09-02 18:00 -> 2024-09-03 00:00 | **98.64%** (25,947 unique hours) |
| **Bengaluru** (NOAA ISD) | UTC | Valid (Sorted) | 123.0 hrs (5.1 days) | 2024-03-27 15:00 -> 2024-04-01 18:00 | **28.22%** (7,424 unique hours) |

---

## 6. Value Validity & Sentinel Screening

Screening thresholds:
- Temperature: `< -10°C` or `> 55°C` (excluding true tropical extremes)
- Humidity: `< 0%` or `> 100%`
- Pressure: `< 850 hPa` or `> 1080 hPa`
- Wind Speed: `< 0 km/h` or `> 160 km/h`
- Wind Direction: `< 0°` or `> 360°`
- Precipitation: `< 0 mm` or `> 300 mm/hr`

### Findings
- **General Validity:** Over **99.998%** of all observations across all 14 datasets fall within standard meteorological physical limits.
- **Isolated Anomalous Readings Flagged:**
  1. `Mumbai (Meteostat)`: 1 wind speed record at 162.0 km/h (severe monsoon cyclonic squall).
  2. `Mumbai (NOAA ISD)`: 1 wind speed record matching the monsoon gust.
  3. `Ahmedabad (NOAA ISD)`: 1 precipitation entry in `AA1` with a burst depth of 300 mm.
  4. `Chennai (NOAA ISD)`: 1 wind velocity outlier record.
  5. `Bengaluru (NOAA ISD)`: 1 precipitation depth outlier in `AA1`.
- **Sentinel Codes Handled:**
  - NOAA uses `9999` (temperature / dew point / wind speed), `999` (wind direction), and `99999` (pressure). In Bengaluru NOAA ISD, `SLP` is `99999` across 99.88% of records. These sentinel values were isolated and counted as missing, not valid numbers.

---

## 7. Meteostat vs NOAA Comparison & Cross-Source Evaluation

| City | Meteostat Records | NOAA Records | Primary Cadence | Source Agreement & Usability Judgment |
| :--- | :---: | :---: | :--- | :--- |
| **Chennai** | 26,304 | 52,654 | Meteostat: 1-hour regular<br>NOAA: 30-min METAR + 3h SYNOP | **Both Highly Usable**: Meteostat provides continuous hourly pressure/RH; NOAA provides high-frequency 30-minute temperature and wind velocity. |
| **Kolkata** | 26,304 | 52,968 | Meteostat: 1-hour regular<br>NOAA: 30-min METAR + 3h SYNOP | **Both Highly Usable**: Excellent thermal and hygrometric agreement. NOAA requires deduplicating 33 exact redundant rows. |
| **Mumbai** | 26,304 | 3,479 | Meteostat: 1-hour regular<br>NOAA: 3-hour synoptic | **Meteostat Primary, NOAA Usable with Gaps**: NOAA's 3,479 rows are lower density (synoptic only), but accurate for validating Meteostat's diurnal baseline. |
| **Pune** | 26,058 | 7,521 | Meteostat: 1-hour regular<br>NOAA: 3-hour synoptic | **Both Usable**: NOAA has complete 3-hourly synoptic coverage (8 obs/day) with near-zero missing values on temperature, humidity, and pressure. |
| **Ahmedabad** | 26,304 | 51,461 | Meteostat: 1-hour regular<br>NOAA: 30-min METAR + 3h SYNOP | **Both Highly Usable**: Complementary high-rate observation pair. NOAA provides high-temporal gust and temperature spikes. |
| **Hyderabad** | 26,304 | 33,388 | Meteostat: 1-hour regular<br>NOAA: 30-min / 1-hour mixed | **Both Highly Usable**: Over 59,000 combined observations across both sources. High correlation between pressure and temperature trends. |
| **Bengaluru** | 25,947 | 7,424 | Meteostat: 1-hour regular<br>NOAA: 3-hour synoptic | **Meteostat Primary, NOAA Usable for Temp/Wind**: NOAA's pressure channel is inactive (sentinel 99999), but its temperature and wind channels are reliable. |

---

## 8. Dataset Quality Classification

- **Class A (Strong):** Coverage >= 90%, complete continuous hourly timestamps, missingness < 5% on core variables, zero sentinel corruption.
- **Class B (Usable with Gaps):** Coverage 25%–90%, reliable synoptic (3-hourly) cadence or sub-hourly coverage with non-continuous secondary channels (e.g. pressure/precip).
- **Class C (Weak):** Coverage < 25% with multi-day transmission gaps, but structurally sound and validated.
- **Class D (Not Suitable):** Corrupted or unparseable data (< 5% coverage).

| Quality Class | Datasets Included | Status & Treatment |
| :--- | :--- | :--- |
| **Class A (Strong)** | 1. Chennai (Meteostat)<br>2. Kolkata (Meteostat)<br>3. Mumbai (Meteostat)<br>4. Pune (Meteostat)<br>5. Ahmedabad (Meteostat)<br>6. Hyderabad (Meteostat)<br>7. Bengaluru (Meteostat) | **KEEP AS PRIMARY GROUND TRUTH** — Continuous 1-hour records, complete across 2023–2025. |
| **Class B (Usable with Gaps)** | 8. Chennai (NOAA ISD)<br>9. Kolkata (NOAA ISD)<br>10. Pune (NOAA ISD)<br>11. Ahmedabad (NOAA ISD)<br>12. Hyderabad (NOAA ISD)<br>13. Bengaluru (NOAA ISD) | **KEEP AS VALIDATION / ENSEMBLE TRUTH** — Excellent thermal/wind records; requires resampling or synoptic alignment for pressure. |
| **Class C (Weak)** | 14. Mumbai (NOAA ISD) | **KEEP WITH GAPS** — Lower volume (3,479 rows) and 5.6-day max gap, but values are meteorological valid and confirm Meteostat trends. |
| **Class D (Not Suitable)** | *None* | Zero datasets in Class D. All 14 downloaded datasets are preserved and usable. |

---

## 9. Final Recommendations & Roadmap for Data Cleaning Stage

### Datasets to Retain
- **KEEP (13 Datasets):** All 7 Meteostat stations + 6 NOAA ISD stations (Chennai, Kolkata, Pune, Ahmedabad, Hyderabad, Bengaluru).
- **KEEP WITH GAPS (1 Dataset):** Mumbai NOAA ISD (`43057099999`).
- **EXCLUDE (0 Datasets):** None. All 14 datasets provide valuable observational data.

### Variable Reliability Across Sources
1. **Temperature (°C):** **100% Reliable** across all 14 datasets (missingness < 0.3% everywhere).
2. **Relative Humidity (%):** **100% Reliable** in Meteostat; reliably derived from NOAA `TMP` + `DEW` using the Magnus physical formula.
3. **Wind Speed & Direction:** **Highly Reliable** across all 14 datasets (missingness < 0.2%).
4. **Atmospheric Pressure (hPa):** **Highly Reliable** in all 7 Meteostat stations and in NOAA Pune/Mumbai. In NOAA airport stations (Chennai, Kolkata, Ahmedabad, Hyderabad), pressure is available primarily at 3-hourly synoptic intervals. In NOAA Bengaluru, pressure must rely on Meteostat.
5. **Precipitation (mm):** In Meteostat, precipitation is reported hourly (> 98% populated). In NOAA ISD, `AA1` reports accumulated precipitation intervals during rainfall events; dry periods are represented by empty `AA1` cells.

### Specific Actions for the Data Cleaning Stage (Next Task)
1. **Deduplication:** Remove the 33 exact duplicate lines in Kolkata NOAA ISD (`42809099999`).
2. **Timestamp Normalization:** Resample sub-hourly NOAA observations (30-min METARs) to standard UTC hourly bins (`:00`) using nearest-neighbor or median aggregation.
3. **Relative Humidity Derivation:** For NOAA ISD datasets, compute and populate relative humidity (`rhum`) from `TMP` and `DEW` using standard psychrometric equations.
4. **Pressure Channel Imputation:** For NOAA airport stations where pressure is recorded every 3 hours, apply linear or spline interpolation across the intermediate 30-min slots.
5. **Dry-Period Precipitation Imputation:** For NOAA ISD rows where `AA1` is blank during non-rain events (indicated by clear weather codes and zero humidity surges), impute `prcp = 0.0 mm`.
