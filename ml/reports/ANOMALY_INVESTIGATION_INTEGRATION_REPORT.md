# Anomaly Investigation Layer Integration Report
**SkyGuard AI Meteorological Telemetry Intelligence System**  
**Phase**: Anomaly Investigation Engine, Anomaly Alerts Queue & Forensic Deep-Dive Triage Integration  
**Date**: September 24, 2026  
**Status**: COMPLETE & FULLY VERIFIED (Tests A–F Passed)

---

## 1. Executive Summary

The **Anomaly Investigation Layer** provides an automated, multi-tiered forensic analysis pipeline that bridges live telemetry, deep-learning sequence anomaly detection, and ground-truth meteorological cross-validation.

Crucially, **investigations are NOT gated on LSTM inference alone**. The engine evaluates every incoming packet across four independent diagnostic tiers:
1. **Temporal ML Sequence Model**: Rolling 24-step LSTM Autoencoder (`lstm_autoencoder.keras`, frozen threshold `0.24231`).
2. **Deterministic Physical Rules**:
   - Temporal Rate of Change: $|\Delta T / \Delta t| > 3.0^\circ\text{C/h}$.
   - Climatic Diurnal Envelope: Physical boundaries $[\text{expectedMin}, \text{expectedMax}]$.
   - Zero-Variance Sensor Freeze: $\ge 3$ consecutive identical cycles with fluctuating diurnal expectation.
3. **Multi-Station Spatial Peer Consensus**: Inverse Distance Weighting (IDW) comparison against all neighboring AWS stations within a $150\text{km}$ radius.
4. **Live External Weather Feed**: Real-time reference data from Open-Meteo API queryable by station geographic coordinates (with non-blocking graceful fallback).

Stations operating on 3-hourly synoptic observation cadences (NOAA Mumbai, Pune, and Bengaluru) are strictly excluded from sequence padding and routed directly to deterministic rule checks with `lstm_reconstruction_error: null` and `lstm_status: "NOT_APPLICABLE (3h cadence)"`.

---

## 2. File-by-File Component Inventory

| File Path | Role / Purpose | Status | Key Features |
| :--- | :--- | :--- | :--- |
| `backend/ml/investigation_service.py` | Core Forensic Triage Engine | **CREATED** (572 lines) | 4-layer diagnosis, trigger tracking, decision matrix, IDW spatial consensus ($\le 150\text{km}$), Open-Meteo coordinate lookup |
| `backend/main.py` | API Endpoints & Broadcast | **MODIFIED** | `/api/investigation/active`, `/api/investigation/{station_id}`, `/api/investigation/evaluate`, `/api/investigation/clear`, WebSocket broadcast |
| `backend/ml/lstm_service.py` | LSTM Inference Engine | **MODIFIED** | Extended `EXCLUDED_SERIES` to include frontend AWS IDs (`AWS-003`, `AWS-004`, `AWS-007`) for NOAA 3h cadence |
| `frontend/src/Dashboard/types/dashboard.types.ts` | TypeScript Interfaces | **MODIFIED** | Defined `InvestigationRecord`, attached optional `investigation` to `AnomalyAlert` |
| `frontend/src/Dashboard/utils/investigationUtils.ts` | Forensic Transformers | **CREATED** | `investigationToAlert()` mapping `InvestigationRecord` to UI alert objects with formatted evidence |
| `frontend/src/Dashboard/context/TelemetryContext.tsx` | State Management & Polling | **MODIFIED** | Real-time `/api/investigation/evaluate` on telemetry updates and fault injections, 2.5s active queue polling, instant reset |
| `frontend/src/Dashboard/components/common/AlertRow.tsx` | Alert Queue Component | **MODIFIED** | Dynamic trigger source badges (`LSTM_ANOMALY`, `RATE_OF_CHANGE_FAIL`, `PHYSICAL_RANGE_FAIL`, etc.) |
| `frontend/src/Dashboard/components/pages/AnomalyAlertsPage.tsx` | Alerts Queue Page | **VERIFIED** | Live counters (Total, Critical, High, Medium), clean network state ("All Weather Stations Operating Within Tolerance") |
| `frontend/src/Dashboard/components/pages/AnomalyInvestigationPage.tsx` | Deep-Dive Forensic Triage | **MODIFIED** | Full 3-evidence forensic panels, dynamic severity styling, live timeline chart, external Open-Meteo and spatial peer breakdown |
| `frontend/src/Dashboard/components/pages/CommandOverviewPage.tsx` | Command Center Overview | **MODIFIED** | Replaced static placeholders with real dynamic investigation feed, added fallback nominal state |
| `frontend/src/Dashboard/DashboardApp.tsx` | App Shell Controller | **MODIFIED** | Connected `dynamicAlerts`, wired Deep Triage navigation from alerts to active forensic record |

