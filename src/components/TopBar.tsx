import React, { useState } from 'react';
import { Bell, Sliders, LogOut, Activity, User, ChevronDown, Menu, X, Users, Cpu, LineChart, FlaskConical } from 'lucide-react';
import { UserProfile, Patient } from '../types';

interface TopBarProps {
  user: UserProfile | null;
  activeAlertsCount: number;
  onOpenAlerts: () => void;
  onOpenConfig: () => void;
  onLogout: () => void;
  activeScreen: string;
  onNavigate: (screen: string) => void;
  selectedPatient?: Patient | null;
  patients?: Patient[];
  onSelectPatient?: (p: Patient) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  activeAlertsCount,
  onOpenAlerts,
  onOpenConfig,
  onLogout,
  activeScreen,
  onNavigate,
  selectedPatient,
  patients = [],
  onSelectPatient
}) => {
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="h-14 md:h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 md:px-6 flex items-center justify-between z-30 shrink-0 sticky top-0 shadow-lg shadow-black/40">
      
      {/* Zone 1: Wordmark & Mobile Quick Selector */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/25 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Activity className="w-4.5 h-4.5 text-cyan-400" />
          </div>
          <div>
            <div className="text-sm md:text-base font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
              <span className="bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                ICU DIGITAL TWIN
              </span>
              <span className="text-[9px] md:text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-800/80 text-cyan-300 font-semibold tracking-normal hidden sm:inline-block">
                RESEARCH PROTOTYPE
              </span>
            </div>
            <div className="text-[9px] md:text-[10px] text-slate-400 font-mono hidden md:block">
              AI-Based Early Deterioration Prediction & Clinical Telemetry
            </div>
          </div>
        </button>

        {/* Mobile Quick Patient Pill with Dropdown */}
        {selectedPatient && onSelectPatient && (
          <div className="relative md:hidden ml-1">
            <button
              onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-200"
            >
              <span className={`w-2 h-2 rounded-full ${
                selectedPatient.risk_level === 'HIGH' ? 'bg-rose-500 animate-pulse' :
                selectedPatient.risk_level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              <span className="font-bold">{selectedPatient.patient_id}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isPatientDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in">
                <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800 mb-1">
                  Select ICU Patient
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {patients.map((p) => (
                    <button
                      key={p.patient_id}
                      onClick={() => {
                        onSelectPatient(p);
                        setIsPatientDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        selectedPatient.patient_id === p.patient_id
                          ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          p.risk_level === 'HIGH' ? 'bg-rose-500' :
                          p.risk_level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span>{p.patient_id}</span>
                        <span className="text-[10px] text-slate-400">{p.bed_number}</span>
                      </div>
                      <span className="font-mono text-[10px]">{(p.risk_score * 100).toFixed(0)}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone 2: Desktop Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`hover:text-white transition-colors py-1 relative ${
            activeScreen === 'dashboard' ? 'text-cyan-400 font-bold' : ''
          }`}
        >
          <span>Dashboard</span>
          {activeScreen === 'dashboard' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          )}
        </button>
        <button
          onClick={() => onNavigate('patients-list')}
          className={`hover:text-white transition-colors py-1 relative ${
            activeScreen === 'patients-list' ? 'text-cyan-400 font-bold' : ''
          }`}
        >
          <span>Patients</span>
          {activeScreen === 'patients-list' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          )}
        </button>
        <button
          onClick={() => onNavigate('digital-twin')}
          className={`hover:text-white transition-colors py-1 relative ${
            activeScreen === 'digital-twin' ? 'text-cyan-400 font-bold' : ''
          }`}
        >
          <span>Digital Twin</span>
          {activeScreen === 'digital-twin' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          )}
        </button>
        <button
          onClick={() => onNavigate('analysis')}
          className={`hover:text-white transition-colors py-1 relative ${
            activeScreen === 'analysis' ? 'text-cyan-400 font-bold' : ''
          }`}
        >
          <span>Analysis</span>
          {activeScreen === 'analysis' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          )}
        </button>
        <button
          onClick={() => onNavigate('simulation')}
          className={`hover:text-white transition-colors py-1 relative ${
            activeScreen === 'simulation' ? 'text-cyan-400 font-bold' : ''
          }`}
        >
          <span>Simulation</span>
          {activeScreen === 'simulation' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          )}
        </button>
      </nav>

      {/* Zone 3: Actions & Quick Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Risk Threshold Config Button */}
        <button
          onClick={onOpenConfig}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
          title="Configure Risk Thresholds"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Alerts Trigger */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
          title="Active ICU Alerts"
        >
          <Bell className="w-4 h-4" />
          {activeAlertsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]">
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* User Identity / Logout */}
        {user && (
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-800 text-xs">
            <div className="hidden lg:block text-right">
              <div className="font-semibold text-slate-200">{user.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{user.role}</div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-900 transition-colors"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
