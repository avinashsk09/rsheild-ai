import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, HelpCircle, ShieldAlert } from 'lucide-react';

export default function SecurityScore({ safetyScore, size = 220 }) {
  if (!safetyScore) return null;

  const {
    score,
    band,
    bandColor,
    isUnableToVerify,
    isThreatIntelMatch,
    summaryReason,
  } = safetyScore;

  const numericScore = typeof score === 'number' ? Math.max(0, Math.min(100, Math.round(score))) : 0;
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (isUnableToVerify) {
      setAnimatedScore(0);
      return;
    }
    const timer = requestAnimationFrame(() => {
      setAnimatedScore(numericScore);
    });
    return () => cancelAnimationFrame(timer);
  }, [numericScore, isUnableToVerify]);

  // Styling tokens matching reference website (niat-hackthon.vercel.app gauge)
  let strokeColor = '#16A34A'; // emerald-600
  let innerBg = '#F0FDF4';    // emerald-50
  let statusText = 'LOW OBSERVED RISK';
  let badgeColor = 'text-emerald-700 border-emerald-200 bg-emerald-50';
  let Icon = ShieldCheck;

  if (isUnableToVerify || band === 'Unable to Verify') {
    strokeColor = '#64748B';
    innerBg = '#F8FAFC';
    statusText = 'UNABLE TO VERIFY';
    badgeColor = 'text-slate-600 border-slate-200 bg-slate-100';
    Icon = HelpCircle;
  } else if (bandColor === 'yellow' || band === 'Caution') {
    strokeColor = '#D97706';
    innerBg = '#FFFBEB';
    statusText = 'CAUTION';
    badgeColor = 'text-amber-800 border-amber-300 bg-amber-50';
    Icon = AlertTriangle;
  } else if (bandColor === 'orange' || band === 'High Risk') {
    strokeColor = '#EA580C';
    innerBg = '#FFF7ED';
    statusText = 'HIGH RISK';
    badgeColor = 'text-orange-800 border-orange-300 bg-orange-50';
    Icon = AlertTriangle;
  } else if (bandColor === 'red' || band === 'Critical Risk' || isThreatIntelMatch) {
    strokeColor = '#DC2626';
    innerBg = '#FEF2F2';
    statusText = isThreatIntelMatch ? 'CONFIRMED THREAT' : 'CRITICAL RISK';
    badgeColor = 'text-red-700 border-red-300 bg-red-50';
    Icon = isThreatIntelMatch ? ShieldAlert : AlertOctagon;
  }

  // Exact math from reference gauge (useSpeech-DMecewva.js)
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isUnableToVerify
    ? circumference
    : circumference - (animatedScore / 100) * circumference;

  return (
    <div className="bg-white/95 border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center justify-center text-center">
      {/* Top Header Badge */}
      <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Icon className="w-4 h-4 stroke-[2.2]" />
          <span>Security Assessment</span>
        </span>
        <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
          Deterministic Engine
        </span>
      </div>

      {/* 220px Circular Gauge matching reference site */}
      <div className="flex flex-col items-center justify-center p-2 sm:p-4 my-2">
        <div
          className="relative flex items-center justify-center rounded-full p-2 transition-colors duration-500 shadow-inner"
          style={{ width: size, height: size, backgroundColor: innerBg }}
          role="progressbar"
          aria-valuenow={isUnableToVerify ? 0 : numericScore}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label={`Safety score: ${isUnableToVerify ? 'Unavailable' : numericScore} out of 100, status ${statusText}`}
        >
          <svg
            width={size}
            height={size}
            className="transform -rotate-90 origin-center"
          >
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress track */}
            {!isUnableToVerify && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                style={{
                  transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1), stroke 400ms ease-out',
                }}
              />
            )}
          </svg>

          {/* Centered Score & Unit Typography */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500 mb-0.5">
              Safety Score
            </span>
            <div className="text-5xl font-black text-navy-950 tracking-tight leading-none tabular-nums flex items-baseline justify-center">
              <span>{isUnableToVerify ? '—' : animatedScore}</span>
              {!isUnableToVerify && (
                <span className="text-2xl text-slate-400 font-bold ml-0.5">/100</span>
              )}
            </div>

            {/* Verdict Badge pill inside/under the score */}
            <span
              className={`mt-2.5 text-xs sm:text-sm font-black px-3.5 py-1 rounded-full uppercase tracking-wider ${badgeColor} bg-white shadow-sm border verdict-pop`}
            >
              {band || statusText}
            </span>
          </div>
        </div>
      </div>

      {/* Confirmed Threat Match Warning */}
      {isThreatIntelMatch && (
        <div className="mt-2 text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 border-2 border-red-300 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Confirmed Threat Intelligence Match (Google Safe Browsing)</span>
        </div>
      )}

      {/* Summary reason */}
      <p className="mt-4 text-sm text-slate-700 font-medium leading-relaxed max-w-md">
        {summaryReason}
      </p>

      {/* Scale guide caption */}
      <div className="mt-3 pt-3 border-t border-slate-100 w-full max-w-xs text-[11px] font-mono text-slate-400">
        Scale: 0 (Critical Threat) &rarr; 100 (Low Observed Risk)
      </div>
    </div>
  );
}
