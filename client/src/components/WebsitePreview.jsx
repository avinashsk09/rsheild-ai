import React, { useState } from 'react';
import { Globe, Lock, Unlock, ExternalLink, ShieldAlert, Check, Copy, Server, Radio, ShieldCheck } from 'lucide-react';

export default function WebsitePreview({ destinationPreview, safetyScore }) {
  const [copied, setCopied] = useState(false);
  const [confirmedRisk, setConfirmedRisk] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!destinationPreview || !destinationPreview.finalDestination) return null;

  const {
    finalDestination,
    finalDomain,
    finalProtocol,
    finalPortInfo,
    hops,
  } = destinationPreview;

  const isHttps = finalProtocol === 'https';
  const lastHop = hops && hops.length > 0 ? hops[hops.length - 1] : null;
  const resolvedIp = lastHop?.resolvedIp || null;

  const bandColor = safetyScore?.bandColor || 'gray';
  const isHighRisk = bandColor === 'red' || bandColor === 'orange' || safetyScore?.isThreatIntelMatch;
  const isCaution = bandColor === 'yellow';

  const copyUrl = () => {
    navigator.clipboard.writeText(finalDestination);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVisit = () => {
    if (!finalDestination) return;
    window.open(finalDestination, '_blank', 'noopener,noreferrer');
  };

  const faviconUrl = finalDomain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(finalDomain)}&sz=64`
    : null;

  return (
    <div className="bg-white/95 border-2 border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h3 className="text-sm font-black text-navy-950 uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 stroke-[2.2] text-navy-900" />
          <span>Website Security Preview</span>
        </h3>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          Sandboxed Inspect
        </span>
      </div>

      {/* Domain Header Card with Favicon and Protocol Lock */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-200 p-2 flex items-center justify-center shrink-0 shadow-sm">
            {!imgError && faviconUrl ? (
              <img
                src={faviconUrl}
                alt={`${finalDomain} favicon`}
                className="w-7 h-7 object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <Globe className="w-6 h-6 text-slate-400" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-navy-950 text-base font-sans truncate">
                {finalDomain}
              </span>
              {isHttps ? (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-700" />
                  TLS 1.3 Encrypted
                </span>
              ) : (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                  <Unlock className="w-3 h-3 text-amber-600" />
                  Unencrypted HTTP
                </span>
              )}
            </div>
            <div className="font-mono text-xs text-slate-500 truncate mt-1">
              {finalDestination}
            </div>
          </div>

          <button
            type="button"
            onClick={copyUrl}
            title="Copy final URL"
            className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-navy-900 transition-colors cursor-pointer shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Network & Infrastructure Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">
            Target Host Address
          </div>
          <div className="font-bold text-navy-950 truncate flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-slate-500" />
            <span>{resolvedIp || 'Resolved via DNS'}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">
            Connection Port
          </div>
          <div className="font-bold text-navy-950 truncate">
            Port {finalPortInfo?.effectivePort || (isHttps ? 443 : 80)}
            {finalPortInfo?.isStandard !== false ? ' (Standard Web)' : ' (Non-Standard)'}
          </div>
        </div>
      </div>

      {/* Safe Navigation Controls with Security Interlock Gate */}
      <div className="pt-3 border-t border-slate-200">
        {isHighRisk && (
          <div className="mb-3 p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-red-950 font-black text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-600" />
              <span>High-Risk Intercept Gate Active</span>
            </div>
            <p className="text-red-900 text-xs leading-relaxed">
              This target was flagged by threat intelligence or high-severity heuristic rules. Automatic navigation is strictly disabled to protect your browser and identity.
            </p>
            <label className="flex items-center gap-2.5 cursor-pointer select-none font-bold text-red-950 text-xs pt-1">
              <input
                type="checkbox"
                checked={confirmedRisk}
                onChange={(e) => setConfirmedRisk(e.target.checked)}
                className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500 cursor-pointer"
              />
              <span>I understand the security risks and wish to proceed manually</span>
            </label>
          </div>
        )}

        {isCaution && !isHighRisk && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-center gap-2 font-semibold">
            <Unlock className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Proceed with caution: destination displays unusual or unverified characteristics.</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleVisit}
          disabled={isHighRisk && !confirmedRisk}
          className={`min-h-[48px] w-full px-5 py-3 rounded-xl font-black text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${
            isHighRisk
              ? confirmedRisk
                ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              : isCaution
                ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                : 'bg-navy-900 hover:bg-navy-800 text-white cursor-pointer'
          }`}
        >
          <span>Visit Destination Website</span>
          <ExternalLink className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
}
