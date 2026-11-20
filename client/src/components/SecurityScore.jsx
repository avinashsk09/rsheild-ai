import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, HelpCircle, ShieldAlert } from 'lucide-react';

export default function SecurityScore({ safetyScore }) {
  if (!safetyScore) return null;

  const {
    score,
    band,
    bandColor,
    isUnableToVerify,
    isThreatIntelMatch,
    summaryReason,
  } = safetyScore;

  // Exact color definitions per Design System
  let ringColor = '#3F7A5C'; // Green
  let badgeClass = 'text-risk-green-text bg-risk-green-bg border-risk-green-border';
  let Icon = ShieldCheck;

  if (isUnableToVerify || band === 'Unable to Verify') {
    ringColor = '#9A988F';
    badgeClass = 'text-ink-muted bg-canvas border-borderline';
    Icon = HelpCircle;
  } else if (bandColor === 'yellow' || band === 'Caution') {
    ringColor = '#B4863C';
    badgeClass = 'text-risk-amber-text bg-risk-amber-bg border-risk-amber-border';
    Icon = AlertTriangle;
  } else if (bandColor === 'orange' || band === 'High Risk') {
    ringColor = '#B4863C';
    badgeClass = 'text-risk-amber-text bg-risk-amber-bg border-risk-amber-border';
    Icon = AlertTriangle;
  } else if (bandColor === 'red' || band === 'Critical Risk' || isThreatIntelMatch) {
    ringColor = '#B23A3A';
    badgeClass = 'text-risk-red-text bg-risk-red-bg border-risk-red-border';
    Icon = isThreatIntelMatch ? ShieldAlert : AlertOctagon;
  }

  // Calculate SVG gauge stroke with large radius
  const numericScore = typeof score === 'number' ? score : 0;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numericScore / 100) * circumference;

  return (
    <div className="bg-surface border border-borderline rounded-xl p-5 shadow-sm ring-1 ring-black/[0.02]">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-borderline">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 stroke-[2]" />
          <span>Security Assessment</span>
        </span>
        <span className="text-[10px] font-mono text-ink-faint">
          Deterministic Rules Engine
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Large Circular SVG Ring Gauge (0-100) */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-24 h-24 -rotate-90 block" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="#E4E2DB"
              strokeWidth="6"
              fill="none"
            />
            {!isUnableToVerify && (
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke={ringColor}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
            <span className="font-mono text-3xl font-extrabold text-ink leading-none">
              {isUnableToVerify ? '—' : score}
            </span>
            {!isUnableToVerify && (
              <span className="font-mono text-[10px] font-semibold text-ink-muted mt-0.5 leading-none">
                / 100
              </span>
            )}
          </div>
        </div>

        {/* Score Details: Risk classification + Summary */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${badgeClass}`}>
              <span className="h-2 w-2 rounded-full bg-current"></span>
              {band}
            </span>
            {isThreatIntelMatch && (
              <span className="text-[10px] font-bold text-risk-red-text bg-risk-red-bg border border-risk-red-border px-2 py-0.5 rounded-md">
                Confirmed Threat Intel Match
              </span>
            )}
          </div>

          <p className="text-xs text-ink-muted leading-relaxed mb-3">
            {summaryReason}
          </p>

          {/* Mini 4-band visual bar with label */}
          <div className="flex items-center gap-1.5 w-full max-w-xs mx-auto sm:mx-0">
            <div className={`h-1.5 flex-1 rounded-full ${numericScore < 20 && !isUnableToVerify ? 'bg-risk-red-text' : 'bg-borderline'}`} title="Critical Risk (0-19)" />
            <div className={`h-1.5 flex-1 rounded-full ${numericScore >= 20 && numericScore < 50 && !isUnableToVerify ? 'bg-risk-amber-text' : 'bg-borderline'}`} title="High Risk (20-49)" />
            <div className={`h-1.5 flex-1 rounded-full ${numericScore >= 50 && numericScore < 80 && !isUnableToVerify ? 'bg-[#C9941D]' : 'bg-borderline'}`} title="Caution (50-79)" />
            <div className={`h-1.5 flex-1 rounded-full ${numericScore >= 80 && !isUnableToVerify ? 'bg-risk-green-text' : 'bg-borderline'}`} title="Low Risk (80-100)" />
          </div>

          <div className="text-[10px] text-ink-faint mt-1.5 font-mono">
            Scale: 0 (Critical Risk) to 100 (Low Observed Risk)
          </div>
        </div>
      </div>
    </div>
  );
}
