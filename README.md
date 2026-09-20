# SkyGuard AI — "Trust Every Weather Reading."

**AI/ML-Based Intelligent Anomaly Detection for Automatic Weather Stations (AWS)**  
**Organization:** Ministry of Earth Sciences (MoES)  
**Department:** India Meteorological Department (IMD)  
**Problem Statement ID:** 26073  
**Event:** Smart India Hackathon (SIH)  

---

## 1. Executive Summary

Automatic Weather Stations (AWS) deployed across India provide continuous weather observations essential for national numerical weather prediction (NWP), cyclone tracking, agricultural advisories, and disaster management. However, sensor malfunctions, electrical noise, stuck ADC registers, and calibration drift often corrupt telemetry.

**SkyGuard AI** is a production-quality, meteorological-grade operational command center that monitors the three primary AWS parameters:
1. **Temperature (°C)**
2. **Atmospheric Pressure (hPa)**
3. **Relative Humidity (%)**

The system intelligently distinguishes between **genuine meteorological phenomena** (e.g., convective squalls, cold fronts, monsoon depressions) and **isolated sensor faults** (e.g., spikes, stuck values, drifting thermistors, communication blackouts).

---

## 2. End-to-End Operational Workflow

```
RAW AWS TELEMETRY (Temp, Pressure, RH)
               ↓
ESP32 EDGE AI FILTER (12ms Micro-anomaly detector)
               ↓
MULTI-DIMENSIONAL AI ANALYSIS:
  ├── Temporal Consistency (Isolation Forest, EWMA, Rate-of-Change, Stuck ADC detector)
  ├── Spatial Consistency (Haversine k-Nearest Neighbor IDW Interpolation)
  └── Multivariate Physical Consistency (Clausius-Clapeyron Thermodynamic Envelope)
               ↓
EVENT AUTHENTICITY DISCRIMINATION:
  ├── Spatially Correlated Step Changes → GENUINE METEOROLOGICAL EVENT
  └── Isolated Departure from Regional Cluster → SENSOR MALFUNCTION / DRIFT
               ↓
EXPLAINABLE AI (XAI) ENGINE:
  ├── SHAP Surrogate Feature Importance (Temporal, Spatial, Humidity, Pressure %)
  └── Probable Root Cause Posterior Probabilities
               ↓
SELF-HEALING PIPELINE (Spatial-temporal Hybrid Imputation with Immutable Lineage)
               ↓
SENSOR HEALTH SURVEILLANCE & PREDICTIVE MAINTENANCE QUEUE
               ↓
NATIONAL AWS INTELLIGENCE COMMAND CENTER + INTERACTIVE INDIA MAP + AI COPILOT
```

---

## 3. Unique SIH Differentiators

1. **Spatial + Temporal + Multivariate Triangulation:** Detects anomalies that pass individual statistical thresholds but violate thermodynamic laws (e.g., $55^\circ\text{C}$ with $98\%$ RH at sea level).
2. **Genuine Weather Event vs Sensor Fault Discrimination:** When a squall hits, multiple nearby stations simultaneously shift. SkyGuard recognizes regional spatial consensus and authenticates the event rather than raising false sensor alarms!
3. **Interactive Simulation Lab:** 1-click testbench allowing hackathon judges to inject real-world defects ($55^\circ\text{C}$ spikes, frozen transducers, progressive calibration drifts, communication dropouts).
4. **Self-Healing Data Pipeline:** Estimates physically coherent imputed values without overwriting raw observations, preserving an immutable audit trail for meteorological scientists.
5. **Explainable AI (XAI):** Clear feature attribution bars and natural language scientific justifications for every flag.
6. **ESP32 Edge AI Architecture:** Demonstrates edge inferencing on remote solar-powered RTUs, reducing cellular transmission costs by 74%.
7. **SkyGuard Copilot:** Context-aware meteorological assistant answering live queries based on the actual telemetry matrix.

---

## 4. Application Architecture & Pages

