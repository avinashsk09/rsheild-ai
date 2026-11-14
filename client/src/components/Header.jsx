import React from 'react';
import { Shield, Radio } from 'lucide-react';

export default function Header({ scansToday }) {
  return (
    <header className="border-b border-borderline bg-surface/95 backdrop-blur-sm sticky top-0 z-20 py-3.5 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Left: Wordmark + Shield icon + Tagline */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-ink flex items-center justify-center text-white shadow-sm ring-1 ring-black/5">
            <Shield className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-ink font-sans">
                RShield AI
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-risk-green-bg text-risk-green-text border border-risk-green-border">
                <Radio className="h-2.5 w-2.5 animate-pulse" />
                Live Engine
              </span>
            </div>
            <p className="text-xs text-ink-muted">
              QR code and link security analysis platform
            </p>
          </div>
        </div>

        {/* Right: Small scans today counter in muted mono text */}
        <div className="flex items-center gap-2 font-mono text-xs text-ink-muted shrink-0 text-right bg-canvas px-3 py-1.5 rounded-md border border-borderline">
          <span className="text-ink-faint">scans today:</span>
          <span className="font-bold text-ink">{typeof scansToday === 'number' ? scansToday : '—'}</span>
        </div>
      </div>
    </header>
  );
}
