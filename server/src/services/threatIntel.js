import { config } from '../config.js';

const SUSPICIOUS_TLDS = [
  '.top', '.xyz', '.click', '.fit', '.surf', '.rest', '.bid', '.gq',
  '.tk', '.ml', '.cf', '.work', '.date', '.racing', '.icu', '.monster',
  '.buzz', '.kim', '.link', '.country', '.stream', '.download'
];

const TARGET_BRANDS = [
  'paypal', 'google', 'apple', 'microsoft', 'netflix', 'amazon',
  'facebook', 'instagram', 'whatsapp', 'chase', 'wellsfargo', 'bankofamerica',
  'citi', 'binance', 'coinbase', 'metamask', 'docusign', 'fedex', 'ups',
  'dhl', 'usps', 'irs', 'telegram', 'outlook', 'yahoo', 'sbi', 'hdfc', 'icici', 'paytm', 'phonepe'
];

// Common typo / homoglyph lookalikes for high-profile targets
const LOOKALIKE_MAP = [
  { lookalike: 'paypa1', brand: 'paypal', legitimateDomain: 'paypal.com' },
  { lookalike: 'paypaI', brand: 'paypal', legitimateDomain: 'paypal.com' },
  { lookalike: 'micros0ft', brand: 'microsoft', legitimateDomain: 'microsoft.com' },
  { lookalike: 'g00gle', brand: 'google', legitimateDomain: 'google.com' },
  { lookalike: 'goog1e', brand: 'google', legitimateDomain: 'google.com' },
  { lookalike: 'app1e', brand: 'apple', legitimateDomain: 'apple.com' },
  { lookalike: 'arnazon', brand: 'amazon', legitimateDomain: 'amazon.com' },
  { lookalike: 'amazn', brand: 'amazon', legitimateDomain: 'amazon.com' },
  { lookalike: 'netflx', brand: 'netflix', legitimateDomain: 'netflix.com' },
  { lookalike: 'faceb00k', brand: 'facebook', legitimateDomain: 'facebook.com' },
  { lookalike: 'wellsfarg0', brand: 'wellsfargo', legitimateDomain: 'wellsfargo.com' },
  { lookalike: 'b1nance', brand: 'binance', legitimateDomain: 'binance.com' },
];

const DANGEROUS_EXTENSIONS = [
  '.exe', '.scr', '.bat', '.cmd', '.msi', '.apk', '.vbs', '.ps1',
  '.iso', '.dll', '.jar', '.vbe', '.wsf', '.hta'
];

const KNOWN_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 't.co', 'is.gd', 'buff.ly', 'ow.ly',
  'cutt.ly', 'goo.gl', 'rb.gy', 'shorturl.at', 'rebrand.ly'
];

/**
 * Queries Google Safe Browsing API v4 if an API key is configured.
 * @param {string} urlToCheck
 * @returns {Promise<{ available: boolean, isThreat: boolean, threats?: string[], error?: string }>}
 */
