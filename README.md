# AquaSense – Intelligent Predictive Filter Health Monitoring System

> **Predict. Monitor. Maintain.**  
> Innovation Challenge Submission for **atomQUEST 2026** by **Atomberg Technologies**  
> **Exploration Area:** *Prognostics of filter failure using data analytics*

---

## 1. Project Background & Problem Statement

Atomberg's cutting-edge water purifiers combine multiple filtration technologies (RO, UF, UV, Sediment, Carbon, and Mineraliser stages) to deliver safe drinking water. In conventional consumer purifiers, filter replacements are dictated by fixed time intervals (e.g., replace every 6 or 12 months) or simple volume counters. 

However, **actual filter degradation varies drastically** based on:
1. **Raw Water Quality Fluctuations:** High input TDS (e.g., 800+ ppm) or seasonal silt/turbidity rapidly fouls pre-filters and membranes.
2. **Usage Intensity:** High-consumption households choke cartridges months before standard calendar schedules.
3. **Hydraulic Dynamics:** Scale deposition decreases permeate flux and spikes upstream differential pressure ($\Delta P$), stressing booster pumps.

A rigid replacement schedule causes either **premature replacement** (unnecessary consumer expense and environmental waste) or **delayed replacement** (breakthrough of dissolved solutes, bacterial colonization, or pump cavitation).

---

## 2. Proposed Solution: AquaSense

**AquaSense** is an industrial-grade IoT predictive maintenance dashboard that transitions water purification from reactive servicing to **condition-based failure prognostics**.

AquaSense delivers an end-to-end telemetry-to-insight pipeline:
- **Simulated Multi-Channel Telemetry:** Monitors input TDS, permeate TDS, optical turbidity, flow rate, differential pressure, cumulative water, filter operating age, and daily draw volume.
- **Explainable Health Calculation Engine:** Evaluates composite filter health ($0–100$) using a transparent, weighted multi-factor degradation model.
- **Prognostics & Remaining Useful Life (RUL):** Computes degradation velocity via statistical regression on telemetry history, projecting days remaining before crossing the critical maintenance threshold.
- **Multi-Stage Filtration Pipeline:** Granular health visualization across 7 stages (Pre-filter, Sediment, Carbon Block, RO Membrane, UF, UV, and Alkaliser).
- **Proactive Maintenance Center:** Auto-generates condition-specific work orders and maintenance checklists derived from physical anomalies.
- **Audit-Ready Reporting:** Instant CSV telemetry export and formal engineering PDF report generation.
- **Competition Demo Mode:** One-click evaluation scenarios demonstrating Healthy, Degrading, and Abnormal states.

---

## 3. Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS (Clean industrial aesthetic, deep navy headings, teal/cyan accents, slate background)
- **Visualizations:** Recharts (Dynamic line charts, area degradation profiles, histogram distributions)
- **Icons:** Lucide React
- **Document Generation:** jsPDF & jspdf-autotable (Client-side vector PDF generation)
- **Bundler:** Vite 5

### Backend & Analytics
- **API Framework:** Python 3.14 / FastAPI
- **Server:** Uvicorn (ASGI)
- **Data Analytics:** NumPy, Pandas, Scikit-learn (LinearRegression degradation fit)
- **Data Persistence:** SQLite (`aquasense.db`) with automatic schema initialization and 30-day realistic sample history.
- **Zero-Setup Parity:** A dual-mode communication layer (`api.ts` + `clientEngine.ts`) ensures the dashboard functions seamlessly either connected to the FastAPI backend or standalone.

---

## 4. System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AquaSense Architecture                         │
└────────────────────────────────────────────────────────────────────────┘

    [ Simulated Sensor Array ]
    ├── Inlet TDS Conductivity (ppm)
    ├── Permeate TDS Sensor (ppm)
    ├── Optical Turbidity Transducer (NTU)
    ├── Permeate Turbine Flow Sensor (L/min)
    ├── Differential Pressure Cell (bar)
    └── Cumulative Volume Integrator (L)
                   │
                   ▼
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│       FastAPI Backend Engine         │     │     Client-Side Prediction Engine    │
│  (backend/main.py, port 8000)        │     │  (src/services/clientEngine.ts)      │
│  ├── SQLite Persistence (database.py)│◄───►│  * High-availability fallback engine│
│  ├── Health Calculation Engine       │     │  * Identical mathematical models     │
│  ├── Failure Prognostics (scikit)    │     └──────────────────────────────────────┘
│  └── Physics Simulation Engine       │
└──────────────────┬───────────────────┘
                   │  REST API / CORS
                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    React + TypeScript Dashboard                        │
