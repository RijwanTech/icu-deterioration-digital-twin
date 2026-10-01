import React, { useState } from 'react';
import { X, Sliders, ShieldAlert, RotateCcw } from 'lucide-react';
import { RiskThresholdConfig } from '../types';
import { DEFAULT_THRESHOLDS } from '../services/mlEngine';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RiskThresholdConfig;
  onSaveConfig: (newConfig: RiskThresholdConfig) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  const [lowMax, setLowMax] = useState<number>(config.low_max);
  const [medMax, setMedMax] = useState<number>(config.medium_max);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      low_max: +(lowMax).toFixed(2),
      medium_max: +(medMax).toFixed(2)
    });
    onClose();
  };

  const handleReset = () => {
    setLowMax(DEFAULT_THRESHOLDS.low_max);
    setMedMax(DEFAULT_THRESHOLDS.medium_max);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Risk Model Calibration</h2>
              <p className="text-xs text-slate-400">Configure custom deterioration threshold boundaries</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
            <div className="font-semibold text-white mb-1">Configurable Research Categorization:</div>
            Deterioration probability outputs [0.00 – 1.00] are categorized into LOW, MEDIUM, and HIGH tiers according to researcher specifications.
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-emerald-400 font-bold">LOW RISK CEILING (0.00 – {lowMax.toFixed(2)})</span>
                <span className="text-white font-bold">{lowMax.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.55"
                step="0.01"
                value={lowMax}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setLowMax(val);
                  if (val >= medMax) setMedMax(val + 0.05);
                }}
                className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-amber-400 font-bold">MEDIUM RISK CEILING ({(lowMax + 0.01).toFixed(2)} – {medMax.toFixed(2)})</span>
                <span className="text-white font-bold">{medMax.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.40"
                max="0.90"
                step="0.01"
                value={medMax}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (val > lowMax) setMedMax(val);
                }}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs text-rose-300 font-mono">
              <strong>HIGH RISK TIER:</strong> Above {medMax.toFixed(2)} to 1.00
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-sm"
            >
              Apply Calibration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
