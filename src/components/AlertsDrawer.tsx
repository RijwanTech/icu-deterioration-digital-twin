import React from 'react';
import { X, Bell, ShieldAlert, Check, Clock, AlertTriangle } from 'lucide-react';
import { SystemAlert, RiskLevel } from '../types';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: SystemAlert[];
  onAcknowledge: (alertId: string) => void;
  onSelectPatient: (patientId: string) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onAcknowledge,
  onSelectPatient
}) => {
  if (!isOpen) return null;

  const unacknowledged = alerts.filter(a => !a.acknowledged);
  const acknowledged = alerts.filter(a => a.acknowledged);

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    } catch {
      return ts;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-950 border border-rose-800 text-rose-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">ICU Software Alerts</h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {unacknowledged.length} active notifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="p-3 bg-amber-950/20 border-b border-amber-900/30 text-[11px] text-amber-300/90 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>Prototype software alerts based on model threshold exceedance, not bedside hardware alarms.</span>
        </div>

        {/* List of alerts */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {unacknowledged.length === 0 && acknowledged.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No active alerts in current ICU cohort.
            </div>
          ) : (
            <>
              {unacknowledged.map(alert => (
                <div
                  key={alert.alert_id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    alert.risk_level === 'HIGH'
                      ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                      : 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs">
                        {alert.patient_id} ({alert.patient_bed})
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        alert.risk_level === 'HIGH' ? 'bg-rose-900/80 text-rose-300' : 'bg-amber-900/80 text-amber-300'
                      }`}>
                        {alert.risk_level} · {(alert.risk_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(alert.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-2 font-medium">
                    {alert.message}
                  </p>

                  <div className="text-[11px] text-slate-400 font-mono mb-3">
                    Primary Driver: <strong className="text-slate-200">{alert.contributing_factor}</strong>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        onSelectPatient(alert.patient_id);
                        onClose();
                      }}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Open Patient Twin →
                    </button>

                    <button
                      onClick={() => onAcknowledge(alert.alert_id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700 transition-colors"
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Acknowledge</span>
                    </button>
                  </div>
                </div>
              ))}

              {acknowledged.length > 0 && (
                <div className="pt-4 mt-4 border-t border-slate-800">
                  <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                    Acknowledged ({acknowledged.length})
                  </div>
                  <div className="space-y-2 opacity-60">
                    {acknowledged.map(alert => (
                      <div key={alert.alert_id} className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-300">{alert.patient_id} ({alert.patient_bed})</span>
                          <span className="text-[10px] font-mono">{formatTime(alert.timestamp)}</span>
                        </div>
                        <p className="text-[11px] truncate mt-1">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
