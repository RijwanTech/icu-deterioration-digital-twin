import React, { useState } from 'react';
import { X, UserPlus, Activity, ShieldAlert, Heart, Droplets, Wind, Thermometer, Stethoscope } from 'lucide-react';
import { NewPatientInput, Patient } from '../types';
import { api } from '../services/api';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded: (newPatient: Patient) => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientAdded
}) => {
  const [patientId, setPatientId] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<NewPatientInput['gender'] | ''>('');
  const [bedNumber, setBedNumber] = useState('');
  const [unit, setUnit] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [hr, setHr] = useState<number | ''>('');
  const [sbp, setSbp] = useState<number | ''>('');
  const [dbp, setDbp] = useState<number | ''>('');
  const [spo2, setSpo2] = useState<number | ''>('');
  const [rr, setRr] = useState<number | ''>('');
  const [temp, setTemp] = useState<number | ''>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const input: NewPatientInput = {
        patient_id: patientId.trim() || undefined,
        age: Number(age),
        gender: gender as NewPatientInput['gender'],
        bed_number: bedNumber.trim(),
        unit,
        admission_diagnosis: diagnosis.trim(),
        heart_rate: Number(hr),
        systolic_bp: Number(sbp),
        diastolic_bp: Number(dbp),
        spo2: Number(spo2),
        respiratory_rate: Number(rr),
        temperature: Number(temp)
      };

      const newPatient = await api.addPatient(input);
      onPatientAdded(newPatient);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add patient.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Admit New ICU Patient</h2>
              <p className="text-xs text-slate-400">Initialize a new Digital Twin and calculate baseline deterioration risk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Demographics & Admission Section */}
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
              Patient Identification & Admission
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-mono">Patient ID</label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="Leave blank to generate"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Age (Years)</label>
                <input
                  type="number"
                  min="18"
                  max="105"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Gender</label>
                <select
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value as NewPatientInput['gender'] | '')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="" disabled>Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">ICU Unit</label>
                <select
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="" disabled>Select ICU unit</option>
                  <option value="Medical ICU (MICU)">Medical ICU (MICU)</option>
                  <option value="Surgical ICU (SICU)">Surgical ICU (SICU)</option>
                  <option value="Cardiovascular ICU (CICU)">Cardiovascular ICU (CICU)</option>
                  <option value="Neuro ICU (NICU)">Neuro ICU (NICU)</option>
                  <option value="Trauma ICU (TICU)">Trauma ICU (TICU)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Bed Assignment</label>
                <input
                  type="text"
                  required
                  value={bedNumber}
                  onChange={(e) => setBedNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Admission Diagnosis</label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Enter admission diagnosis"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Initial Vital Signs Section */}
          <div className="space-y-4 pt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 flex items-center justify-between">
              <span>Initial Ingested Vital Telemetry</span>
              <span className="text-[10px] font-mono text-slate-500">Calibrates Digital Twin</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
              {/* Heart Rate */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <label className="block text-slate-400 text-[11px] mb-1">HR (bpm)</label>
                <input
                  type="number"
                  min="40"
                  max="190"
                  required
                  value={hr}
                  onChange={(e) => setHr(e.target.value === '' ? '' : Number(e.target.value))}
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
                  onChange={(e) => setSbp(e.target.value === '' ? '' : Number(e.target.value))}
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
                  onChange={(e) => setDbp(e.target.value === '' ? '' : Number(e.target.value))}
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
                  onChange={(e) => setSpo2(e.target.value === '' ? '' : Number(e.target.value))}
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
                  onChange={(e) => setRr(e.target.value === '' ? '' : Number(e.target.value))}
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
                  onChange={(e) => setTemp(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-sm font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between -mx-6 -mb-6 mt-6">
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
                  <UserPlus className="w-4 h-4" />
                  <span>Admit & Generate Digital Twin</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
