import React, { useState, useEffect } from 'react';
import { Patient, SimulationInput, SimulationResult, VitalSign } from '../types';
import { PatientHeader } from '../components/PatientHeader';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';
import { 
  FlaskConical, 
  RotateCcw, 
  ArrowRight, 
  ShieldAlert, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Sparkles,
  Info,
  Sliders
} from 'lucide-react';

interface WhatIfSimulationPageProps {
  patient: Patient;
  onNavigateTab: (tab: 'twin' | 'vitals' | 'trends' | 'risk' | 'timeline' | 'simulation') => void;
  onOpenAIExplanation: () => void;
  onApplySimulationToTwin?: (patientId: string, simulatedVitals: any) => Promise<void>;
}

export const WhatIfSimulationPage: React.FC<WhatIfSimulationPageProps> = ({
  patient,
  onNavigateTab,
  onOpenAIExplanation,
  onApplySimulationToTwin
}) => {
  const current = patient.current_state;

  // Form states initialized to patient's current vitals
  const [hr, setHr] = useState<number>(current.heart_rate);
  const [sbp, setSbp] = useState<number>(current.systolic_bp);
  const [dbp, setDbp] = useState<number>(current.diastolic_bp);
  const [spo2, setSpo2] = useState<number>(current.spo2);
  const [rr, setRr] = useState<number>(current.respiratory_rate);
  const [temp, setTemp] = useState<number>(current.temperature);

  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync inputs if patient changes
  useEffect(() => {
    setHr(current.heart_rate);
    setSbp(current.systolic_bp);
    setDbp(current.diastolic_bp);
    setSpo2(current.spo2);
    setRr(current.respiratory_rate);
    setTemp(current.temperature);
    setSimulationResult(null);
  }, [patient.patient_id, current]);

  const handleRunSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSimulating(true);
    setErrorMsg(null);

    const input: SimulationInput = {
      patient_id: patient.patient_id,
      heart_rate: hr,
      systolic_bp: sbp,
      diastolic_bp: dbp,
      spo2: spo2,
      respiratory_rate: rr,
      temperature: temp
    };

    try {
      const result = await api.runSimulation(input);
      setSimulationResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Simulation execution failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetToCurrent = () => {
    setHr(current.heart_rate);
    setSbp(current.systolic_bp);
    setDbp(current.diastolic_bp);
    setSpo2(current.spo2);
    setRr(current.respiratory_rate);
    setTemp(current.temperature);
    setSimulationResult(null);
  };

  const handleApplyToTwin = async () => {
    if (!simulationResult || !onApplySimulationToTwin) return;
    setIsApplying(true);
    setApplySuccessMsg(null);
    setErrorMsg(null);

    try {
      await onApplySimulationToTwin(patient.patient_id, {
        heart_rate: hr,
        systolic_bp: sbp,
        diastolic_bp: dbp,
        spo2: spo2,
        respiratory_rate: rr,
        temperature: temp
      });
      setApplySuccessMsg(`Simulated physiological state permanently applied to Digital Twin (${patient.patient_id}).`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to apply simulation.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950">
      <DisclaimerBanner />

      <PatientHeader
        patient={patient}
        activeTab="simulation"
        onSelectTab={onNavigateTab}
        onOpenAIExplanation={onOpenAIExplanation}
      />

      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Simulation Header & Mandatory Disclaimers */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">
                What-If Digital Twin Scenario Simulator
              </h1>
              <p className="text-xs text-slate-400">
                Evaluate model deterioration probability under hypothetical counterfactual physiological states.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/60 text-xs text-amber-200/90 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Mandatory Academic Disclaimer:</strong> Simulation represents model output under modified input assumptions and does not represent a clinical prediction, outcome guarantee, or treatment recommendation.
            </div>
          </div>
        </div>

        {applySuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200 flex items-center justify-between">
            <span>{applySuccessMsg}</span>
            <button
              onClick={() => onNavigateTab('twin')}
              className="px-2.5 py-1 rounded bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors"
            >
              View Active Twin →
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Main Grid: Parameter Controls (Left) + Model Comparison (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Adjust Simulation Variables</span>
              </span>
              <button
                onClick={handleResetToCurrent}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Baseline</span>
              </button>
            </div>

            <form onSubmit={handleRunSimulation} className="space-y-4 pt-2 border-t border-slate-800">
              {/* Heart Rate */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-300">Heart Rate (bpm)</span>
                  <span className="text-white font-bold">{hr} bpm (Current: {current.heart_rate})</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="180"
                  value={hr}
                  onChange={(e) => setHr(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>

              {/* SpO2 */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-300">SpO2 Saturation (%)</span>
                  <span className="text-white font-bold">{spo2}% (Current: {current.spo2}%)</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="100"
                  value={spo2}
                  onChange={(e) => setSpo2(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>

              {/* Respiratory Rate */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-300">Respiratory Rate (bpm)</span>
                  <span className="text-white font-bold">{rr} bpm (Current: {current.respiratory_rate})</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="45"
                  value={rr}
                  onChange={(e) => setRr(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>

              {/* Blood Pressure (SBP & DBP) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-slate-300">Systolic (mmHg)</span>
                    <span className="text-white font-bold">{sbp}</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="210"
                    value={sbp}
                    onChange={(e) => setSbp(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-slate-300">Diastolic (mmHg)</span>
                    <span className="text-white font-bold">{dbp}</span>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="120"
                    value={dbp}
                    onChange={(e) => setDbp(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-300">Core Temp (°C)</span>
                  <span className="text-white font-bold">{temp.toFixed(1)} °C (Current: {current.temperature.toFixed(1)})</span>
                </div>
                <input
                  type="range"
                  min="34.5"
                  max="41.0"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isSimulating}
                className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50"
              >
                {isSimulating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FlaskConical className="w-4 h-4" />
                    <span>RUN WHAT-IF SIMULATION</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Comparison Column */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            {simulationResult ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Simulation Comparative Results
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    Model: {simulationResult.model_version}
                  </span>
                </div>

                {/* Comparative Risk Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Current State */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] font-mono text-slate-400 uppercase mb-1">
                      CURRENT BASELINE STATE
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-bold font-mono tabular-nums ${
                        simulationResult.current_state.risk_level === 'HIGH' ? 'text-rose-400' :
                        simulationResult.current_state.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {(simulationResult.current_state.risk_score * 100).toFixed(0)}%
                      </span>
                      <span className={`text-xs font-bold font-mono ${
                        simulationResult.current_state.risk_level === 'HIGH' ? 'text-rose-400' :
                        simulationResult.current_state.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {simulationResult.current_state.risk_level}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 font-mono">
                      HR {patient.current_state.heart_rate} · SpO2 {patient.current_state.spo2}% · BP {patient.current_state.systolic_bp}/{patient.current_state.diastolic_bp}
                    </div>
                  </div>

                  {/* Simulated State */}
                  <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/80">
                    <div className="text-[11px] font-mono text-cyan-400 uppercase mb-1">
                      SIMULATED SCENARIO STATE
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-bold font-mono tabular-nums ${
                        simulationResult.simulated_state.risk_level === 'HIGH' ? 'text-rose-400' :
                        simulationResult.simulated_state.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {(simulationResult.simulated_state.risk_score * 100).toFixed(0)}%
                      </span>
                      <span className={`text-xs font-bold font-mono ${
                        simulationResult.simulated_state.risk_level === 'HIGH' ? 'text-rose-400' :
                        simulationResult.simulated_state.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {simulationResult.simulated_state.risk_level}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-cyan-300/80 font-mono">
                      HR {hr} · SpO2 {spo2}% · BP {sbp}/{dbp}
                    </div>
                  </div>
                </div>

                {/* Risk Difference Callout */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  simulationResult.risk_delta < 0
                    ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                    : simulationResult.risk_delta > 0
                    ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center gap-3">
                    {simulationResult.risk_delta < 0 ? (
                      <TrendingDown className="w-6 h-6 text-emerald-400 shrink-0" />
                    ) : simulationResult.risk_delta > 0 ? (
                      <TrendingUp className="w-6 h-6 text-rose-400 shrink-0" />
                    ) : (
                      <Minus className="w-6 h-6 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-semibold">Estimated Risk Difference</div>
                      <div className="text-[11px] text-slate-400">
                        {simulationResult.risk_delta < 0
                          ? 'Hypothetical parameters indicate reduced probability of deterioration.'
                          : simulationResult.risk_delta > 0
                          ? 'Hypothetical parameters increase cardiorespiratory strain index.'
                          : 'No net change in estimated model probability.'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono tabular-nums">
                      {simulationResult.risk_delta > 0 ? `+${simulationResult.risk_delta}` : simulationResult.risk_delta}
                    </div>
                    <div className="text-[10px] font-mono opacity-80">
                      ({simulationResult.risk_delta_percentage > 0 ? `+${simulationResult.risk_delta_percentage}` : simulationResult.risk_delta_percentage}% net change)
                    </div>
                  </div>
                </div>

                {/* Parameter Delta Comparison Table */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Subsystem Parameter Shifts
                    </span>
                    {onApplySimulationToTwin && (
                      <button
                        type="button"
                        onClick={handleApplyToTwin}
                        disabled={isApplying}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isApplying ? 'Applying State...' : 'Apply Changes to Digital Twin'}</span>
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400">
                        <tr>
                          <th className="py-2.5 px-3">Physiological Variable</th>
                          <th className="py-2.5 px-3">Current Baseline</th>
                          <th className="py-2.5 px-3">Simulated State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300">
                        {simulationResult.contributing_factors_delta.map((f, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-3 font-semibold text-white">{f.factor}</td>
                            <td className="py-2.5 px-3 text-slate-400">{f.before_impact}</td>
                            <td className="py-2.5 px-3 text-cyan-300 font-bold">{f.after_impact}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Explainable AI Simulation Root Cause */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="font-semibold text-slate-200 mb-1 flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Explainable AI Model Mechanism:</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed font-sans">
                    {simulationResult.risk_delta < 0
                      ? `Model risk decreased by ${Math.abs(simulationResult.risk_delta_percentage)}% because shifting vitals towards normal physiological setpoints (${hr} bpm, ${spo2}% SpO2, ${sbp}/${dbp} mmHg) lowered the predicted risk of decompensation.`
                      : simulationResult.risk_delta > 0
                      ? `Model risk increased by +${simulationResult.risk_delta_percentage}% because elevated cardiopulmonary stress variables increased model probability of impending deterioration.`
                      : 'Simulated parameters produce equivalent net deterioration probability under the current model feature weights.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-500">
                  <FlaskConical className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-white">No Active Simulation Executed</h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  Adjust physiological sliders on the left or select a preset hypothesis, then click "RUN WHAT-IF SIMULATION" to view estimated model trajectory changes.
                </p>
                <button
                  type="button"
                  onClick={() => handleRunSimulation()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Run Baseline Simulation
                </button>
              </div>
            )}

            <div className="pt-4 mt-6 border-t border-slate-800 text-[11px] text-slate-400">
              {simulationResult?.simulation_disclaimer || "Academic research tool: Counterfactual simulations are model outputs, not clinical treatment plans."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
