import { Patient, VitalSign, TimelineEvent, SystemAlert, TrendDataPoint, TrendAnalysisSummary } from '../types';
import { calculateDeteriorationRisk, DEFAULT_THRESHOLDS } from './mlEngine';

const patients: Patient[] = [];
const histories = new Map<string, VitalSign[]>();
const timelines = new Map<string, TimelineEvent[]>();
const alerts: SystemAlert[] = [];

export function getAllPatients(): Patient[] {
  return [...patients];
}

export function getPatientById(id: string): Patient | undefined {
  return patients.find(patient => patient.patient_id.toLowerCase() === id.toLowerCase());
}

export function getPatientVitalsHistory(id: string): VitalSign[] {
  return histories.get(id) || [];
}

export function getPatientTimeline(id: string): TimelineEvent[] {
  return [...(timelines.get(id) || [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function getSystemAlerts(): SystemAlert[] {
  return [...alerts];
}

export function acknowledgeAlert(alertId: string): void {
  const alert = alerts.find(item => item.alert_id === alertId);
  if (alert) alert.acknowledged = true;
}

function buildVital(patientId: string, input: Omit<VitalSign, 'record_id' | 'patient_id' | 'timestamp' | 'map'>, timestamp: string): VitalSign {
  return {
    ...input,
    record_id: `rec_${patientId}_${Date.now()}`,
    patient_id: patientId,
    timestamp,
    map: +((2 * input.diastolic_bp + input.systolic_bp) / 3).toFixed(1)
  };
}

function updatePatient(patient: Patient, vital: VitalSign): Patient {
  const history = [...(histories.get(patient.patient_id) || []), vital];
  histories.set(patient.patient_id, history);

  const prediction = calculateDeteriorationRisk(vital, patient.age, history, DEFAULT_THRESHOLDS);
  const updated = {
    ...patient,
    current_state: vital,
    risk_score: prediction.risk_score,
    risk_level: prediction.risk_level,
    short_explanation: prediction.short_explanation,
    last_updated: vital.timestamp
  };
  patients[patients.indexOf(patient)] = updated;
  return updated;
}

export function createNewPatient(input: {
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
}): Patient {
  const now = new Date().toISOString();
  const patientId = input.patient_id || `PT-${crypto.randomUUID()}`;
  if (getPatientById(patientId)) {
    throw new Error(`Patient record with ID ${patientId} already exists.`);
  }

  const currentVital = buildVital(patientId, input, now);
  const prediction = calculateDeteriorationRisk(currentVital, input.age, [currentVital], DEFAULT_THRESHOLDS);
  const patient: Patient = {
    patient_id: patientId,
    age: input.age,
    gender: input.gender,
    bed_number: input.bed_number,
    unit: input.unit,
    admission_diagnosis: input.admission_diagnosis,
    icu_admission_time: now,
    current_state: currentVital,
    risk_score: prediction.risk_score,
    risk_level: prediction.risk_level,
    short_explanation: prediction.short_explanation,
    last_updated: now
  };

  patients.unshift(patient);
  histories.set(patientId, [currentVital]);
  timelines.set(patientId, [{
    event_id: `ev_${patientId}_${Date.now()}`,
    patient_id: patientId,
    timestamp: now,
    event_type: 'clinical_note',
    title: 'ICU Admission',
    description: `Patient admitted to ${input.unit} (${input.bed_number}) with diagnosis: ${input.admission_diagnosis}.`,
    severity: 'normal'
  }]);

  if (prediction.risk_level === 'HIGH' || (prediction.risk_level === 'MEDIUM' && prediction.risk_score >= 0.60)) {
    alerts.unshift({
      alert_id: `alt_${patientId}_${Date.now()}`,
      patient_id: patientId,
      patient_bed: input.bed_number,
      risk_level: prediction.risk_level,
      risk_score: prediction.risk_score,
      timestamp: now,
      message: `Estimated deterioration risk elevated to ${(prediction.risk_score * 100).toFixed(0)}%`,
      contributing_factor: prediction.contributing_factors[0]?.label || 'Initial vital signs',
      acknowledged: false
    });
  }
  return patient;
}

export function applySimulatedVitals(
  patientId: string,
  simulatedVitals: Omit<VitalSign, 'record_id' | 'patient_id' | 'timestamp' | 'map'>
): Patient | null {
  const patient = getPatientById(patientId);
  if (!patient) return null;

  const now = new Date().toISOString();
  const updated = updatePatient(patient, buildVital(patientId, simulatedVitals, now));
  const events = timelines.get(patientId) || [];
  events.unshift({
    event_id: `ev_${patientId}_${Date.now()}`,
    patient_id: patientId,
    timestamp: now,
    event_type: 'intervention',
    title: 'Simulated State Applied',
    description: `Simulated vital parameters applied. Estimated risk: ${(updated.risk_score * 100).toFixed(0)}% (${updated.risk_level}).`,
    severity: updated.risk_level === 'HIGH' ? 'critical' : updated.risk_level === 'MEDIUM' ? 'warning' : 'normal'
  });
  timelines.set(patientId, events);
  return updated;
}

export function updatePatientVitals(patientId: string, newVitals: Partial<VitalSign>): Patient | null {
  const patient = getPatientById(patientId);
  if (!patient) return null;

  const current = patient.current_state;
  const now = new Date().toISOString();
  const updated = updatePatient(patient, buildVital(patientId, {
    heart_rate: newVitals.heart_rate ?? current.heart_rate,
    systolic_bp: newVitals.systolic_bp ?? current.systolic_bp,
    diastolic_bp: newVitals.diastolic_bp ?? current.diastolic_bp,
    spo2: newVitals.spo2 ?? current.spo2,
    respiratory_rate: newVitals.respiratory_rate ?? current.respiratory_rate,
    temperature: newVitals.temperature ?? current.temperature
  }, now));
  const events = timelines.get(patientId) || [];
  events.unshift({
    event_id: `ev_${patientId}_${Date.now()}`,
    patient_id: patientId,
    timestamp: now,
    event_type: 'vital_check',
    title: 'Vital Measurement Logged',
    description: `HR: ${updated.current_state.heart_rate} bpm | BP: ${updated.current_state.systolic_bp}/${updated.current_state.diastolic_bp} | SpO2: ${updated.current_state.spo2}% | RR: ${updated.current_state.respiratory_rate}`,
    severity: updated.risk_level === 'HIGH' ? 'critical' : updated.risk_level === 'MEDIUM' ? 'warning' : 'normal'
  });
  timelines.set(patientId, events);
  return updated;
}

export function getTrendDataPoints(patientId: string, hours: number = 24): TrendDataPoint[] {
  const history = getPatientVitalsHistory(patientId);
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const patient = getPatientById(patientId);

  return history.filter(vital => new Date(vital.timestamp).getTime() >= cutoff).map(vital => {
    const date = new Date(vital.timestamp);
    const risk = calculateDeteriorationRisk(vital, patient?.age ?? 60, history, DEFAULT_THRESHOLDS).risk_score;
    return {
      timestamp: vital.timestamp,
      display_time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
      heart_rate: vital.heart_rate,
      systolic_bp: vital.systolic_bp,
      diastolic_bp: vital.diastolic_bp,
      map: vital.map ?? +((2 * vital.diastolic_bp + vital.systolic_bp) / 3).toFixed(1),
      spo2: vital.spo2,
      respiratory_rate: vital.respiratory_rate,
      temperature: vital.temperature,
      risk_score: +(risk * 100).toFixed(0)
    };
  });
}

export function computeTrendSummary(patientId: string, hours: number = 24): TrendAnalysisSummary {
  const points = getTrendDataPoints(patientId, hours);
  if (points.length < 2) {
    return {
      time_range_hours: hours,
      heart_rate_trend: 'Stable',
      heart_rate_change: 0,
      spo2_trend: 'Stable',
      spo2_change: 0,
      respiratory_rate_trend: 'Stable',
      respiratory_rate_change: 0,
      blood_pressure_trend: 'Stable',
      temperature_trend: 'Stable',
      stability_index: 'Stable'
    };
  }

  const first = points[0];
  const last = points[points.length - 1];
  const hrDiff = last.heart_rate - first.heart_rate;
  const spo2Diff = last.spo2 - first.spo2;
  const rrDiff = last.respiratory_rate - first.respiratory_rate;
  const sbpDiff = last.systolic_bp - first.systolic_bp;
  const tempDiff = +(last.temperature - first.temperature).toFixed(1);

  return {
    time_range_hours: hours,
    heart_rate_trend: hrDiff > 5 ? 'Increasing' : hrDiff < -5 ? 'Decreasing' : 'Stable',
    heart_rate_change: hrDiff,
    spo2_trend: spo2Diff < -2 ? 'Decreasing' : spo2Diff > 2 ? 'Increasing' : 'Stable',
    spo2_change: spo2Diff,
    respiratory_rate_trend: rrDiff > 3 ? 'Increasing' : rrDiff < -3 ? 'Decreasing' : 'Stable',
    respiratory_rate_change: rrDiff,
    blood_pressure_trend: sbpDiff < -12 ? 'Decreasing' : sbpDiff > 15 ? 'Increasing' : 'Stable',
    temperature_trend: tempDiff > 0.5 ? 'Increasing' : tempDiff < -0.5 ? 'Decreasing' : 'Stable',
    stability_index: Math.abs(hrDiff) > 15 || spo2Diff < -4 || rrDiff > 5 ? 'Volatile' : Math.abs(hrDiff) > 8 || spo2Diff < -2 ? 'Guarded' : 'Stable'
  };
}