export async function checkGoogleSafeBrowsing(urlToCheck) {
  const cleanKey = (config.googleSafeBrowsingKey || '').replace(/['"]/g, '').trim();
  if (!cleanKey) {
    return {
      available: false,
      isThreat: false,
      reason: 'Google Safe Browsing API key not configured in environment.'
    };
  }

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${cleanKey}`;
  const requestBody = {
    client: {
      clientId: 'qrshield-ai',
      clientVersion: '1.0.0',
    },
    threatInfo: {
      threatTypes: [
        'MALWARE',
        'SOCIAL_ENGINEERING',
        'UNWANTED_SOFTWARE',
        'POTENTIALLY_HARMFUL_APPLICATION'
      ],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url: urlToCheck }],
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errDetail = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.error?.message) {
          errDetail += ` (${errJson.error.message})`;
        }
      } catch {}

      return {
        available: false,
        isThreat: false,
        error: `Google Safe Browsing feed unavailable: ${errDetail}. Ensure 'Safe Browsing API (v4)' is enabled in Google Cloud Console.`
      };
    }

    const data = await response.json();
    const matches = data.matches || [];
    if (matches.length > 0) {
      const threatTypes = matches.map(m => m.threatType);
      return {
        available: true,
        isThreat: true,
        threats: threatTypes,
        details: matches,
      };
    }

    return {
      available: true,
      isThreat: false,
      threats: [],
    };
  } catch (err) {
    return {
      available: false,
      isThreat: false,
      error: `Threat intel query failed: ${err.message}`
    };
  }
}

/**
 * Analyzes domain structure and heuristics for suspicious traits.
 * @param {string} rawUrl
 * @returns {object}
 */
export function analyzeDomainHeuristics(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { error: 'Invalid URL' };
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();
  const search = parsed.search.toLowerCase();
  const fullPath = pathname + search;

  const findings = [];
  let isBrandImpersonation = false;
  let impersonatedBrand = null;
  let isSuspiciousTld = false;
  let isDirectIpHost = false;
  let isPunycode = false;
  let isShortener = false;
  let hasDangerousDownload = false;
  let hasCredentialsInUrl = false;
  let excessiveSubdomains = false;

  // 1. Credentials in URL (e.g. http://user:pass@domain.com)
  if (parsed.username || parsed.password) {
    hasCredentialsInUrl = true;
    findings.push({
      type: 'suspicious',
      title: 'Credentials embedded in URL',
      description: 'The URL embeds authentication credentials in the authority string, a technique frequently used in deception attacks.'
    });
  }

  // 2. Direct IP as Hostname
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    isDirectIpHost = true;
    findings.push({
      type: 'suspicious',
      title: 'Direct IP Address Destination',
      description: `Hostname is an explicit raw IP address (${hostname}) instead of a verified registered domain name.`
    });
  }

  // 3. Punycode / Homograph (IDN)
  if (hostname.includes('xn--')) {
    isPunycode = true;
    findings.push({
      type: 'suspicious',
      title: 'Internationalized Domain Name (Punycode)',
      description: 'Domain uses Punycode encoding (xn--), which can be used to spoof Latin letters with visually indistinguishable characters (homoglyph attack).'
    });
  }

  // 4. Known Shortener
  if (KNOWN_SHORTENERS.includes(hostname)) {
    isShortener = true;
    findings.push({
      type: 'suspicious',
      title: 'URL Shortener Detected',
      description: `URL uses a shortening service (${hostname}) that conceals the ultimate destination until followed.`
    });
  }

  // 5. Suspicious TLD
  for (const tld of SUSPICIOUS_TLDS) {
    if (hostname.endsWith(tld)) {
      isSuspiciousTld = true;
      findings.push({
        type: 'suspicious',
        title: `High-Risk Top-Level Domain (${tld})`,
        description: `Domain uses '${tld}', a top-level domain frequently associated with automated throwaway registration and low-cost spam/phishing campaigns.`
      });
      break;
    }
  }

  // 6. Brand Impersonation / Typosquatting
  // Related official brand services map
  const BRAND_RELATED_DOMAINS = {
    google: ['youtube.com', 'youtu.be', 'android.com', 'gmail.com', 'gstatic.com', 'googleapis.com', 'googleusercontent.com', 'googlesource.com', 'withgoogle.com', 'goo.gl', 'chrome.com'],
    apple: ['apple.com', 'icloud.com', 'itunes.com', 'me.com', 'apple.co'],
    microsoft: ['microsoft.com', 'live.com', 'office.com', 'office365.com', 'azure.com', 'windows.com', 'bing.com', 'github.com', 'msn.com', 'xbox.com', 'visualstudio.com'],
    amazon: ['amazon.com', 'amazonaws.com', 'primevideo.com', 'media-amazon.com', 'images-amazon.com'],
    paypal: ['paypal.com', 'paypal.me'],
    facebook: ['facebook.com', 'fb.com', 'fb.me', 'meta.com'],
    instagram: ['instagram.com'],
    whatsapp: ['whatsapp.com', 'wa.me'],
    netflix: ['netflix.com'],
    spotify: ['spotify.com'],
    telegram: ['telegram.org', 't.me'],
    binance: ['binance.com'],
    coinbase: ['coinbase.com'],
    docusign: ['docusign.com', 'docusign.net'],
    fedex: ['fedex.com'],
    ups: ['ups.com'],
    dhl: ['dhl.com'],
    usps: ['usps.com'],
  };

  for (const brand of TARGET_BRANDS) {
    const brandRegex = new RegExp(`(^|[-._])${brand}([-._]|$)`, 'i');
    if (brandRegex.test(hostname)) {
      // 1. Check if brand is the TLD itself (e.g. antigravity.google, blog.google)
      const isBrandTld = hostname === brand || hostname.endsWith(`.${brand}`);
      
      // 2. Check if hostname is an official ccTLD or gTLD for this brand (e.g. google.com, google.co.in, google.de)
      const ccRegex = new RegExp(`^([a-z0-9-]+\\.)*${brand}\\.[a-z]{2,4}(\\.[a-z]{2})?$`, 'i');
      const isOfficialDomain = ccRegex.test(hostname);

      // 3. Check known ecosystem domains for that brand
      const isRelatedOfficial = BRAND_RELATED_DOMAINS[brand]?.some(d => hostname === d || hostname.endsWith(`.${d}`));

      if (!isBrandTld && !isOfficialDomain && !isRelatedOfficial) {
        isBrandImpersonation = true;
        impersonatedBrand = brand;
        findings.push({
          type: 'suspicious',
          title: `Potential Brand Impersonation (${brand})`,
          description: `The domain references '${brand}' but does not appear to be an official verified domain of ${brand.toUpperCase()}.`
        });
        break;
      }
    }
  }

  // 7. Excessive Subdomains (e.g. auth.secure.login.example.com.phish.org)
  const parts = hostname.split('.');
  if (parts.length > 4) {
    excessiveSubdomains = true;
    findings.push({
      type: 'suspicious',
      title: 'Excessive Subdomain Stacking',
      description: `Domain contains ${parts.length} labels, a pattern common in phishing attacks attempting to bury the true root domain.`
    });
  }

  // 8. Dangerous File Download Extension
  for (const ext of DANGEROUS_EXTENSIONS) {
    if (pathname.endsWith(ext) || fullPath.includes(`${ext}?`)) {
      hasDangerousDownload = true;
      findings.push({
        type: 'suspicious',
        title: `Direct Executable / Archive Download (${ext})`,
        description: `Destination path targets an executable or high-risk file extension (${ext}). Scanning before downloading or running is critical.`
      });
      break;
    }
  }

  // 9. Sensitive keywords in path (login, verify, otp, credential, banking)
  const suspiciousKeywords = ['login', 'signin', 'verify', 'update-password', 'banking', 'secure-account', 'otp-code', 'wallet-connect'];
  const matchedKeywords = suspiciousKeywords.filter(k => fullPath.includes(k));
  if (matchedKeywords.length > 0 && (isBrandImpersonation || isSuspiciousTld || isDirectIpHost)) {
    findings.push({
      type: 'suspicious',
      title: 'Authentication Phishing Markers',
      description: `Path includes credential-harvesting keywords (${matchedKeywords.join(', ')}) combined with anomalous domain attributes.`
    });
  }

  return {
    findings,
    isBrandImpersonation,
    impersonatedBrand,
    isSuspiciousTld,
    isDirectIpHost,
    isPunycode,
    isShortener,
    hasDangerousDownload,
    hasCredentialsInUrl,
    excessiveSubdomains,
  };
}