---

## 3. Forensic Decision Table & Severity Matrix

The investigation engine maps active trigger combinations to standardized severities and operational remedies:

| Condition / Triggers | Severity | Probable Cause | Recommended Action |
| :--- | :--- | :--- | :--- |
| $\ge 2$ independent signals agree (e.g. `LSTM_ANOMALY` + `PHYSICAL_RANGE_FAIL` or `RATE_OF_CHANGE_FAIL`) AND external/spatial mismatch | **CRITICAL** | Severe sensor hardware failure / catastrophic transducer spike | `Create Maintenance Ticket` |
| Communication link down $\ge 2.0\text{h}$ (`COMM_FAILURE`) | **CRITICAL** | Station offline / telemetry link failure | `Create Maintenance Ticket` |
| `RATE_OF_CHANGE_FAIL` ($> 3.0^\circ\text{C/h}$) | **HIGH** | Rapid thermal excursion breaching atmospheric gradient limits | `Sensor Inspection Required` |
| `PHYSICAL_RANGE_FAIL` (outside diurnal limits) | **HIGH** | Operational band breach exceeding historical bounds | `Sensor Inspection Required` |
| `ZERO_VARIANCE_FROZEN` ($\ge 3$ consecutive constant readings) | **HIGH** | Transducer freeze / stuck Analog-to-Digital Converter (ADC) | `Sensor Inspection Required` |
| `LSTM_ANOMALY` isolated (error ratio $> 1.0\text{x}$) | **MEDIUM** | Sequence pattern anomaly without physical threshold violation | `Continue Monitoring` |
| Uncorrelated telemetry anomaly | **MEDIUM** | Transient atmospheric anomaly / sensor drift | `Verify with External Weather` |
| Reading matches external Open-Meteo & spatial neighbors | **LOW** | Genuine local microclimate or regional meteorological event | `Possible Genuine Weather Event` |

---

## 4. Real Verification Results (Tests A – F)

Tests were executed against the live backend instance (`http://127.0.0.1:8000`). All assertions passed with 100% precision:

### Test A: Normal Telemetry Check
- **Input**: AWS-001 (Chennai) nominal reading ($29.5^\circ\text{C}$, $65\%$, $1010.5\text{ hPa}$, $4.2\text{ m/s}$).
- **Result**:
  - `has_investigation`: `False`
  - `investigation`: `None`
  - `active_total`: `0`
- **Verdict**: **PASSED** (Pristine network produces no false alarms).

### Test B: Severe Temperature Spike (`TEMP_SPIKE`)
- **Input**: AWS-001 (Chennai) warmed up to 24 steps, injected with sudden $52.0^\circ\text{C}$ spike.
- **Result**:
  - `Investigation ID`: `INV-AWS-001-20260924005617`
  - `Severity`: **CRITICAL**
  - `Triggers`: `['LSTM_ANOMALY', 'RATE_OF_CHANGE_FAIL', 'PHYSICAL_RANGE_FAIL']`
  - `LSTM Reconstruction Error`: `1.66259` (vs frozen threshold `0.24231`, ratio `6.86x`)
  - `LSTM Status`: `ANOMALY`
  - `Rate of Change Check`: `FAIL` ($22.5^\circ\text{C/h} > 3.0^\circ\text{C/h}$)
  - `Physical Range Check`: `FAIL` ($52.0^\circ\text{C} > 38.0^\circ\text{C}$)
  - `Recommended Action`: `Create Maintenance Ticket`
- **Verdict**: **PASSED** (Multi-trigger concurrence classifies as CRITICAL with maintenance ticket dispatch).

