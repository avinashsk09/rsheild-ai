import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

export default function SecurityMetricsOverview({ findings }) {
  if (!findings) return null;

  const passedCount = findings.positive?.length || 0;
  const warningsCount = findings.suspicious?.length || 0;
  const unavailableCount = findings.unavailable?.length || 0;

  return (
    <div className="bg-white/95 border-2 border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Security Check Metrics
        </span>
        <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
          Real Analysis Results
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {/* Passed Checks */}
        <div className="p-3 rounded-xl bg-emerald-50 border-2 border-emerald-200 flex flex-col justify-between">
          <div className="flex items-center justify-center gap-1.5 text-emerald-800 mb-1">
            <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
            <span className="text-xs font-black uppercase tracking-wider">Passed</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800 leading-none">
            {passedCount}
          </div>
        </div>

        {/* Warnings / Suspicious */}
        <div className={`p-3 rounded-xl border-2 flex flex-col justify-between ${
          warningsCount > 0
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <AlertTriangle className={`w-4 h-4 stroke-[2.2] ${warningsCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            <span className="text-xs font-black uppercase tracking-wider">Warnings</span>
          </div>
          <div className={`text-2xl sm:text-3xl font-black leading-none ${warningsCount > 0 ? 'text-amber-900' : 'text-slate-600'}`}>
            {warningsCount}
          </div>
        </div>

        {/* Unavailable Checks */}
        <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200 text-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-center gap-1.5 mb-1 text-slate-500">
            <HelpCircle className="w-4 h-4 stroke-[2.2]" />
            <span className="text-xs font-black uppercase tracking-wider">Info</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-700 leading-none">
            {unavailableCount}
          </div>
        </div>
      </div>
    </div>
  );
}
