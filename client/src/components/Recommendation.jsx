import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Info } from 'lucide-react';

export default function Recommendation({ recommendation, bandColor }) {
  if (!recommendation) return null;

  let tintStyle = 'bg-risk-green-bg border-risk-green-border text-risk-green-text';
  let Icon = ShieldCheck;

  if (bandColor === 'red') {
    tintStyle = 'bg-risk-red-bg border-risk-red-border text-risk-red-text';
    Icon = ShieldAlert;
  } else if (bandColor === 'orange' || bandColor === 'yellow') {
    tintStyle = 'bg-risk-amber-bg border-risk-amber-border text-risk-amber-text';
    Icon = AlertTriangle;
  } else if (bandColor === 'gray') {
    tintStyle = 'bg-canvas border-borderline text-ink-muted';
    Icon = Info;
  }

  return (
    <div className={`w-full border-2 rounded-xl p-4 sm:p-5 mb-6 shadow-sm transition-all ${tintStyle}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-1.5 rounded-lg bg-surface/80 border border-current/20 shrink-0">
          <Icon className="h-4 w-4 stroke-[2.2]" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90 mb-0.5">
            Clear Action Recommendation
          </span>
          <p className="text-xs sm:text-sm font-bold text-ink leading-snug">
            {recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}
