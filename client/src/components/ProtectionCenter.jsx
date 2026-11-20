import React, { useEffect, useState } from 'react';
import {
  Network, RefreshCw, GitFork, Radio, FileSearch, KeyRound, QrCode,
  FileX, Compass, Cpu, CheckCircle2, X, ArrowUpRight, Info,
} from 'lucide-react';

const safeguards = [
  {
    id: 'ssrf-protection', title: 'SSRF & Private IP Guard',
    short: 'Blocks requests to private and internal network destinations.',
    description: 'The scanner validates a submitted website address before the backend requests it. Loopback, private-network and cloud-metadata destinations are restricted so the scanner cannot be used as a proxy to reach private infrastructure.',
    icon: Network, status: 'Active', verifiedModule: 'server/src/services/ssrfGuard.js',
    whatItChecks: ['Loopback and localhost destinations, including 127.0.0.1.', 'Private IPv4 and IPv6 address ranges.', 'Link-local and cloud metadata addresses such as 169.254.169.254.', 'The destination hostname and its resolved addresses before inspection.'],
    whyItMatters: 'A URL scanner makes network requests on behalf of its users. Without restrictions, a maliciously crafted URL could attempt to make the server contact internal services that are not publicly accessible.',
    userBenefit: 'RShield can inspect public destinations while rejecting destinations that should never be reached by the scanning service.',
    limitation: 'This is a server-side network safeguard. It does not certify that a public website is trustworthy or free of malicious content.'
  },
  {
    id: 'dns-rebinding', title: 'DNS Rebinding Protection',
    short: 'Rechecks DNS destinations as redirect inspection progresses.',
    description: 'DNS rebinding attempts to change the IP address returned for a hostname so that a later connection reaches a restricted network. RShield revalidates resolved addresses as it inspects redirect destinations.',
    icon: RefreshCw, status: 'Active', verifiedModule: 'server/src/services/redirectResolver.js',
    whatItChecks: ['DNS answers for the hostname being inspected.', 'Whether resolved addresses fall into restricted network ranges.', 'The hostname introduced by each new redirect.', 'Whether a redirect changes the network destination being contacted.'],
    whyItMatters: 'A hostname can resolve to one address during an initial check and a different address later. Rechecking at each hop reduces the risk of a redirect or DNS change bypassing the first validation.',
    userBenefit: 'The scanner applies network restrictions throughout the inspection, not only to the first URL.',
    limitation: 'DNS checks must be tied to the actual outbound connection to fully mitigate DNS rebinding. The protection depends on the resolver and HTTP client configuration used by the deployed backend.'
  },
  {
    id: 'redirect-protection', title: 'Redirect Traversal Security',
    short: 'Inspects supported HTTP redirects with a five-hop limit.',
    description: 'Shortened links and redirect services can hide the destination a user will eventually reach. RShield follows supported HTTP redirect responses one hop at a time, applying destination validation as it proceeds.',
    icon: GitFork, status: 'Active', verifiedModule: 'server/src/services/redirectResolver.js',
    whatItChecks: ['Common HTTP redirect responses: 301, 302, 307 and 308.', 'Intermediate destination URLs and available response details.', 'Redirect loops and repeated destinations.', 'Protocol and explicit port changes where available.', 'A maximum inspection depth of five hops.'],
    whyItMatters: 'A short or familiar-looking URL may forward the user to a different domain. Seeing the route makes unexpected destination changes easier to notice.',
    userBenefit: 'Users can compare the original URL with the final destination that RShield successfully inspected.',
    limitation: 'The HTTP redirect trace does not guarantee discovery of JavaScript redirects, meta refreshes, login-gated destinations or redirects that require user interaction.'
  },
  {
    id: 'threat-intelligence', title: 'Google Safe Browsing',
    short: 'Checks destinations against known unsafe-resource lists.',
    description: 'RShield can check inspected URLs against Google Safe Browsing threat intelligence for supported threat categories. A confirmed match is surfaced as a high-priority security finding.',
    icon: Radio, status: 'Active', verifiedModule: 'server/src/services/threatIntel.js',
    whatItChecks: ['Known phishing and social-engineering destinations.', 'Known malware-related URLs.', 'Other unsafe-resource categories supported by the configured service.', 'Whether the threat-intelligence lookup completed or was unavailable.'],
    whyItMatters: 'A destination may already be reported as unsafe by security providers. Reputation checks add evidence beyond local URL-pattern rules.',
    userBenefit: 'A confirmed threat match can be shown prominently so users understand why a destination should be avoided.',
    limitation: 'A URL that has no match is not guaranteed safe. New, private or unreported threats may not yet appear in a threat-intelligence database.'
  },
  {
    id: 'domain-security', title: 'Heuristic Domain Defense',
    short: 'Looks for impersonation, typosquatting and deceptive URL patterns.',
    description: 'RShield examines domain and URL characteristics that are often used to make deceptive destinations look legitimate. These checks are indicators for review, not proof of malicious intent on their own.',
    icon: FileSearch, status: 'Active', verifiedModule: 'server/src/services/threatIntel.js',
    whatItChecks: ['Lookalike spellings and possible typosquatting.', 'Brand names embedded in unrelated domains.', 'Punycode and visually similar Unicode characters.', 'IP-address hostnames and embedded credentials.', 'Uncommon top-level domains and other suspicious URL patterns.'],
    whyItMatters: 'A deceptive website may use a hostname that resembles a bank, delivery service or popular platform. Careful domain inspection helps expose that mismatch.',
    userBenefit: 'The report can explain which part of the hostname or URL triggered a warning instead of showing only a generic danger label.',
    limitation: 'Uncommon TLDs, long URLs and unfamiliar domains can be legitimate. RShield should combine indicators and avoid treating one heuristic as conclusive proof.'
  },
  {
    id: 'otp-privacy', title: 'OTP & PIN Masking',
    short: 'Masks verification codes before external AI analysis.',
    description: 'When a user submits a suspicious message, RShield looks for OTP-like codes and sensitive information and replaces matched values before the content is passed to an external AI explanation service.',
    icon: KeyRound, status: 'Active', verifiedModule: 'server/src/services/messageAnalyzer.js',
    whatItChecks: ['Common 4–8 digit verification-code patterns.', 'PIN-like numeric values covered by the masking rules.', 'Other sensitive fields supported by the message-masking utility.', 'Requests in a message that pressure users to reveal verification codes.'],
    whyItMatters: 'A pasted message may contain personal or authentication information. Masking reduces the amount of sensitive data exposed during analysis.',
    userBenefit: 'Users can review suspicious message wording without intentionally sending a visible OTP to the AI explanation layer.',
    limitation: 'Pattern matching can miss unusual code formats or mask ordinary numbers. Never paste a real OTP, PIN or password into a scanner.'
  },
  {
    id: 'local-qr', title: 'Local QR Decoding',
    short: 'Decodes QR images in the browser before analysis.',
    description: 'The QR scanning interface processes the camera stream or uploaded image in the browser to extract the encoded payload. The image itself does not need to be uploaded to the analysis backend.',
    icon: QrCode, status: 'Active', verifiedModule: 'client QR scanner and image decoder',
    whatItChecks: ['QR payloads that contain website URLs.', 'UPI payment details and payment-request information.', 'Wi-Fi configuration strings.', 'Contact cards, SMS, telephone links and plain text.'],
    whyItMatters: 'QR images can contain private visual information beyond the link itself. Local decoding helps minimize unnecessary image transfer.',
    userBenefit: 'The user can scan with a camera or select an image, then review the decoded contents before deciding what to do.',
    limitation: 'The decoded payload may still need to be sent to the backend for URL or message analysis. Local image decoding does not mean every decoded value stays on the device.'
  },
  {
    id: 'zero-retention', title: 'Zero Content Retention',
    short: 'Avoids saving original URLs, QR payloads and message bodies.',
    description: 'RShield is designed to process scan content temporarily and avoid persisting original URLs, decoded QR payloads or message bodies. Its metrics layer is intended to retain aggregate scan information rather than user-submitted content.',
    icon: FileX, status: 'Active', verifiedModule: 'server metrics and persistence layer',
    whatItChecks: ['Whether original scan content is written to persistent storage.', 'Whether telemetry contains only the aggregate fields required for metrics.', 'Whether errors and diagnostics expose submitted content.', 'Whether sensitive values are excluded from scan-history records.'],
    whyItMatters: 'A security scanner should not create an unnecessary repository of the private messages and destinations that users submit for inspection.',
    userBenefit: 'The design minimizes retained content and reduces the amount of sensitive information that could be exposed later.',
    limitation: 'Temporary processing, infrastructure logs, hosting telemetry and third-party API handling must also be reviewed. Avoid claiming that no provider ever sees submitted data unless that has been verified end to end.'
  },
  {
    id: 'safe-navigation', title: 'Safe Navigation Interlock',
    short: 'Adds an explicit warning step before visiting risky destinations.',
    description: 'RShield separates inspecting a destination from visiting it. The results interface can require the user to acknowledge a warning before opening a destination classified as high risk.',
    icon: Compass, status: 'Active', verifiedModule: 'client/src/components/WebsitePreview.jsx',
    whatItChecks: ['The safety band returned by the analysis engine.', 'Whether a destination is eligible for a visit action.', 'Whether the user has acknowledged the warning for a high-risk result.', 'Whether the destination shown to the user matches the inspected result.'],
    whyItMatters: 'A scanner should not silently send users to the very destination it is warning them about.',
    userBenefit: 'Users can review the report first and make a deliberate decision instead of being redirected automatically.',
    limitation: 'An acknowledgement is not a security guarantee. Users should avoid confirmed malicious destinations and independently verify unfamiliar websites.'
  },
  {
    id: 'ai-safety', title: 'Deterministic Score Authority',
    short: 'Keeps the mathematical scoring engine in control of the result.',
    description: 'RShield uses deterministic rules to calculate the safety score. Gemini is used to explain the evidence in plain language and does not decide or rewrite the numerical score.',
    icon: Cpu, status: 'Active', verifiedModule: 'server/src/services/scoringEngine.js',
    whatItChecks: ['Rule-based signals and their configured risk weights.', 'The final score and risk band produced by the scoring engine.', 'Whether an AI explanation is available or a fallback is used.', 'Whether unavailable checks are reported separately from passed checks.'],
    whyItMatters: 'A language model can produce inconsistent or unsupported conclusions. Keeping score calculation separate makes the numerical result repeatable and easier to audit.',
    userBenefit: 'Users receive a score based on defined checks and a human-readable explanation of the findings.',
    limitation: 'A deterministic score is only as reliable as its rules, threat data and test coverage. A high score is not a guarantee that a website is safe.'
  },
];

