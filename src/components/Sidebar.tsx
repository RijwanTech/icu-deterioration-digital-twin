import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Cpu, 
  LineChart, 
  FlaskConical, 
  BellRing, 
  LogOut, 
  UserCheck,
  ChevronRight,
  Activity,
  Sparkles
} from 'lucide-react';
import { Patient } from '../types';

interface SidebarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  selectedPatient: Patient | null;
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  activeAlertsCount: number;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onNavigate,
  selectedPatient,
  patients,
  onSelectPatient,
  activeAlertsCount,
  onLogout
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients-list', label: 'Patients', icon: Users, badge: patients.length },
    { id: 'digital-twin', label: 'Digital Twin', icon: Cpu, disabled: !selectedPatient },
    { id: 'analysis', label: 'Analysis', icon: LineChart, disabled: !selectedPatient },
    { id: 'simulation', label: 'Simulation', icon: FlaskConical, disabled: !selectedPatient },
    { id: 'alerts', label: 'Alerts', icon: BellRing, badge: activeAlertsCount > 0 ? activeAlertsCount : undefined }
  ];

  return (
    <aside className="hidden md:flex w-64 bg-slate-950/80 backdrop-blur-md border-r border-slate-800/80 flex-col shrink-0 h-full select-none">
      {/* Active patient selector widget */}
      <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/40">
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>Active Patient Twin</span>
          </span>
          {selectedPatient && (
            <span className="text-[9px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
              LIVE SYNC
            </span>
          )}
        </div>

        {selectedPatient ? (
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md hover:border-slate-700 transition-all flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                <span className="text-cyan-300">{selectedPatient.patient_id}</span>
                <span className="text-xs font-normal text-slate-400">· {selectedPatient.bed_number}</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[130px] font-sans mt-0.5">
                {selectedPatient.admission_diagnosis}
              </div>
            </div>

            <div className={`text-xs font-mono font-bold px-2 py-1 rounded-lg border shadow-sm ${
              selectedPatient.risk_level === 'HIGH' ? 'bg-rose-950/80 text-rose-300 border-rose-800/80' :
              selectedPatient.risk_level === 'MEDIUM' ? 'bg-amber-950/80 text-amber-300 border-amber-800/80' :
              'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
            }`}>
              {(selectedPatient.risk_score * 100).toFixed(0)}%
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 text-xs text-slate-500 text-center">
            No patient selected
          </div>
        )}
      </div>

      {/* Main navigation list */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && onNavigate(item.id)}
              disabled={item.disabled}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/60 to-slate-900 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : item.disabled
                  ? 'text-slate-700 opacity-40 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400 scale-110' : ''}`} />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                  item.id === 'alerts' && item.badge > 0
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick patient switcher list */}
        <div className="pt-4 mt-4 border-t border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
            <span>ICU Cohort ({patients.length})</span>
            <span className="text-[10px] text-cyan-400/80">Quick Switch</span>
          </div>

          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            {patients.slice(0, 10).map(p => {
              const isCurrent = selectedPatient?.patient_id === p.patient_id;
              return (
                <button
                  key={p.patient_id}
                  onClick={() => onSelectPatient(p)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/40 text-cyan-200 font-bold border border-cyan-800/60 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full ${
                      p.risk_level === 'HIGH' ? 'bg-rose-500' :
                      p.risk_level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <span className="font-mono">{p.patient_id}</span>
                    <span className="text-[11px] text-slate-400 truncate">{p.bed_number}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                    {(p.risk_score * 100).toFixed(0)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer info & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/70 mb-2.5 text-[11px] text-slate-400 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <div className="truncate">
            <div className="font-semibold text-slate-200">ML: RF-Ensemble-v1.4</div>
            <div className="text-[10px] text-slate-400 truncate">Calibrated on ICU Cohort</div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/40 transition-colors text-xs font-semibold"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Session</span>
        </button>
      </div>
    </aside>
  );
};
