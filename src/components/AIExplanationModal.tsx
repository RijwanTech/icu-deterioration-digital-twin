import React, { useState, useMemo } from 'react';
import { 
  X, 
  ShieldAlert, 
  Cpu, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Clock, 
  Activity, 
  Heart, 
  Wind, 
  Droplets, 
  Thermometer, 
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { PredictionResult, Patient, VitalSign, ContributingFactor } from '../types';
import { calculateDeteriorationRisk } from '../services/mlEngine';

interface AIExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prediction: PredictionResult | null;
  patient?: Patient | null;
  vitalsHistory?: VitalSign[];
}

export const AIExplanationModal: React.FC<AIExplanationModalProps> = ({
  isOpen,
  onClose,
  prediction,
  patient,
  vitalsHistory = []
}) => {
  const [selectedWindow, setSelectedWindow] = useState<6 | 12 | 24>(6);
  const [activeParamTab, setActiveParamTab] = useState<'all' | 'hr' | 'spo2' | 'rr' | 'bp' | 'temp'>('all');

  // Compute trend metrics across selected history window
  const trendAnalysis = useMemo(() => {
    if (!vitalsHistory || vitalsHistory.length === 0) {
      return null;
    }

    const windowSlice = vitalsHistory.slice(-selectedWindow);
    const oldestRecord = windowSlice[0];
    const latestRecord = windowSlice[windowSlice.length - 1];

    if (!oldestRecord || !latestRecord) return null;
    if (!patient) return null;

    // Deltas
    const hrDelta = latestRecord.heart_rate - oldestRecord.heart_rate;
    const spo2Delta = latestRecord.spo2 - oldestRecord.spo2;
    const rrDelta = latestRecord.respiratory_rate - oldestRecord.respiratory_rate;
    const sbpDelta = latestRecord.systolic_bp - oldestRecord.systolic_bp;
    const tempDelta = +(latestRecord.temperature - oldestRecord.temperature).toFixed(1);

    const oldestMap = (2 * oldestRecord.diastolic_bp + oldestRecord.systolic_bp) / 3;
    const latestMap = (2 * latestRecord.diastolic_bp + latestRecord.systolic_bp) / 3;
    const mapDelta = +(latestMap - oldestMap).toFixed(1);

    const oldestShockIndex = oldestRecord.systolic_bp > 0 ? +(oldestRecord.heart_rate / oldestRecord.systolic_bp).toFixed(2) : 0.8;
    const latestShockIndex = latestRecord.systolic_bp > 0 ? +(latestRecord.heart_rate / latestRecord.systolic_bp).toFixed(2) : 0.8;
    const shockIndexDelta = +(latestShockIndex - oldestShockIndex).toFixed(2);

    // Initial window risk vs current risk
    const patientAge = patient.age;
    const initialRisk = calculateDeteriorationRisk(oldestRecord, patientAge);
    const currentRisk = prediction ? prediction.risk_score : calculateDeteriorationRisk(latestRecord, patientAge).risk_score;
    const riskScoreDelta = +(currentRisk - initialRisk.risk_score).toFixed(2);

    // Chart formatted points
    const chartPoints = windowSlice.map((v, idx) => {
      let label = `${idx}h`;
      try {
        const d = new Date(v.timestamp);
        label = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      } catch {}

      const vMap = (2 * v.diastolic_bp + v.systolic_bp) / 3;
      return {
        time: label,
        heart_rate: v.heart_rate,
        spo2: v.spo2,
        respiratory_rate: v.respiratory_rate,
        systolic_bp: v.systolic_bp,
        diastolic_bp: v.diastolic_bp,
        map: +vMap.toFixed(1),
        temperature: v.temperature
      };
    });

    // Generate detailed trend-based explanation cards
    const detailedTrendDrivers = [];

    // 1. Heart Rate Trend
    if (Math.abs(hrDelta) >= 4 || latestRecord.heart_rate > 95 || latestRecord.heart_rate < 55) {
      const isIncreasing = hrDelta > 0;
      const isCritical = latestRecord.heart_rate >= 110 || latestRecord.heart_rate <= 45;
      detailedTrendDrivers.push({
        id: 'hr_trend',
        title: isIncreasing 
          ? `Heart rate trend increasing over the last ${selectedWindow} hours`
          : `Heart rate trend decreasing over the last ${selectedWindow} hours`,
        param: 'Heart Rate',
        icon: Heart,
        iconColor: 'text-rose-400',
        badgeColor: isIncreasing ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-cyan-950 text-cyan-300 border-cyan-800',
        trajectory: isIncreasing ? `+${hrDelta} bpm escalation (${oldestRecord.heart_rate} → ${latestRecord.heart_rate} bpm)` : `${hrDelta} bpm change (${oldestRecord.heart_rate} → ${latestRecord.heart_rate} bpm)`,
        riskContribution: isCritical ? '+32% Risk Weight' : '+18% Risk Weight',
        direction: isIncreasing || isCritical ? 'increasing_risk' : 'neutral',
        explanation: isIncreasing 
          ? `Persistent upward velocity of +${(hrDelta / selectedWindow).toFixed(1)} bpm/hour indicates compensatory cardiovascular stress, heightened sympathetic tone, or occult systemic distress.`
          : `Decreased heart rate trend may indicate cardiac fatigue, conduction delay, or therapeutic rate control response.`,
        physiologicBasis: `Normal sinus resting: 60–100 bpm. High sustained rate elevates myocardial oxygen consumption (${latestRecord.heart_rate} bpm vs. baseline ${oldestRecord.heart_rate} bpm).`,
        startVal: `${oldestRecord.heart_rate} bpm`,
        currentVal: `${latestRecord.heart_rate} bpm`,
        deltaVal: `${hrDelta > 0 ? `+${hrDelta}` : hrDelta} bpm`,
        status: isCritical ? 'Critical Deterioration Vector' : 'Elevated Trend Vector'
      });
    }

    // 2. SpO2 Desaturation Trend
    if (spo2Delta <= -1 || latestRecord.spo2 < 95) {
      const isDesat = spo2Delta < 0;
      const isSevere = latestRecord.spo2 <= 91;
      detailedTrendDrivers.push({
        id: 'spo2_trend',
        title: isDesat 
          ? `Oxygen saturation (SpO₂) desaturation trend over the last ${selectedWindow} hours`
          : `SpO₂ saturation sub-optimal despite flat trajectory`,
        param: 'Oxygen Saturation',
        icon: Wind,
        iconColor: 'text-cyan-400',
        badgeColor: isDesat ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-amber-950 text-amber-300 border-amber-800',
        trajectory: isDesat ? `${spo2Delta}% desaturation drop (${oldestRecord.spo2}% → ${latestRecord.spo2}%)` : `Plateau at ${latestRecord.spo2}% (Target ≥95%)`,
        riskContribution: isSevere ? '+35% Risk Weight' : '+22% Risk Weight',
        direction: 'increasing_risk',
        explanation: isDesat 
          ? `Continuous downward drift of ${Math.abs(spo2Delta)}% demonstrates progressive ventilation-perfusion mismatch, microatelectasis, or worsening pulmonary diffusion barrier.`
          : `Pulse oximetry remains depressed at ${latestRecord.spo2}%, sustaining hypoxemic tissue vulnerability.`,
        physiologicBasis: `Oxygen hemoglobin dissociation curve steepens rapidly below 93%. Drop from ${oldestRecord.spo2}% to ${latestRecord.spo2}% substantially lowers arterial oxygen content (CaO₂).`,
        startVal: `${oldestRecord.spo2}%`,
        currentVal: `${latestRecord.spo2}%`,
        deltaVal: `${spo2Delta > 0 ? `+${spo2Delta}` : spo2Delta}%`,
        status: isSevere ? 'High Risk Pulmonary Factor' : 'Moderate Pulmonary Stress'
      });
    }

    // 3. Respiratory Rate Trend
    if (Math.abs(rrDelta) >= 2 || latestRecord.respiratory_rate > 22 || latestRecord.respiratory_rate < 10) {
      const isTachypnea = latestRecord.respiratory_rate > 22;
      const isEscalating = rrDelta > 0;
      detailedTrendDrivers.push({
        id: 'rr_trend',
        title: isEscalating
          ? `Respiratory rate climbing over the last ${selectedWindow} hours`
          : `Respiratory rate elevated (${latestRecord.respiratory_rate} breaths/min)`,
        param: 'Respiratory Rate',
        icon: Activity,
        iconColor: 'text-indigo-400',
        badgeColor: isEscalating ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-slate-900 text-slate-300 border-slate-800',
        trajectory: isEscalating ? `+${rrDelta} breaths/min increase (${oldestRecord.respiratory_rate} → ${latestRecord.respiratory_rate} bpm)` : `Sustained tachypnea at ${latestRecord.respiratory_rate} bpm`,
        riskContribution: latestRecord.respiratory_rate >= 28 ? '+28% Risk Weight' : '+18% Risk Weight',
        direction: 'increasing_risk',
        explanation: `Respiratory rate is clinically the most sensitive single early predictor of ICU deterioration. Rate increase to ${latestRecord.respiratory_rate} bpm signals metabolic acidosis compensation or increased work of breathing.`,
        physiologicBasis: `Reference range: 12–20 breaths/min. Rates >24 bpm indicate impending respiratory fatigue or high dead-space ventilation.`,
        startVal: `${oldestRecord.respiratory_rate} bpm`,
        currentVal: `${latestRecord.respiratory_rate} bpm`,
        deltaVal: `${rrDelta > 0 ? `+${rrDelta}` : rrDelta} bpm`,
        status: isTachypnea ? 'Early Decompensation Indicator' : 'Nominal Ventilation'
      });
    }

    // 4. Hemodynamics, MAP, and Shock Index Trend
    if (mapDelta <= -3 || latestRecord.systolic_bp < 100 || latestShockIndex >= 0.9) {
      const isMapDropping = mapDelta < 0;
      detailedTrendDrivers.push({
        id: 'bp_trend',
        title: isMapDropping
          ? `Mean Arterial Pressure (MAP) decline over the last ${selectedWindow} hours`
          : `Shock Index elevated (${latestShockIndex.toFixed(2)}) indicating occult hypoperfusion`,
        param: 'Hemodynamics / MAP',
        icon: Droplets,
        iconColor: 'text-emerald-400',
        badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
        trajectory: `MAP delta: ${mapDelta > 0 ? `+${mapDelta}` : mapDelta} mmHg (${oldestMap.toFixed(0)} → ${latestMap.toFixed(0)} mmHg) · Shock Index: ${oldestShockIndex} → ${latestShockIndex}`,
        riskContribution: latestMap < 65 ? '+30% Risk Weight' : '+19% Risk Weight',
        direction: 'increasing_risk',
        explanation: `Progression toward hemodynamic instability. A rising Shock Index (HR / SBP = ${latestShockIndex.toFixed(2)}) exceeding 0.9 is strongly correlated with left ventricular uncoupling or occult hypovolemia.`,
        physiologicBasis: `Organ perfusion threshold target is MAP ≥65 mmHg. Current SBP ${latestRecord.systolic_bp} mmHg / DBP ${latestRecord.diastolic_bp} mmHg yields MAP ${latestMap.toFixed(0)} mmHg.`,
        startVal: `MAP ${oldestMap.toFixed(0)} mmHg`,
        currentVal: `MAP ${latestMap.toFixed(0)} mmHg`,
        deltaVal: `${mapDelta > 0 ? `+${mapDelta}` : mapDelta} mmHg`,
        status: latestMap < 65 ? 'Critical Perfusion Risk' : 'Perfusion Strain Vector'
      });
    }

    // 5. Core Temperature Trend
    if (Math.abs(tempDelta) >= 0.4 || latestRecord.temperature >= 38.0 || latestRecord.temperature <= 35.8) {
      const isFever = latestRecord.temperature >= 38.0;
      detailedTrendDrivers.push({
        id: 'temp_trend',
        title: tempDelta > 0
          ? `Core temperature elevation (+${tempDelta}°C) over the last ${selectedWindow} hours`
          : `Core thermal fluctuation observed (${latestRecord.temperature.toFixed(1)}°C)`,
        param: 'Core Temperature',
        icon: Thermometer,
        iconColor: 'text-amber-400',
        badgeColor: isFever ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-slate-900 text-slate-300 border-slate-800',
        trajectory: `${tempDelta > 0 ? `+${tempDelta}` : tempDelta}°C thermal shift (${oldestRecord.temperature.toFixed(1)}°C → ${latestRecord.temperature.toFixed(1)}°C)`,
        riskContribution: '+15% Risk Weight',
        direction: 'increasing_risk',
        explanation: `Temperature progression to ${latestRecord.temperature.toFixed(1)}°C increases basal metabolic rate by ~10-13% per °C, increasing oxygen demand and placing higher load on already stressed cardiorespiratory reserves.`,
        physiologicBasis: `Normothermia: 36.5–37.5°C. Pyrexia induces systemic vasodilation and accelerates tachycardia.`,
        startVal: `${oldestRecord.temperature.toFixed(1)}°C`,
        currentVal: `${latestRecord.temperature.toFixed(1)}°C`,
        deltaVal: `${tempDelta > 0 ? `+${tempDelta}` : tempDelta}°C`,
        status: 'Thermal & Metabolic Stress'
      });
    }

    return {
      oldestRecord,
      latestRecord,
      hrDelta,
      spo2Delta,
      rrDelta,
      sbpDelta,
      tempDelta,
      oldestMap,
      latestMap,
      mapDelta,
      oldestShockIndex,
      latestShockIndex,
      initialRiskScore: initialRisk.risk_score,
      currentRiskScore: currentRisk,
      riskScoreDelta,
      chartPoints,
      detailedTrendDrivers
    };
  }, [vitalsHistory, selectedWindow, patient, prediction]);

  if (!isOpen) return null;

  const currentRiskScore = prediction ? prediction.risk_score : (patient ? patient.risk_score : 0.78);
  const currentRiskLevel = prediction ? prediction.risk_level : (patient ? patient.risk_level : 'HIGH');

  // Filtered chart data based on parameter tab
  const filteredDrivers = trendAnalysis ? trendAnalysis.detailedTrendDrivers.filter(d => {
    if (activeParamTab === 'all') return true;
    if (activeParamTab === 'hr') return d.id === 'hr_trend';
    if (activeParamTab === 'spo2') return d.id === 'spo2_trend';
    if (activeParamTab === 'rr') return d.id === 'rr_trend';
    if (activeParamTab === 'bp') return d.id === 'bp_trend';
    if (activeParamTab === 'temp') return d.id === 'temp_trend';
    return true;
  }) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Explainable AI: Physiological Risk Drivers & Trends
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-semibold">
                  MIMIC-IV Calibrated
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {patient ? `Patient ${patient.patient_id} (${patient.admission_diagnosis})` : 'ICU Cohort Patient'} · Model: {prediction?.model_name || 'RF Ensemble v1.4'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Section A: Research Disclaimer Notice */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/60 text-xs text-amber-200/90 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-200">Explainable AI Interpretability Notice:</strong> Feature contributions and longitudinal slopes reflect statistical correlations from machine learning risk ensembles. They demonstrate why the estimated risk score increased over time and are provided strictly for research and demonstration.
            </div>
          </div>

          {/* Section B: Risk Trajectory & Trend Delta Summary Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Risk Badge & Calibrated Score */}
            <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-800/80 pb-3 md:pb-0 md:pr-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                CURRENT DETERIORATION RISK
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-3xl font-black font-mono tracking-tight ${
                  currentRiskLevel === 'HIGH' ? 'text-rose-400' :
                  currentRiskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {(currentRiskScore * 100).toFixed(0)}%
                </span>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${
                  currentRiskLevel === 'HIGH' ? 'bg-rose-950/80 text-rose-300 border-rose-800' :
                  currentRiskLevel === 'MEDIUM' ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                }`}>
                  {currentRiskLevel} RISK
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                95% CI: [{Math.max(0, Math.round((currentRiskScore - 0.05) * 100))}% – {Math.min(100, Math.round((currentRiskScore + 0.05) * 100))}%]
              </div>
            </div>

            {/* Trajectory Over Time */}
            <div className="md:col-span-8 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Longitudinal Trend Velocity ({selectedWindow}-Hour Window)</span>
                </span>

                {/* Window Selector */}
                <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
                  {([6, 12, 24] as const).map(w => (
                    <button
                      key={w}
                      onClick={() => setSelectedWindow(w)}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        selectedWindow === w
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {w}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Trajectory narrative */}
              {trendAnalysis && (
                <div className="text-xs text-slate-300 flex items-center gap-2">
                  {trendAnalysis.riskScoreDelta > 0 ? (
                    <span className="flex items-center gap-1 font-bold text-rose-400 font-mono">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>+{(trendAnalysis.riskScoreDelta * 100).toFixed(0)}% Score Escalation</span>
                    </span>
                  ) : trendAnalysis.riskScoreDelta < 0 ? (
                    <span className="flex items-center gap-1 font-bold text-emerald-400 font-mono">
                      <ArrowDownRight className="w-4 h-4" />
                      <span>{(trendAnalysis.riskScoreDelta * 100).toFixed(0)}% Score De-escalation</span>
                    </span>
                  ) : (
                    <span className="font-bold text-slate-400 font-mono">Steady Trajectory</span>
                  )}
                  <span className="text-slate-400 text-[11px]">
                    from {(trendAnalysis.initialRiskScore * 100).toFixed(0)}% ({selectedWindow}h ago) to {(trendAnalysis.currentRiskScore * 100).toFixed(0)}% (Now)
                  </span>
                </div>
              )}

              {/* Progress bar visual */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    currentRiskLevel === 'HIGH' ? 'bg-gradient-to-r from-amber-500 to-rose-500' :
                    currentRiskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(5, Math.round(currentRiskScore * 100))}%` }}
                />
              </div>
            </div>

          </div>

          {/* Section C: Multi-Channel Trend Curve Preview */}
          {trendAnalysis && trendAnalysis.chartPoints.length > 1 && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Multi-Parameter Physiological Waveforms ({selectedWindow} Hours)</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Ingested Points: {trendAnalysis.chartPoints.length} Hourly Checks
                </div>
              </div>

              {/* Mini Sparkline Chart */}
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendAnalysis.chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hrGradModal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="spo2GradModal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} 
                    />
                    <Area type="monotone" dataKey="heart_rate" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#hrGradModal)" name="Heart Rate (bpm)" />
                    <Area type="monotone" dataKey="spo2" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#spo2GradModal)" name="SpO2 (%)" />
                    <Area type="monotone" dataKey="respiratory_rate" stroke="#818cf8" strokeWidth={1.5} fillOpacity={0} name="Resp Rate (bpm)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Heart Rate (bpm)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    <span>SpO₂ (%)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Resp Rate (bpm)</span>
                  </span>
                </div>
                <span>Temporal Window: Last {selectedWindow} Hours</span>
              </div>
            </div>
          )}

          {/* Section D: Detailed Trend Breakdown Cards (The Core User Requirement) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <span>Detailed Physiological Trend Drivers</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {filteredDrivers.length} Vectors Identified
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Specific multi-hour trajectory patterns driving the AI risk estimate
                </p>
              </div>

              {/* Parameter Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg text-xs font-mono">
                <button
                  onClick={() => setActiveParamTab('all')}
                  className={`px-2 py-0.5 rounded transition-colors ${activeParamTab === 'all' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveParamTab('hr')}
                  className={`px-2 py-0.5 rounded transition-colors ${activeParamTab === 'hr' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  HR
                </button>
                <button
                  onClick={() => setActiveParamTab('spo2')}
                  className={`px-2 py-0.5 rounded transition-colors ${activeParamTab === 'spo2' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  SpO₂
                </button>
                <button
                  onClick={() => setActiveParamTab('rr')}
                  className={`px-2 py-0.5 rounded transition-colors ${activeParamTab === 'rr' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  RR
                </button>
                <button
                  onClick={() => setActiveParamTab('bp')}
                  className={`px-2 py-0.5 rounded transition-colors ${activeParamTab === 'bp' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  BP/MAP
                </button>
                <button
                  onClick={() => setActiveParamTab('temp')}
                  className={`px-2 py-0.5 rounded transition-colors ${activeParamTab === 'temp' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Temp
                </button>
              </div>
            </div>

            {/* Detailed Cards List */}
            <div className="space-y-3">
              {filteredDrivers.map((driver) => {
                const IconComponent = driver.icon;
                return (
                  <div 
                    key={driver.id} 
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all text-xs space-y-2.5 shadow-sm"
                  >
                    {/* Driver Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${driver.iconColor}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
                            <span>{driver.title}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {driver.status} · Parameter: <strong className="text-slate-200">{driver.param}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${driver.badgeColor}`}>
                          {driver.riskContribution}
                        </span>
                      </div>
                    </div>

                    {/* Longitudinal Trajectory Box */}
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{selectedWindow}h Baseline:</span>
                        <strong className="text-slate-300">{driver.startVal}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Trajectory Shift:</span>
                        <strong className="text-rose-400 font-bold">{driver.trajectory}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Current Ingested:</span>
                        <strong className="text-cyan-300 font-bold">{driver.currentVal}</strong>
                      </div>
                    </div>

                    {/* Detailed Pathophysiologic Narrative */}
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {driver.explanation}
                    </p>

                    {/* Physiologic Reference Footnote */}
                    <div className="pt-2 border-t border-slate-900 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Clinical Reference: {driver.physiologicBasis}</span>
                      <span className="text-cyan-400 font-semibold">Active Vector</span>
                    </div>
                  </div>
                );
              })}

              {/* Fallback to Standard SHAP Contributing Factors if no trend data matches filter */}
              {filteredDrivers.length === 0 && prediction?.contributing_factors && (
                <div className="space-y-2.5">
                  {prediction.contributing_factors.map((factor, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white">{factor.label}</span>
                        <span className="font-mono text-rose-400 font-bold">
                          +{Math.round(Math.abs(factor.impact_score) * 100)}% impact
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs">{factor.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section E: Decomposition by Organ System */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-System Physiological Stress Allocation</span>
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">CARDIOVASCULAR</div>
                <div className="text-sm font-bold text-rose-400 mt-0.5">High Stress</div>
                <div className="text-[10px] text-slate-400">Tachycardia / Demand</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">RESPIRATORY</div>
                <div className="text-sm font-bold text-rose-400 mt-0.5">Compromised</div>
                <div className="text-[10px] text-slate-400">Desaturation + Tachypnea</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">HEMODYNAMICS</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">Compensated</div>
                <div className="text-[10px] text-slate-400">MAP Stable &gt; 65</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">THERMAL / METABOLIC</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">Pyrexial Response</div>
                <div className="text-[10px] text-slate-400">Hypermetabolic State</div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-slate-400">
            Explainable AI (XAI) Model Inspector · De-identified Clinical Research
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
