import { validateUrlForSsrf } from './ssrfGuard.js';
import { config } from '../config.js';

export function getPortDetails(urlInput) {
  let parsedUrl;
  try {
    parsedUrl = typeof urlInput === 'string' ? new URL(urlInput) : urlInput;
  } catch {
    return {
      protocol: 'http',
      explicitPort: null,
      effectivePort: 80,
      isStandard: true,
      explanation: 'Port 80 is the standard port for unencrypted HTTP web traffic.',
    };
  }

  const protocol = parsedUrl.protocol ? parsedUrl.protocol.replace(':', '') : 'http';
  const explicitPort = parsedUrl.port ? parseInt(parsedUrl.port, 10) : null;
  const standardPort = protocol === 'https' ? 443 : 80;
  const effectivePort = explicitPort || standardPort;
  const isNonStandard = explicitPort !== null && explicitPort !== standardPort;

  let portExplanation = '';
  if (effectivePort === 80) {
    portExplanation = 'Port 80 is the standard port for unencrypted HTTP web traffic.';
  } else if (effectivePort === 443) {
    portExplanation = 'Port 443 is the standard port for secure HTTPS encrypted web traffic.';
  } else if (effectivePort === 8080) {
    portExplanation = 'Port 8080 is commonly used for alternate HTTP services, test servers, or proxies.';
  } else if (effectivePort === 8443) {
    portExplanation = 'Port 8443 is commonly used for alternate secure HTTPS services, staging, or admin panels.';
  } else if (isNonStandard) {
    portExplanation = `Port ${effectivePort} is a non-standard port for web traffic. An unusual port is a signal to look closer, not proof of compromise.`;
  } else {
    portExplanation = `Port ${effectivePort} is standard for ${protocol.toUpperCase()} traffic.`;
  }

  return {
    protocol,
    explicitPort,
    effectivePort,
    isStandard: !isNonStandard,
    explanation: portExplanation,
  };
}

/**
 * Traces and inspects HTTP redirects safely.
 * @param {string} initialUrl
 * @returns {Promise<object>}
 */
