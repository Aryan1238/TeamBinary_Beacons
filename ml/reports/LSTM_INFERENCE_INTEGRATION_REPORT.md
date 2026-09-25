# LSTM Autoencoder Telemetry & Dashboard Integration Verification Report

**Project**: SkyGuard AI — Automatic Weather Station Telemetry Assurance  
**Verification Date**: September 24, 2026  
**Status**: COMPLETE — Verified with Real Empirical Evidence & Exact Numbers  
**Environment**: Local Integration (FastAPI Port 8000 / Vite Port 5173 / Python 3.14 on D:\skyguard_env)

---

## 1. Executive Summary

The trained LSTM Autoencoder sequence model (`ml/models/lstm_autoencoder.keras`) has been integrated into the local telemetry ingestion engine, the Live Monitoring dashboard, and the Simulation Lab testbench.

Every verification item (Steps A through E, including real execution of Tests A through G) was performed against the live running API and frontend. All reported numbers represent actual computed model outputs and HTTP responses—none are hypothetical or assumed.

---

## 2. Step A — Confirmation of Files Built (File-by-File Audit)

| Target Component | Status | Exact File Path | Description of Changes / Features |
| :--- | :--- | :--- | :--- |
| **LSTM Inference Engine** | **CREATED** | `backend/ml/lstm_service.py` | 421 lines. Rolling buffers, dynamic feature extraction (ROC, cyclical, 3h/24h rolling stats), series exclusions, gap detection (>1.0h reset), NaN handling, feature attribution, append-only logging. |
| **API Endpoints & WebSocket** | **MODIFIED** | `backend/main.py` | Mounted `/api/ml/infer`, `/api/ml/status`, `/api/ml/threshold`, `/api/ml/reset`, and `/api/ml/logs`. Augmented WebSocket broadcast to stream `ml_status`. |
| **Telemetry Context** | **MODIFIED** | `frontend/src/Dashboard/context/TelemetryContext.tsx` | Added `mlResults`, `telemetryAlerts`, `streamSources`. Dispatches live packets to `/api/ml/infer`. Bypasses LSTM for `COMMUNICATION_FAILURE` and 3h synoptic series. |
| **Live Monitoring Page** | **MODIFIED** | `frontend/src/Dashboard/components/pages/LiveMonitoringPage.tsx` | Added dual-stream selector (Meteostat/NOAA), dedicated LSTM Autoencoder Surveillance panel with MSE, frozen threshold, ratio bar, dominant feature attribution, performance disclaimer, and separate rule-based panel. |
| **Command Overview Page** | **MODIFIED** | `frontend/src/Dashboard/components/pages/CommandOverviewPage.tsx` | Removed hardcoded placeholder strings (`critical in AWS-003`, `1 Critical, 1 High, 1 Medium`). Wired KPI cards to dynamic ML and testbench anomaly counts. |
| **Simulation Lab Page** | **MODIFIED** | `frontend/src/Dashboard/components/pages/SimulationLabPage.tsx` | Replaced mock decision cards with live LSTM Autoencoder verdict box, real MSE, error ratio, dominant driver, and separate Telemetry Availability Alert banner for communication failure. |
| **Inference Log File** | **CREATED & ACTIVE** | `ml/logs/inference.log` | Append-only newline-delimited JSON audit log recording timestamp, station_id, source, reconstruction_error, threshold, prediction, fault_type, and affected_feature. |

---

## 3. Step B — Confirmation of Untouched Frozen Artifacts

SHA-256 cryptographic hashes and filesystem modification timestamps were checked directly against disk:

| Artifact | File Path | SHA-256 Hash | Last Modified (IST) | File Size | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **LSTM Model** | `ml/models/lstm_autoencoder.keras` | `0a286da03cba0fb723f2db865687d9d802467f2be081d7fcd466a03c898bff23` | 2026-09-23 22:35:16 | 733,405 bytes | **UNTOUCHED / FROZEN** |
| **StandardScaler** | `ml/models/scaler.pkl` | `6343fb8adefee7025b2b354d8dba33c2e8ee204ceed50e559a75ac0874a6c189` | 2026-09-23 21:43:51 | 1,008 bytes | **UNTOUCHED / FROZEN** |
| **Threshold Config** | `ml/models/anomaly_threshold.json` | `a8aba25ba85d233c45355c9c7e339dc69efd7051096ec0691a91a51a40abf8c4` | 2026-09-23 22:35:31 | 1,363 bytes | **UNTOUCHED / FROZEN** |
| **Feature List** | `ml/features/lstm_feature_config.json` | `59a49c62caa395abac1f9aab14d5511840218157b64bf62d378454d9e7739af7` | 2026-09-23 21:43:23 | 1,518 bytes | **UNTOUCHED / FROZEN** |

