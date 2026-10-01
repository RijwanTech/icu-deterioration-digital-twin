import React, { useState } from 'react';
import { Patient, VitalSign, PredictionResult, TimelineEvent, SimulationResult } from '../types';
import { PatientHeader } from '../components/PatientHeader';
import { VitalCard } from '../components/VitalCard';
import { DigitalTwinView } from '../components/DigitalTwin3DView';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { exportPatientDataToCSV } from '../utils/export.js';
import { calculateDeteriorationRisk } from '../services/mlEngine';
import { 
  ShieldAlert, 
  Cpu, 
  TrendingUp, 
  TrendingDown,
  CheckCircle2, 
  Clock, 
  LineChart, 
  FlaskConical, 
  ChevronRight,
  Activity,
  Layers,
  Heart,
  Droplets,
  Wind,
  Thermometer,
  Download,
  Sliders,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface PatientDigitalTwinPageProps {
  patient: Patient;
  vitalsHistory: VitalSign[];
  prediction: PredictionResult | null;
  timeline: TimelineEvent[];
  onNavigateTab: (tab: 'twin' | 'vitals' | 'trends' | 'risk' | 'timeline' | 'simulation') => void;
  onOpenAIExplanation: () => void;
  onOpenLogVital?: () => void;
}

export const PatientDigitalTwinPage: React.FC<PatientDigitalTwinPageProps> = ({
  patient,
  vitalsHistory,
  prediction,
  timeline,
  onNavigateTab,
  onOpenAIExplanation,
  onOpenLogVital
}) => {
  const [activeTab, setActiveTab] = useState<'twin' | 'vitals' | 'trends' | 'risk' | 'timeline' | 'simulation'>('twin');
  const [trendWindow, setTrendWindow] = useState<6 | 12 | 24>(24);

  // Quick Embedded What-If Simulation State
  const [simHeartRate, setSimHeartRate] = useState<number>(patient.current_state.heart_rate);
  const [simSpo2, setSimSpo2] = useState<number>(patient.current_state.spo2);
  const [simRespRate, setSimRespRate] = useState<number>(patient.current_state.respiratory_rate);
  const [simSystolicBp, setSimSystolicBp] = useState<number>(patient.current_state.systolic_bp);
  const [simTemp, setSimTemp] = useState<number>(patient.current_state.temperature);

  // Calculate live simulation output on the fly
  const simulatedVitals: VitalSign = {
    patient_id: patient.patient_id,
    timestamp: new Date().toISOString(),
    heart_rate: simHeartRate,
    spo2: simSpo2,
    respiratory_rate: simRespRate,
    systolic_bp: simSystolicBp,
    diastolic_bp: patient.current_state.diastolic_bp,
    map: ((2 * patient.current_state.diastolic_bp + simSystolicBp) / 3),
    temperature: simTemp
  };

  const simResult = calculateDeteriorationRisk(
    simulatedVitals,
    patient.age,
    vitalsHistory
  );

  const v = patient.current_state;
  
  // Compute deltas against previous vital entry (e.g. 1 hour ago)
  const prevVital = vitalsHistory.length > 1 ? vitalsHistory[vitalsHistory.length - 2] : null;
  const hrDelta = prevVital ? v.heart_rate - prevVital.heart_rate : 0;
  const spo2Delta = prevVital ? v.spo2 - prevVital.spo2 : 0;
  const rrDelta = prevVital ? v.respiratory_rate - prevVital.respiratory_rate : 0;
  const sbpDelta = prevVital ? v.systolic_bp - prevVital.systolic_bp : 0;
  const tempDelta = prevVital ? +(v.temperature - prevVital.temperature).toFixed(1) : 0;

  const handleTabChange = (tab: 'twin' | 'vitals' | 'trends' | 'risk' | 'timeline' | 'simulation') => {
    setActiveTab(tab);
    onNavigateTab(tab);
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return ts;
    }
  };

  // Filter history for mini trend graphs
  const recentHistory = vitalsHistory.slice(-trendWindow).map((rec, i) => {
    let label = `${i}h`;
    try {
      const d = new Date(rec.timestamp);
      label = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {}
    return {
      time: label,
      hr: rec.heart_rate,
      spo2: rec.spo2,
      rr: rec.respiratory_rate,
      sbp: rec.systolic_bp,
      temp: rec.temperature
    };
  });

  const resetQuickSimulation = () => {
    setSimHeartRate(patient.current_state.heart_rate);
    setSimSpo2(patient.current_state.spo2);
    setSimRespRate(patient.current_state.respiratory_rate);
    setSimSystolicBp(patient.current_state.systolic_bp);
    setSimTemp(patient.current_state.temperature);
  };

  const isSimModified = 
    simHeartRate !== patient.current_state.heart_rate ||
    simSpo2 !== patient.current_state.spo2 ||
    simRespRate !== patient.current_state.respiratory_rate ||
    simSystolicBp !== patient.current_state.systolic_bp ||
    simTemp !== patient.current_state.temperature;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 text-slate-100">
      <DisclaimerBanner />

      {/* Patient Header Banner */}
      <PatientHeader
        patient={patient}
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        onOpenAIExplanation={onOpenAIExplanation}
        onExportCSV={() => exportPatientDataToCSV(patient.patient_id, vitalsHistory)}
        onOpenLogVital={onOpenLogVital}
      />

      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* SECTION 1: PRIMARY VITALS TELEMETRY & AI RISK SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Vitals Telemetry Grid (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Primary Ingested Vital Telemetry</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                Synced: {formatTime(patient.last_updated)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Heart Rate */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span className="text-sm">❤️</span>
                    <span>HR</span>
                  </span>
                  {hrDelta !== 0 && (
                    <span className={`text-[11px] font-mono font-bold ${hrDelta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {hrDelta > 0 ? `+${hrDelta}` : hrDelta} (1h)
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-3xl font-bold font-mono text-white tabular-nums">
                    {v.heart_rate}
                  </span>
                  <span className="text-xs font-mono uppercase text-slate-400">bpm</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Ref: 60–100</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold ${v.heart_rate > 100 ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'}`}>
                    {v.heart_rate > 100 ? 'HIGH' : 'NORMAL'}
                  </span>
                </div>
              </div>

              {/* SpO2 */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span className="text-sm">🫁</span>
                    <span>SpO₂</span>
                  </span>
                  {spo2Delta !== 0 && (
                    <span className={`text-[11px] font-mono font-bold ${spo2Delta < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {spo2Delta > 0 ? `+${spo2Delta}` : spo2Delta}% (1h)
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-3xl font-bold font-mono text-white tabular-nums">
                    {v.spo2}
                  </span>
                  <span className="text-xs font-mono uppercase text-slate-400">%</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Ref: 95–100%</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold ${v.spo2 < 92 ? 'bg-rose-950 text-rose-400' : (v.spo2 < 95 ? 'bg-amber-950 text-amber-400' : 'bg-emerald-950 text-emerald-400')}`}>
                    {v.spo2 < 92 ? 'HYPOXIC' : (v.spo2 < 95 ? 'LOW' : 'NORMAL')}
                  </span>
                </div>
              </div>

              {/* Blood Pressure */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span className="text-sm">🩺</span>
                    <span>BP</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    MAP {v.map ? Math.round(v.map) : Math.round((2 * v.diastolic_bp + v.systolic_bp) / 3)}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-2xl font-bold font-mono text-white tabular-nums">
                    {v.systolic_bp}/{v.diastolic_bp}
                  </span>
                  <span className="text-xs font-mono uppercase text-slate-400">mmHg</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Ref: 120/80</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold ${v.systolic_bp < 90 ? 'bg-rose-950 text-rose-400' : (v.systolic_bp > 140 ? 'bg-amber-950 text-amber-400' : 'bg-emerald-950 text-emerald-400')}`}>
                    {v.systolic_bp < 90 ? 'HYPOTENSIVE' : (v.systolic_bp > 140 ? 'ELEVATED' : 'NORMAL')}
                  </span>
                </div>
              </div>

              {/* Respiratory Rate */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Resp Rate</span>
                  </span>
                  {rrDelta !== 0 && (
                    <span className={`text-[11px] font-mono font-bold ${rrDelta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {rrDelta > 0 ? `+${rrDelta}` : rrDelta}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-3xl font-bold font-mono text-white tabular-nums">
                    {v.respiratory_rate}
                  </span>
                  <span className="text-xs font-mono uppercase text-slate-400">bpm</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Ref: 12–20</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold ${v.respiratory_rate > 22 ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'}`}>
                    {v.respiratory_rate > 22 ? 'TACHYPNEA' : 'NORMAL'}
                  </span>
                </div>
              </div>

              {/* Core Temperature */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span className="text-sm">🌡️</span>
                    <span>Temp</span>
                  </span>
                  {tempDelta !== 0 && (
                    <span className={`text-[11px] font-mono font-bold ${tempDelta > 0 ? 'text-rose-400' : 'text-cyan-400'}`}>
                      {tempDelta > 0 ? `+${tempDelta}` : tempDelta}°
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-3xl font-bold font-mono text-white tabular-nums">
                    {v.temperature.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono uppercase text-slate-400">°C</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Ref: 36.5–37.5</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold ${v.temperature >= 38.3 ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'}`}>
                    {v.temperature >= 38.3 ? 'FEVER' : 'NORMAL'}
                  </span>
                </div>
              </div>

              {/* Quick Action Tile */}
              <div className="p-4 rounded-xl border border-cyan-800/60 bg-cyan-950/20 flex flex-col justify-between">
                <div className="text-xs font-semibold text-cyan-300">
                  Recorded Telemetry
                </div>
                <div className="text-[11px] text-slate-400">
                  Export recorded vital observations.
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => exportPatientDataToCSV(patient.patient_id, vitalsHistory)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                    title="Export CSV"
                  >
                    <Download className="w-3.5 h-3.5 inline mr-1.5" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI Deterioration Risk & Explanations Card (5 Cols) */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-rose-950 border border-rose-800 text-rose-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      AI Deterioration Risk Estimate
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400">
                      Model: {prediction?.model_name || 'Random Forest Ensemble'} · v{prediction?.model_version || '1.4'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onOpenAIExplanation}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>SHAP XAI</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Main Risk Numbers */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    AI RISK STATUS
                  </div>
                  <div className={`text-xl font-bold font-mono tracking-wider mt-0.5 ${
                    patient.risk_level === 'HIGH' ? 'text-rose-400' :
                    patient.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {patient.risk_level} RISK
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Threshold: &gt;0.69 (HIGH)</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    RISK SCORE
                  </div>
                  <div className={`text-2xl font-bold font-mono tabular-nums mt-0.5 ${
                    patient.risk_level === 'HIGH' ? 'text-rose-400' :
                    patient.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {(patient.risk_score * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    95% CI: [{Math.max(0, Math.round((patient.risk_score - 0.06) * 100))}% – {Math.min(100, Math.round((patient.risk_score + 0.06) * 100))}%]
                  </div>
                </div>
              </div>

              {/* Progress Risk Meter */}
              <div className="mb-4">
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      patient.risk_level === 'HIGH' ? 'bg-gradient-to-r from-amber-500 to-rose-500' :
                      patient.risk_level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(5, Math.round(patient.risk_score * 100))}%` }}
                  />
                </div>
              </div>

              {/* Explainable Why Risk Increased Short Summary */}
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs">
                <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Why Risk is Elevated</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {patient.risk_level === 'HIGH' ? (
                    <>Acute deterioration driven by <strong>tachycardia ({v.heart_rate} bpm)</strong>, <strong>desaturation ({v.spo2}% SpO₂)</strong>, and <strong>febrile response ({v.temperature.toFixed(1)}°C)</strong> exceeding nominal ICU stability bounds.</>
                  ) : patient.risk_level === 'MEDIUM' ? (
                    <>Subtle trajectory elevation observed in cardiovascular demand and respiratory patterns requiring close clinical surveillance.</>
                  ) : (
                    <>Hemodynamics and oxygenation within target clinical ranges with stable multi-hour trend trajectory.</>
                  )}
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">
                AI-generated risk estimate — for research/demo purposes only.
              </span>
              <button
                onClick={() => handleTabChange('simulation')}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Simulation Sandbox</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: DIGITAL TWIN INTERACTIVE ORGAN MAP */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Patient Digital Twin Organ System Architecture</span>
            </h2>
            <span className="text-[11px] font-mono text-cyan-400">
              State Status: {patient.risk_level === 'HIGH' ? 'System Stress Identified' : 'Compensated'}
            </span>
          </div>

          <DigitalTwinView
            patientId={patient.patient_id}
            vitals={v}
            riskScore={patient.risk_score}
            riskLevel={patient.risk_level}
            lastUpdated={patient.last_updated}
          />
        </div>

        {/* SECTION 3: 📈 TREND ANALYSIS (TELEMETRY WAVEFORMS) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
                <LineChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  📈 Telemetry Trend Analysis & Waveform History
                </h3>
                <p className="text-[11px] font-mono text-slate-400">
                  Multi-channel continuous physiological telemetry
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
                {([6, 12, 24] as const).map(w => (
                  <button
                    key={w}
                    onClick={() => setTrendWindow(w)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      trendWindow === w
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {w}h
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleTabChange('trends')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <span>Full Waveforms</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>
          </div>

          {/* Mini Waveform Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Heart Rate Waveform */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-rose-300 flex items-center gap-1.5">
                  <span>❤️</span>
                  <span>HEART RATE (BPM)</span>
                </span>
                <span className="text-xs font-mono text-slate-400">Current: {v.heart_rate} bpm</span>
              </div>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recentHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hrTwinGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} 
                    />
                    <Area type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#hrTwinGrad)" name="Heart Rate" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SpO2 Saturation Waveform */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-cyan-300 flex items-center gap-1.5">
                  <span>🫁</span>
                  <span>SPO2 SATURATION (%)</span>
                </span>
                <span className="text-xs font-mono text-slate-400">Current: {v.spo2}%</span>
              </div>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recentHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="spo2TwinGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" domain={[85, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} 
                    />
                    <Area type="monotone" dataKey="spo2" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#spo2TwinGrad)" name="SpO2" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: 🧠 EXPLAINABLE AI (XAI) & 🕐 PATIENT TIMELINE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 🧠 Explainable AI Panel (7 Cols) */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400">
                    <span className="text-base">🧠</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      Explainable AI (XAI) & Feature Drivers
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400">
                      Feature attribution weights estimating deterioration risk
                    </p>
                  </div>
                </div>

                <button
                  onClick={onOpenAIExplanation}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Model Inspector</span>
                </button>
              </div>

              {/* Contributing Factors List */}
              <div className="space-y-2.5">
                {prediction?.contributing_factors.map((factor, idx) => {
                  const isRiskInc = factor.direction === 'increasing_risk';
                  const percentage = Math.min(100, Math.round(Math.abs(factor.impact_score) * 100));

                  return (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-white flex items-center gap-2">
                          {isRiskInc ? (
                            <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>{factor.label}</span>
                        </div>
                        <span className={`font-mono font-bold ${isRiskInc ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isRiskInc ? `+${percentage}% risk contribution` : `-${percentage}% risk offset`}
                        </span>
                      </div>

                      <p className="text-slate-400 text-[11px] mb-1.5 leading-relaxed">
                        {factor.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-900">
                        <span>Observed: <strong className="text-slate-300">{factor.observed_value}</strong></span>
                        <span>Physiological Baseline: <strong className="text-slate-400">{factor.baseline_reference}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-800 text-[11px] text-slate-400">
              Weights derived from Random Forest feature attribution & SHAP calculations on de-identified benchmarks.
            </div>
          </div>

          {/* 🕐 Patient Timeline Panel (5 Cols) */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-950 border border-amber-800 text-amber-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      🕐 Patient Chronological Timeline
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400">
                      Clinical milestones & telemetry events
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-400">
                  {timeline.length} Events
                </span>
              </div>

              {/* Timeline Feed */}
              <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
                {timeline.map((item) => (
                  <div key={item.event_id} className="relative pl-5 pb-2 border-l border-slate-800 last:border-l-0 text-xs">
                    <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${
                      item.severity === 'critical' ? 'bg-rose-500 ring-2 ring-rose-500/20' :
                      item.severity === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'
                    }`} />

                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-slate-200">{item.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-center">
              <button
                onClick={() => handleTabChange('trends')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Inspect Telemetry Correlation →
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 5: 🧪 WHAT-IF SIMULATION SANDBOX */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  🧪 Interactive What-If Simulation Sandbox
                </h3>
                <p className="text-[11px] font-mono text-slate-400">
                  Simulate parameter adjustments to estimate hypothetical risk changes in the Digital Twin
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isSimModified && (
                <button
                  onClick={resetQuickSimulation}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Parameters</span>
                </button>
              )}
              <button
                onClick={() => handleTabChange('simulation')}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs text-white font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>Full Simulation Suite</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Simulation Sliders (8 Cols) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* HR Slider */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <span>❤️</span>
                    <span>Simulated Heart Rate</span>
                  </span>
                  <span className="font-mono font-bold text-white">{simHeartRate} bpm</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="170"
                  value={simHeartRate}
                  onChange={(e) => setSimHeartRate(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>40</span>
                  <span>Baseline: {patient.current_state.heart_rate}</span>
                  <span>170</span>
                </div>
              </div>

              {/* SpO2 Slider */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <span>🫁</span>
                    <span>Simulated SpO₂</span>
                  </span>
                  <span className="font-mono font-bold text-white">{simSpo2}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="100"
                  value={simSpo2}
                  onChange={(e) => setSimSpo2(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>80%</span>
                  <span>Baseline: {patient.current_state.spo2}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* RR Slider */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Simulated Resp Rate</span>
                  </span>
                  <span className="font-mono font-bold text-white">{simRespRate} bpm</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="45"
                  value={simRespRate}
                  onChange={(e) => setSimRespRate(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>8</span>
                  <span>Baseline: {patient.current_state.respiratory_rate}</span>
                  <span>45</span>
                </div>
              </div>

              {/* Systolic BP Slider */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <span>🩺</span>
                    <span>Simulated Systolic BP</span>
                  </span>
                  <span className="font-mono font-bold text-white">{simSystolicBp} mmHg</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={simSystolicBp}
                  onChange={(e) => setSimSystolicBp(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>60</span>
                  <span>Baseline: {patient.current_state.systolic_bp}</span>
                  <span>200</span>
                </div>
              </div>
            </div>

            {/* Simulated vs Current Risk Comparison Box (4 Cols) */}
            <div className="lg:col-span-4 p-4 rounded-xl bg-slate-950 border border-cyan-900/60 flex flex-col justify-between space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Counterfactual Comparison
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">CURRENT RISK</div>
                  <div className={`text-xl font-bold font-mono mt-1 ${
                    patient.risk_level === 'HIGH' ? 'text-rose-400' :
                    patient.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {(patient.risk_score * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">{patient.risk_level}</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-cyan-800 text-center">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase">SIMULATED RISK</div>
                  <div className={`text-xl font-bold font-mono mt-1 ${
                    simResult.risk_level === 'HIGH' ? 'text-rose-400' :
                    simResult.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {(simResult.risk_score * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] font-mono text-cyan-300">{simResult.risk_level}</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 text-center">
                {simResult.risk_score < patient.risk_score ? (
                  <span className="text-emerald-400 font-semibold">
                    ↓ Projected Risk Reduction: -{((patient.risk_score - simResult.risk_score) * 100).toFixed(0)}%
                  </span>
                ) : simResult.risk_score > patient.risk_score ? (
                  <span className="text-rose-400 font-semibold">
                    ↑ Projected Risk Increase: +{((simResult.risk_score - patient.risk_score) * 100).toFixed(0)}%
                  </span>
                ) : (
                  <span className="text-slate-400">Identical to current baseline state</span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
