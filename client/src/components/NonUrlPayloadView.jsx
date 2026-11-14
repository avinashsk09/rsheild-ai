import React, { useState } from 'react';
import { Wifi, CreditCard, User, MessageCircle, FileText, Copy, Check, AlertTriangle } from 'lucide-react';

export default function NonUrlPayloadView({ qrPayload }) {
  const [copied, setCopied] = useState(false);

  if (!qrPayload) return null;

  const { type, label, details, rawPayload, warning } = qrPayload;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIcon = () => {
    switch (type) {
      case 'wifi': return <Wifi className="h-5 w-5 text-primary-muted" />;
      case 'payment_upi':
      case 'crypto_wallet': return <CreditCard className="h-5 w-5 text-primary-muted" />;
      case 'contact': return <User className="h-5 w-5 text-primary-muted" />;
      case 'communication': return <MessageCircle className="h-5 w-5 text-primary-muted" />;
      default: return <FileText className="h-5 w-5 text-primary-muted" />;
    }
  };

  return (
    <div className="bg-surface border border-borderline rounded-xl p-5 sm:p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-borderline mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-subtle border border-borderline">
            {getIcon()}
          </div>
          <div>
            <h2 className="text-base font-bold text-primary-charcoal tracking-tight">
              {label}
            </h2>
            <p className="text-xs text-primary-sub mt-0.5">
              Decoded static QR payload &bull; Never automatically executed or joined
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-borderline bg-canvas text-xs font-medium text-primary-muted hover:bg-subtle transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Payload'}</span>
        </button>
      </div>

      {warning && (
        <div className="mb-4 p-3 bg-risk-yellow-bg/70 border border-risk-yellow-border text-xs text-risk-yellow-text rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{warning}</span>
        </div>
      )}

      {/* Render structured details if available */}
      {details && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {Object.entries(details).map(([key, val]) => (
            <div key={key} className="p-2.5 rounded-lg border border-borderline/80 bg-subtle/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-sub block mb-0.5">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="font-mono text-primary-charcoal font-medium break-all">
                {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val || 'N/A')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Raw Payload display */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-primary-sub block mb-1">
          Raw Decoded Payload:
        </label>
        <div className="p-3 rounded-lg border border-borderline bg-canvas font-mono text-xs text-primary-charcoal break-all whitespace-pre-wrap select-all">
          {rawPayload}
        </div>
      </div>
    </div>
  );
}

