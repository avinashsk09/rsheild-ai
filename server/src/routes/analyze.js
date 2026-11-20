import express from 'express';
import { z } from 'zod';
import { traceRedirects } from '../services/redirectResolver.js';
import { analyzeDomainHeuristics, checkGoogleSafeBrowsing } from '../services/threatIntel.js';
import { calculateSafetyScore } from '../services/scoringEngine.js';
import { parseQrPayload } from '../services/qrPayloadParser.js';
import { analyzeMessageText } from '../services/messageAnalyzer.js';
import { generateSecurityExplanation } from '../services/geminiService.js';
import { recordScanEvent } from '../services/metricsDb.js';

const router = express.Router();

const urlSchema = z.object({
  url: z.string().trim().min(1, 'URL is required').max(2048, 'URL exceeds maximum length'),
});

const qrSchema = z.object({
  payload: z.string().trim().min(1, 'QR payload is required').max(8192, 'Payload exceeds maximum length'),
});

const messageSchema = z.object({
  message: z.string().trim().min(1, 'Message text is required').max(10000, 'Message text exceeds maximum length'),
});

/**
 * Helper to perform full URL analysis flow
 */
async function performUrlAnalysis(targetUrl, source = 'url') {
  // 1. Trace redirects safely with SSRF protections
  const redirectResult = await traceRedirects(targetUrl);

  // 2. Domain & URL heuristics
  const heuristics = analyzeDomainHeuristics(redirectResult.finalUrl || targetUrl);

  // 3. Threat intel lookup
  const safeBrowsingResult = await checkGoogleSafeBrowsing(redirectResult.finalUrl || targetUrl);

  // 4. Deterministic scoring
  const scoreResult = calculateSafetyScore({
    redirectResult,
    heuristics,
    safeBrowsingResult,
  });

  // 5. Generate plain-language explanation (Gemini or deterministic fallback)
  const explanationResult = await generateSecurityExplanation({
    analysisType: source,
    deterministicScore: scoreResult.score,
    band: scoreResult.band,
    originalUrl: redirectResult.originalUrl || targetUrl,
    finalUrl: redirectResult.finalUrl || targetUrl,
    hops: redirectResult.hops || [],
    domainChanged: redirectResult.domainChanged,
    positiveFindings: scoreResult.positiveFindings,
    suspiciousFindings: scoreResult.suspiciousFindings,
    unavailableChecks: scoreResult.unavailableChecks,
  });

  return {
    source,
    targetUrl,
    destinationPreview: {
      originalUrl: redirectResult.originalUrl || targetUrl,
      originalDomain: redirectResult.originalDomain || 'N/A',
      originalProtocol: redirectResult.originalProtocol || 'N/A',
      originalPortInfo: redirectResult.originalPortInfo || null,
      hops: redirectResult.hops || [],
      totalHops: redirectResult.totalHops || 0,
      finalDestination: redirectResult.finalUrl || targetUrl,
      finalDomain: redirectResult.finalDomain || 'N/A',
      finalProtocol: redirectResult.finalProtocol || 'N/A',
      finalPortInfo: redirectResult.finalPortInfo || null,
      domainChanged: redirectResult.domainChanged || false,
      isUnreachable: redirectResult.isUnreachable || false,
      unreachableReason: redirectResult.unreachableReason || null,
    },
    safetyScore: {
      score: scoreResult.score,
      band: scoreResult.band,
      bandColor: scoreResult.bandColor,
      isUnableToVerify: scoreResult.isUnableToVerify,
      isThreatIntelMatch: scoreResult.isThreatIntelMatch,
      summaryReason: scoreResult.summaryReason,
    },
    findings: {
      positive: scoreResult.positiveFindings,
      suspicious: scoreResult.suspiciousFindings,
      unavailable: scoreResult.unavailableChecks,
    },
    aiExplanation: explanationResult,
    recommendation: scoreResult.recommendation,
  };
}

/**
 * Route: POST /api/analyze/url
 */
