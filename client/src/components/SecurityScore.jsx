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

  // Exact color definitions per §8
  let ringColor = '#3F7A5C'; // Green
  let badgeClass = 'text-risk-green-text bg-risk-green-bg border-risk-green-border';
  let Icon = ShieldCheck;

  if (isUnableToVerify || band === 'Unable to Verify') {
    ringColor = '#9A988F';
    badgeClass = 'text-ink-muted bg-canvas border-borderline';
    Icon = HelpCircle;
  } else if (bandColor === 'yellow' || band === 'Caution') {
    ringColor = '#C9941D';
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

  // Calculate SVG gauge stroke
  const numericScore = typeof score === 'number' ? score : 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numericScore / 100) * circumference;

  return (
    <div className="bg-surface border border-borderline rounded-xl p-4 sm:p-5 shadow-sm ring-1 ring-black/[0.02]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-borderline">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 stroke-[2]" />
          <span>Security Assessment</span>
        </span>
        <span className="text-[10px] font-mono text-ink-faint">
          Deterministic Rules Engine
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* SVG Ring Gauge */}
        <div className="relative h-18 w-18 shrink-0 flex items-center justify-center">
          <svg className="w-18 h-18 -rotate-90" viewBox="0 0 68 68">
            <circle
              cx="34"
              cy="34"
              r={radius}
              stroke="#E4E2DB"
              strokeWidth="5"
              fill="none"
            />
            {!isUnableToVerify && (
              <circle
                cx="34"
                cy="34"
                r={radius}
                stroke={ringColor}
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="font-mono text-lg font-bold text-ink leading-none">
              {isUnableToVerify ? '—' : score}
            </span>
            {!isUnableToVerify && (
              <span className="font-mono text-[9px] text-ink-faint leading-none mt-0.5">
                / 100
              </span>
            )}
          </div>
        </div>

        {/* Score Details: Status + One-line reason */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${badgeClass}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
              {band}
            </span>
            {isThreatIntelMatch && (
              <span className="text-[10px] font-bold text-risk-red-text bg-risk-red-bg border border-risk-red-border px-2 py-0.5 rounded-md">
                Confirmed Threat Intel Match
              </span>
            )}
          </div>

          <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">
            {summaryReason}
          </p>

          {/* Mini 4-band visual bar */}
          <div className="mt-2.5 flex items-center gap-1 w-full max-w-xs">
            <div className={`h-1 flex-1 rounded-full ${numericScore < 20 && !isUnableToVerify ? 'bg-risk-red-text' : 'bg-borderline'}`} title="Critical (0-19)" />
            <div className={`h-1 flex-1 rounded-full ${numericScore >= 20 && numericScore < 50 && !isUnableToVerify ? 'bg-risk-amber-text' : 'bg-borderline'}`} title="High Risk (20-49)" />
            <div className={`h-1 flex-1 rounded-full ${numericScore >= 50 && numericScore < 80 && !isUnableToVerify ? 'bg-amber-400' : 'bg-borderline'}`} title="Caution (50-79)" />
            <div className={`h-1 flex-1 rounded-full ${numericScore >= 80 && !isUnableToVerify ? 'bg-risk-green-text' : 'bg-borderline'}`} title="Low Risk (80-100)" />
          </div>
        </div>
      </div>
    </div>
  );
}