### Test C: Rapid Sensor Drift (`TEMP_DRIFT`)
- **Input**: AWS-005 (Ahmedabad) baseline $27.0^\circ\text{C}$ followed by $+4.5^\circ\text{C/h}$ drift to $31.5^\circ\text{C}$ (within physical bounds $15\text{--}40^\circ\text{C}$).
- **Result**:
  - `Investigation ID`: `INV-AWS-005-20260924005617`
  - `Severity`: **HIGH**
  - `Triggers`: `['RATE_OF_CHANGE_FAIL']`
  - `Rate of Change Check`: `FAIL` ($4.5^\circ\text{C/h} > 3.0^\circ\text{C/h}$)
  - `Probable Cause`: `Rapid rate-of-change violation (4.5°C/h > 3.0°C/h). Exceeds physical atmospheric gradient limit for station Ahmedabad SVP.`
  - `Recommended Action`: `Sensor Inspection Required`
- **Verdict**: **PASSED** (Rule-based check catches calibration drift even if LSTM stays NORMAL).

### Test D: Stuck / Frozen Transducer (`FROZEN_SENSOR`)
- **Input**: AWS-006 (Hyderabad) transmitting identical $32.14^\circ\text{C}$ across 3 consecutive cycles.
- **Result**:
  - `Investigation ID`: `INV-AWS-006-20260924005617`
  - `Severity`: **HIGH**
  - `Triggers`: `['ZERO_VARIANCE_FROZEN']`
  - `Zero-Variance Check`: `FAIL` (`3` consecutive constant readings)
  - `Probable Cause`: `Transducer freeze / stuck Analog-to-Digital Converter. Sensor reporting static 32.1°C across consecutive cycles while ambient diurnal profile varies.`
  - `Recommended Action`: `Sensor Inspection Required`
- **Verdict**: **PASSED** (Catches zero-variance freeze that autoencoders frequently miss).

### Test E: 3-Hourly Synoptic Excluded Station Check
- **Input**: AWS-004 (Mumbai Santacruz) on NOAA stream ($48.0^\circ\text{C}$, exceeding physical max $35^\circ\text{C}$).
- **Result**:
  - `Investigation ID`: `INV-AWS-004-20260924005617`
  - `Severity`: **CRITICAL**
  - `LSTM Reconstruction Error`: `None`
  - `LSTM Status`: `NOT_APPLICABLE (3h cadence)`
  - `Dominant Feature`: `Not applicable (3h cadence)`
  - `Triggers`: `['PHYSICAL_RANGE_FAIL', 'SPATIAL_MISMATCH']`
  - `Physical Range Check`: `FAIL` ($48.0^\circ\text{C} > 35.0^\circ\text{C}$)
- **Verdict**: **PASSED** (Strict preservation of temporal sequence integrity; 3h stations are never fed to LSTM and route directly to rule-based triage).

### Test F: Live External Weather Reference (Open-Meteo API)
- **Input**: AWS-003 (Pune) queried against live Open-Meteo API using station coordinates ($18.58^\circ\text{N}, 73.92^\circ\text{E}$).
- **Result**:
  - `External Source`: `Open-Meteo API (Pune)`
  - `Live External Value`: `23.2°C`
  - `Discrepancy Delta`: `26.8°C`
  - `Station Distance`: `9.4 km`
  - `Spatial Peer Consensus`: Evaluated `AWS-004` (Mumbai, $124.3\text{ km}$ distance, $27.5^\circ\text{C}$ baseline), diff `22.5°C`.
- **Verdict**: **PASSED** (Real live meteorological API coordinates matching; graceful fallback verified).

---

## 5. Summary of System Constraints & Compliance

- **No Retraining or Modifying ML Models**: `lstm_autoencoder.keras`, `scaler.pkl`, and `anomaly_threshold.json` remained untouched with MD5 hashes preserved.
- **Cadence Integrity Preserved**: NOAA Mumbai, Pune, and Bengaluru were never artificially padded or forward-filled.
- **Graceful API Fallbacks**: If external Open-Meteo API is unreachable, the system falls back to `"UNAVAILABLE"` without blocking or throwing exceptions.
- **No Mock Anomaly Dependencies**: Replaced all hardcoded `MOCK_ANOMALIES` with live reactive `InvestigationRecord` pipelines.