router.post('/url', async (req, res) => {
  try {
    const parseRes = urlSchema.safeParse(req.body);
    if (!parseRes.success) {
      return res.status(400).json({ error: parseRes.error.errors[0]?.message || 'Invalid input' });
    }

    let inputUrl = parseRes.data.url;
    // Prefix protocol if user pasted bare domain
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      inputUrl = `https://${inputUrl}`;
    }

    const result = await performUrlAnalysis(inputUrl, 'url');

    // Record scan outcome in metrics DB with real counters
    const isThreat = result.safetyScore.score !== null && result.safetyScore.score < 50;
    const isLowRisk = result.safetyScore.score !== null && result.safetyScore.score >= 80;
    const redirectsCount = result.destinationPreview?.totalHops || 1;
    recordScanEvent(req.sessionId, 'url', { isThreat, isLowRisk, redirectsCount });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      error: 'Analysis could not be completed',
      details: err.message,
    });
  }
});

/**
 * Route: POST /api/analyze/qr
 */
router.post('/qr', async (req, res) => {
  try {
    const parseRes = qrSchema.safeParse(req.body);
    if (!parseRes.success) {
      return res.status(400).json({ error: parseRes.error.errors[0]?.message || 'Invalid input' });
    }

    const rawPayload = parseRes.data.payload;
    const parsedQr = parseQrPayload(rawPayload);

    // If payload is a URL, run the full URL analysis pipeline
    if (parsedQr.isUrl && parsedQr.url) {
      const urlAnalysis = await performUrlAnalysis(parsedQr.url, 'qr');
      const isThreat = urlAnalysis.safetyScore.score !== null && urlAnalysis.safetyScore.score < 50;
      const isLowRisk = urlAnalysis.safetyScore.score !== null && urlAnalysis.safetyScore.score >= 80;
      const redirectsCount = urlAnalysis.destinationPreview?.totalHops || 1;
      recordScanEvent(req.sessionId, 'qr', { isThreat, isLowRisk, redirectsCount });

      return res.json({
        ...urlAnalysis,
        qrPayload: parsedQr,
      });
    }

    // If payload is non-URL (Wi-Fi, vCard, UPI/Crypto, Plain Text):
    // Display contents safely without execution
    recordScanEvent(req.sessionId, 'qr', { isThreat: false, isLowRisk: true, redirectsCount: 0 });
    const scoreResult = {
      score: 90,
      band: 'Low Observed Risk',
      bandColor: 'green',
      isUnableToVerify: false,
      isThreatIntelMatch: false,
      summaryReason: `Decoded ${parsedQr.label}. The QR code contains static configuration/contact data rather than an executable web link.`,
    };

    const explanationResult = await generateSecurityExplanation({
      analysisType: 'qr_non_url',
      deterministicScore: 90,
      band: 'Low Observed Risk',
      originalUrl: null,
      finalUrl: null,
      hops: [],
      domainChanged: false,
      positiveFindings: [
        { title: 'No External Web Redirection', description: 'Payload does not open browser pages or execute remote web requests.' }
      ],
      suspiciousFindings: parsedQr.warning ? [
        { title: `${parsedQr.label} Advisory`, description: parsedQr.warning }
      ] : [],
      unavailableChecks: [],
    });

    return res.json({
      source: 'qr',
      isNonUrlQr: true,
      qrPayload: parsedQr,
      safetyScore: scoreResult,
      destinationPreview: null,
      findings: {
        positive: [
          {
            type: 'positive',
            title: 'Static Non-Executable Payload',
            description: `The QR code encodes ${parsedQr.label} and contains no active HTTP links.`
          }
        ],
        suspicious: parsedQr.warning ? [
          {
            type: 'suspicious',
            title: `${parsedQr.label} Notice`,
            description: parsedQr.warning
          }
        ] : [],
        unavailable: [],
      },
      aiExplanation: explanationResult,
      recommendation: parsedQr.warning || 'Review the decoded payload details before taking manual action.',
    });
  } catch (err) {
    return res.status(500).json({
      error: 'QR code analysis could not be completed',
      details: err.message,
    });
  }
});

/**
 * Route: POST /api/analyze/message
 */
