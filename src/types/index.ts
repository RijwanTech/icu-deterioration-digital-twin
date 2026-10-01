export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface VitalSign {
  record_id?: string;
  patient_id: string;
  timestamp: string; // ISO string or format 'YYYY-MM-DD HH:mm'
  heart_rate: number; // bpm
  systolic_bp: number; // mmHg
  diastolic_bp: number; // mmHg
  spo2: number; // %
  respiratory_rate: number; // breaths/min
  temperature: number; // Celsius
  map?: number; // Mean Arterial Pressure (calculated: (2*DBP + SBP)/3)
}

export interface Patient {
  patient_id: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bed_number: string;
  unit: string; // e.g. "Medical ICU (MICU-B)", "Surgical ICU (SICU-2)"
  admission_diagnosis: string;
  icu_admission_time: string;
  current_state: VitalSign;
  risk_score: number; // 0.00 to 1.00
  risk_level: RiskLevel;
  short_explanation?: string;
  last_updated: string;
}

export interface PredictionResult {
  patient_id: string;
  risk_score: number; // e.g. 0.78 (78%)
  risk_level: RiskLevel;
  short_explanation?: string;
  model_version: string;
  model_name: string;
  prediction_timestamp: string;
  confidence_interval?: [number, number];
  contributing_factors: ContributingFactor[];
  clinical_disclaimer: string;
}

export interface NewPatientInput {
  patient_id?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bed_number: string;
  unit: string;
  admission_diagnosis: string;
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  spo2: number;
  respiratory_rate: number;
  temperature: number;
}

export interface ContributingFactor {
  feature: string;
  label: string;
  impact_score: number; // -1.0 to 1.0 or feature importance weight
  direction: 'increasing_risk' | 'decreasing_risk' | 'neutral';
  description: string;
  observed_value: string;
  baseline_reference: string;
}

export interface TimelineEvent {
  event_id: string;
  patient_id: string;
  timestamp: string;
  event_type: 'vital_check' | 'risk_change' | 'intervention' | 'lab_result' | 'clinical_note';
  title: string;
  description: string;
  severity?: 'normal' | 'warning' | 'critical';
  details?: Record<string, string | number>;
}

export interface TrendDataPoint {
  timestamp: string;
  display_time: string;
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  map: number;
  spo2: number;
  respiratory_rate: number;
  temperature: number;
  risk_score?: number;
}

export interface TrendAnalysisSummary {
  time_range_hours: number;
  heart_rate_trend: 'Increasing' | 'Decreasing' | 'Stable';
  heart_rate_change: number;
  spo2_trend: 'Increasing' | 'Decreasing' | 'Stable';
  spo2_change: number;
  respiratory_rate_trend: 'Increasing' | 'Decreasing' | 'Stable';
  respiratory_rate_change: number;
  blood_pressure_trend: 'Increasing' | 'Decreasing' | 'Stable';
  temperature_trend: 'Increasing' | 'Decreasing' | 'Stable';
  stability_index: string; // e.g., "Volatile", "Guarded", "Stable"
}

export interface SimulationInput {
  patient_id: string;
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  spo2: number;
  respiratory_rate: number;
  temperature: number;
  target_notes?: string;
}

export interface SimulationResult {
  patient_id: string;
  current_state: {
    vitals: VitalSign;
    risk_score: number;
    risk_level: RiskLevel;
  };
  simulated_state: {
    vitals: Partial<VitalSign>;
    risk_score: number;
    risk_level: RiskLevel;
  };
  risk_delta: number; // e.g. -0.27
  risk_delta_percentage: number;
  model_version: string;
  simulation_disclaimer: string;
  contributing_factors_delta: {
    factor: string;
    before_impact: string;
    after_impact: string;
  }[];
}

export interface SystemAlert {
  alert_id: string;
  patient_id: string;
  patient_bed: string;
  risk_level: RiskLevel;
  risk_score: number;
  timestamp: string;
  message: string;
  contributing_factor: string;
  acknowledged: boolean;
}

export interface DashboardSummary {
  total_patients: number;
  low_risk_count: number;
  medium_risk_count: number;
  high_risk_count: number;
  active_alerts_count: number;
  last_model_run: string;
  model_status: 'ONLINE' | 'ACTIVE';
}

export interface UserProfile {
  user_id: string;
  username: string;
  name: string;
  role: string;
  token: string;
}

export interface RiskThresholdConfig {
  low_max: number; // default 0.39
  medium_max: number; // default 0.69
}
