import React, { useState } from 'react';
import { Globe, Lock, Unlock, ExternalLink, ShieldAlert, Check, Copy, Server, Radio } from 'lucide-react';

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
    isUnreachable,
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
    <div className="bg-surface border border-borderline rounded-xl p-4 sm:p-5 shadow-sm ring-1 ring-black/[0.02]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-borderline">
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 stroke-[2]" />
          <span>Website Security Preview</span>
        </h3>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-canvas border border-borderline text-ink-muted">
          <Radio className="h-2 w-2 text-risk-green-text" />
          Sandboxed inspect
        </span>
      </div>

      {/* Domain Header Card with Favicon and Protocol Lock */}
      <div className="p-3.5 bg-canvas/70 border border-borderline rounded-lg mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-surface border border-borderline p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
            {!imgError && faviconUrl ? (
              <img
                src={faviconUrl}
                alt={`${finalDomain} favicon`}
                className="h-6 w-6 object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <Globe className="h-5 w-5 text-ink-muted" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-ink text-sm font-sans truncate">
                {finalDomain}
              </span>
              {isHttps ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-risk-green-bg text-risk-green-text border border-risk-green-border">
                  <Lock className="h-2.5 w-2.5" />
                  TLS Encrypted
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-risk-amber-bg text-risk-amber-text border border-risk-amber-border">
                  <Unlock className="h-2.5 w-2.5" />
                  Unencrypted HTTP
                </span>
              )}
            </div>
            <div className="font-mono text-[11px] text-ink-muted truncate mt-0.5">
              {finalDestination}
            </div>
          </div>

          <button
            type="button"
            onClick={copyUrl}
            title="Copy final URL"
            className="p-1.5 rounded-md hover:bg-surface border border-transparent hover:border-borderline text-ink-muted hover:text-ink transition-colors cursor-pointer shrink-0"
          >
            {copied ? <Check className="h-4 w-4 text-risk-green-text" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Network & Infrastructure Details */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mb-3">
        <div className="p-2.5 rounded-lg bg-surface border border-borderline">
          <div className="text-[10px] text-ink-faint uppercase font-sans font-semibold mb-0.5">
            Network Host
          </div>
          <div className="font-semibold text-ink truncate flex items-center gap-1.5">
            <Server className="h-3 w-3 text-ink-muted" />
            <span>{resolvedIp || 'Resolved via DNS'}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-surface border border-borderline">
          <div className="text-[10px] text-ink-faint uppercase font-sans font-semibold mb-0.5">
            Connection Port
          </div>
          <div className="font-semibold text-ink truncate">
            Port {finalPortInfo?.effectivePort || (isHttps ? 443 : 80)}
            {finalPortInfo?.isStandard !== false ? ' (Standard)' : ' (Non-standard)'}
          </div>
        </div>
      </div>

      {/* Navigation Controls with Security Interlock */}
      <div className="pt-2 border-t border-borderline">
        {isHighRisk && (
          <div className="mb-2.5 p-2.5 bg-risk-red-bg border border-risk-red-border rounded-lg text-xs">
            <div className="flex items-center gap-2 mb-1 text-risk-red-text font-bold">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>High Risk Security Warning</span>
            </div>
            <p className="text-[11px] text-risk-red-text/90 mb-2 leading-relaxed">
              This destination was flagged by threat intelligence or heuristic security checks. Visiting may expose your browser to malware, phishing, or credential harvesting.
            </p>
            <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-risk-red-text text-[11px]">
              <input
                type="checkbox"
                checked={confirmedRisk}
                onChange={(e) => setConfirmedRisk(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-borderline text-ink cursor-pointer"
              />
              <span>I understand the risks and wish to proceed</span>
            </label>
          </div>
        )}

        {isCaution && !isHighRisk && (
          <p className="text-[11px] text-risk-amber-text font-medium mb-2 flex items-center gap-1.5">
            <Unlock className="h-3.5 w-3.5 shrink-0" />
            <span>Proceed with caution before visiting this destination.</span>
          </p>
        )}

        <button
          type="button"
          onClick={handleVisit}
          disabled={isHighRisk && !confirmedRisk}
          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
            isHighRisk
              ? confirmedRisk
                ? 'bg-risk-red-text text-white hover:bg-red-800 cursor-pointer'
                : 'bg-canvas text-ink-faint border border-borderline cursor-not-allowed'
              : isCaution
                ? 'bg-[#B4863C] text-white hover:bg-[#9B7230] cursor-pointer'
                : 'bg-ink text-white hover:bg-black cursor-pointer'
          }`}
        >
          <span>Visit Destination Website</span>
          <ExternalLink className="h-3.5 w-3.5 stroke-[2]" />
        </button>
      </div>
    </div>
  );
}
