import React from 'react';
import { Check, AlertTriangle, Minus, ShieldAlert } from 'lucide-react';

export default function SecurityFindings({ findings }) {
  if (!findings) return null;

  const { positive = [], suspicious = [], unavailable = [] } = findings;

  const totalCount = positive.length + suspicious.length + unavailable.length;

  return (
    <div className="bg-surface border border-borderline rounded-xl p-4 sm:p-5 shadow-sm ring-1 ring-black/[0.02]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-borderline">
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 stroke-[2]" />
          <span>Security Findings</span>
        </h3>
        <span className="text-[10px] font-mono text-ink-muted">
          {totalCount} observation{totalCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2">
        {/* Suspicious Findings (!) */}
        {suspicious.map((item, idx) => (
          <div
            key={`susp-${idx}`}
            className="flex items-center gap-2.5 p-2 rounded-lg bg-risk-red-bg/70 border border-risk-red-border text-xs"
          >
            <span className="h-5 w-5 rounded-full bg-risk-red-text text-white font-mono font-bold flex items-center justify-center text-[11px] shrink-0">
              !
            </span>
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-risk-red-text block truncate">
                {item.title}
              </span>
            </div>
            <span className="text-[10px] font-mono text-risk-red-text/80 uppercase tracking-wider shrink-0 font-medium">
              Risk
            </span>
          </div>
        ))}

        {/* Positive Safeguards (✓) */}
        {positive.map((item, idx) => (
          <div
            key={`pos-${idx}`}
            className="flex items-center gap-2.5 p-2 rounded-lg bg-risk-green-bg/60 border border-risk-green-border text-xs"
          >
            <span className="h-5 w-5 rounded-full bg-risk-green-text text-white font-mono font-bold flex items-center justify-center text-[11px] shrink-0">
              ✓
            </span>
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-risk-green-text block truncate">
                {item.title}
              </span>
            </div>
            <span className="text-[10px] font-mono text-risk-green-text/80 uppercase tracking-wider shrink-0 font-medium">
              Clean
            </span>
          </div>
        ))}

        {/* Limitations / Unavailable (–) */}
        {unavailable.map((item, idx) => (
          <div
            key={`unav-${idx}`}
            className="flex items-center gap-2.5 p-2 rounded-lg bg-canvas border border-borderline text-xs"
          >
            <span className="h-5 w-5 rounded-full bg-borderline text-ink-muted font-mono font-bold flex items-center justify-center text-[11px] shrink-0">
              –
            </span>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-ink-muted block truncate">
                {item.title}
              </span>
            </div>
            <span className="text-[10px] font-mono text-ink-faint uppercase tracking-wider shrink-0">
              Info
            </span>
          </div>
        ))}

        {totalCount === 0 && (
          <div className="p-3 text-center text-xs text-ink-muted italic bg-canvas rounded-lg border border-borderline">
            No specific findings recorded for this destination.
          </div>
        )}
      </div>
    </div>
  );
}
