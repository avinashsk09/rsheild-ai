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
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  const [scanningStep, setScanningStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [metrics, setMetrics] = useState(null);

  // Load metrics from actual backend endpoint
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
    <div className="min-h-screen flex flex-col bg-canvas text-ink font-sans">
      <Header scansToday={metrics?.scansToday ?? metrics?.totalScans} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Section 1: Cybersecurity Statistics Grid (Connected to actual backend metrics) */}
        <StatsGrid metrics={metrics} isLoading={isMetricsLoading} />

        {/* Main Input / Scanning Section */}
        <ScanSection
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          scanningStep={scanningStep}
        />

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-lg bg-risk-red-bg border border-risk-red-border text-risk-red-text text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Inspection Failed</p>
              <p className="mt-0.5 text-xs text-risk-red-text/90">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Section 2: Two-Column Security Results Grid */}
        {analysisResult && (
          <section aria-label="Inspection Results" className="animate-in fade-in duration-200 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Inspection Result
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3 stroke-[2]" />
                <span>New scan</span>
              </button>
            </div>

            {/* Responsive Two-Column Layout on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start mb-4">
              {/* LEFT COLUMN: Score, Risk Classification, Destination Routing, Website Preview */}
              <div className="space-y-4">
                {/* Large circular safety score (0–100) & risk classification */}
                <SecurityScore safetyScore={analysisResult.safetyScore} />

                {analysisResult.isNonUrlQr ? (
                  <NonUrlPayloadView qrPayload={analysisResult.qrPayload} />
                ) : (
                  analysisResult.destinationPreview && (
                    <>
                      {/* Original URL, Final destination URL, Redirect chain, Domain & Port Info */}
                      <DestinationPreview
                        destinationPreview={analysisResult.destinationPreview}
                        safetyScore={analysisResult.safetyScore}
                        showVisitButton={false}
                      />

                      {/* Website preview with favicon, SSL verification, and safe navigation controls */}
                      <WebsitePreview
                        destinationPreview={analysisResult.destinationPreview}
                        safetyScore={analysisResult.safetyScore}
                      />
                    </>
                  )
                )}
              </div>

              {/* RIGHT COLUMN: Positive checks, Suspicious indicators, Unavailable checks, AI explanation, Action */}
              <div className="space-y-4">
                {/* Security Metrics Overview: passed, warnings, unavailable counts */}
                <SecurityMetricsOverview findings={analysisResult.findings} />

                {/* Positive security checks, Suspicious indicators, Unavailable checks */}
                <SecurityFindings findings={analysisResult.findings} />

                {/* Plain-language AI Explanation */}
                <AIExplanation aiExplanation={analysisResult.aiExplanation} />

                {/* Recommended security action */}
                <Recommendation
                  recommendation={analysisResult.recommendation}
                  bandColor={analysisResult.safetyScore?.bandColor}
                />
              </div>
            </div>
          </section>
        )}

        {/* Section 3: RShield Protection Center (6 confirmed safeguards) */}
        <ProtectionCenter />
      </main>

      {/* Trust & Privacy Minimal Footer */}
      <footer className="border-t border-borderline py-4 px-4 text-xs text-ink-muted bg-surface">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px]">
          <span>RShield AI &bull; QR &amp; Link Security Analysis Engine</span>
          <span className="text-ink-faint">
            Zero content retention &bull; Network sandboxed &bull; Privacy protected
          </span>
        </div>
      </footer>
    </div>
  );
}