**Loaded Threshold**: `0.24231` (method: `percentile_grid_search_max_f1`, Validation F1: `0.339`).  
Zero retraining, fine-tuning, or parameter alterations occurred during integration.

---

## 4. Step C — Confirmation of Placeholder Removal

A full scan across all files in `frontend/src` was executed. Zero occurrences of the placeholder verdict logic remain.

### Scan Confirmation:
- `FAIL (Z > 3.8)`: **0 occurrences**
- `FAIL (Z`: **0 occurrences**
- `Z > 3.8`: **0 occurrences**
- `Envelope Check: FAIL`: **0 occurrences**
- `critical in AWS-003`: **0 occurrences**
- `1 Critical, 1 High, 1 Medium`: **0 occurrences**
- `Temperature spike violates inverse thermodynamic correlation`: **0 occurrences**
- `Spatial Consensus: CONFLICT`: **0 occurrences**
- `Gradient: OUTLIER`: **0 occurrences**

### Exact Removed Lines:

#### 1. `frontend/src/Dashboard/data/mockStations.ts` (Lines 67-81):
```diff
-    status: 'ANOMALY',
-    healthScore: 74,
-    sensors: {
-      temperature: { value: 34.8, unit: '°C', status: 'ANOMALY', min24h: 19.5, max24h: 34.8, expectedMin: 20.0, expectedMax: 29.5, lastUpdated: 'Just now' },
-    weatherCondition: 'Isolated Thermal Discrepancy',
-    forecastSummary: 'Sudden +5.3°C deviation from regional cluster. Physical rate-of-change violated.',
-    calibrationDueDays: 12,
-    communicationUptime: 96.1
+    status: 'NORMAL',
+    healthScore: 97,
+    sensors: {
+      temperature: { value: 27.8, unit: '°C', status: 'NORMAL', min24h: 19.5, max24h: 29.2, expectedMin: 20.0, expectedMax: 29.5, lastUpdated: '1s ago' },
+    weatherCondition: 'Deccan Plateau Clear • Nominal Baseline',
+    forecastSummary: 'Synoptic pressure and thermal gradient within expected historical bounds.',
+    calibrationDueDays: 140,
+    communicationUptime: 99.5
```

#### 2. `frontend/src/Dashboard/components/pages/LiveMonitoringPage.tsx` (Lines 387-390):
```diff
-                  <span className="font-semibold text-rose-300">
-                    {selectedStationId === 'AWS-003'
-                      ? 'Temperature spike violates inverse thermodynamic correlation with RH. High probability of thermal decoupling or pyrometer decalibration.'
-                      : 'Operational telemetry is stable. Sensor responses align with neighboring synoptic stations.'}
-                  </span>
```

#### 3. `frontend/src/Dashboard/components/pages/CommandOverviewPage.tsx` (Lines 88-93):
```diff
-          trend={{ value: 12, isPositive: false, label: 'critical in AWS-003' }}
-          subtext="1 Critical, 1 High, 1 Medium"
+          trend={{
+            value: totalAnomalies,
+            isPositive: totalAnomalies === 0,
+            label: totalAnomalies > 0 ? `${totalAnomalies} active anomaly signal(s)` : 'All stations nominal',
+          }}
+          subtext={
+            mlAnomalyCount > 0
+              ? `${mlAnomalyCount} LSTM sequence anomaly detected`
+              : activeFaultCount > 0
+              ? `${activeFaultCount} testbench injected fault(s) active`
+              : '0 active sequence anomalies'
+          }
```

#### 4. `frontend/src/Dashboard/components/pages/SimulationLabPage.tsx` (Lines 347-365):
```diff
-                <span className="text-slate-400">Envelope Check:</span>
-                <span className={isAnomalous ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
-                  {isAnomalous ? 'FAIL (Z > 3.8)' : 'PASS'}
-                </span>
-              </div>
-              <div className="flex justify-between">
-                <span className="text-slate-400">Physical Check:</span>
-                <span className={activeScenario === 'humidity-spike' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
-                  {activeScenario === 'humidity-spike' ? 'CONFLICT' : 'PASS'}
-                </span>
-              </div>
-              <div className="flex justify-between">
-                <span className="text-slate-400">Spatial Neighbors:</span>
-                <span className={isAnomalous ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
-                  {isAnomalous ? 'OUTLIER' : 'CONSENSUS'}
-                </span>
+                <span className="text-slate-400">Reconstruction MSE:</span>
+                <span className={currentML.reconstructionError !== null && currentML.reconstructionError > currentML.threshold ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
+                  {currentML.reconstructionError !== null ? currentML.reconstructionError.toFixed(5) : 'N/A (Warming up)'}
+                </span>
```

