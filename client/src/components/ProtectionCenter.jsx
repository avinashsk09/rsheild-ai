import React from 'react';
import { Shield, KeyRound, Network, GitFork, QrCode, FileX, Compass, CheckCircle } from 'lucide-react';

export default function ProtectionCenter() {
  const safeguards = [
    {
      id: 'otp-masking',
      title: 'OTP and PIN Masking',
      description: 'Automatically strips one-time codes, PINs, and credentials before processing to prevent accidental credential leakage.',
      icon: KeyRound,
      status: 'Active',
      verifiedIn: 'Message Analysis Engine',
    },
    {
      id: 'ssrf-guard',
      title: 'SSRF and DNS Protection',
      description: 'Blocks private IP ranges (RFC 1918), link-local metadata (169.254.169.254), and loopback DNS re-binding attacks.',
      icon: Network,
      status: 'Active',
      verifiedIn: 'Network Isolation Layer',
    },
    {
      id: 'redirect-validation',
      title: 'Redirect Validation',
      description: 'Inspects HTTP 301, 302, 307, and 308 redirection chains hop-by-hop with domain-shift and protocol verification.',
      icon: GitFork,
      status: 'Active',
      verifiedIn: 'Redirect Tracer Service',
    },
    {
      id: 'browser-qr-decoding',
      title: 'Local Browser QR Decoding',
      description: 'Decodes QR images client-side via WebAssembly Canvas. Raw unrendered photos and camera streams never leave your device.',
      icon: QrCode,
      status: 'Active',
      verifiedIn: 'Client Web Worker / jsQR',
    },
    {
      id: 'zero-retention',
      title: 'Zero Raw-Content Retention',
      description: 'Only anonymous telemetry events and cryptographic timestamps are logged. No URLs, text, or payloads are stored.',
      icon: FileX,
      status: 'Active',
      verifiedIn: 'Metrics Database & Privacy Shield',
    },
    {
      id: 'safe-navigation',
      title: 'Safe Destination Controls',
      description: 'Disables automatic URL navigation. Enforces strict manual safety gates and visual confirmation on high-risk targets.',
      icon: Compass,
      status: 'Active',
      verifiedIn: 'Navigation Security Controls',
    },
  ];

  return (
    <section aria-label="RShield Protection Center" className="mt-8 mb-6">
      <div className="border-t border-borderline pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
          <div>
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 stroke-[2.2] text-risk-green-text" />
              <span>RShield Protection Center</span>
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Verified security safeguards active across all scanning engines
            </p>
          </div>
          <span className="text-[11px] font-mono text-ink-faint">
            6 of 6 safeguards active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {safeguards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-surface border border-borderline rounded-xl p-4 shadow-sm ring-1 ring-black/[0.02] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="p-1.5 rounded-lg bg-canvas border border-borderline text-ink shrink-0">
                      <Icon className="h-4 w-4 stroke-[2]" />
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-risk-green-bg text-risk-green-text border border-risk-green-border">
                      <span className="h-1.5 w-1.5 rounded-full bg-risk-green-text"></span>
                      {item.status}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-ink mb-1">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-borderline/60 text-[10px] font-mono text-ink-faint flex items-center justify-between">
                  <span>{item.verifiedIn}</span>
                  <CheckCircle className="h-3 w-3 text-risk-green-text" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
