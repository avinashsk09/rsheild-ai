import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, GitFork } from 'lucide-react';

export default function StatsGrid({ metrics, isLoading }) {
  const formatNumber = (val) => {
    if (isLoading && val === undefined) return '—';
    if (typeof val === 'number') return val.toLocaleString();
    return '—';
  };

  const totalScans = metrics?.totalScans;
  const threatsDetected = metrics?.threatsDetected;
  const lowRiskScans = metrics?.lowRiskScans;
  const redirectsInspected = metrics?.redirectsInspected;

  const cards = [
    {
      id: 'total-scans',
      label: 'Total Scans',
      sublabel: 'QR, URL & Message Inspections',
      value: formatNumber(totalScans),
      icon: Shield,
      accent: 'text-navy-950',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      badgeText: metrics?.byType
        ? `${metrics.byType.url || 0} URL · ${metrics.byType.qr || 0} QR · ${metrics.byType.message || 0} MSG`
        : 'Telemetry Active',
    },
    {
      id: 'threats-detected',
      label: 'Threats Detected',
      sublabel: 'Malicious, Phishing & Fraud Alerts',
      value: formatNumber(threatsDetected),
      icon: ShieldAlert,
      accent: threatsDetected > 0 ? 'text-red-600' : 'text-navy-950',
      badgeClass: threatsDetected > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200',
      badgeText: threatsDetected > 0 ? 'Actionable Risks' : 'Zero High Threats',
    },
    {
      id: 'low-risk-scans',
      label: 'Low-Risk Scans',
      sublabel: 'Verified Clean Destinations',
      value: formatNumber(lowRiskScans),
      icon: ShieldCheck,
      accent: 'text-emerald-700',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeText: 'Validated Safe',
    },
    {
      id: 'redirects-inspected',
      label: 'Redirects Inspected',
      sublabel: 'HTTP Traversal & Hops Verified',
      value: formatNumber(redirectsInspected),
      icon: GitFork,
      accent: 'text-navy-950',
      badgeClass: 'bg-navy-50 text-navy-800 border-navy-200',
      badgeText: 'SSRF & Rebind Guarded',
    },
  ];

  return (
    <section aria-label="Cybersecurity Statistics Grid" className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white/95 border-2 border-slate-200 hover:border-navy-900 rounded-2xl p-5 sm:p-6 shadow-sm transition-all card-lift min-h-[145px] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                  {card.label}
                </span>
                <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </span>
              </div>

              <div className="my-1.5">
                <div className={`text-3xl sm:text-4xl font-black tracking-tight leading-none ${card.accent}`}>
                  {card.value}
                </div>
                <div className="text-xs text-slate-600 font-medium mt-1.5 truncate">
                  {card.sublabel}
                </div>
              </div>

              <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                <span className={`px-2 py-0.5 rounded-md border font-semibold truncate ${card.badgeClass}`}>
                  {card.badgeText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