---

## 5. Step D — Real Test Execution Results (Scenarios A through G)

All tests were executed against the live running API (`http://127.0.0.1:8000`) using native records from `data/ml_ready/weather_ml_ready_test.csv`.

### Test A: Nominal 30h Hourly Telemetry (Meteostat Chennai, Station 43279)
- **Warm-Up Progression**:
  - Step 1: `WARMING_UP (1/24)`
  - Step 12: `WARMING_UP (12/24)`
  - Step 23: `WARMING_UP (23/24)`
- **Valid Warmed-Up Windows (Steps 24 through 30, 7 Windows)**:
  - Step 24 (2025-07-01 23:00:00): Status = `NORMAL`, MSE = `0.19536`, Ratio = `0.81x`, Dominant = `wind_speed_roll_std_3h`
  - Step 25 (2025-07-02 00:00:00): Status = `NORMAL`, MSE = `0.16456`, Ratio = `0.68x`, Dominant = `wind_speed_roll_std_3h`
  - Step 26 (2025-07-02 01:00:00): Status = `NORMAL`, MSE = `0.15590`, Ratio = `0.64x`, Dominant = `wind_speed_roll_std_3h`
  - Step 27 (2025-07-02 02:00:00): Status = `NORMAL`, MSE = `0.15660`, Ratio = `0.65x`, Dominant = `wind_speed_roll_std_3h`
  - Step 28 (2025-07-02 03:00:00): Status = `NORMAL`, MSE = `0.15044`, Ratio = `0.62x`, Dominant = `humidity_roc`
  - Step 29 (2025-07-02 04:00:00): Status = `NORMAL`, MSE = `0.15442`, Ratio = `0.64x`, Dominant = `humidity_roc`
  - Step 30 (2025-07-02 05:00:00): Status = `NORMAL`, MSE = `0.16230`, Ratio = `0.67x`, Dominant = `humidity_roc`
- **Summary**:
  - Minimum MSE: `0.15044`
  - Maximum MSE: `0.19536`
  - Mean MSE: `0.16280`
  - All 7 windows strictly $\le$ `0.24231` (100% `NORMAL`).

---

### Test B: Injected TEMP_SPIKE (+12°C)
- **Input**: Spiked native temperature from `34.5°C` to `46.5°C` (`+12.0°C`).
- **Actual Model Response**:
  - Status: **`ANOMALY`**
  - Reconstruction Error (MSE): **`0.35922`** (Threshold: `0.24231`)
  - Reconstruction-Error Ratio: **`1.48x`**
  - Margin: **`+0.11691 breach`**
  - Dominant Error Driver: **`temperature_roll_std_3h`** (direct mathematical attribution from squared error vector).

---

### Test C: Injected TEMP_DRIFT (+0.8°C/h over 8 Hours)
- **Input**: Progressive thermal drift of $+0.8^\circ	ext{C}$ per hour added to native diurnal curve.
- **Hourly Progression**:
  - Hour 1 ($+0.8^\circ	ext{C}$, 31.0°C): MSE = `0.16547`, Ratio = `0.68x`, Status = `NORMAL`, Dominant = `wind_speed_roll_std_3h`
  - Hour 2 ($+1.6^\circ	ext{C}$, 31.6°C): MSE = `0.15707`, Ratio = `0.65x`, Status = `NORMAL`, Dominant = `wind_speed_roll_std_3h`
  - Hour 3 ($+2.4^\circ	ext{C}$, 33.4°C): MSE = `0.16087`, Ratio = `0.66x`, Status = `NORMAL`, Dominant = `wind_speed_roll_std_3h`
  - Hour 4 ($+3.2^\circ	ext{C}$, 34.5°C): MSE = `0.15467`, Ratio = `0.64x`, Status = `NORMAL`, Dominant = `humidity_roc`
  - Hour 5 ($+4.0^\circ	ext{C}$, 36.0°C): MSE = `0.16382`, Ratio = `0.68x`, Status = `NORMAL`, Dominant = `humidity_roc`
  - Hour 6 ($+4.8^\circ	ext{C}$, 37.8°C): MSE = `0.17396`, Ratio = `0.72x`, Status = `NORMAL`, Dominant = `humidity_roc`
  - Hour 7 ($+5.6^\circ	ext{C}$, 40.1°C): MSE = `0.15655`, Ratio = `0.65x`, Status = `NORMAL`, Dominant = `humidity_roc`
  - Hour 8 ($+6.4^\circ	ext{C}$, 41.4°C): MSE = `0.16322`, Ratio = `0.67x`, Status = `NORMAL`, Dominant = `humidity_roc`
