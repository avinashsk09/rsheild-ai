import React, { useState } from 'react';
import { Copy, Check, GitFork, ArrowDown, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function DestinationPreview({ destinationPreview, safetyScore }) {
  const [copiedUrl, setCopiedUrl] = useState(null);

  if (!destinationPreview) return null;

  const {
    originalUrl,
    originalDomain,
    originalProtocol,
    hops,
    finalDestination,
    finalDomain,
    finalProtocol,
    finalPortInfo,
    domainChanged,
    isUnreachable,
    unreachableReason,
  } = destinationPreview;

  const copyToClipboard = (text, identifier) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(identifier);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const effectiveFinalPort = finalPortInfo?.effectivePort || (finalProtocol === 'http' ? 80 : 443);
  const isFinalPortStandard = finalPortInfo?.isStandard ?? [80, 443].includes(effectiveFinalPort);
  const portLabel = effectiveFinalPort === 443 ? '443 (HTTPS standard)'
    : effectiveFinalPort === 80 ? '80 (HTTP standard)'
    : effectiveFinalPort === 8080 ? '8080 (Alt HTTP)'
    : effectiveFinalPort === 8443 ? '8443 (Alt HTTPS)'
    : `${effectiveFinalPort} (Non-standard)`;

  return (
    <div className="bg-white/95 border-2 border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h3 className="text-sm font-black text-navy-950 uppercase tracking-wider flex items-center gap-2">
          <GitFork className="w-4 h-4 stroke-[2.2] text-navy-900" />
          <span>Destination &amp; Redirect Routing</span>
        </h3>
        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
          {hops?.length || 1} hop{(hops?.length || 1) !== 1 ? 's' : ''} inspected
        </span>
      </div>

      {/* Path Flow */}
      <div className="space-y-3">
        {/* Step 1: Original URL */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-500">
              Original Destination
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(originalUrl, 'orig')}
              className="text-slate-500 hover:text-navy-900 font-mono text-xs flex items-center gap-1 cursor-pointer font-bold"
            >
              {copiedUrl === 'orig' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl === 'orig' ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
          <div className="font-mono text-xs sm:text-sm text-slate-900 font-semibold break-all select-all">
            {originalUrl}
          </div>
        </div>

        {/* Intermediate Hops (if redirects occurred) */}
        {hops && hops.length > 1 && (
          <div className="pl-4 ml-4 border-l-2 border-dashed border-slate-300 space-y-2 py-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Intermediate Redirect Chain ({hops.length - 1} {hops.length - 1 === 1 ? 'hop' : 'hops'})
            </div>
            {hops.slice(0, -1).map((hop, idx) => (
              <div
                key={idx}
                className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700">
                    Hop {idx + 1}
                  </span>
                  <span className="font-mono text-slate-900 font-semibold truncate max-w-[220px]">
                    {hop.domain}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded font-mono font-bold">
                    HTTP {hop.status || '301'}
                  </span>
                </div>
                {hop.resolvedIp && (
                  <span className="font-mono text-[11px] text-slate-500 shrink-0">
                    {hop.resolvedIp}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Flow indicator */}
        <div className="flex items-center justify-center my-1">
          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <ArrowDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Step 2: Final Destination */}
        <div className="p-4 bg-white border-2 border-navy-900 rounded-xl space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black uppercase tracking-wider text-navy-950">
                Final Verified Landing
              </span>
              {finalProtocol === 'https' && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 stroke-[2.2]" />
                  HTTPS
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(finalDestination, 'dest')}
              className="text-slate-500 hover:text-navy-900 font-mono text-xs flex items-center gap-1 cursor-pointer font-bold"
            >
              {copiedUrl === 'dest' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl === 'dest' ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>

          <div className="font-mono text-xs sm:text-sm text-navy-950 font-bold break-all select-all">
            {finalDestination}
          </div>
        </div>
      </div>

      {/* Domain & Port Information Row */}
      <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className={`px-2.5 py-1 rounded-lg border font-bold ${
          isFinalPortStandard
            ? 'bg-slate-100 border-slate-200 text-slate-800'
            : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}>
          Port: {portLabel}
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold">
          Domain: {finalDomain}
        </span>
        {domainChanged && (
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 font-sans font-bold">
            Domain Shift Across Redirects
          </span>
        )}
        {isUnreachable && (
          <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-800 border border-red-300 font-sans font-bold">
            {unreachableReason || 'Destination Unreachable'}
          </span>
        )}
      </div>

      {/* Non-standard Port Warning */}
      {!isFinalPortStandard && (
        <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs text-amber-950 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Non-Standard Port Advisory: Port {effectiveFinalPort}</span>
          </p>
          <p className="text-slate-700">
            {finalPortInfo?.explanation || `Port ${effectiveFinalPort} deviates from standard web ports (80/443). Non-standard ports are frequently used by attackers to bypass corporate web proxies or run rogue servers.`}
          </p>
        </div>
      )}
    </div>
  );
}
