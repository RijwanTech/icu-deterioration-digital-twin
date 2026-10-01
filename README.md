# ICU DETERIORATION DIGITAL TWIN
### AI-Based Early Prediction and Monitoring of ICU Patient Deterioration

> **Academic & Research Prototype Notice:**  
> This application is an academic research demonstration prototype designed to evaluate how physiological Digital Twins and Machine Learning models estimate acute deterioration probability. This software does **NOT** provide medical diagnosis, clinical treatment plans, medication orders, or autonomous life-support interventions.  
> **"AI-generated risk estimate — for research/demo purposes only."**

---

## 1. Problem Statement
Intensive Care Unit (ICU) patients experience rapid, non-linear clinical decompensation stemming from respiratory failure, occult hypoperfusion, septic shock, and multi-organ dysfunction syndrome (MODS). Traditional threshold-based bedside monitors often trigger late alarms and high false-positive alert fatigue. An integrated **Physiological Digital Twin** coupled with time-series Machine Learning enables early probabilistic estimation of deterioration risk, allowing researchers and clinicians to observe subtle multivariate drift hours before overt decompensation.

---

## 2. Project Objectives
1. **Virtual Digital Twin Representation:** Maintain an active computational twin state tracking real-time and historical multi-organ physiology (Cardiac, Pulmonary, Hemodynamic/Vascular, and Metabolic).
2. **Predictive Risk Modeling:** Estimate 6–12 hour deterioration probability using Random Forest & Logistic Regression ensembles calibrated on ICU cohorts.
3. **Transparent Explainability:** Expose observable physiological drivers and SHAP-like feature attributions to prevent "black box" obscurity.
4. **Counterfactual What-If Simulation:** Allow researchers to test hypothetical physiological interventions (e.g. oxygen titration, fluid resuscitation, pressure regulation) and observe model risk deltas.
5. **Continuous Telemetry & Software Alerts:** Provide multi-patient command center monitoring with configurable risk tier boundaries.

---

## 3. High-Level Architecture

```
+-------------------------------------------------------------------+
|               ICU Bedside Telemetry / Imported Cohort             |
+---------------------------------+---------------------------------+
                                  |
                                  v
+---------------------------------+---------------------------------+
|                    Data Ingestion & Cleaning                     |
|         (Range verification, Forward-fill, Grouping)              |
+---------------------------------+---------------------------------+
                                  |
                                  v
+---------------------------------+---------------------------------+
|               Physiological Digital Twin Core                     |
|  - Patient Profile (Demographics, Bed, Unit, Admission Dx)        |
|  - Real-Time Vitals (HR, SBP, DBP, MAP, SpO2, RR, Temp)          |
|  - Historical 24h Buffer (Multi-channel time-series)              |
|  - Subsystem Organ Mapping (Cardiac, Pulmonary, Vascular)        |
+---------------------------------+---------------------------------+
                                  |
                                  v
+---------------------------------+---------------------------------+
|                Machine Learning Deterioration Engine              |
|  - Feature Engineering (Shock Index, Rolling Means, Deltas)       |
|  - Random Forest & Logistic Regression Ensemble                   |
|  - Calibrated Probability Score [0.00 – 1.00]                     |
|  - Configurable Categorization (LOW, MEDIUM, HIGH)                |
|  - Feature Attribution & Mathematical Drivers                     |
+---------------------------------+---------------------------------+
                                  |
                                  v
+---------------------------------+---------------------------------+
|               Interactive Clinical Research Console               |
|  - ICU Command Center & Multi-Patient Dashboard                   |
|  - Interactive Organ Twin Inspector (Biometric Node Map)          |
|  - Recharts Multi-Waveform Trend Analysis (6h, 12h, 24h)          |
|  - Chronological Event Timeline & Prototype Software Alerts       |
|  - Counterfactual What-If Scenario Simulator                      |
+-------------------------------------------------------------------+
```

---

## 4. Technology Stack

- **Frontend Application:**
  - React 19 (Functional components, hooks)
  - Vite (Fast HMR & build pipeline)
  - Tailwind CSS (Domain-native healthcare styling, accessible contrast)
  - Recharts (Time-series waveforms, Area risk trajectories)
  - Lucide React (Clinical iconography)
- **Backend API (FastAPI Architecture):**
  - Python 3.10+ / FastAPI / Uvicorn
  - Pydantic v2 (Request/response schemas)
  - SQLAlchemy (ORM data modeling)
  - SQLite (Local MVP database)
- **Machine Learning & Analytics:**
  - Scikit-learn (Random Forest, Logistic Regression, Pipeline)
  - Pandas & NumPy (Data wrangling & rolling window time-series features)
  - Joblib (Model artifact persistence)

---

## 5. Dataset & Feature Engineering

### Cohort Data
No patient cohort or sample records are bundled with this project. The ML training pipeline requires a user-provided, appropriately authorized cohort CSV with patient identifiers, timestamps, demographic fields, and vital-sign measurements.

