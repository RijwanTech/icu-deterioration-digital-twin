import { 
  Patient, 
  VitalSign, 
  PredictionResult, 
  TimelineEvent, 
  SimulationInput, 
  SimulationResult, 
  SystemAlert, 
  DashboardSummary,
  RiskThresholdConfig,
  UserProfile,
  TrendDataPoint,
  TrendAnalysisSummary,
  NewPatientInput
} from '../types';
import { 
  getAllPatients, 
  getPatientById, 
  getPatientVitalsHistory, 
  getPatientTimeline, 
  getSystemAlerts, 
  acknowledgeAlert as ackAlert,
  getTrendDataPoints,
  computeTrendSummary,
  updatePatientVitals,
  createNewPatient,
  applySimulatedVitals
} from './mockData';
import { calculateDeteriorationRisk, DEFAULT_THRESHOLDS, MODEL_META } from './mlEngine';

// Current active configuration for thresholds
let currentThresholds: RiskThresholdConfig = { ...DEFAULT_THRESHOLDS };

export function getThresholdConfig(): RiskThresholdConfig {
  return { ...currentThresholds };
}

export function updateThresholdConfig(config: RiskThresholdConfig): void {
  currentThresholds = { ...config };
}

// Simulated network latency for realistic UX feel
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const api = {
  // Auth
  async login(username: string, password: string): Promise<UserProfile> {
    await delay(350);
    if (!username || !password) {
      throw new Error('Please enter both username and password.');
    }
    return {
      user_id: username,
      username,
      name: username.includes('@') ? username.split('@')[0] : username,
      role: 'ICU Clinician',
      token: ''
    };
  },

  async register(fullName: string, email: string, password: string, role: string, institution: string): Promise<UserProfile> {
    await delay(450);
    if (!fullName || !email || !password) {
      throw new Error('Please fill in all mandatory registration fields.');
    }
    return {
      user_id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      username: email,
      name: fullName,
      role: role || 'ICU Clinician',
      token: ''
    };
  },

  // Patients
  async getPatients(): Promise<Patient[]> {
    await delay(200);
    const patients = getAllPatients();
    // Re-evaluate with current thresholds
    return patients.map(p => {
      const pred = calculateDeteriorationRisk(p.current_state, p.age, getPatientVitalsHistory(p.patient_id), currentThresholds);
      return {
        ...p,
        risk_score: pred.risk_score,
        risk_level: pred.risk_level
      };
    });
  },

  async getPatient(patientId: string): Promise<Patient> {
    await delay(200);
    const patient = getPatientById(patientId);
    if (!patient) {
      throw new Error(`Patient record with ID ${patientId} not found.`);
    }
    const history = getPatientVitalsHistory(patientId);
    const pred = calculateDeteriorationRisk(patient.current_state, patient.age, history, currentThresholds);
    return {
      ...patient,
      risk_score: pred.risk_score,
      risk_level: pred.risk_level
    };
  },

  async getPatientVitals(patientId: string): Promise<VitalSign[]> {
    await delay(150);
    return getPatientVitalsHistory(patientId);
  },

  async getPatientTrends(patientId: string, hours: number = 24): Promise<{ points: TrendDataPoint[]; summary: TrendAnalysisSummary }> {
    await delay(250);
    const points = getTrendDataPoints(patientId, hours);
    const summary = computeTrendSummary(patientId, hours);
    return { points, summary };
  },

  async getPatientTimeline(patientId: string): Promise<TimelineEvent[]> {
    await delay(180);
    return getPatientTimeline(patientId);
  },

  // ML Prediction
  async getLatestPrediction(patientId: string): Promise<PredictionResult> {
    await delay(220);
    const patient = getPatientById(patientId);
    if (!patient) {
      throw new Error(`Patient record ${patientId} not found.`);
    }
    const history = getPatientVitalsHistory(patientId);
    return calculateDeteriorationRisk(patient.current_state, patient.age, history, currentThresholds);
  },

  async predictRisk(vital: VitalSign, age: number, historicalVitals?: VitalSign[]): Promise<PredictionResult> {
    await delay(280);
    return calculateDeteriorationRisk(vital, age, historicalVitals || [], currentThresholds);
  },

  // What-If Simulation
  async runSimulation(input: SimulationInput): Promise<SimulationResult> {
    await delay(350);
    const patient = getPatientById(input.patient_id);
    if (!patient) {
      throw new Error(`Patient ${input.patient_id} not found.`);
    }

    const currentHistory = getPatientVitalsHistory(input.patient_id);
    const currentPred = calculateDeteriorationRisk(patient.current_state, patient.age, currentHistory, currentThresholds);

    const simulatedVital: VitalSign = {
      record_id: `sim_${patient.patient_id}`,
      patient_id: patient.patient_id,
      timestamp: new Date().toISOString(),
      heart_rate: input.heart_rate,
      systolic_bp: input.systolic_bp,
      diastolic_bp: input.diastolic_bp,
      spo2: input.spo2,
      respiratory_rate: input.respiratory_rate,
      temperature: input.temperature,
      map: +((2 * input.diastolic_bp + input.systolic_bp) / 3).toFixed(1)
    };

    // Evaluate simulated state against current history
    const simulatedPred = calculateDeteriorationRisk(simulatedVital, patient.age, currentHistory, currentThresholds);

    const risk_delta = +(simulatedPred.risk_score - currentPred.risk_score).toFixed(2);
    const risk_delta_percentage = +(risk_delta * 100).toFixed(0);

    const contributing_factors_delta = [
      {
        factor: 'Heart Rate',
        before_impact: `${patient.current_state.heart_rate} bpm`,
        after_impact: `${input.heart_rate} bpm (${input.heart_rate - patient.current_state.heart_rate >= 0 ? '+' : ''}${input.heart_rate - patient.current_state.heart_rate} bpm)`
      },
      {
        factor: 'Oxygen Saturation (SpO2)',
        before_impact: `${patient.current_state.spo2}%`,
        after_impact: `${input.spo2}% (${input.spo2 - patient.current_state.spo2 >= 0 ? '+' : ''}${input.spo2 - patient.current_state.spo2}%)`
      },
      {
        factor: 'Respiratory Rate',
        before_impact: `${patient.current_state.respiratory_rate} bpm`,
        after_impact: `${input.respiratory_rate} bpm (${input.respiratory_rate - patient.current_state.respiratory_rate >= 0 ? '+' : ''}${input.respiratory_rate - patient.current_state.respiratory_rate} bpm)`
      },
      {
        factor: 'Blood Pressure / MAP',
        before_impact: `${patient.current_state.systolic_bp}/${patient.current_state.diastolic_bp} (MAP ${patient.current_state.map?.toFixed(0)})`,
        after_impact: `${input.systolic_bp}/${input.diastolic_bp} (MAP ${simulatedVital.map?.toFixed(0)})`
      },
      {
        factor: 'Body Temperature',
        before_impact: `${patient.current_state.temperature.toFixed(1)} °C`,
        after_impact: `${input.temperature.toFixed(1)} °C`
      }
    ];

    return {
      patient_id: patient.patient_id,
      current_state: {
        vitals: patient.current_state,
        risk_score: currentPred.risk_score,
        risk_level: currentPred.risk_level
      },
      simulated_state: {
        vitals: simulatedVital,
        risk_score: simulatedPred.risk_score,
        risk_level: simulatedPred.risk_level
      },
      risk_delta,
      risk_delta_percentage,
      model_version: MODEL_META.version,
      simulation_disclaimer: "Simulation represents model output under modified input assumptions and does not represent a clinical prediction or treatment recommendation.",
      contributing_factors_delta
    };
  },

  // Dashboard summary
  async getDashboardSummary(): Promise<DashboardSummary> {
    await delay(150);
    const patients = getAllPatients();
    let low = 0, med = 0, high = 0;

    patients.forEach(p => {
      const pred = calculateDeteriorationRisk(p.current_state, p.age, getPatientVitalsHistory(p.patient_id), currentThresholds);
      if (pred.risk_level === 'HIGH') high++;
      else if (pred.risk_level === 'MEDIUM') med++;
      else low++;
    });

    const alerts = getSystemAlerts().filter(a => !a.acknowledged);

    return {
      total_patients: patients.length,
      low_risk_count: low,
      medium_risk_count: med,
      high_risk_count: high,
      active_alerts_count: alerts.length,
      last_model_run: new Date().toISOString(),
      model_status: 'ACTIVE'
    };
  },

  // Alerts
  async getAlerts(): Promise<SystemAlert[]> {
    await delay(150);
    return getSystemAlerts();
  },

  async acknowledgeAlert(alertId: string): Promise<void> {
    await delay(100);
    ackAlert(alertId);
  },

  // Add New Patient
  async addPatient(input: NewPatientInput): Promise<Patient> {
    await delay(300);
    const newPt = createNewPatient(input);
    return newPt;
  },

  // Apply Simulation Changes Permanently to Patient Digital Twin
  async applySimulationToTwin(patientId: string, simulatedVitals: {
    heart_rate: number;
    systolic_bp: number;
    diastolic_bp: number;
    spo2: number;
    respiratory_rate: number;
    temperature: number;
  }): Promise<Patient> {
    await delay(300);
    const updated = applySimulatedVitals(patientId, simulatedVitals);
    if (!updated) {
      throw new Error(`Patient ${patientId} could not be updated.`);
    }
    return updated;
  },

  // Log a new vital measurement over time
  async logNewVital(patientId: string, newVitals: Partial<VitalSign>): Promise<Patient> {
    await delay(250);
    const updated = updatePatientVitals(patientId, newVitals);
    if (!updated) {
      throw new Error(`Patient ${patientId} not found.`);
    }
    return updated;
  },
};
