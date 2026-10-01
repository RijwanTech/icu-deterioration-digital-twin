import React from 'react';
import { Patient, RiskLevel } from '../types';
import { 
  Cpu, 
  LineChart, 
  FlaskConical, 
  Clock, 
  ShieldAlert, 
  Activity, 
  User, 
  Bed, 
  Calendar, 
  Download, 
  PlusCircle, 
  HelpCircle,
  Sparkles,
  Layers
} from 'lucide-react';

interface PatientHeaderProps {
  patient: Patient;
  activeTab: 'twin' | 'vitals' | 'trends' | 'risk' | 'timeline' | 'simulation';
  onSelectTab: (tab: 'twin' | 'vitals' | 'trends' | 'risk' | 'timeline' | 'simulation') => void;
  onOpenAIExplanation?: () => void;
  onExportCSV?: () => void;
  onOpenLogVital?: () => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  activeTab,
  onSelectTab,
  onOpenAIExplanation,
  onExportCSV,
  onOpenLogVital
}) => {
  const getRiskBadge = (level: RiskLevel, score: number) => {
    switch (level) {
      case 'HIGH':
        return {
          label: 'HIGH RISK',
          color: 'bg-rose-950/80 text-rose-300 border-rose-800/80 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
          dot: 'bg-rose-500'
        };
      case 'MEDIUM':
        return {
          label: 'MEDIUM RISK',
          color: 'bg-amber-950/80 text-amber-300 border-amber-800/80 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
          dot: 'bg-amber-500'
        };
      default:
        return {
          label: 'LOW RISK',
          color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
          dot: 'bg-emerald-500'
        };
    }
  };

  const badge = getRiskBadge(patient.risk_level, patient.risk_score);

  const formatAdmissionTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return `${d.toLocaleDateString()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return ts;
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 p-3.5 sm:p-5 shrink-0 space-y-3 shadow-md">
      {/* Top Row: Demographics & Risk Score Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 flex items-center justify-center text-cyan-300 font-black font-mono text-base sm:text-lg shrink-0 shadow-inner">
            {patient.patient_id}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Patient {patient.patient_id}
              </h1>
              <span className="text-slate-400 text-xs sm:text-sm font-medium">
                · {patient.age}y {patient.gender}
              </span>
              <span className="text-[11px] font-mono font-semibold text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded-md border border-cyan-800/60">
                {patient.bed_number}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {patient.unit}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
              <span className="text-slate-300 font-medium">
                <strong>Dx:</strong> {patient.admission_diagnosis}
              </span>
              <span className="hidden sm:inline text-slate-600" aria-hidden="true">•</span>
              <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
                Admitted: {formatAdmissionTime(patient.icu_admission_time)}
              </span>
            </div>
          </div>
        </div>

        {/* Risk Score & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className={`px-3 py-1.5 sm:py-2 rounded-xl border ${badge.color} flex items-center gap-2 sm:gap-3`}>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400">ESTIMATED RISK</div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
                <span className="text-base sm:text-lg font-bold font-mono tabular-nums">
                  {(patient.risk_score * 100).toFixed(0)}%
                </span>
                <span className="text-[11px] font-bold font-mono tracking-wider">
                  {badge.label}
                </span>
              </div>
            </div>
          </div>

          {onOpenLogVital && (
            <button
              onClick={onOpenLogVital}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Record a new vital sign measurement"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Log Vitals</span>
            </button>
          )}

          {onOpenAIExplanation && (
            <button
              onClick={onOpenAIExplanation}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Explain XAI</span>
              <span className="sm:hidden">XAI</span>
            </button>
          )}

          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all flex items-center gap-1.5 active:scale-95"
              title="Export historical vitals to CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-800/80 no-scrollbar">
        <button
          onClick={() => onSelectTab('twin')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'twin'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Digital Twin View</span>
        </button>

        <button
          onClick={() => onSelectTab('trends')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'trends'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <LineChart className="w-3.5 h-3.5" />
          <span>Waveforms & Trends</span>
        </button>

        <button
          onClick={() => onSelectTab('simulation')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'simulation'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>What-If Sandbox</span>
        </button>

        <button
          onClick={() => onOpenAIExplanation && onOpenAIExplanation()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-all"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span>SHAP Risk Factors</span>
        </button>
      </div>
    </div>
  );
};