│ ├── 1. Overview Dashboard (KPIs, Gauges, Rejection, Active Alerts)    │
│ ├── 2. Live Monitoring (8 Sensor Cards, Sliders, Manual Override)      │
│ ├── 3. Filter Health (Transparent Decomposition, 7-Stage Pipeline)    │
│ ├── 4. Predictive Analytics (RUL Trajectory, Threshold Crossings)      │
│ ├── 5. Maintenance Center (Work Order Checklist, Alert Dispatch)       │
│ ├── 6. Analytics & Reports (Export CSV & Download Printable PDF)       │
│ └── 7. System Settings (Calibrate Weights, Baselines, Reseed DB)      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Mathematical Degradation & Prognostics Methodology

### 5.1 Transparent Filter Health Calculation ($0–100$)

Filter Health is computed transparently:
$$\text{Filter Health} = \max\left(0, 100 - \sum \text{Degradation Penalties}\right)$$

Where the degradation score represents the sum of 6 normalized contributions:
$$\text{Degradation Score} = C_{\text{age}} + C_{\text{water}} + C_{\text{flow}} + C_{\Delta P} + C_{\text{TDS}} + C_{\text{turbidity}}$$

1. **Operating Age Contribution ($W = 20\%$):**
   $$C_{\text{age}} = \min\left(\frac{\text{Age}_{\text{days}}}{\text{Rated Days (365)}}, 1.5\right) \times 100 \times 0.20$$
2. **Cumulative Water Consumption ($W = 25\%$):**
   $$C_{\text{water}} = \min\left(\frac{\text{Volume}_{\text{litres}}}{\text{Rated Capacity (6000)}}, 1.5\right) \times 100 \times 0.25$$
3. **Flow Rate Restriction ($W = 25\%$):**
   $$\text{Reduction Ratio} = \max\left(0, \frac{\text{Flow}_{\text{baseline}} - \text{Flow}_{\text{current}}}{\text{Flow}_{\text{baseline}}}\right)$$
   $$C_{\text{flow}} = (\text{Reduction Ratio})^{1.1} \times 100 \times 0.25$$
4. **Differential Pressure Drop ($W = 15\%$):**
   $$C_{\Delta P} = \min\left(\frac{\max(0, \Delta P - \Delta P_{\text{baseline}})}{1.5}, 1.5\right) \times 100 \times 0.15$$
5. **Solute Breakthrough / TDS Proxy ($W = 10\%$):**
   $$\text{Rejection Efficiency} = \frac{\text{TDS}_{\text{in}} - \text{TDS}_{\text{out}}}{\text{TDS}_{\text{in}}}$$
   $$C_{\text{TDS}} = f(\text{Rejection Drop}, \text{TDS}_{\text{out}}) \times 100 \times 0.10$$
6. **Turbidity Influx ($W = 5\%$):**
   $$C_{\text{turbidity}} = \min\left(\frac{\text{Turbidity}}{1.0}, 2.0\right) \times 100 \times 0.05$$

**Operational Health Bands:**
- **$75 – 100$:** Optimal / Healthy
- **$45 – 74$:** Attention Required (Schedule filter inspection)
- **$0 – 44$:** Critical (Immediate replacement recommended)

### 5.2 Failure Prognostics & Remaining Useful Life (RUL)

- **Degradation Velocity ($m$):** Computed using Ordinary Least Squares linear regression ($\hat{y} = mx + c$) over the trailing telemetry window.
- **Remaining Useful Life (Days):**
  $$\text{RUL} = \left\lceil \frac{\text{Current Health} - \text{Maintenance Threshold (40)}}{m} \right\rceil$$
- **Confidence Metric:** Evaluated as *High (Historical Fit)* when $>5$ historical readings exist with consistent slope; *Moderate (Trend Heuristic)* otherwise.
- **Root-Cause Anomaly Engine:** Auto-identifies dominant failure drivers (e.g. membrane fouling, calcite bed exhaustion, sediment cake resistance).

---

## 6. How to Run Locally

### Prerequisites
- **Node.js** (v18+ recommended, verified on v24)
- **Python** (3.10+ recommended, verified on 3.14)
- **npm** (included with Node.js)

### Option A: Complete Full-Stack Run (Recommended)

1. **Clone/Navigate to the directory:**
   ```bash
   cd c:\Users\KIIT\Desktop\Atomquest
   ```

