import React from 'react';
import {
  Shield,
  Network,
  RefreshCw,
  GitFork,
  Radio,
  FileSearch,
  KeyRound,
  QrCode,
  FileX,
  Compass,
  Cpu,
  CheckCircle2,
} from 'lucide-react';

export default function ProtectionCenter() {
  const safeguards = [
    {
      id: 'ssrf-protection',
      title: '1. SSRF & Private IP Guard',
      description: 'Blocks RFC 1918 private IPv4/IPv6 ranges, loopback localhost addresses, and cloud instance metadata (169.254.169.254). Enforces strict DNS pre-flight verification.',
      icon: Network,
      status: 'Active',
      verifiedModule: 'server/src/services/ssrfGuard.js',
    },
    {
      id: 'dns-rebinding',
      title: '2. DNS Rebinding Protection',
      description: 'Revalidates the resolved IP address on every single redirect hop. Prevents Time-of-Check to Time-of-Use (TOCTOU) DNS rebinding attacks on internal networks.',
      icon: RefreshCw,
      status: 'Active',
      verifiedModule: 'server/src/services/redirectResolver.js',
    },
    {
      id: 'redirect-protection',
      title: '3. Redirect Traversal Security',
      description: 'Limits redirect chains to a strict 5-hop maximum with cycle detection. Records intermediate HTTP status codes, protocol handshakes, and target ports.',
      icon: GitFork,
      status: 'Active',
      verifiedModule: 'Hop-by-Hop Resolution Tracer',
    },
    {
      id: 'threat-intelligence',
      title: '4. Google Safe Browsing Feed',
      description: 'Queries official Google Safe Browsing v4 threat intelligence feeds. Confirmed threat database matches trigger immediate hard-fail quarantine overrides.',
      icon: Radio,
      status: 'Active',
      verifiedModule: 'server/src/services/threatIntel.js',
    },
    {
      id: 'domain-security',
      title: '5. Heuristic Domain Defense',
      description: 'Audits for brand impersonation, typosquatting, Punycode homoglyphs, embedded basic auth credentials, and non-standard TLD risk indicators.',
      icon: FileSearch,
      status: 'Active',
      verifiedModule: 'Domain Heuristics Classifier',
    },
    {
      id: 'otp-privacy',
      title: '6. Zero-Leak OTP & PIN Masking',
      description: 'Automatically strips sensitive 4-8 digit OTPs, PINs, and passwords in memory before external AI analysis. Confidential credentials are never leaked.',
      icon: KeyRound,
      status: 'Active',
      verifiedModule: 'server/src/services/messageAnalyzer.js',
    },
    {
      id: 'local-qr',
      title: '7. Local In-Browser QR Decoding',
      description: 'Decodes QR image matrices entirely client-side using WebAssembly Canvas and jsQR. Unrendered photos and camera streams never leave your device.',
      icon: QrCode,
      status: 'Active',
      verifiedModule: 'Client Web Worker / jsQR Engine',
    },
    {
      id: 'zero-retention',
      title: '8. Zero Content Retention Policy',
      description: 'Maintains an ephemeral, memory-only inspection pipeline. No original URLs, QR payloads, or message bodies are ever saved to disk or database.',
      icon: FileX,
      status: 'Active',
      verifiedModule: 'Zero-Log Telemetry & DB Shield',
    },
    {
      id: 'safe-navigation',
      title: '9. Safe Navigation Interlock',
      description: 'Automatic client redirect execution is permanently disabled. High-risk destinations strictly require manual risk acknowledgment before visiting.',
      icon: Compass,
      status: 'Active',
      verifiedModule: 'client/src/components/WebsitePreview.jsx',
    },
    {
      id: 'ai-safety',
      title: '10. Deterministic Score Authority',
      description: 'Gemini AI provides plain-language explanations, while the deterministic mathematical scoring engine retains 100% control over safety points.',
      icon: Cpu,
      status: 'Active',
      verifiedModule: 'server/src/services/scoringEngine.js',
    },
  ];

  return (
    <section aria-label="RShield Protection Center" className="mt-12 mb-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-slate-200 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
              RShield Protection Center
            </h2>
            <span className="text-xs bg-navy-900 text-white font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              10 DEFENSE LAYERS
            </span>
          </div>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Verified cybersecurity safeguards actively enforced across all scanning operations
          </p>
        </div>

        <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>10 of 10 Safeguards Active</span>
        </div>
      </div>

      {/* 10 Safeguards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {safeguards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="bg-white/95 border-2 border-slate-200 hover:border-navy-900 rounded-2xl p-5 shadow-sm transition-all card-lift flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-navy-900 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    {item.status}
                  </span>
                </div>

                <h3 className="text-base font-black text-navy-950 mb-1.5 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="truncate max-w-[210px]">{item.verifiedModule}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
