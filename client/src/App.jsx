import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import StatsGrid from './components/StatsGrid.jsx';
import ScanSection from './components/ScanSection.jsx';
import SecurityScore from './components/SecurityScore.jsx';
import DestinationPreview from './components/DestinationPreview.jsx';
import WebsitePreview from './components/WebsitePreview.jsx';
import SecurityMetricsOverview from './components/SecurityMetricsOverview.jsx';
import SecurityFindings from './components/SecurityFindings.jsx';
import AIExplanation from './components/AIExplanation.jsx';
import Recommendation from './components/Recommendation.jsx';
import ProtectionCenter from './components/ProtectionCenter.jsx';
import NonUrlPayloadView from './components/NonUrlPayloadView.jsx';
import { analyzeUrl, analyzeQr, analyzeMessage, getMetrics } from './services/api.js';
import { AlertCircle, RotateCcw, Shield } from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  const [scanningStep, setScanningStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [metrics, setMetrics] = useState(null);

  // Load actual backend metrics
  const refreshMetrics = async () => {
    try {
      const data = await getMetrics();
      if (data) {
        setMetrics(data);
      }
    } catch (err) {
      console.warn('Could not refresh backend metrics:', err.message);
    } finally {
      setIsMetricsLoading(false);
    }
  };

  useEffect(() => {
    refreshMetrics();

    // Session exit beacon on tab close / unload
    const handleExit = () => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/session/exit');
      }
    };

    window.addEventListener('pagehide', handleExit);
    window.addEventListener('beforeunload', handleExit);

    return () => {
      window.removeEventListener('pagehide', handleExit);
      window.removeEventListener('beforeunload', handleExit);
    };
  }, []);

  const handleAnalyze = async (mode, payload) => {
    setIsLoading(true);
    setErrorMsg(null);
    setAnalysisResult(null);

    setScanningStep('Validating input & resolving destination...');
    const stepTimer1 = setTimeout(() => {
      setScanningStep('Following redirect chain & inspecting hops...');
    }, 600);

    const stepTimer2 = setTimeout(() => {
      setScanningStep('Checking threat intel & computing safety score...');
    }, 1400);

    try {
      let data;
      if (mode === 'url') {
        data = await analyzeUrl(payload.url);
      } else if (mode === 'qr') {
        data = await analyzeQr(payload.payload);
      } else if (mode === 'message') {
        data = await analyzeMessage(payload.message);
      }

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setAnalysisResult(data);
      refreshMetrics();
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      const serverErr = err.response?.data?.error || err.response?.data?.details || err.message;
      setErrorMsg(`Analysis could not be completed: ${serverErr}`);
    } finally {
      setIsLoading(false);
      setScanningStep('');
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {/* 2A. Header matching reference website */}
      <Header scansToday={metrics?.scansToday ?? metrics?.totalScans} />

      <main className="flex-1 w-full max-w-none mx-0 px-4 sm:px-6 lg:px-8 2xl:px-10 py-8 space-y-8">
        {/* Hero Section */}
        <section className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-navy-900 bg-navy-50 border border-navy-200">
            <Shield className="w-3.5 h-3.5 text-navy-900" />
            <span>Autonomous Threat Intelligence &bull; Zero Trust</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-navy-950 tracking-tight leading-tight">
            Check Before You Click, Scan, or Trust.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-medium max-w-4xl leading-relaxed">
            Verify where suspicious QR codes, shortened links, and manipulative phishing messages truly lead before opening them in your browser.
          </p>
        </section>

        {/* 2B. Statistics Grid (4 responsive cards connected to real backend metrics) */}
        <StatsGrid metrics={metrics} isLoading={isMetricsLoading} />

        {/* 2C. Scanner Section (Preserving all 3 modes: QR, URL, Message) */}
        <ScanSection
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          scanningStep={scanningStep}
        />

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-300 text-red-950 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-black text-base">Inspection Failed</p>
              <p className="text-sm text-red-900 font-medium mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* 2D. Analysis Results Grid (Responsive Two-Column Layout) */}
        {analysisResult && (
          <section aria-label="Inspection Results" className="w-full space-y-4 animate-in fade-in duration-200">
            {/* Results Title Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Inspection Result &bull; Detailed Cyber Threat Report
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-navy-900 px-3 py-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>New Scan</span>
              </button>
            </div>

            {/* Two-Column Grid on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* LEFT COLUMN: Safety Score Gauge, Risk Classification, Destination Routing, Website Preview */}
              <div className="space-y-6">
                {/* 220px Safety Score Circular Gauge */}
                <SecurityScore safetyScore={analysisResult.safetyScore} size={220} />

                {analysisResult.isNonUrlQr ? (
                  <NonUrlPayloadView qrPayload={analysisResult.qrPayload} />
                ) : (
                  analysisResult.destinationPreview && (
                    <>
                      {/* Original URL, Final Destination, Redirect Chain, Port & Domain info */}
                      <DestinationPreview
                        destinationPreview={analysisResult.destinationPreview}
                        safetyScore={analysisResult.safetyScore}
                      />

                      {/* Safe Website Preview with Favicon, TLS encryption, and Safe Navigation Gate */}
                      <WebsitePreview
                        destinationPreview={analysisResult.destinationPreview}
                        safetyScore={analysisResult.safetyScore}
                      />
                    </>
                  )
                )}
              </div>

              {/* RIGHT COLUMN: Passed Checks, Suspicious Indicators, Unavailable Checks, AI Explanation, Actions */}
              <div className="space-y-6">
                {/* Security Check Metrics Overview */}
                <SecurityMetricsOverview findings={analysisResult.findings} />

                {/* Positive security checks, Suspicious indicators, Unavailable checks */}
                <SecurityFindings findings={analysisResult.findings} />

                {/* Plain-Language AI Security Explanation */}
                <AIExplanation aiExplanation={analysisResult.aiExplanation} />

                {/* Recommended Security Action Callout */}
                <Recommendation
                  recommendation={analysisResult.recommendation}
                  bandColor={analysisResult.safetyScore?.bandColor}
                />
              </div>
            </div>
          </section>
        )}

        {/* 2E. & 3. RShield Protection Center (All 10 active safeguards) */}
        <ProtectionCenter />
      </main>

      {/* Commercial Product Footer */}
      <footer className="border-t border-slate-200 bg-white/95 py-8 px-4 sm:px-6 lg:px-8 mt-12 text-sm text-slate-600">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-navy-900 text-white flex items-center justify-center font-black text-xs">
              R
            </div>
            <span className="font-black text-navy-950">RShield AI</span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">
              Enterprise QR, URL &amp; Link Security Intelligence
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
            <span>Zero Content Retention</span>
            <span>&bull;</span>
            <span>SSRF Sandboxed</span>
            <span>&bull;</span>
            <span>Deterministic Rules Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
