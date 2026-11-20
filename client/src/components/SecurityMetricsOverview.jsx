import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

export default function SecurityMetricsOverview({ findings }) {
  if (!findings) return null;

  const passedCount = findings.positive?.length || 0;
  const warningsCount = findings.suspicious?.length || 0;
  const unavailableCount = findings.unavailable?.length || 0;

  return (
    <div className="bg-surface border border-borderline rounded-xl p-4 shadow-sm ring-1 ring-black/[0.02]">
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-borderline">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Security Check Metrics
        </span>
        <span className="text-[10px] font-mono text-ink-faint">
          Live Rules Breakdown
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Passed Checks */}
        <div className="p-2.5 rounded-lg bg-risk-green-bg/70 border border-risk-green-border">
          <div className="flex items-center justify-center gap-1 text-risk-green-text mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 stroke-[2]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Passed</span>
          </div>
          <div className="font-mono text-xl font-extrabold text-risk-green-text">
            {passedCount}
          </div>
        </div>

        {/* Warnings / Suspicious */}
        <div className={`p-2.5 rounded-lg border ${
          warningsCount > 0
            ? 'bg-risk-red-bg/70 border-risk-red-border text-risk-red-text'
            : 'bg-canvas border-borderline text-ink-muted'
        }`}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertTriangle className="h-3.5 w-3.5 stroke-[2]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Warnings</span>
          </div>
          <div className={`font-mono text-xl font-extrabold ${warningsCount > 0 ? 'text-risk-red-text' : 'text-ink'}`}>
            {warningsCount}
          </div>
        </div>

        {/* Unavailable Checks */}
        <div className="p-2.5 rounded-lg bg-canvas border border-borderline text-ink-muted">
          <div className="flex items-center justify-center gap-1 mb-1">
            <HelpCircle className="h-3.5 w-3.5 stroke-[2]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Unavailable</span>
          </div>
          <div className="font-mono text-xl font-extrabold text-ink">
            {unavailableCount}
          </div>
        </div>
      </div>
    </div>
  );
}