router.post('/message', async (req, res) => {
  try {
    const parseRes = messageSchema.safeParse(req.body);
    if (!parseRes.success) {
      return res.status(400).json({ error: parseRes.error.errors[0]?.message || 'Invalid input' });
    }

    const rawMessage = parseRes.data.message;

    // Run message heuristics with strict OTP masking
    const msgAnalysis = analyzeMessageText(rawMessage);

    let urlAnalysis = null;
    let combinedScore = 100;
    let primaryUrl = null;

    if (msgAnalysis.extractedUrls.length > 0) {
      primaryUrl = msgAnalysis.extractedUrls[0];
      urlAnalysis = await performUrlAnalysis(primaryUrl, 'message');
      combinedScore = urlAnalysis.safetyScore.score !== null ? urlAnalysis.safetyScore.score : 80;
    }

    // Apply social engineering penalties to message score
    if (msgAnalysis.flagsCount > 0) {
      combinedScore -= msgAnalysis.flagsCount * 15;
    }

    combinedScore = Math.max(0, Math.min(100, combinedScore));

    let band = 'Low Observed Risk';
    let bandColor = 'green';
    let recommendation = 'No severe social engineering indicators detected. Always verify message sender identity independently.';

    if (combinedScore < 20) {
      band = 'Critical Risk';
      bandColor = 'red';
      recommendation = 'High probability of phishing or credential theft scam. Do not click links or respond.';
    } else if (combinedScore < 50) {
      band = 'High Risk';
      bandColor = 'orange';
      recommendation = 'Multiple coercive manipulation patterns detected. Do not share any personal details or codes.';
    } else if (combinedScore < 80) {
      band = 'Caution';
      bandColor = 'yellow';
      recommendation = 'Message exhibits suspicious characteristics or urgency. Contact the organization via official numbers to verify.';
    }

    const messageSuspiciousFindings = msgAnalysis.detectedFlags.map(f => ({
      type: 'suspicious',
      title: `${f.category}: ${f.label}`,
      description: f.explanation,
    }));

    const allSuspicious = [
      ...messageSuspiciousFindings,
      ...(urlAnalysis?.findings?.suspicious || []),
    ];

    const allPositive = [
      ...(urlAnalysis?.findings?.positive || []),
      ...(msgAnalysis.flagsCount === 0 ? [{
        type: 'positive',
        title: 'No Coercive Social Engineering Markers',
        description: 'Text does not exhibit recognized artificial urgency, threatening phrasing, or credential solicitation patterns.'
      }] : []),
    ];

    // Generate AI explanation
    const explanationResult = await generateSecurityExplanation({
      analysisType: 'message',
      deterministicScore: combinedScore,
      band,
      originalUrl: primaryUrl,
      finalUrl: urlAnalysis?.destinationPreview?.finalDestination || null,
      hops: urlAnalysis?.destinationPreview?.hops || [],
      domainChanged: urlAnalysis?.destinationPreview?.domainChanged || false,
      positiveFindings: allPositive,
      suspiciousFindings: allSuspicious,
      unavailableChecks: urlAnalysis?.findings?.unavailable || [],
      messageAnalysis: msgAnalysis,
    });

    return res.json({
      source: 'message',
      messageAnalysis: {
        sanitizedText: msgAnalysis.sanitizedText,
        hadOtpMasked: msgAnalysis.hadOtpMasked,
        flagsCount: msgAnalysis.flagsCount,
        detectedFlags: msgAnalysis.detectedFlags,
        extractedUrls: msgAnalysis.extractedUrls,
      },
      destinationPreview: urlAnalysis ? urlAnalysis.destinationPreview : null,
      safetyScore: {
        score: combinedScore,
        band,
        bandColor,
        isUnableToVerify: false,
        isThreatIntelMatch: urlAnalysis?.safetyScore?.isThreatIntelMatch || false,
        summaryReason: msgAnalysis.flagsCount > 0
          ? `Detected ${msgAnalysis.flagsCount} social engineering marker(s)${msgAnalysis.hadOtpMasked ? ' and masked confidential OTP code(s)' : ''}.`
          : 'Standard message text with no high-risk manipulation indicators.',
      },
      findings: {
        positive: allPositive,
        suspicious: allSuspicious,
        unavailable: urlAnalysis?.findings?.unavailable || [],
      },
      aiExplanation: explanationResult,
      recommendation,
    });

    const isThreat = combinedScore < 50;
    const isLowRisk = combinedScore >= 80;
    const redirectsCount = urlAnalysis?.destinationPreview?.totalHops || 0;
    recordScanEvent(req.sessionId, 'message', { isThreat, isLowRisk, redirectsCount });
    return;
  } catch (err) {
    return res.status(500).json({
      error: 'Message analysis could not be completed',
      details: err.message,
    });
  }
});

export default router;