### Engineered Variables
1. **Core Biometrics:** Age, Heart Rate (HR), Systolic BP (SBP), Diastolic BP (DBP), SpO2, Respiratory Rate (RR), Temperature.
2. **Hemodynamic Indices:**
   - $\text{MAP} = \frac{2 \times \text{DBP} + \text{SBP}}{3}$
   - $\text{Shock Index} = \frac{\text{HR}}{\text{SBP}}$
   - $\text{Pulse Pressure} = \text{SBP} - \text{DBP}$
3. **Temporal Trend Drivers:**
   - $\Delta \text{HR}_{6h}, \Delta \text{SpO2}_{6h}, \Delta \text{RR}_{6h}$
   - Rolling 6-hour moving averages ($\mu_{\text{HR}}, \mu_{\text{SpO2}}, \mu_{\text{RR}}$)

---

## 6. Machine Learning Methodology

### Target Construction
The deterioration label is defined as an acute cardiopulmonary compromise within a 6–12 hour forward window:
$$\text{Target} = 1 \iff (\text{SBP} < 90 \lor \text{SpO2} < 90\% \lor \text{RR} > 28 \lor \text{Shock Index} > 1.0)$$

### Leakage Prevention
Patient records are partitioned using `GroupShuffleSplit` on `patient_id` so that multiple longitudinal time slices from the same individual never cross train and test sets.

### Configurable Risk Thresholds
- **LOW:** `0.00 – 0.39`
- **MEDIUM:** `0.40 – 0.69`
- **HIGH:** `0.70 – 1.00`
*(Thresholds can be dynamically adjusted in real-time via the Risk Model Calibration modal).*

---

## 7. Database Design (SQLite / SQLAlchemy)

| Table | Primary Key | Key Columns | Description |
| :--- | :--- | :--- | :--- |
| **`patients`** | `patient_id` | `age, gender, bed_number, unit, admission_diagnosis, icu_admission_time` | Patient demographic and admission metadata |
| **`vital_signs`** | `record_id` | `patient_id, timestamp, heart_rate, systolic_bp, diastolic_bp, spo2, respiratory_rate, temperature` | Timestamped longitudinal physiological telemetry |
| **`predictions`** | `prediction_id` | `patient_id, timestamp, risk_score, risk_level, model_version` | Model evaluation logs |
| **`events`** | `event_id` | `patient_id, timestamp, event_type, description` | Chronological clinical events and alert triggers |
| **`users`** | `user_id` | `username, password_hash, role` | Research portal authorization credentials |

---

## 8. REST API Documentation

- `POST /api/auth/login` — Authenticate research credentials.
- `GET /api/patients` — List all active ICU patients with current vital state and risk.
- `GET /api/patients/{id}` — Fetch complete patient digital twin state.
- `GET /api/patients/{id}/vitals` — Retrieve 24h historical telemetry points.
- `GET /api/patients/{id}/trends` — Fetch time-series waveform data and derived delta summary.
- `GET /api/patients/{id}/timeline` — Retrieve chronological clinical events.
- `GET /api/patients/{id}/export/csv` — Export individual patient historical vitals & telemetry as CSV.
- `GET /api/patients/export/csv` — Export complete multi-patient cohort summary as CSV.
- `GET /api/patients/{id}/prediction` — Fetch latest ML risk estimate and SHAP-like factors.
- `POST /api/predict` — Ad-hoc ML inference for arbitrary physiological parameters.
- `POST /api/simulate` — Execute counterfactual What-If simulation and compute parameter deltas.
- `GET /api/dashboard/summary` — Overview counts of total, low, medium, and high-risk patients.

---

## 9. Installation & Run Instructions

### A. Web Application (React + Vite)
```bash
# Install dependencies
npm install

# Start development server (Port 3000)
npm run dev
```

### B. Python Backend (Optional Local Standalone FastAPI Server)
```bash
# Navigate to project root
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Run FastAPI with Uvicorn
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### C. ML Model Training & Evaluation Pipeline
```bash
# Train models and save model artifact
python -m ml.train

# Evaluate accuracy, ROC-AUC, and confusion matrix
python -m ml.evaluate
```

---

---

## 10. Project Limitations
1. **Clinical Validation:** The model has not been validated across randomized multi-center clinical trials.
2. **Missing Sensor Artifacts:** Does not simulate hardware lead detachment artifacts or motion noise.
3. **No Direct Drug Infusion Feedback:** What-if simulation models mathematical probabilities under modified state assumptions without pharmacokinetics/pharmacodynamics (PK/PD) curves.

---

## 11. Future Scope
- **Advanced Deep Learning:** Integration of Recurrent Neural Networks (LSTM/GRU) and Temporal Transformers for multi-day continuous trajectory modeling.
- **HL7 / FHIR Interoperability:** Native integration with hospital electronic health record (EHR) feeds.
- **Biophysical Organ Simulation:** Integration with OpenCOR / CellML for cellular-level cardiac electrophysiology modeling.
- **Federated Privacy-Preserving Learning:** Multi-hospital model training without centralizing patient telemetry.
