import React, { useState } from 'react';
import { QrCode, Link as LinkIcon, MessageSquare, ArrowRight, Loader2, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import CameraScanner from './CameraScanner.jsx';
import ImageUploader from './ImageUploader.jsx';

export default function ScanSection({ onAnalyze, isLoading, scanningStep }) {
  const [activeTab, setActiveTab] = useState('url'); // 'qr' | 'url' | 'message'
  const [qrMethod, setQrMethod] = useState('upload'); // 'upload' | 'camera'
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
    <div className="bg-surface border border-borderline rounded-xl p-5 sm:p-6 mb-6 shadow-sm ring-1 ring-black/[0.02]">
      {/* Top row: Pill-style tab group + Quick test presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-borderline">
        {/* Pill-style tab group */}
        <div className="flex items-center gap-1 p-1 bg-canvas border border-borderline rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-surface text-ink shadow-sm border border-borderline'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5 stroke-[2]" />
            <span>URL / Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-surface text-ink shadow-sm border border-borderline'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <QrCode className="h-3.5 w-3.5 stroke-[2]" />
            <span>QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('message')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'message'
                ? 'bg-surface text-ink shadow-sm border border-borderline'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 stroke-[2]" />
            <span>Suspicious Message</span>
          </button>
        </div>

        {/* Quick Test Presets */}
        <div className="flex items-center gap-1.5 text-[11px] text-ink-muted flex-wrap">
          <span className="text-ink-faint font-medium">Quick samples:</span>
          <button
            type="button"
            onClick={() => loadPreset('safe')}
            className="px-2 py-0.5 rounded bg-canvas hover:bg-subtle border border-borderline text-ink hover:text-black transition-colors"
          >
            Safe link
          </button>
          <button
            type="button"
            onClick={() => loadPreset('redirect')}
            className="px-2 py-0.5 rounded bg-canvas hover:bg-subtle border border-borderline text-ink hover:text-black transition-colors"
          >
            Redirect hops
          </button>
          <button
            type="button"
            onClick={() => loadPreset('qr-port')}
            className="px-2 py-0.5 rounded bg-canvas hover:bg-subtle border border-borderline text-ink hover:text-black transition-colors font-mono"
          >
            QR with Port (:8443)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('wifi')}
            className="px-2 py-0.5 rounded bg-canvas hover:bg-subtle border border-borderline text-ink hover:text-black transition-colors"
          >
            Wi-Fi QR
          </button>
          <button
            type="button"
            onClick={() => loadPreset('message')}
            className="px-2 py-0.5 rounded bg-canvas hover:bg-subtle border border-borderline text-ink hover:text-black transition-colors"
          >
            Phishing + OTP
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Single Shared Input Area */}

        {/* 1. URL Mode */}
        {activeTab === 'url' && (
          <div>
            <div className="relative">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/login or paste any shortened link..."
                className="w-full font-mono text-xs sm:text-sm px-4 py-3 rounded-lg border border-borderline bg-canvas/60 text-ink placeholder-ink-faint focus:outline-none focus:border-ink focus:bg-surface focus:ring-2 focus:ring-ink/5 transition-all shadow-inner"
              />
              {urlInput && (
                <button
                  type="button"
                  onClick={() => setUrlInput('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted hover:text-ink"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-ink-muted mt-2">
              <span>Resolves redirect chains &bull; Probes SSL &amp; non-standard ports</span>
              <span className="text-ink-faint">SSRF &amp; DNS Rebinding Guard Active</span>
            </div>
          </div>
        )}

        {/* 2. QR Mode */}
        {activeTab === 'qr' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setQrMethod('upload')}
                  className={`text-xs px-3 py-1 rounded-md font-semibold border transition-all cursor-pointer ${
                    qrMethod === 'upload'
                      ? 'bg-ink text-white border-ink shadow-2xs'
                      : 'bg-surface text-ink-muted border-borderline hover:bg-canvas'
                  }`}
                >
                  Upload QR Image
                </button>
                <button
                  type="button"
                  onClick={() => setQrMethod('camera')}
                  className={`text-xs px-3 py-1 rounded-md font-semibold border transition-all cursor-pointer ${
                    qrMethod === 'camera'
                      ? 'bg-ink text-white border-ink shadow-2xs'
                      : 'bg-surface text-ink-muted border-borderline hover:bg-canvas'
                  }`}
                >
                  Webcam Scanner
                </button>
                <button
                  type="button"
                  onClick={() => setQrMethod('manual')}
                  className={`text-xs px-3 py-1 rounded-md font-semibold border transition-all cursor-pointer ${
                    qrMethod === 'manual'
                      ? 'bg-ink text-white border-ink shadow-2xs'
                      : 'bg-surface text-ink-muted border-borderline hover:bg-canvas'
                  }`}
                >
                  Paste / Manual Payload
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadPreset('qr-port')}
                  className="text-[11px] text-ink-muted hover:text-ink underline decoration-borderline cursor-pointer"
                >
                  Port 8443 sample
                </button>
                <span className="text-borderline">&bull;</span>
                <button
                  type="button"
                  onClick={() => loadPreset('wifi')}
                  className="text-[11px] text-ink-muted hover:text-ink underline decoration-borderline cursor-pointer"
                >
                  Wi-Fi sample
                </button>
              </div>
            </div>

            {qrMethod === 'upload' && (
              <ImageUploader onDecoded={handleQrDecoded} />
            )}
            {qrMethod === 'camera' && (
              <CameraScanner onDecoded={handleQrDecoded} />
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-ink font-semibold">QR Payload to Analyze:</span>
                {qrDecodedPayload && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-risk-green-text bg-risk-green-bg px-2 py-0.5 rounded border border-risk-green-border">
                      <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
                      Payload ready
                    </span>
                    <button
                      type="button"
                      onClick={() => setQrDecodedPayload('')}
                      className="text-[11px] text-ink-muted hover:text-ink underline"
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
                placeholder="QR payload populates automatically on scan/upload, or paste any QR URL/text directly..."
                className="w-full font-mono text-xs px-3.5 py-2.5 rounded-lg border border-borderline bg-canvas/60 text-ink placeholder-ink-faint focus:outline-none focus:border-ink focus:bg-surface"
              />
            </div>
          </div>
        )}

        {/* 3. Message Mode */}
        {activeTab === 'message' && (
          <div>
            <textarea
              rows={3}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Paste email text, SMS delivery alert, WhatsApp scam message, or OTP prompt here..."
              className="w-full text-xs sm:text-sm px-4 py-3 rounded-lg border border-borderline bg-canvas/60 text-ink placeholder-ink-faint focus:outline-none focus:border-ink focus:bg-surface focus:ring-2 focus:ring-ink/5 transition-all resize-y shadow-inner"
            />
            <div className="flex items-center justify-between mt-2 text-[11px] text-ink-muted">
              <span>Extracts all web links &bull; Scans for artificial urgency and impersonation</span>
              <span className="inline-flex items-center gap-1 text-risk-green-text font-semibold bg-risk-green-bg px-2 py-0.5 rounded border border-risk-green-border">
                <ShieldCheck className="h-3 w-3 stroke-[2.2]" />
                Zero-Leak OTP Masking Active
              </span>
            </div>
          </div>
        )}

        {/* Bottom Bar: Multi-stage status + High-contrast Analyze Button */}
        <div className="mt-4 pt-3.5 border-t border-borderline flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-ink-muted">
            {isLoading ? (
              <span className="flex items-center gap-2 text-ink font-semibold">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-ink" />
                {scanningStep || 'Inspecting destination...'}
              </span>
            ) : (
              <span>Zero client execution &bull; SSRF protected &bull; Deterministic engine</span>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid() || isLoading}
            className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm ${
              isFormValid() && !isLoading
                ? 'bg-ink text-white hover:bg-black active:scale-[0.99] cursor-pointer'
                : 'bg-canvas text-ink-faint border border-borderline cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Running Scan...</span>
              </>
            ) : (
              <>
                <span>Analyze Destination</span>
                <ArrowRight className="h-4 w-4 ml-2 stroke-[2.2]" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
