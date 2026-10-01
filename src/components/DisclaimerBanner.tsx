import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

interface DisclaimerBannerProps {
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/40 border border-cyan-800/40 rounded text-xs text-cyan-300">
        <Info className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
        <span className="truncate">AI-generated risk estimate — for research/demo purposes only. Not for clinical diagnosis.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
      <div className="flex items-center gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong className="text-slate-300 font-medium">Academic Research Prototype:</strong> AI predictions are model-generated probability estimates and do not constitute clinical diagnosis, medical advice, or treatment recommendations.
        </span>
      </div>
    </div>
  );
};
