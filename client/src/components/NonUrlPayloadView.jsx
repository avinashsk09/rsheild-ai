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
      case 'wifi': return <Wifi className="w-5 h-5 text-navy-900" />;
      case 'payment_upi':
      case 'crypto_wallet': return <CreditCard className="w-5 h-5 text-navy-900" />;
      case 'contact': return <User className="w-5 h-5 text-navy-900" />;
      case 'communication': return <MessageCircle className="w-5 h-5 text-navy-900" />;
      default: return <FileText className="w-5 h-5 text-navy-900" />;
    }
  };

  return (
    <div className="bg-white/95 border-2 border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-base font-black text-navy-950 tracking-tight leading-snug">
              {label}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Decoded static QR payload &bull; Never automatically executed or joined
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:text-navy-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'COPIED' : 'COPY'}</span>
        </button>
      </div>

      {warning && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 text-xs text-amber-950 rounded-xl flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span className="font-medium leading-relaxed">{warning}</span>
        </div>
      )}

      {/* Structured details */}
      {details && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {Object.entries(details).map(([key, val]) => (
            <div key={key} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="font-mono text-slate-900 font-bold break-all">
                {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val || 'N/A')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Raw Payload display */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
          Raw Decoded Payload:
        </label>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-900 break-all whitespace-pre-wrap select-all">
          {rawPayload}
        </div>
      </div>
    </div>
  );
}