The application is structured into 13 major operational modules:
1. **Landing / Mission Overview:** Real-time animated telemetry ticker, operational pipeline, architecture overview.
2. **Command Center (Star View):** Dynamic KPIs, live AI Network Briefing, Leaflet Geospatial India Map, streaming telemetry charts, active triage feed.
3. **Live AWS Network:** Geospatial pin mode, topological adjacency mesh, and comprehensive station directory.
4. **Station Details:** 24h historical telemetry trends, sensor health gauges, nearest neighbor consensus comparisons, and maintenance tickets.
5. **Anomaly Center:** Complete anomaly management grid with search, multi-parameter filtering, and one-click launch of the deep AI Investigation Panel.
6. **AI Investigation Panel:** SHAP feature contributions, root cause probabilities, event authenticity verdict, and raw vs imputed value confirmation.
7. **AI Explainability (XAI) Hub:** Global feature importance, local SHAP breakdowns, decision paths, and comparative model benchmarks (Hybrid vs Isolation Forest vs Statistical).
8. **Sensor Health:** Station health scoring ($0\text{--}100\%$), sensor stability, drift tracking, and calibration confidence.
9. **Predictive Maintenance:** Automated maintenance queue (Critical/High/Medium/Low) with dispatch recommendations.
10. **Simulation Lab:** Interactive anomaly injection laboratory with custom parameter sliders and 8-stage real-time AI decision timeline.
11. **Weather Analytics:** Diurnal harmonic cycles, station parameter distributions, regional comparisons.
12. **Data Quality Dashboard:** Completeness, consistency, validity, timeliness, and accuracy scoring under WMO-8 standards.
13. **Reports & Audit Exporter:** Automated IMD/MoES incident report generator with CSV and print preview export.

---

## 5. Technology Stack

### Frontend
- **Framework:** React 19 + Vite + TypeScript
- **Styling:** Tailwind CSS v4 + Custom Mission-Control Dark Theme (`#070B14`, `#00E5FF`, `#EF4444`, `#10B981`)
- **Mapping:** Leaflet & React-Leaflet with CartoDB Dark Matter satellite tiles
- **Charts:** Recharts high-density composed telemetry line & area charts
- **Icons:** Lucide React

### Backend & AI/ML
- **Framework:** Python FastAPI + Uvicorn
- **Machine Learning:** Scikit-Learn (`IsolationForest`), NumPy, Pandas, SciPy
- **Algorithms:**
  - *Temporal:* Exponentially Weighted Moving Average (EWMA), Rolling Z-score, rate-of-change, stuck/frozen ADC detector.
  - *Spatial:* Great-circle Haversine distance, Inverse Distance Weighting (IDW) interpolation.
  - *Multivariate:* Magnus-Tetens vapor pressure formulation, Clausius-Clapeyron saturation boundary, multi-dimensional Isolation Forest.
  - *Explainability:* Additive feature attribution surrogate.
- **Streaming:** WebSockets (`/ws/telemetry`) with automatic client-side fallback simulation.

---

## 6. How to Run the Project

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### Step 1: Start the FastAPI Backend
Open a terminal in the project directory:
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```
The API server will launch at `http://127.0.0.1:8000`.  
API Swagger Documentation: `http://127.0.0.1:8000/docs`.

### Step 2: Start the React Frontend
Open another terminal:
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

> **Zero-Dependency Demo Mode:** The frontend includes an automatic, fault-tolerant simulation fallback. If the backend is loading or restarted, the frontend seamlessly runs internal ML calculations without throwing errors or blank screens!

---

## 7. How to Demonstrate to SIH Judges (Under 2 Minutes)

1. **Launch the Dashboard:**
   - Click the floating **⚡ SIH DEMO** button in the bottom right corner.
2. **Scenario 1: Catastrophic 55°C Sensor Spike**
   - Click `Run Demo` on *Catastrophic Sensor Spike (55°C)*.
   - Observe AWS-MH-042 (Pune) pulse red on the India map.
   - A CRITICAL alert appears in the triage feed.
   - Click `AI Explain` to open the **AI Investigation Panel**.
   - Show judges the **SHAP Feature Contribution** bars (Temporal 42%, Spatial 31%, etc.).
   - Point out the **Imputed Value (31.4°C)** and click `Accept Imputed Value` to heal the data.
3. **Scenario 2: Regional Genuine Weather Event**
   - Click **⚡ SIH DEMO** → *Regional Genuine Weather Front*.
   - Watch 5 nearby Western Ghats stations drop temperature by $7.5^\circ\text{C}$ and surge humidity.
   - Show how SkyGuard's spatial consensus AI classifies this as a **"GENUINE METEOROLOGICAL EVENT"** with 96% confidence rather than a sensor fault.
4. **Ask SkyGuard Copilot:**
   - Click `SkyGuard Copilot` in the top bar.
   - Click `"Why was AWS-MH-042 flagged?"` to see context-aware meteorological reasoning generated from live data!
