import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Info } from 'lucide-react';

export default function Recommendation({ recommendation, bandColor }) {
  if (!recommendation) return null;

  let tintStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950';
  let badgeStyle = 'bg-emerald-600 text-white';
  let Icon = ShieldCheck;

  if (bandColor === 'red') {
    tintStyle = 'bg-red-50 border-red-300 text-red-950';
    badgeStyle = 'bg-red-600 text-white';
    Icon = ShieldAlert;
  } else if (bandColor === 'orange' || bandColor === 'yellow') {
    tintStyle = 'bg-amber-50 border-amber-300 text-amber-950';
    badgeStyle = 'bg-amber-500 text-white';
    Icon = AlertTriangle;
  } else if (bandColor === 'gray') {
    tintStyle = 'bg-slate-50 border-slate-300 text-slate-800';
    badgeStyle = 'bg-slate-600 text-white';
    Icon = Info;
  }

  return (
    <div className={`w-full border-2 rounded-2xl p-5 sm:p-6 shadow-sm transition-all ${tintStyle}`}>
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-xl shrink-0 shadow-sm ${badgeStyle}`}>
          <Icon className="w-5 h-5 stroke-[2.4]" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-black uppercase tracking-wider block opacity-80 mb-1">
            Recommended Security Action
          </span>
          <p className="text-sm sm:text-base font-black leading-snug break-words">
            {recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}
