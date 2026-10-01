import React, { useState } from 'react';
import { VitalSign, RiskLevel } from '../types';
import { Heart, Wind, Activity, Thermometer, ShieldCheck, AlertCircle, Layers, CheckCircle2 } from 'lucide-react';

interface DigitalTwinViewProps {
  patientId: string;
  vitals: VitalSign;
  riskScore: number;
  riskLevel: RiskLevel;
  lastUpdated: string;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  patientId,
  vitals,
  riskScore,
  riskLevel,
  lastUpdated,
}) => {
  const [selectedOrgan, setSelectedOrgan] = useState<'cardiac' | 'pulmonary' | 'vascular' | 'metabolic'>('cardiac');

  const map = vitals.map || +((2 * vitals.diastolic_bp + vitals.systolic_bp) / 3).toFixed(1);
  const shockIndex = vitals.systolic_bp > 0 ? +(vitals.heart_rate / vitals.systolic_bp).toFixed(2) : 0.8;
  const pulsePressure = vitals.systolic_bp - vitals.diastolic_bp;

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'HIGH':
        return { 
          text: 'text-rose-300', 
          bg: 'bg-rose-950/80', 
          border: 'border-rose-700', 
          badge: 'bg-rose-950 text-rose-300 border-rose-600',
          ring: 'ring-rose-500/30' 
        };
      case 'MEDIUM':
        return { 
          text: 'text-amber-300', 
          bg: 'bg-amber-950/80', 
          border: 'border-amber-700', 
          badge: 'bg-amber-950 text-amber-300 border-amber-600',
          ring: 'ring-amber-500/30' 
        };
      default:
        return { 
          text: 'text-emerald-300', 
          bg: 'bg-emerald-950/80', 
          border: 'border-emerald-700', 
          badge: 'bg-emerald-950 text-emerald-300 border-emerald-600',
          ring: 'ring-emerald-500/30' 
        };
    }
  };

  const riskStyles = getRiskColor(riskLevel);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20 animate-pulse" />
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Physiological Digital Twin</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-cyan-300 border border-slate-700">
              ID: {patientId}-TWIN
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Dynamic computational state synced with ICU telemetry & time-series model.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">STATE SYNCHRONIZATION</div>
            <div className="text-xs font-mono font-bold text-emerald-300 flex items-center justify-end gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recorded {new Date(lastUpdated).toLocaleString()}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Subsystem quick selector tabs for mobile & tablet */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <button
          onClick={() => setSelectedOrgan('cardiac')}
          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
            selectedOrgan === 'cardiac'
              ? 'bg-rose-950/80 border-rose-500 text-white shadow-md'
              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Heart className={`w-4 h-4 ${vitals.heart_rate > 100 ? 'text-rose-400' : 'text-rose-300'}`} />
            <span>Cardiac</span>
          </div>
          <span className="font-mono text-[11px] text-slate-300">{vitals.heart_rate} bpm</span>
        </button>

        <button
          onClick={() => setSelectedOrgan('pulmonary')}
          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
            selectedOrgan === 'pulmonary'
              ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-md'
              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wind className={`w-4 h-4 ${vitals.spo2 < 93 ? 'text-rose-400' : 'text-cyan-300'}`} />
            <span>Pulmonary</span>
          </div>
          <span className="font-mono text-[11px] text-slate-300">{vitals.spo2}%</span>
        </button>

        <button
          onClick={() => setSelectedOrgan('vascular')}
          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
            selectedOrgan === 'vascular'
              ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-md'
              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Vascular</span>
          </div>
          <span className="font-mono text-[11px] text-slate-300">MAP {map}</span>
        </button>

        <button
          onClick={() => setSelectedOrgan('metabolic')}
          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
            selectedOrgan === 'metabolic'
              ? 'bg-amber-950/80 border-amber-500 text-white shadow-md'
              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-amber-400" />
            <span>Metabolic</span>
          </div>
          <span className="font-mono text-[11px] text-slate-300">{vitals.temperature.toFixed(1)}°C</span>
        </button>
      </div>

      {/* Main Grid: Visual Bio Model + System Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Organ Map Visual Stage */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-5 relative flex flex-col items-center justify-center min-h-[300px]">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

          {/* Central Human Silhouette & System Nodes */}
          <div className="relative w-56 h-64 flex items-center justify-center">
            {/* SVG Silhouette representation */}
            <svg viewBox="0 0 200 240" className="w-full h-full text-slate-800 fill-current opacity-40">
              <path d="M100,20 C110,20 118,28 118,38 C118,48 110,56 100,56 C90,56 82,48 82,38 C82,28 90,20 100,20 Z M80,62 L120,62 C135,62 145,74 142,92 L132,145 C130,150 126,155 120,155 L118,225 C118,232 110,235 104,235 C98,235 94,228 94,220 L94,165 L86,165 L86,220 C86,228 82,235 76,235 C70,235 62,232 62,225 L60,155 C54,155 50,150 48,145 L38,92 C35,74 45,62 60,62 Z" />
            </svg>

            {/* Organ System Interactive Nodes */}
            {/* 1. Pulmonary / Respiratory Node */}
            <button
              onClick={() => setSelectedOrgan('pulmonary')}
              className={`absolute top-14 left-1/2 -translate-x-1/2 p-2.5 rounded-full border transition-all ${
                selectedOrgan === 'pulmonary'
                  ? 'bg-cyan-950 border-cyan-400 shadow-lg shadow-cyan-500/40 ring-4 ring-cyan-400/40 scale-110'
                  : 'bg-slate-900 border-slate-700 hover:border-cyan-400'
              }`}
              title="Inspect Pulmonary Subsystem"
            >
              <Wind className={`w-5 h-5 ${vitals.spo2 < 93 ? 'text-rose-400' : 'text-cyan-300'}`} />
            </button>

            {/* 2. Cardiac / Hemodynamic Node */}
            <button
              onClick={() => setSelectedOrgan('cardiac')}
              className={`absolute top-26 left-[38%] -translate-x-1/2 p-2.5 rounded-full border transition-all ${
                selectedOrgan === 'cardiac'
                  ? 'bg-rose-950 border-rose-400 shadow-lg shadow-rose-500/40 ring-4 ring-rose-400/40 scale-110'
                  : 'bg-slate-900 border-slate-700 hover:border-rose-400'
              }`}
              title="Inspect Cardiac Subsystem"
            >
              <Heart className={`w-5 h-5 ${vitals.heart_rate > 105 ? 'text-rose-400' : 'text-rose-300'} animate-pulse`} />
            </button>

            {/* 3. Vascular / Perfusion Node */}
            <button
              onClick={() => setSelectedOrgan('vascular')}
              className={`absolute top-40 left-1/2 -translate-x-1/2 p-2.5 rounded-full border transition-all ${
                selectedOrgan === 'vascular'
                  ? 'bg-emerald-950 border-emerald-400 shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-400/40 scale-110'
                  : 'bg-slate-900 border-slate-700 hover:border-emerald-400'
              }`}
              title="Inspect Vascular Subsystem"
            >
              <Activity className="w-5 h-5 text-emerald-400" />
            </button>

            {/* 4. Metabolic / Thermal Node */}
            <button
              onClick={() => setSelectedOrgan('metabolic')}
              className={`absolute top-22 right-4 p-2.5 rounded-full border transition-all ${
                selectedOrgan === 'metabolic'
                  ? 'bg-amber-950 border-amber-400 shadow-lg shadow-amber-500/40 ring-4 ring-amber-400/40 scale-110'
                  : 'bg-slate-900 border-slate-700 hover:border-amber-400'
              }`}
              title="Inspect Metabolic Subsystem"
            >
              <Thermometer className="w-5 h-5 text-amber-400" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-xs text-slate-300 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Pulmonary
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Cardiac
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Vascular
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Metabolic
            </span>
          </div>
        </div>

        {/* Organ Inspector & Biometric Twin Analytics */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Active Inspector: {selectedOrgan.toUpperCase()} SUBSYSTEM
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                REAL-TIME TELEMETRY
              </span>
            </div>

            {selectedOrgan === 'cardiac' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[11px] uppercase">HEART RATE</div>
                    <div className="text-2xl font-bold text-white tabular-nums mt-0.5">{vitals.heart_rate} <span className="text-xs font-normal text-slate-400">bpm</span></div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Reference: 60–100 bpm</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[11px] uppercase">SHOCK INDEX (HR/SBP)</div>
                    <div className={`text-2xl font-bold tabular-nums mt-0.5 ${shockIndex > 0.9 ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {shockIndex}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Reference: 0.5–0.7</div>
                  </div>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  Cardiovascular twin state registers {vitals.heart_rate > 100 ? 'sinus tachycardia with heightened myocardial oxygen demand and sympathetic activation' : 'stable chronotropic pacing within nominal physiologic targets'}.
                </p>
              </div>
            )}

            {selectedOrgan === 'pulmonary' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[11px] uppercase">PULSE OXIMETRY (SPO2)</div>
                    <div className={`text-2xl font-bold tabular-nums mt-0.5 ${vitals.spo2 < 93 ? 'text-rose-300' : 'text-cyan-300'}`}>
                      {vitals.spo2}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Target: 95–100%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[11px] uppercase">RESPIRATORY RATE</div>
                    <div className={`text-2xl font-bold tabular-nums mt-0.5 ${vitals.respiratory_rate > 22 ? 'text-amber-300' : 'text-white'}`}>
                      {vitals.respiratory_rate} <span className="text-xs font-normal text-slate-400">bpm</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Reference: 12–20 bpm</div>
                  </div>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  Pulmonary twin computes minute ventilation workload. {vitals.spo2 < 94 ? 'Risk of hypoxic gas exchange compromise detected, indicating potential V/Q mismatch.' : 'Adequate alveolar gas exchange and respiratory mechanics.'}
                </p>
              </div>
            )}

            {selectedOrgan === 'vascular' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[11px] uppercase">MEAN ARTERIAL PRESSURE</div>
                    <div className={`text-2xl font-bold tabular-nums mt-0.5 ${map < 65 ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {map} <span className="text-xs font-normal text-slate-400">mmHg</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Perfusion Target: &gt; 65 mmHg</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[11px] uppercase">PULSE PRESSURE (SBP - DBP)</div>
                    <div className="text-2xl font-bold text-white tabular-nums mt-0.5">
                      {pulsePressure} <span className="text-xs font-normal text-slate-400">mmHg</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Reference: 30–50 mmHg</div>
                  </div>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  Vascular compartment indicates systemic arterial compliance. {map < 65 ? 'Critical end-organ hypoperfusion threshold breach.' : 'Adequate perfusion gradient maintained.'}
                </p>
              </div>
            )}

            {selectedOrgan === 'metabolic' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[11px] uppercase">CORE TEMPERATURE</div>
                    <div className={`text-2xl font-bold tabular-nums mt-0.5 ${vitals.temperature >= 38.3 ? 'text-rose-300' : 'text-white'}`}>
                      {vitals.temperature.toFixed(1)} <span className="text-xs font-normal text-slate-400">°C</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Normothermia: 36.5–37.5 °C</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[11px] uppercase">SIRS TEMPERATURE CRITERIA</div>
                    <div className={`text-xl font-bold font-mono mt-0.5 ${vitals.temperature >= 38.0 || vitals.temperature <= 36.0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {vitals.temperature >= 38.0 || vitals.temperature <= 36.0 ? 'POSITIVE' : 'NEGATIVE'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Rule: &gt;38.0 or &lt;36.0 °C</div>
                  </div>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  Metabolic twin evaluates thermoregulatory demand. Pyrexial elevations increase basal metabolic rate by ~10–13% per °C.
                </p>
              </div>
            )}
          </div>

          {/* Aggregate Twin Health Bar */}
          <div className={`p-4 rounded-xl border ${riskStyles.border} ${riskStyles.bg} flex items-center justify-between shadow-lg`}>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">Composite Deterioration Risk</div>
              <div className="text-xs text-slate-300 mt-0.5">Calibrated ML Risk Horizon: 6–12h Deterioration Window</div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-black font-mono tabular-nums ${riskStyles.text}`}>
                {(riskScore * 100).toFixed(0)}%
              </div>
              <div className={`text-xs font-bold font-mono tracking-wider ${riskStyles.text}`}>
                {riskLevel} RISK
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