- **Result & Finding**: Status remained **`NORMAL`** throughout. MSE peaked at `0.17396` without crossing `0.24231`.
- **Honest Finding**: This provides direct empirical validation of the model's documented limitation: **TEMP_DRIFT detection recall is only 11.5%**. Slow gradual drifts fit within the autoencoder's diurnal reconstruction envelope. This confirms why the prominent disclaimer in the UI is necessary.

---

### Test D: Injected FROZEN_SENSOR (Fixed at 29.5°C for 10 Hours)
- **Input**: Temperature pinned at `29.5°C` while true ambient temperature rose from `30.2°C` to `36.4°C`.
- **Hourly Progression**:
  - Hours 1–6: MSE = `0.15391` to `0.17009`, Ratio = `0.64x` to `0.70x`, Status = `NORMAL`.
  - Hours 7–10: As natural temperature diverged to $36.4^\circ	ext{C}$, the dominant error driver automatically switched to **`temperature_roll_std_3h`** (Hour 7: MSE `0.15466`, Hour 8: MSE `0.16241`, Hour 9: MSE `0.16332`, Hour 10: MSE `0.15096`).
- **Result & Finding**: Status stayed `NORMAL`. Because 29.5°C is within the climatological range for Chennai in July, uncalibrated autoencoder error remained below 0.24231. Independent physical rate-of-change rules (zero variance over 10h) flag this in the separate rule-based panel.

---

### Test E: Clear Fault & Recovery Window
- **Input**: Clean native readings resumed following the fault injection.
- **Hourly Progression**:
  - Post-Clear Hour 1 (2025-07-02 10:00:00): Status = **`NORMAL`**, MSE = **`0.18623`**, Ratio = **`0.77x`**.
- **Result**: Immediate recovery to `NORMAL` in **1 hour** (MSE `0.18623` $\le$ `0.24231`).

---

### Test F: Trigger COMMUNICATION_FAILURE (3h Telemetry Gap)
- **Pre-gap Inference Log Count**: 75
- **During 3h Link Down**:
  - Telemetry Availability Alert surfaced on UI: `"NO DATA — link down for 3h"`
  - Inference Log Count: **75 (Zero LSTM calls logged during link failure)**
- **Resumption Packet**: Received at $t+4	ext{h}$ (4-hour time jump).
  - Continuity check triggered: `diff_hours = 4.0h > 1.05h`
  - Buffer reset executed: returned **`WARMING_UP (1/24)`**, `reconstruction_error = None`.
  - Logged transition: `[RESET] Time gap (4.00h > 1.0h)`.

---

### Test G: 3-Hourly Synoptic Series Exclusion
Packets submitted for all three 3-hourly synoptic series:
1. **NOAA Mumbai (43057099999)**:
   - Status: **`NOT_APPLICABLE (3h cadence)`**
   - Reconstruction MSE: **`None`**
   - LSTM Model Invocations: **0**
   - Message: `Series (43057099999, NOAA) is 3-hourly cadence and excluded from LSTM Autoencoder. Routed to rule-based checks.`
2. **NOAA Pune (43063099999)**:
   - Status: **`NOT_APPLICABLE (3h cadence)`**
   - Reconstruction MSE: **`None`**
   - LSTM Model Invocations: **0**
3. **NOAA Bengaluru (43295099999)**:
   - Status: **`NOT_APPLICABLE (3h cadence)`**
   - Reconstruction MSE: **`None`**
   - LSTM Model Invocations: **0**

---

## 6. Step E — Confirmation of Visible Disclaimer in Built UI

The model performance disclaimer is actively rendered in the UI directly below the reconstruction error ratio bar in `LiveMonitoringPage.tsx`:

### Exact Rendered Text:
> **MODEL PERFORMANCE DISCLAIMER:**  
> "Test recall is ~26.5% / precision ~43% / F1 0.33. Misses are expected, especially for TEMP_DRIFT (11.5%) and TEMP_SPIKE (14.7%)."

### Ratio Labeling:
> "*Normalized ratio relative to threshold, not a calibrated probability."

### Separate Diagnostic Panel:
Atmospheric physics and rule-based diagnostics (e.g., Physical Limits, Rate-of-Change, Dew Point Consistency, Spatial Consensus) are rendered in a distinct panel below the ML card, ensuring operators distinguish between statistical sequence reconstruction and deterministic physical violations.

---

## 7. Deliverable Verification Artifacts

1. Report File: `ml/reports/LSTM_INFERENCE_INTEGRATION_REPORT.md`
2. Test Execution Data: `ml/reports/real_integration_test_results.json`
3. Audit Log: `ml/logs/inference.log`
4. Backend Service: `backend/ml/lstm_service.py` & `backend/main.py`
5. Frontend UI: `frontend/src/Dashboard/components/pages/LiveMonitoringPage.tsx`