export default function ProtectionCenter() {
  const [selectedSafeguard, setSelectedSafeguard] = useState(null);

  useEffect(() => {
    if (!selectedSafeguard) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedSafeguard(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSafeguard]);

  const SelectedIcon = selectedSafeguard?.icon;

  return (
    <section aria-label="RShield Protection Center" className="mt-12 mb-10 w-full">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">RShield Protection Center</h2>
            <span className="text-[11px] bg-navy-900 text-white font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider">10 Defense Layers</span>
          </div>
          <p className="text-sm sm:text-base text-slate-600 font-medium mt-2 max-w-3xl">
            Explore the safeguards behind every inspection. Select any layer to see what it checks, how it works and what its limitations are.
          </p>
        </div>
        <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 inline-flex items-center gap-2 self-start xl:self-auto shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>10 of 10 Safeguards Listed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {safeguards.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedSafeguard(item)}
              aria-haspopup="dialog"
              aria-expanded={selectedSafeguard?.id === item.id}
              aria-label={'Explain ' + item.title}
              className="group w-full min-h-[220px] text-left bg-white border-2 border-slate-200 hover:border-navy-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy-200 rounded-2xl p-5 shadow-sm transition-all card-lift flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-navy-50 text-navy-800 border border-navy-100 flex items-center justify-center shrink-0 group-hover:bg-navy-900 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5 stroke-[2.1]" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    {item.status}
                  </span>
                </div>
                <h3 className="text-base sm:text-[17px] font-extrabold text-navy-950 mb-2 leading-snug">{item.title}</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.short}</p>
              </div>
              <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-navy-800 group-hover:text-navy-700">View explanation</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-navy-800 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </button>
          );
        })}
      </div>

      {selectedSafeguard && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          role="presentation"
          onClick={() => setSelectedSafeguard(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="safeguard-dialog-title"
            aria-describedby="safeguard-dialog-description"
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-slate-200 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-5 sm:px-7 py-4 flex items-start justify-between gap-4 rounded-t-3xl">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center shrink-0">
                  {SelectedIcon && <SelectedIcon className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">{selectedSafeguard.status}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Defense layer</span>
                  </div>
                  <h3 id="safeguard-dialog-title" className="text-lg sm:text-xl font-black text-navy-950 leading-tight">{selectedSafeguard.title}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSafeguard(null)}
                aria-label="Close safeguard explanation"
                className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:text-navy-950 hover:bg-slate-50 flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-7 space-y-6">
              <p id="safeguard-dialog-description" className="text-sm sm:text-base text-slate-700 leading-relaxed">{selectedSafeguard.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <h4 className="text-sm font-extrabold text-navy-950 mb-3">What it checks</h4>
                  <ul className="space-y-2.5">
                    {selectedSafeguard.whatItChecks.map((check) => (
                      <li key={check} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <span>{check}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-navy-100 bg-navy-50/70 p-4">
                    <h4 className="text-sm font-extrabold text-navy-950 mb-2">Why it matters</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedSafeguard.whyItMatters}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                    <h4 className="text-sm font-extrabold text-emerald-950 mb-2">How it helps you</h4>
                    <p className="text-sm text-emerald-950/85 leading-relaxed">{selectedSafeguard.userBenefit}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-extrabold text-amber-950 mb-1">Important limitation</h4>
                  <p className="text-sm text-amber-950/85 leading-relaxed">{selectedSafeguard.limitation}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Related implementation</p>
                <code className="inline-block max-w-full break-all text-xs text-navy-800 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">{selectedSafeguard.verifiedModule}</code>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
