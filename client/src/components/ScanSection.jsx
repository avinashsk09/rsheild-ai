import React, { useState } from 'react';
import { QrCode, Link as LinkIcon, MessageSquare, ArrowRight, Loader2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import CameraScanner from './CameraScanner.jsx';
import ImageUploader from './ImageUploader.jsx';

export default function ScanSection({ onAnalyze, isLoading, scanningStep }) {
  const [activeTab, setActiveTab] = useState('url'); // 'qr' | 'url' | 'message'
  const [qrMethod, setQrMethod] = useState('upload'); // 'upload' | 'camera' | 'manual'
  const [qrDecodedPayload, setQrDecodedPayload] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [messageInput, setMessageInput] = useState('');

  const handleQrDecoded = (payload) => {
    setQrDecodedPayload(payload);
    if (payload && payload.trim()) {
      onAnalyze('qr', { payload: payload.trim() });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (activeTab === 'qr') {
      if (!qrDecodedPayload.trim()) return;
      onAnalyze('qr', { payload: qrDecodedPayload.trim() });
    } else if (activeTab === 'url') {
      if (!urlInput.trim()) return;
      onAnalyze('url', { url: urlInput.trim() });
    } else if (activeTab === 'message') {
      if (!messageInput.trim()) return;
      onAnalyze('message', { message: messageInput.trim() });
    }
  };

  const isFormValid = () => {
    if (activeTab === 'qr') return !!qrDecodedPayload.trim();
    if (activeTab === 'url') return !!urlInput.trim();
    if (activeTab === 'message') return !!messageInput.trim();
    return false;
  };

  // Quick 1-click test samples
  const loadPreset = (type) => {
    if (type === 'safe') {
      setActiveTab('url');
      setUrlInput('https://www.google.com');
    } else if (type === 'redirect') {
      setActiveTab('url');
      setUrlInput('https://httpbin.org/redirect/2');
    } else if (type === 'qr-port') {
      setActiveTab('qr');
      setQrMethod('manual');
      setQrDecodedPayload('https://destination.example:8443/login?session=admin');
    } else if (type === 'message') {
      setActiveTab('message');
      setMessageInput('URGENT: Your bank account has been suspended! Please reply immediately with your one-time code 948201 to verify your identity at https://secure-verify.top/login');
    } else if (type === 'wifi') {
      setActiveTab('qr');
      setQrMethod('manual');
      setQrDecodedPayload('WIFI:S:ExecutiveLounge_5G;T:WPA;P:Secr3tP@ss2026;;');
    }
  };

  return (
    <section aria-label="Scan & Threat Analysis Console" className="bg-white/95 border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-8 space-y-6">
      {/* Top Header: Tab Selector & Quick Presets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        {/* Navigation Tabs matching reference style */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`min-h-[44px] px-4 sm:px-5 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'url'
                ? 'bg-navy-900 text-white shadow-sm border border-navy-900'
                : 'text-slate-700 hover:text-navy-900 hover:bg-slate-200/70'
            }`}
          >
            <LinkIcon className="w-4 h-4 stroke-[2.2]" />
            <span>URL / Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`min-h-[44px] px-4 sm:px-5 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-navy-900 text-white shadow-sm border border-navy-900'
                : 'text-slate-700 hover:text-navy-900 hover:bg-slate-200/70'
            }`}
          >
            <QrCode className="w-4 h-4 stroke-[2.2]" />
            <span>QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('message')}
            className={`min-h-[44px] px-4 sm:px-5 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'message'
                ? 'bg-navy-900 text-white shadow-sm border border-navy-900'
                : 'text-slate-700 hover:text-navy-900 hover:bg-slate-200/70'
            }`}
          >
            <MessageSquare className="w-4 h-4 stroke-[2.2]" />
            <span>Suspicious Message</span>
          </button>
        </div>

        {/* Quick Test Presets */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px] mr-1">
            Presets:
          </span>
          <button
            type="button"
            onClick={() => loadPreset('safe')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            Safe Link
          </button>
          <button
            type="button"
            onClick={() => loadPreset('redirect')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            Redirect Hops
          </button>
          <button
            type="button"
            onClick={() => loadPreset('qr-port')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold font-mono transition-colors cursor-pointer"
          >
            Port :8443
          </button>
          <button
            type="button"
            onClick={() => loadPreset('message')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            Phishing + OTP
          </button>
          <button
            type="button"
            onClick={() => loadPreset('wifi')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            Wi-Fi Config
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. URL Mode */}
        {activeTab === 'url' && (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Target Web Address or Shortened Link
            </label>
            <div className="relative">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/login or paste bit.ly, tinyurl, or suspicious link..."
                className="w-full font-mono text-sm sm:text-base px-4 py-3.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-navy-900 focus:ring-0 shadow-inner transition-all"
              />
              {urlInput && (
                <button
                  type="button"
                  onClick={() => setUrlInput('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-navy-900 cursor-pointer"
                >
                  CLEAR
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500 pt-1">
              <span>Resolves full HTTP 301/302 redirect chains &bull; Probes SSL &amp; non-standard ports</span>
              <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                SSRF &amp; DNS Rebinding Guard Active
              </span>
            </div>
          </div>
        )}

        {/* 2. QR Mode */}
        {activeTab === 'qr' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setQrMethod('upload')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    qrMethod === 'upload'
                      ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Upload QR Image
                </button>
                <button
                  type="button"
                  onClick={() => setQrMethod('camera')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    qrMethod === 'camera'
                      ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Webcam Scanner
                </button>
                <button
                  type="button"
                  onClick={() => setQrMethod('manual')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    qrMethod === 'manual'
                      ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Paste / Manual Payload
                </button>
              </div>

              <div className="text-xs text-slate-500 font-semibold">
                Decoded locally inside browser (Zero raw image upload)
              </div>
            </div>

            {qrMethod === 'upload' && (
              <ImageUploader onDecoded={handleQrDecoded} />
            )}
            {qrMethod === 'camera' && (
              <CameraScanner onDecoded={handleQrDecoded} />
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Decoded QR Payload:
                </span>
                {qrDecodedPayload && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                      Payload Decoded
                    </span>
                    <button
                      type="button"
                      onClick={() => setQrDecodedPayload('')}
                      className="text-xs font-bold text-slate-400 hover:text-navy-900 underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <input
                type="text"
                value={qrDecodedPayload}
                onChange={(e) => setQrDecodedPayload(e.target.value)}
                placeholder="QR payload populates automatically on upload/scan, or paste raw payload text directly..."
                className="w-full font-mono text-sm px-4 py-3 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-navy-900 focus:ring-0 shadow-inner"
              />
            </div>
          </div>
        )}

        {/* 3. Message Mode */}
        {activeTab === 'message' && (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Suspicious Message Text (SMS, Email, WhatsApp Scam, OTP Prompt)
            </label>
            <textarea
              rows={4}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Paste suspicious text here (e.g. 'URGENT: Your account is blocked. Share code 491029 to verify at https://...')"
              className="w-full text-sm sm:text-base p-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-navy-900 focus:ring-0 shadow-inner transition-all resize-y"
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500 pt-1">
              <span>Scans for psychological pressure, fake KYC threats &amp; embedded phishing URLs</span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1 self-start sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5 stroke-[2.2]" />
                Zero-Leak OTP Masking Active
              </span>
            </div>
          </div>
        )}

        {/* Bottom Action Row */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-600 font-medium">
            {isLoading ? (
              <span className="flex items-center gap-2 text-navy-900 font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-navy-900" />
                {scanningStep || 'Inspecting destination and security vectors...'}
              </span>
            ) : (
              <span>Zero client execution &bull; SSRF protected &bull; Deterministic engine</span>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid() || isLoading}
            className={`min-h-[50px] w-full sm:w-auto px-8 py-3 rounded-xl text-base font-black transition-all shadow-sm flex items-center justify-center gap-2.5 ${
              isFormValid() && !isLoading
                ? 'bg-navy-900 hover:bg-navy-800 text-white cursor-pointer active:scale-[0.99]'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-1" />
                <span>Scanning Destination...</span>
              </>
            ) : (
              <>
                <span>Analyze Security Risks</span>
                <ArrowRight className="w-5 h-5 stroke-[2.2]" />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
