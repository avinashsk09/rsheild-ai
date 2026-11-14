import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Globe, ArrowDown, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function DestinationPreview({ destinationPreview, safetyScore }) {
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [acknowledgedMalicious, setAcknowledgedMalicious] = useState(false);

  if (!destinationPreview) return null;

  const {
    originalUrl,
    originalDomain,
    originalProtocol,
    originalPortInfo,
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

  const handleVisit = () => {
    if (!finalDestination) return;
    window.open(finalDestination, '_blank', 'noopener,noreferrer');
  };

  const bandColor = safetyScore?.bandColor || 'gray';
  const isHighOrCritical = bandColor === 'red' || bandColor === 'orange' || safetyScore?.isThreatIntelMatch;
  const isCaution = bandColor === 'yellow';

  return (
    <div className="bg-surface border border-borderline rounded-xl p-4 sm:p-5 shadow-sm ring-1 ring-black/[0.02]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-borderline">
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 stroke-[2]" />
          <span>Where Does This Take You?</span>
        </h3>
        <span className="text-[10px] font-mono text-ink-muted">
          {hops?.length || 1} hop{(hops?.length || 1) !== 1 ? 's' : ''} inspected
        </span>
      </div>

      {/* Visual Path Flow */}
      <div className="space-y-2 mb-3">
        {/* Step 1: Submitted Origin */}
        <div className="p-3 bg-canvas/80 border border-borderline rounded-lg text-xs">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-semibold text-ink-muted uppercase tracking-wider text-[10px]">Submitted URL</span>
            <button
              type="button"
              onClick={() => copyToClipboard(originalUrl, 'orig')}
              className="text-ink-muted hover:text-ink font-mono text-[11px] flex items-center gap-1"
            >
              {copiedUrl === 'orig' ? <Check className="h-3 w-3 text-risk-green-text" /> : <Copy className="h-3 w-3" />}
              <span>{copiedUrl === 'orig' ? 'copied' : 'copy'}</span>
            </button>
          </div>
          <div className="font-mono text-xs text-ink font-medium break-all select-all">
            {originalUrl}
          </div>
        </div>

        {/* Intermediate Hops (if more than 1 hop) */}
        {hops && hops.length > 1 && (
          <div className="pl-3 ml-3 border-l-2 border-dashed border-borderline space-y-1.5 py-1">
            {hops.slice(0, -1).map((hop, idx) => (
              <div key={idx} className="p-2 bg-surface border border-borderline/80 rounded-md text-[11px] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-[10px] px-1.5 py-0.2 bg-canvas border border-borderline rounded text-ink-muted font-semibold">
                    Hop {idx + 1}
                  </span>
                  <span className="font-mono text-ink truncate max-w-[200px]">
                    {hop.domain}
                  </span>
                  <span className="text-[10px] px-1 py-0.2 bg-risk-amber-bg text-risk-amber-text border border-risk-amber-border rounded font-mono">
                    HTTP {hop.status || '301'}
                  </span>
                </div>
                {hop.resolvedIp && (
                  <span className="font-mono text-[10px] text-ink-faint shrink-0">
                    {hop.resolvedIp}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Path Indicator Arrow */}
        <div className="flex items-center justify-center my-0.5">
          <div className="h-5 w-5 rounded-full bg-canvas border border-borderline flex items-center justify-center text-ink-faint">
            <ArrowDown className="h-3 w-3" />
          </div>
        </div>

        {/* Step 2: Final Destination */}
        <div className="p-3 bg-surface border-2 border-borderline rounded-lg text-xs shadow-2xs">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-ink uppercase tracking-wider text-[10px]">Verified Final Landing</span>
              {finalProtocol === 'https' && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-risk-green-bg text-risk-green-text border border-risk-green-border">
                  HTTPS Encrypted
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(finalDestination, 'dest')}
              className="text-ink-muted hover:text-ink font-mono text-[11px] flex items-center gap-1"
            >
              {copiedUrl === 'dest' ? <Check className="h-3 w-3 text-risk-green-text" /> : <Copy className="h-3 w-3" />}
              <span>{copiedUrl === 'dest' ? 'copied' : 'copy'}</span>
            </button>
          </div>

          <div className="font-mono text-xs text-ink font-semibold break-all select-all">
            {finalDestination}
          </div>
        </div>
      </div>

      {/* One-line flags row with Port details */}
      {(() => {
        const effectiveFinalPort = finalPortInfo?.effectivePort || (finalProtocol === 'http' ? 80 : 443);
        const isFinalPortStandard = finalPortInfo?.isStandard ?? [80, 443].includes(effectiveFinalPort);
        const portLabel = effectiveFinalPort === 443 ? '443 (HTTPS standard)'
          : effectiveFinalPort === 80 ? '80 (HTTP standard)'
          : effectiveFinalPort === 8080 ? '8080 (Alt HTTP)'
          : effectiveFinalPort === 8443 ? '8443 (Alt HTTPS)'
          : `${effectiveFinalPort} (Non-standard)`;

        return (
          <>
            <div className="flex flex-wrap items-center gap-1.5 py-2.5 border-y border-borderline text-[11px] font-mono text-ink-muted mb-3">
              <span className={`px-2 py-0.5 rounded border ${
                isFinalPortStandard
                  ? 'bg-canvas border-borderline text-ink'
                  : 'bg-risk-amber-bg border-risk-amber-border text-risk-amber-text font-semibold'
              }`}>
                Port {portLabel}
              </span>
              <span className="px-2 py-0.5 rounded bg-canvas border border-borderline">
                {finalDomain}
              </span>
              {domainChanged && (
                <span className="px-2 py-0.5 rounded bg-risk-amber-bg text-risk-amber-text border border-risk-amber-border font-sans font-semibold">
                  Domain Shift Across Redirects
                </span>
              )}
              {isUnreachable && (
                <span className="px-2 py-0.5 rounded bg-risk-red-bg text-risk-red-text border border-risk-red-border font-sans font-semibold">
                  Destination Unreachable
                </span>
              )}
            </div>

            {/* Port explanation note if non-standard or unusual */}
            {!isFinalPortStandard && (
              <div className="p-2.5 bg-risk-amber-bg/60 border border-risk-amber-border rounded-lg text-xs text-risk-amber-text mb-3 leading-relaxed">
                <p className="font-semibold flex items-center gap-1.5 mb-0.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Port Notice: Port {effectiveFinalPort}</span>
                </p>
                <p className="text-[11px]">
                  {finalPortInfo?.explanation || `Port ${effectiveFinalPort} is unusual for standard web browsing. An unusual port is a signal to inspect closer, not proof of compromise.`}
                </p>
              </div>
            )}
          </>
        );
      })()}

      {/* Risk-Gated Visit Button (§3) */}
      <div className="pt-1">
        {isCaution && (
          <p className="text-[11px] text-risk-amber-text font-medium mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Proceed with caution before visiting this destination.
          </p>
        )}

        {isHighOrCritical && (
          <div className="flex items-center gap-2 mb-2.5 p-2 bg-risk-red-bg border border-risk-red-border rounded-md">
            <input
              type="checkbox"
              id="confirm-malicious"
              checked={acknowledgedMalicious}
              onChange={(e) => setAcknowledgedMalicious(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-borderline text-ink focus:ring-ink cursor-pointer"
            />
            <label htmlFor="confirm-malicious" className="text-xs text-risk-red-text font-semibold cursor-pointer select-none">
              I understand this destination may be malicious
            </label>
          </div>
        )}

        <button
          type="button"
          onClick={handleVisit}
          disabled={isHighOrCritical && !acknowledgedMalicious}
          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
            isHighOrCritical
              ? acknowledgedMalicious
                ? 'bg-risk-red-text text-white hover:bg-red-800 cursor-pointer'
                : 'bg-canvas text-ink-faint border border-borderline cursor-not-allowed'
              : isCaution
                ? 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer'
                : 'bg-ink text-white hover:bg-black cursor-pointer'
          }`}
        >
          <span>Visit this destination</span>
          <ExternalLink className="h-3.5 w-3.5 stroke-[2]" />
        </button>
      </div>
    </div>
  );
}
