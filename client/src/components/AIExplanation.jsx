import React from 'react';
import { Cpu, Sparkles } from 'lucide-react';

export default function AIExplanation({ aiExplanation }) {
  if (!aiExplanation) return null;

  const { aiLayerAvailable, explanation } = aiExplanation;

  return (
    <div className="bg-white/95 border-2 border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h3 className="text-sm font-black text-navy-950 uppercase tracking-wider flex items-center gap-2">
          {aiLayerAvailable ? (
            <Sparkles className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
          ) : (
            <Cpu className="w-4 h-4 text-slate-500 stroke-[2.2]" />
          )}
          <span>Security Analysis Summary</span>
        </h3>
        <span className="text-xs font-mono font-bold text-navy-900 bg-navy-50 border border-navy-200 px-3 py-1 rounded-full">
          {aiLayerAvailable ? 'Gemini AI Verified' : 'Deterministic Synthesis'}
        </span>
      </div>

      {/* Body */}
      <div className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed space-y-2.5">
        {explanation ? (
          explanation.split('\n\n').slice(0, 3).map((para, i) => (
            <p key={i} className="text-slate-800 leading-relaxed">
              {para}
            </p>
          ))
        ) : (
          <p className="italic text-slate-400">No explanation generated.</p>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-400">
        Synthesized strictly from deterministic destination inspection without automated score adjustments.
      </div>
    </div>
  );
}
