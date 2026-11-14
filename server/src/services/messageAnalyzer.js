/**
 * Message analysis service with strict OTP masking and social engineering detection.
 */

const URGENCY_PATTERNS = [
  { pattern: /\b(immediate(ly)?|urgent(ly)?|right away|asap|at once)\b/i, label: 'High Urgency Phrasing', explanation: 'Creates artificial panic to bypass deliberate consideration.' },
  { pattern: /\b(within (24|12|48|2|1) (hours?|hrs?)|expires in \d+ (minutes?|mins?))\b/i, label: 'Artificial Time Limit', explanation: 'Imposes short deadlines to pressure victims into acting without verifying.' },
  { pattern: /\b(suspend(ed|ing)?|terminat(ed|ing|ion)|freeze|frozen|block(ed)?)\b/i, label: 'Account Suspension Threat', explanation: 'Threatens service disruption to trigger panic responses.' },
  { pattern: /\b(legal action|lawsuit|arrest|warrant|police|court|fine|penalty)\b/i, label: 'Coercive Threat / Legal Pressure', explanation: 'Threatens legal retribution or arrest to intimidate the recipient.' },
  { pattern: /\b(unauthorized (access|transaction|charge|login)|fraud alert|compromised)\b/i, label: 'Fabricated Security Alert', explanation: 'Claims an account breach occurred to lure the user to a fake verification portal.' },
];

const CREDENTIAL_OTP_PATTERNS = [
  { pattern: /\b(share|send|provide|give|reply with|enter) (your )?(otp|one-time (password|passcode|code)|pin|password|passcode|security code)\b/i, label: 'Direct OTP / Credential Request', explanation: 'Legitimate services never request your one-time passwords, verification codes, or PINs.' },
  { pattern: /\b(do not share|never share) (this|your) (otp|code)\b/i, label: 'Security Warning Contradiction', explanation: 'Text paradoxically cites standard security advisories while instructing external actions.' },
  { pattern: /\b(verify|authenticate) (your )?(identity|account|credentials) (at|via|by clicking)\b/i, label: 'Credential Harvesting Bait', explanation: 'Directs user to input sensitive credentials under the guise of an identity re-check.' }
];

const IMPERSONATION_PATTERNS = [
  { pattern: /\b(bank of america|wells fargo|chase|citi|barclays|hsbc|sbi|hdfc|icici|paypal)\b/i, label: 'Financial Institution Impersonation', explanation: 'Claims to represent a major banking or payments entity.' },
  { pattern: /\b(fedex|ups|dhl|usps|postal service|courier|delivery failed|customs fee|parcel)\b/i, label: 'Delivery / Parcel Scam', explanation: 'Impersonates shipping carriers to prompt fee payments or personal data entry.' },
  { pattern: /\b(apple support|microsoft support|google support|meta security|whatsapp team)\b/i, label: 'Tech Support Impersonation', explanation: 'Pretends to be a platform security or technical support team.' },
  { pattern: /\b(irs|tax authority|tax refund|revenue service|government agency)\b/i, label: 'Government / Tax Agency Impersonation', explanation: 'Pretends to represent tax or civic authorities.' }
];

/**
 * HARD REQUIREMENT: Mask any OTP or PIN-shaped values in user text
 * BEFORE it can reach any AI layer, logging, or third-party service.
 * @param {string} text
 * @returns {string} Sanitized text with OTP values masked
 */
export function maskSensitiveOtpValues(text) {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text;

  // Mask OTP patterns after explicit keywords: e.g. "code: 123456", "OTP is 482901", "PIN 9876"
  sanitized = sanitized.replace(
    /(\b(?:otp|code|pin|passcode|token|password|digits?|verification)\s*(?:is|:|=|-|\s)\s*)([0-9]{4,8})\b/gi,
    '$1[OTP_MASKED]'
  );

  // Mask formatted codes like 123-456 or 1234-5678
  sanitized = sanitized.replace(
    /\b([0-9]{3,4})[- ]([0-9]{3,4})\b/g,
    '[OTP_MASKED]'
  );

  // Mask standalone 6-digit numeric sequences
  sanitized = sanitized.replace(
    /\b[0-9]{6}\b/g,
    '[OTP_MASKED]'
  );

  return sanitized;
}

/**
 * Extracts all URLs found in the text.
 * @param {string} text
 * @returns {string[]} Array of unique extracted URLs
 */
export function extractUrlsFromMessage(text) {
  if (!text) return [];

  // Match full http/https URLs or common domain link patterns
  const urlRegex = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/gi;
  const matches = text.match(urlRegex) || [];

  const normalized = matches.map(u => {
    let clean = u.replace(/[.,;!?)]+$/, ''); // Strip trailing punctuation
    if (clean.toLowerCase().startsWith('www.')) {
      clean = `https://${clean}`;
    }
    return clean;
  });

  return Array.from(new Set(normalized));
}

/**
 * Analyzes text for social engineering markers.
 * @param {string} rawText
 * @returns {object} Analysis result with sanitized text and detected flags
 */
export function analyzeMessageText(rawText) {
  const sanitizedText = maskSensitiveOtpValues(rawText);
  const detectedFlags = [];

  // Check Urgency
  for (const item of URGENCY_PATTERNS) {
    if (item.pattern.test(sanitizedText)) {
      detectedFlags.push({
        category: 'Urgency & Pressure',
        label: item.label,
        explanation: item.explanation,
      });
    }
  }

  // Check Credential / OTP Request
  for (const item of CREDENTIAL_OTP_PATTERNS) {
    if (item.pattern.test(sanitizedText)) {
      detectedFlags.push({
        category: 'Credential / OTP Solicitation',
        label: item.label,
        explanation: item.explanation,
      });
    }
  }

  // Check Impersonation
  for (const item of IMPERSONATION_PATTERNS) {
    if (item.pattern.test(sanitizedText)) {
      detectedFlags.push({
        category: 'Entity Impersonation',
        label: item.label,
        explanation: item.explanation,
      });
    }
  }

  // Check if OTP was masked
  const hadOtpMasked = sanitizedText.includes('[OTP_MASKED]');
  if (hadOtpMasked) {
    detectedFlags.push({
      category: 'Privacy Protection Triggered',
      label: 'One-Time Passcode (OTP) Detected and Masked',
      explanation: 'Text contained an OTP/PIN pattern. RShield AI masked this value immediately before analysis to protect your privacy.'
    });
  }

  const extractedUrls = extractUrlsFromMessage(sanitizedText);

  return {
    sanitizedText,
    hadOtpMasked,
    extractedUrls,
    flagsCount: detectedFlags.length,
    detectedFlags,
    isSuspicious: detectedFlags.length > 0,
  };
}

