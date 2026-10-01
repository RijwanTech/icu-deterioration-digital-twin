import React, { useState } from 'react';
import { X, Activity, ShieldAlert, Heart, Wind, Droplets, Thermometer, Clock, ArrowRight } from 'lucide-react';
import { Patient, VitalSign } from '../types';
import { api } from '../services/api';
import { calculateDeteriorationRisk } from '../services/mlEngine';

interface LogVitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onVitalLogged: (updatedPatient: Patient) => void;
}

export const LogVitalModal: React.FC<LogVitalModalProps> = ({
  isOpen,
  onClose,
  patient,
  onVitalLogged
}) => {
  const current = patient.current_state;

  const [hr, setHr] = useState(current.heart_rate);
  const [sbp, setSbp] = useState(current.systolic_bp);
  const [dbp, setDbp] = useState(current.diastolic_bp);
  const [spo2, setSpo2] = useState(current.spo2);
  const [rr, setRr] = useState(current.respiratory_rate);
  const [temp, setTemp] = useState(current.temperature);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Live preview estimation
  const previewVital: VitalSign = {
    patient_id: patient.patient_id,
    timestamp: new Date().toISOString(),
    heart_rate: Number(hr),
    systolic_bp: Number(sbp),
    diastolic_bp: Number(dbp),
    spo2: Number(spo2),
    respiratory_rate: Number(rr),
    temperature: Number(temp),
    map: +((2 * Number(dbp) + Number(sbp)) / 3).toFixed(1)
  };

  const previewRisk = calculateDeteriorationRisk(previewVital, patient.age);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updated = await api.logNewVital(patient.patient_id, {
        heart_rate: Number(hr),
        systolic_bp: Number(sbp),
        diastolic_bp: Number(dbp),
        spo2: Number(spo2),
        respiratory_rate: Number(rr),
        temperature: Number(temp)
      });
      onVitalLogged(updated);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Log Telemetry Reading — {patient.patient_id}
              </h2>
              <p className="text-xs text-slate-400">
                {patient.bed_number} · {patient.admission_diagnosis}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Live Dynamic Prediction Preview Banner */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between font-mono ${
            previewRisk.risk_level === 'HIGH' ? 'bg-rose-950/40 border-rose-800/80 text-rose-200' :
            previewRisk.risk_level === 'MEDIUM' ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' :
            'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
          }`}>
            <div>
              <div className="text-[10px] uppercase tracking-wider opacity-80">ESTIMATED RISK TRAJECTORY</div>
              <div className="text-lg font-bold">
                {(previewRisk.risk_score * 100).toFixed(0)}% · {previewRisk.risk_level} RISK
              </div>
              <div className="text-[11px] font-sans opacity-90 mt-0.5 max-w-sm">
                {previewRisk.short_explanation}
              </div>
            </div>
            <div className="text-right text-[11px] opacity-75 hidden sm:block">
              <span>Delta vs Prev: </span>
              <span className="font-bold">
                {(previewRisk.risk_score - patient.risk_score) >= 0 ? '+' : ''}
                {((previewRisk.risk_score - patient.risk_score) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Vitals Form Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
            {/* HR */}
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <label className="block text-slate-400 text-[11px] mb-1">Heart Rate (bpm)</label>
              <input
                type="number"
                min="40"
                max="190"
                required
                value={hr}
                onChange={(e) => setHr(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-sm font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* SBP */}
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <label className="block text-slate-400 text-[11px] mb-1">Systolic BP (mmHg)</label>
              <input
                type="number"
                min="60"
                max="220"
                required
                value={sbp}
                onChange={(e) => setSbp(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-sm font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* DBP */}
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <label className="block text-slate-400 text-[11px] mb-1">Diastolic BP (mmHg)</label>
              <input
                type="number"
                min="35"
                max="130"
                required
                value={dbp}
                onChange={(e) => setDbp(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-sm font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* SpO2 */}
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <label className="block text-slate-400 text-[11px] mb-1">SpO2 (%)</label>
              <input
                type="number"
                min="70"
                max="100"
                required
                value={spo2}
                onChange={(e) => setSpo2(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-sm font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* RR */}
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <label className="block text-slate-400 text-[11px] mb-1">Resp Rate (bpm)</label>
              <input
                type="number"
                min="8"
                max="50"
                required
                value={rr}
                onChange={(e) => setRr(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-sm font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Temp */}
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <label className="block text-slate-400 text-[11px] mb-1">Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                min="34.0"
                max="42.0"
                required
                value={temp}
                onChange={(e) => setTemp(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-sm font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between -mx-6 -mb-6 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-cyan-950/50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Update Patient Vitals & Recompute Twin</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
