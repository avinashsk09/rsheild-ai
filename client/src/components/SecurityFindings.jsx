import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, ShieldAlert } from 'lucide-react';

export default function SecurityFindings({ findings }) {
  if (!findings) return null;

  const { positive = [], suspicious = [], unavailable = [] } = findings;
  const totalCount = positive.length + suspicious.length + unavailable.length;

  return (
    <div className="bg-surface border border-borderline rounded-xl p-4 sm:p-5 shadow-sm ring-1 ring-black/[0.02]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-borderline">
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 stroke-[2]" />
          <span>Security Observations</span>
        </h3>
        <span className="text-[10px] font-mono text-ink-muted">
          {totalCount} observation{totalCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3.5">
        {/* 1. Suspicious Indicators (Risk / Warnings) */}
        {suspicious.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-risk-red-text mb-1.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Suspicious Indicators ({suspicious.length})</span>
            </div>
            <div className="space-y-1.5">
              {suspicious.map((item, idx) => (
                <div
                  key={`susp-${idx}`}
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-risk-red-bg/70 border border-risk-red-border text-xs"
                >
                  <span className="h-5 w-5 rounded-full bg-risk-red-text text-white font-mono font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    !
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-risk-red-text block">
                      {item.title}
                    </span>
                    {item.description && (
                      <span className="text-[11px] text-risk-red-text/80 block mt-0.5 leading-snug">
                        {item.description}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-risk-red-text font-bold uppercase tracking-wider shrink-0 mt-0.5">
                    Risk
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Positive Security Checks (Clean) */}
        {positive.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-risk-green-text mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Positive Security Checks ({positive.length})</span>
            </div>
            <div className="space-y-1.5">
              {positive.map((item, idx) => (
                <div
                  key={`pos-${idx}`}
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-risk-green-bg/60 border border-risk-green-border text-xs"
                >
                  <span className="h-5 w-5 rounded-full bg-risk-green-text text-white font-mono font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-risk-green-text block">
                      {item.title}
                    </span>
                    {item.description && (
                      <span className="text-[11px] text-risk-green-text/85 block mt-0.5 leading-snug">
                        {item.description}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-risk-green-text font-semibold uppercase tracking-wider shrink-0 mt-0.5">
                    Clean
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Unavailable / Informational Checks */}
        {unavailable.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1.5 flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              <span>Unavailable Checks ({unavailable.length})</span>
            </div>
            <div className="space-y-1.5">
              {unavailable.map((item, idx) => (
                <div
                  key={`unav-${idx}`}
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-canvas border border-borderline text-xs"
                >
                  <span className="h-5 w-5 rounded-full bg-borderline text-ink-muted font-mono font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    –
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-ink-muted block">
                      {item.title}
                    </span>
                    {item.description && (
                      <span className="text-[11px] text-ink-faint block mt-0.5 leading-snug">
                        {item.description}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-ink-faint uppercase tracking-wider shrink-0 mt-0.5">
                    Info
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalCount === 0 && (
          <div className="p-3 text-center text-xs text-ink-muted italic bg-canvas rounded-lg border border-borderline">
            No specific findings recorded for this destination.
          </div>
        )}
      </div>
    </div>
  );
}
