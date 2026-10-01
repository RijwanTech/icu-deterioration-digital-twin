import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Cpu, 
  LineChart, 
  FlaskConical, 
  BellRing
} from 'lucide-react';
import { Patient } from '../types';

interface MobileBottomNavProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  selectedPatient: Patient | null;
  activeAlertsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeScreen,
  onNavigate,
  selectedPatient,
  activeAlertsCount
}) => {
  const items = [
    { id: 'dashboard', label: 'ICU', icon: LayoutDashboard },
    { id: 'patients-list', label: 'Cohort', icon: Users },
    { id: 'digital-twin', label: 'Twin', icon: Cpu, disabled: !selectedPatient },
    { id: 'analysis', label: 'Trends', icon: LineChart, disabled: !selectedPatient },
    { id: 'simulation', label: 'Sim', icon: FlaskConical, disabled: !selectedPatient },
    { id: 'alerts', label: 'Alerts', icon: BellRing, badge: activeAlertsCount }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1 flex items-center justify-around pb-safe shadow-2xl">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeScreen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => !item.disabled && onNavigate(item.id)}
            disabled={item.disabled}
            className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              isActive
                ? 'text-cyan-400 bg-cyan-950/40 font-bold'
                : item.disabled
                ? 'text-slate-700 opacity-40 cursor-not-allowed'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-cyan-400 scale-110' : ''}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute -top-0.5 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
