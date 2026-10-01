/**
 * Formats historical patient vital signs data into a structured CSV string
 * with headers: timestamp, heart_rate, spo2, respiratory_rate, temperature (and additional vital metrics)
 * and triggers a browser download.
 *
 * @param {string} patientId - Unique identifier for the patient
 * @param {Array<Object>} history - Array of historical vital sign objects containing timestamp, heart_rate, spo2, respiratory_rate, temperature
 */
export function exportPatientDataToCSV(patientId, history) {
  if (!history || !Array.isArray(history) || history.length === 0) {
    console.warn(`[exportPatientDataToCSV] No history data available to export for patient ${patientId}`);
    return;
  }

  // Mandatory headers: timestamp, heart_rate, spo2, respiratory_rate, temperature
  const headers = [
    'timestamp',
    'heart_rate',
    'spo2',
    'respiratory_rate',
    'temperature',
    'systolic_bp',
    'diastolic_bp',
    'map'
  ];

  const rows = history.map((record) => {
    const timestamp = record.timestamp || new Date().toISOString();
    const heartRate = record.heart_rate ?? '';
    const spo2 = record.spo2 ?? '';
    const respRate = record.respiratory_rate ?? '';
    const temp = record.temperature != null ? Number(record.temperature).toFixed(1) : '';
    const sbp = record.systolic_bp ?? '';
    const dbp = record.diastolic_bp ?? '';
    const map = record.map ?? (sbp && dbp ? ((2 * Number(dbp) + Number(sbp)) / 3).toFixed(1) : '');

    return [
      `"${timestamp}"`,
      heartRate,
      spo2,
      respRate,
      temp,
      sbp,
      dbp,
      map
    ].join(',');
  });

  const metadataHeader = `# ICU DETERIORATION DIGITAL TWIN - ACADEMIC RESEARCH DATASET\n# PATIENT_ID: ${patientId || 'UNKNOWN'} | EXPORT_DATE: ${new Date().toISOString()}\n`;
  const csvContent = metadataHeader + headers.join(',') + '\n' + rows.join('\n');

  // Trigger browser download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `${patientId || 'patient'}_vitals_history_${new Date().toISOString().slice(0, 10)}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default exportPatientDataToCSV;
