import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, ShieldAlert } from 'lucide-react';

export default function SecurityFindings({ findings }) {
  if (!findings) return null;

  const { positive = [], suspicious = [], unavailable = [] } = findings;
  const totalCount = positive.length + suspicious.length + unavailable.length;

  return (
    <div className="bg-white/95 border-2 border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h3 className="text-sm font-black text-navy-950 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 stroke-[2.2] text-navy-900" />
          <span>Security Observations</span>
        </h3>
        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
          {totalCount} observation{totalCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {/* 1. Suspicious Indicators */}
        {suspicious.length > 0 && (
          <div className="space-y-2.5">
            <div className="text-xs font-black uppercase tracking-wider text-red-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Suspicious Indicators ({suspicious.length})</span>
            </div>
            <div className="space-y-2">
              {suspicious.map((item, idx) => (
                <div
                  key={`susp-${idx}`}
                  className="bg-red-50/80 border-2 border-red-200 rounded-2xl p-4 shadow-sm flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    !
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-white border border-red-200 px-2 py-0.5 rounded-md shrink-0">
                        RISK
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Positive Security Checks */}
        {positive.length > 0 && (
          <div className="space-y-2.5">
            <div className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Positive Security Checks ({positive.length})</span>
            </div>
            <div className="space-y-2">
              {positive.map((item, idx) => (
                <div
                  key={`pos-${idx}`}
                  className="bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl p-4 shadow-sm flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                        CLEAN
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Unavailable / Info Checks */}
        {unavailable.length > 0 && (
          <div className="space-y-2.5">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Unavailable Checks ({unavailable.length})</span>
            </div>
            <div className="space-y-2">
              {unavailable.map((item, idx) => (
                <div
                  key={`unav-${idx}`}
                  className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    –
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-black text-slate-800 leading-snug">
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                        INFO
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalCount === 0 && (
          <div className="p-4 text-center text-sm text-slate-500 font-medium bg-slate-50 rounded-2xl border border-slate-200">
            No specific findings recorded for this destination.
          </div>
        )}
      </div>
    </div>
  );
}
