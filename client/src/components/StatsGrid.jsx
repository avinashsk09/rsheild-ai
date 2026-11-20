import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, GitFork, ArrowUpRight } from 'lucide-react';

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

  const stats = [
    {
      id: 'total-scans',
      label: 'Total Scans',
      sublabel: 'QR, URL & Messages',
      value: formatNumber(totalScans),
      icon: Shield,
      accentColor: 'text-ink',
      borderColor: 'border-borderline',
      badge: metrics?.byType
        ? `${metrics.byType.url || 0} URL · ${metrics.byType.qr || 0} QR · ${metrics.byType.message || 0} MSG`
        : null,
    },
    {
      id: 'threats-detected',
      label: 'Threats Detected',
      sublabel: 'High & critical alerts',
      value: formatNumber(threatsDetected),
      icon: ShieldAlert,
      accentColor: threatsDetected > 0 ? 'text-risk-red-text' : 'text-ink',
      borderColor: threatsDetected > 0 ? 'border-risk-red-border' : 'border-borderline',
      badge: 'Actionable risks',
    },
    {
      id: 'low-risk-scans',
      label: 'Low-Risk Scans',
      sublabel: 'Verified clean destinations',
      value: formatNumber(lowRiskScans),
      icon: ShieldCheck,
      accentColor: 'text-risk-green-text',
      borderColor: 'border-borderline',
      badge: 'Validated safe',
    },
    {
      id: 'redirects-inspected',
      label: 'Redirects Inspected',
      sublabel: 'HTTP hops validated',
      value: formatNumber(redirectsInspected),
      icon: GitFork,
      accentColor: 'text-ink',
      borderColor: 'border-borderline',
      badge: 'SSRF guarded',
    },
  ];

  return (
    <section aria-label="Cybersecurity Statistics Grid" className="mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className={`bg-surface border ${stat.borderColor} rounded-xl p-4 shadow-sm ring-1 ring-black/[0.02] flex flex-col justify-between transition-all`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider truncate">
                  {stat.label}
                </span>
                <span className="p-1.5 rounded-lg bg-canvas border border-borderline text-ink-muted shrink-0">
                  <Icon className="h-3.5 w-3.5 stroke-[2]" />
                </span>
              </div>

              <div className="my-1">
                <div className={`font-mono text-2xl sm:text-3xl font-extrabold tracking-tight ${stat.accentColor}`}>
                  {stat.value}
                </div>
                <div className="text-[11px] text-ink-muted mt-0.5 truncate">
                  {stat.sublabel}
                </div>
              </div>

              {stat.badge && (
                <div className="pt-2 mt-2 border-t border-borderline/60 text-[10px] font-mono text-ink-faint truncate">
                  {stat.badge}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
