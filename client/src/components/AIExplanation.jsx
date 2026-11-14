import React from 'react';
import { Cpu, Sparkles } from 'lucide-react';

export default function AIExplanation({ aiExplanation }) {
  if (!aiExplanation) return null;

  const { aiLayerAvailable, explanation } = aiExplanation;

  return (
    <div className="bg-surface border border-borderline rounded-xl p-4 sm:p-5 shadow-sm ring-1 ring-black/[0.02]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-borderline">
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
          {aiLayerAvailable ? (
            <Sparkles className="h-3.5 w-3.5 text-risk-green-text" />
          ) : (
            <Cpu className="h-3.5 w-3.5 text-ink-muted" />
          )}
          <span>Security Analysis Summary</span>
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-canvas border border-borderline text-ink-muted">
          {aiLayerAvailable ? 'Gemini AI Verified' : 'Deterministic Synthesis'}
        </span>
      </div>

      <div className="text-xs text-ink-muted leading-relaxed space-y-2">
        {explanation ? (
          explanation.split('\n\n').slice(0, 2).map((para, i) => (
            <p key={i} className="text-ink font-normal leading-relaxed">
              {para}
            </p>
          ))
        ) : (
          <p className="italic text-ink-faint">No summary generated.</p>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-borderline/60 text-[10px] text-ink-faint">
        Synthesized strictly from deterministic destination inspection without automated score adjustments.
      </div>
    </div>
  );
}