2. **Start the backend server:**
   ```bash
   # In terminal 1:
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *FastAPI Swagger interactive docs will be available at:* `http://127.0.0.1:8000/docs`

3. **Start the frontend dashboard:**
   ```bash
   # In terminal 2:
   cd frontend
   npm run dev
   ```
   *Open browser at:* `http://localhost:5173`

*(On Windows, you can alternatively double-click `run_all.bat` to launch both servers simultaneously).*

### Option B: Zero-Config Standalone Frontend Run
AquaSense includes a built-in client prediction engine with full mathematical parity. If Python is unavailable:
```bash
cd frontend
npm run dev
```
The application will detect backend absence and seamlessly execute all physics, telemetry calculations, and PDF reporting in the browser.

---

## 7. Demonstration Guide (atomQUEST Competition Evaluation)

Use the top **Scenarios** bar to demonstrate the 3 required evaluation profiles:

### Scenario 1: Healthy Purifier
- **Characteristics:** Low age (18 days), low usage (450 L), normal flow ($1.92\text{ L/min}$), normal pressure ($0.32\text{ bar}$), low output TDS ($22\text{ ppm}$).
- **Observed Outputs:** Health Score **$\sim 95$ (Healthy)**, Failure Risk: **Low Risk**, RUL: **$\sim 270+$ Days**, Advisory: *"Continue normal operation and periodic monitoring."*

### Scenario 2: Filter Degradation
- **Characteristics:** Moderate age (210 days), cumulative water ($4,850\text{ L}$), reduced flow ($1.18\text{ L/min}$), elevated pressure drop ($0.88\text{ bar}$).
- **Observed Outputs:** Health Score drops to **$\sim 47$ (Attention Required)**, Failure Risk: **Moderate Risk**, RUL: **$\sim 27$ Days**, Diagnostics: *"Flow rate declined by 41% compared to baseline. Possible filter restriction detected."*

### Scenario 3: Abnormal Performance
- **Characteristics:** Flow choked to $0.58\text{ L/min}$, pressure drop spikes to $1.52\text{ bar}$, turbidity spikes to $2.95\text{ NTU}$, output TDS exceeds limit at $142\text{ ppm}$.
- **Observed Outputs:** Health Score drops to **$\sim 12$ (Critical)**, Failure Risk: **High Risk**, Actionable alerts generated across multiple stages, immediate replacement ticket prompt.

---

## 8. Safety, Ethical & Fail-Safe Considerations

AquaSense embeds safety considerations in accordance with Section 13:
1. **Passive Supervisory Role:** Operates strictly as a diagnostic platform; exerts zero direct electrical control over high-voltage UV ballasts, solenoid valves, or booster pumps.
2. **Sensor Validity Bounds:** Checks all telemetry for physical bounds. Out-of-bounds readings (e.g. negative flow, impossible TDS ratio) trigger a visible **Sensor Warning** badge rather than misleading high-confidence predictions.
3. **Potability Disclaimer:** Emphasizes that TDS and turbidity measurements alone do not certify biological sterility or absence of organic micropollutants.
4. **Transparent Assumptions:** Weights and thresholds are explicitly labeled as prototype configuration assumptions requiring factory calibration against Atomberg test rigs.

---

## 9. Future Development Plan (Round 3 Hardware Integration)

The software architecture is decoupled from the simulation source, allowing plug-and-play hardware integration:

```
[ Physical Water Purifier ]
  ├── ESP32-WROOM-32 / ESP32-S3 Microcontroller
  ├── DFRobot Gravity Analog TDS Meter
  ├── Turbidity Sensor Module (TS-300B)
  ├── YF-S201 Hall Effect Water Flow Sensor
  └── MPX5050DP / Ceramic Pressure Transducer
             │
             ├── [ MQTT / WebSockets ] ──► [ AquaSense IoT Ingestion Gateway ]
             └── [ Secure HTTPS REST ] ──► [ POST /api/readings ]
```

- **ESP32 Edge Gateway:** Direct telemetry transmission over Wi-Fi/MQTT.
- **Machine Learning RUL Model:** Replace linear trend heuristics with an XGBoost or LSTM recurrent neural network trained on accelerated life testing (ALT) failure datasets.
- **Cloud Fleet Telemetry:** Centralized dashboard for Atomberg service networks managing nationwide purifier fleets with automated technician dispatch.

---

**AquaSense — Predict. Monitor. Maintain.**  
*atomQUEST 2026, Atomberg Technologies.*

