import { Patient, VitalSign, TrendDataPoint } from '../types';

/**
 * Converts selectedPatientHistory array into a structured CSV string with headers:
 * (timestamp, heart_rate, spo2, respiratory_rate, temperature)
 */
export function convertPatientHistoryToCSV(selectedPatientHistory: VitalSign[]): string {
  const headers = ['timestamp', 'heart_rate', 'spo2', 'respiratory_rate', 'temperature', 'systolic_bp', 'diastolic_bp', 'map'];
  
  const rows = selectedPatientHistory.map((v) => {
    const sbp = v.systolic_bp;
    const dbp = v.diastolic_bp;
    const map = v.map ?? +((2 * dbp + sbp) / 3).toFixed(1);
    const temp = typeof v.temperature === 'number' ? v.temperature.toFixed(1) : v.temperature;

    return [
      `"${v.timestamp}"`,
      v.heart_rate,
      v.spo2,
      v.respiratory_rate,
      temp,
      sbp,
      dbp,
      map
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Initiates browser download of CSV string
 */
export function downloadCSV(csvString: string, filename: string): void {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Takes selectedPatientHistory data, converts it into structured CSV format,
 * and initiates browser download.
 *
 * @param selectedPatientHistory Array of historical vital sign records
 * @param patientId Optional patient ID for filename formatting
 * @param customFilename Optional custom filename
 */
export function exportSelectedPatientHistoryToCSV(
  selectedPatientHistory: VitalSign[],
  patientId: string = 'patient',
  customFilename?: string
): void {
  const csvContent = convertPatientHistoryToCSV(selectedPatientHistory);
  const filename = customFilename || `${patientId}_historical_vitals_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCSV(csvContent, filename);
}

/**
 * Generates and triggers browser download of patient telemetry and historical vitals as a research-grade CSV.
 */
export function exportPatientVitalsToCSV(patient: Patient, vitalsHistory: VitalSign[]): void {
  const headers = [
    'timestamp',
    'patient_id',
    'record_id',
    'age',
    'gender',
    'unit',
    'bed_number',
    'admission_diagnosis',
    'heart_rate_bpm',
    'systolic_bp_mmhg',
    'diastolic_bp_mmhg',
    'map_mmhg',
    'spo2_percent',
    'respiratory_rate_bpm',
    'temperature_celsius',
    'shock_index',
    'pulse_pressure_mmhg'
  ];

  const rows = vitalsHistory.map((v) => {
    const sbp = v.systolic_bp;
    const dbp = v.diastolic_bp;
    const map = v.map || ((2 * dbp + sbp) / 3).toFixed(1);
    const shockIndex = sbp > 0 ? (v.heart_rate / sbp).toFixed(2) : '0.80';
    const pulsePressure = sbp - dbp;

    return [
      `"${v.timestamp}"`,
      `"${patient.patient_id}"`,
      `"${v.record_id || `rec_${patient.patient_id}`}"`,
      patient.age,
      `"${patient.gender}"`,
      `"${patient.unit}"`,
      `"${patient.bed_number}"`,
      `"${patient.admission_diagnosis.replace(/"/g, '""')}"`,
      v.heart_rate,
      sbp,
      dbp,
      map,
      v.spo2,
      v.respiratory_rate,
      v.temperature.toFixed(1),
      shockIndex,
      pulsePressure
    ].join(',');
  });

  const metadataComment = `# ICU DETERIORATION DIGITAL TWIN - RESEARCH TELEMETRY EXPORT\n# PATIENT: ${patient.patient_id} | EXPORT TIMESTAMP: ${new Date().toISOString()}\n# NOTICE: Verify authorization and de-identification before sharing.\n`;

  const csvContent = metadataComment + headers.join(',') + '\n' + rows.join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${patient.patient_id}_icu_telemetry_history_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads trend waveform time-series data with calculated deterioration risk trajectories.
 */
export function exportTrendDataToCSV(patient: Patient, trendData: TrendDataPoint[], hours: number): void {
  const headers = [
    'timestamp',
    'display_time',
    'patient_id',
    'heart_rate_bpm',
    'systolic_bp_mmhg',
    'diastolic_bp_mmhg',
    'map_mmhg',
    'spo2_percent',
    'respiratory_rate_bpm',
    'temperature_celsius',
    'model_deterioration_risk_percent'
  ];

  const rows = trendData.map((pt) => [
    `"${pt.timestamp}"`,
    `"${pt.display_time}"`,
    `"${patient.patient_id}"`,
    pt.heart_rate,
    pt.systolic_bp,
    pt.diastolic_bp,
    pt.map,
    pt.spo2,
    pt.respiratory_rate,
    pt.temperature.toFixed(1),
    pt.risk_score || 0
  ].join(','));

  const metadataComment = `# ICU DETERIORATION DIGITAL TWIN - ${hours}H TREND WAVEFORM EXPORT\n# PATIENT: ${patient.patient_id} | WINDOW: ${hours} Hours | EXPORTED: ${new Date().toISOString()}\n`;

  const csvContent = metadataComment + headers.join(',') + '\n' + rows.join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${patient.patient_id}_trends_${hours}h_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports entire ICU cohort dataset for multi-patient offline analysis.
 */
export function exportCohortSummaryToCSV(patients: Patient[]): void {
  const headers = [
    'patient_id',
    'bed_number',
    'unit',
    'age',
    'gender',
    'admission_diagnosis',
    'icu_admission_time',
    'heart_rate_bpm',
    'blood_pressure_mmhg',
    'systolic_bp',
    'diastolic_bp',
    'map_mmhg',
    'spo2_percent',
    'respiratory_rate_bpm',
    'temperature_celsius',
    'estimated_deterioration_risk_score',
    'risk_level',
    'last_updated'
  ];

  const rows = patients.map((p) => {
    const v = p.current_state;
    const map = v.map || ((2 * v.diastolic_bp + v.systolic_bp) / 3).toFixed(1);

    return [
      `"${p.patient_id}"`,
      `"${p.bed_number}"`,
      `"${p.unit}"`,
      p.age,
      `"${p.gender}"`,
      `"${p.admission_diagnosis.replace(/"/g, '""')}"`,
      `"${p.icu_admission_time}"`,
      v.heart_rate,
      `"${v.systolic_bp}/${v.diastolic_bp}"`,
      v.systolic_bp,
      v.diastolic_bp,
      map,
      v.spo2,
      v.respiratory_rate,
      v.temperature.toFixed(1),
      p.risk_score,
      `"${p.risk_level}"`,
      `"${p.last_updated}"`
    ].join(',');
  });

  const metadataComment = `# ICU DETERIORATION DIGITAL TWIN - MULTI-PATIENT COHORT SNAPSHOT\n# TOTAL PATIENTS: ${patients.length} | EXPORTED: ${new Date().toISOString()}\n# NOTICE: AI-generated risk estimates for research use only.\n`;

  const csvContent = metadataComment + headers.join(',') + '\n' + rows.join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `icu_cohort_research_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
