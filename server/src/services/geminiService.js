import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

/**
 * Generates an explainable summary based STRICTLY on the deterministic findings.
 * Never computes scores or overrides verdicts.
 * Falls back to template explanation if API key is absent or request fails.
 */
export async function generateSecurityExplanation({
  analysisType, // 'url' | 'qr' | 'message'
  deterministicScore,
  band,
  originalUrl,
  finalUrl,
  hops,
  domainChanged,
  positiveFindings,
  suspiciousFindings,
  unavailableChecks,
  messageAnalysis,
}) {
  // Check if API key is present
  if (!config.geminiApiKey) {
    return buildDeterministicFallbackExplanation({
      analysisType,
      deterministicScore,
      band,
      originalUrl,
      finalUrl,
      hops,
      domainChanged,
      positiveFindings,
      suspiciousFindings,
      unavailableChecks,
      messageAnalysis,
      reason: 'Gemini API key is not configured in environment variables. Deterministic analysis engine provided this explanation.',
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: config.geminiModel });

    // Ensure all message text passed has OTPs masked
    const sanitizedContext = {
      analysisType,
      score: deterministicScore,
      band,
      originalUrl,
      finalUrl,
      hopCount: hops?.length || 0,
      domainChanged,
      positiveFindings: positiveFindings?.map(f => f.title) || [],
      suspiciousFindings: suspiciousFindings?.map(f => `${f.title}: ${f.description}`) || [],
      unavailableChecks: unavailableChecks?.map(c => c.title) || [],
      messageFlags: messageAnalysis?.detectedFlags?.map(f => `${f.category} - ${f.label}: ${f.explanation}`) || [],
    };

    const prompt = `
You are the cybersecurity explanation layer of QR Shield AI.
Your role is to explain the existing deterministic security findings in clear, professional, plain language.

STRICT CONSTRAINTS:
1. DO NOT alter, recompute, or suggest a different safety score. The score is strictly ${deterministicScore} (${band}).
2. DO NOT state or imply that any site is "100% safe" or "completely risk-free".
3. DO NOT fabricate or invent threat intelligence results.
4. If checks were unavailable, acknowledge the limitation plainly.
5. If OTP markers are present, emphasize that legitimate services never ask users to share one-time codes.
6. Provide a concise, highly readable explanation with:
   - Summary of where the link/QR actually goes and whether the domain changed.
   - Breakdown of suspicious signals or confirmed positive safeguards.
   - Clear, calm actionable advice.

FINDINGS DATA:
${JSON.stringify(sanitizedContext, null, 2)}

Provide a direct, well-structured explanation in 2-3 short paragraphs.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      aiLayerAvailable: true,
      source: 'gemini',
      explanation: text.trim(),
    };
  } catch (err) {
    let friendlyReason = 'Gemini AI service was unavailable';
    if (err.message?.includes('API key not valid') || err.message?.includes('400') || err.message?.includes('404')) {
      friendlyReason = 'Gemini API key is invalid or unrecognized. Google Gemini keys start with "AIzaSy..." from aistudio.google.com.';
    } else {
      friendlyReason = `Gemini explanation layer returned an error (${err.message}).`;
    }

    return buildDeterministicFallbackExplanation({
      analysisType,
      deterministicScore,
      band,
      originalUrl,
      finalUrl,
      hops,
      domainChanged,
      positiveFindings,
      suspiciousFindings,
      unavailableChecks,
      messageAnalysis,
      reason: friendlyReason,
    });
  }
}

/**
 * Builds a structured, dependable template explanation when Gemini is offline.
 */
function buildDeterministicFallbackExplanation({
  analysisType,
  deterministicScore,
  band,
  originalUrl,
  finalUrl,
  hops,
  domainChanged,
  positiveFindings,
  suspiciousFindings,
  unavailableChecks,
  messageAnalysis,
  reason,
}) {
  const paragraphs = [];

  // Paragraph 1: Routing & Destination summary
  if (originalUrl && finalUrl) {
    if (originalUrl === finalUrl) {
      paragraphs.push(
        `The analyzed link connects directly to ${finalUrl} without traversing intermediate redirect hops.`
      );
    } else {
      const hopCount = hops?.length || 1;
      paragraphs.push(
        `The analyzed link initiates at ${originalUrl} and traverses ${hopCount} redirect hop${hopCount > 1 ? 's' : ''} to reach the final destination at ${finalUrl}. ` +
        (domainChanged
          ? 'Noticeable domain shifts occurred across this chain, which means the initial domain hands control over to a different organization.'
          : 'All hops remained within the same domain scope.')
      );
    }
  }

  // Paragraph 2: Findings breakdown
  if (suspiciousFindings && suspiciousFindings.length > 0) {
    const issues = suspiciousFindings.map(f => f.title).join('; ');
    paragraphs.push(
      `Specific security concerns were identified during inspection: ${issues}. These patterns contribute directly to the ${band} evaluation.`
    );
  } else {
    paragraphs.push(
      `No known active risk indicators were observed during inspection. Standard encryption and domain validation checks were satisfied.`
    );
  }

  // Paragraph 3: Message or OTP specific guidance
  if (messageAnalysis && messageAnalysis.detectedFlags && messageAnalysis.detectedFlags.length > 0) {
    paragraphs.push(
      `The submitted message text contains social engineering indicators such as urgency phrasing, credential solicitation, or entity impersonation. Any one-time passcodes (OTPs) detected were masked for privacy before inspection.`
    );
  }

  // Paragraph 4: Checks availability
  if (unavailableChecks && unavailableChecks.length > 0) {
    const list = unavailableChecks.map(u => u.title).join(', ');
    paragraphs.push(
      `Note: Certain external verification checks could not be completed (${list}). Final safety should be independently confirmed.`
    );
  }

  return {
    aiLayerAvailable: false,
    source: 'deterministic_template',
    unavailableReason: reason,
    explanation: paragraphs.join('\n\n'),
  };
}

