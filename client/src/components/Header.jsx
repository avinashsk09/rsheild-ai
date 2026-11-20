import React from 'react';
import { Shield, Radio, Activity } from 'lucide-react';

export default function Header({ scansToday }) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm py-3.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-navy-900 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Shield className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
                RShield AI
              </span>
              <span className="text-[11px] bg-navy-900 text-white font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                CYBER DEFENSE
              </span>
            </div>
            <p className="text-xs text-slate-600 font-semibold hidden sm:block truncate">
              Autonomous QR, URL &amp; Message Threat Intelligence Engine
            </p>
          </div>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Real-time Engine Status Pill */}
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="hidden sm:inline">Active Defense Engine</span>
            <span className="sm:hidden">Active</span>
          </div>

          {/* Anonymous Scan Counter (Only shown when actual backend count is available) */}
          {typeof scansToday === 'number' && (
            <div className="text-xs font-mono font-bold text-navy-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-sans font-medium hidden md:inline">Scans:</span>
              <span>{scansToday.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
