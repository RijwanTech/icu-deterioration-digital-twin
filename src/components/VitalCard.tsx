import React from 'react';
import { ArrowUp, ArrowDown, Minus, Activity, Heart, Wind, Droplets, Thermometer } from 'lucide-react';

interface VitalCardProps {
  label: string;
  value: string | number;
  unit: string;
  delta?: number;
  deltaLabel?: string;
  timestamp: string;
  referenceRange: string;
  iconType?: 'heart' | 'spo2' | 'respiratory' | 'bp' | 'temperature';
  status?: 'nominal' | 'elevated' | 'critical';
}

export const VitalCard: React.FC<VitalCardProps> = ({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  timestamp,
  referenceRange,
  iconType = 'heart',
  status = 'nominal'
}) => {
  const getIcon = () => {
    switch (iconType) {
      case 'heart':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'spo2':
        return <Droplets className="w-4 h-4 text-cyan-300" />;
      case 'respiratory':
        return <Wind className="w-4 h-4 text-indigo-300" />;
      case 'bp':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'temperature':
        return <Thermometer className="w-4 h-4 text-amber-300" />;
      default:
        return <Activity className="w-4 h-4 text-slate-300" />;
    }
  };

  const getStatusBorder = () => {
    switch (status) {
      case 'critical':
        return 'border-rose-600 bg-rose-950/70 shadow-[0_0_15px_rgba(244,63,94,0.15)]';
      case 'elevated':
        return 'border-amber-600 bg-amber-950/70 shadow-[0_0_15px_rgba(245,158,11,0.15)]';
      default:
        return 'border-slate-800 bg-slate-900/90 hover:border-slate-700';
    }
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    } catch {
      return ts;
    }
  };

  return (
    <div className={`p-4 rounded-2xl border ${getStatusBorder()} transition-all relative overflow-hidden group shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800/90 border border-slate-700">
            {getIcon()}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{label}</span>
        </div>
        
        {delta !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-mono font-bold ${
            delta > 0 ? (iconType === 'spo2' ? 'text-emerald-300' : 'text-amber-300') :
            delta < 0 ? (iconType === 'spo2' ? 'text-rose-300' : 'text-emerald-300') :
            'text-slate-300'
          }`}>
            {delta > 0 ? (
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : delta < 0 ? (
              <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
            <span>{delta > 0 ? `+${delta}` : delta}</span>
            {deltaLabel && <span className="text-[10px] text-slate-400 font-normal">({deltaLabel})</span>}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 my-1.5">
        <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white tabular-nums">
          {value}
        </span>
        <span className="text-xs font-mono uppercase font-semibold text-slate-400">
          {unit}
        </span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
        <span>Ref: <strong className="text-slate-300">{referenceRange}</strong></span>
        <span>Rec: {formatTime(timestamp)}</span>
      </div>
    </div>
  );
};