export async function traceRedirects(initialUrl) {
  const hops = [];
  let currentUrl = initialUrl;
  let hopCount = 0;
  let finalDestination = null;
  let isUnreachable = false;
  let unreachableReason = null;
  let domainChanged = false;

  const originalValidation = await validateUrlForSsrf(currentUrl);
  if (!originalValidation.isSafe) {
    let hostFallback = 'unknown';
    let portFallback = null;
    let protoFallback = currentUrl.startsWith('https') ? 'https' : 'http';
    try {
      const u = new URL(currentUrl);
      hostFallback = u.hostname;
      protoFallback = u.protocol.replace(':', '');
      portFallback = getPortDetails(u);
    } catch {
      portFallback = getPortDetails(currentUrl);
    }

    if (originalValidation.isSsrfBlocked) {
      return {
        success: false,
        error: originalValidation.errorReason,
        isSsrfBlocked: true,
        originalUrl: initialUrl,
        originalDomain: hostFallback,
        originalProtocol: protoFallback,
        originalPortInfo: portFallback,
        hops: [],
        totalHops: 0,
        finalUrl: initialUrl,
        finalDomain: hostFallback,
        finalProtocol: protoFallback,
        finalPortInfo: portFallback,
        domainChanged: false,
        isUnreachable: true,
        unreachableReason: originalValidation.errorReason,
      };
    }

    return {
      success: true,
      originalUrl: initialUrl,
      originalDomain: hostFallback,
      originalProtocol: protoFallback,
      originalPortInfo: portFallback,
      hops: [],
      totalHops: 0,
      finalUrl: initialUrl,
      finalDomain: hostFallback,
      finalProtocol: protoFallback,
      finalPortInfo: portFallback,
      domainChanged: false,
      isUnreachable: true,
      unreachableReason: originalValidation.errorReason || 'Destination host could not be reached via DNS.',
    };
  }

  const originalParsed = originalValidation.parsedUrl;
  const originalDomain = originalParsed.hostname;
  const originalPortInfo = getPortDetails(originalParsed);

  while (hopCount < config.maxRedirects) {
    hopCount++;

    // Validate the current hop for SSRF and DNS security
    const ssrfCheck = await validateUrlForSsrf(currentUrl);
    if (!ssrfCheck.isSafe) {
      hops.push({
        hopIndex: hopCount,
        url: currentUrl,
        domain: currentUrl.startsWith('http') ? new URL(currentUrl).hostname : 'unknown',
        protocol: currentUrl.startsWith('http') ? new URL(currentUrl).protocol.replace(':', '') : 'unknown',
        portInfo: currentUrl.startsWith('http') ? getPortDetails(new URL(currentUrl)) : null,
        status: null,
        statusText: 'Blocked by SSRF / Security Policy',
        errorReason: ssrfCheck.errorReason,
        resolvedIp: null,
      });
      isUnreachable = true;
      unreachableReason = `Redirect blocked by security filter: ${ssrfCheck.errorReason}`;
      break;
    }

    const parsedUrl = ssrfCheck.parsedUrl;
    const portInfo = getPortDetails(parsedUrl);
    const resolvedIp = ssrfCheck.resolvedIp;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);

    let response;
    try {
      // Use standard fetch without following redirects automatically
      response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'QRShieldAI-SecurityScanner/1.0 (+https://qrshield.internal/scanner-bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError' || err.message?.includes('timeout');
      hops.push({
        hopIndex: hopCount,
        url: currentUrl,
        domain: parsedUrl.hostname,
        protocol: portInfo.protocol,
        portInfo,
        status: null,
        statusText: isTimeout ? 'Request Timed Out' : 'Connection Failed',
        errorReason: isTimeout ? `Request timed out after ${config.requestTimeoutMs / 1000}s` : err.message,
        resolvedIp,
      });
      isUnreachable = true;
      unreachableReason = isTimeout
        ? `Destination server timed out (${config.requestTimeoutMs / 1000}s)`
        : `Could not connect to host: ${err.message}`;
      break;
    } finally {
      clearTimeout(timeoutId);
    }

    const status = response.status;
    const statusText = response.statusText || `${status}`;
    const locationHeader = response.headers.get('location');

    hops.push({
      hopIndex: hopCount,
      url: currentUrl,
      domain: parsedUrl.hostname,
      protocol: portInfo.protocol,
      portInfo,
      status,
      statusText,
      resolvedIp,
      serverHeader: response.headers.get('server') || null,
      contentType: response.headers.get('content-type') || null,
    });

    // Check if this hop changed the root domain compared to the original
    if (parsedUrl.hostname.toLowerCase() !== originalDomain.toLowerCase()) {
      domainChanged = true;
    }

    // Check for HTTP redirect statuses: 301, 302, 303, 307, 308
    if ([301, 302, 303, 307, 308].includes(status) && locationHeader) {
      try {
        const nextUrlObj = new URL(locationHeader, currentUrl);
        currentUrl = nextUrlObj.toString();
      } catch {
        isUnreachable = true;
        unreachableReason = `Invalid redirect location header: "${locationHeader}"`;
        break;
      }
    } else {
      // Reached terminal destination
      finalDestination = currentUrl;
      break;
    }
  }

  if (hopCount >= config.maxRedirects && !finalDestination) {
    isUnreachable = true;
    unreachableReason = `Maximum redirect hops limit (${config.maxRedirects}) exceeded without reaching terminal page.`;
  }

  const lastReachedHop = hops[hops.length - 1];
  const finalUrl = finalDestination || (lastReachedHop ? lastReachedHop.url : initialUrl);
  let finalParsed;
  try {
    finalParsed = new URL(finalUrl);
  } catch {
    finalParsed = originalParsed;
  }

  const finalPortInfo = getPortDetails(finalParsed);

  return {
    success: true,
    originalUrl: initialUrl,
    originalDomain,
    originalProtocol: originalPortInfo.protocol,
    originalPortInfo,
    hops,
    totalHops: hops.length,
    finalUrl,
    finalDomain: finalParsed.hostname,
    finalProtocol: finalPortInfo.protocol,
    finalPortInfo,
    domainChanged,
    isUnreachable,
    unreachableReason,
  };
}
