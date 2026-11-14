import dns from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

const DISALLOWED_IPV4_RANGES = [
  'unspecified',
  'broadcast',
  'linkLocal',
  'loopback',
  'private',
  'carrierGradeNat',
  'reserved'
];

const DISALLOWED_IPV6_RANGES = [
  'unspecified',
  'linkLocal',
  'loopback',
  'uniqueLocal',
  'multicast',
  'reserved',
  'rfc6145',
  'rfc6052',
  '6to4',
  'teredo'
];

const DISALLOWED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  '0.0.0.0'
];

/**
 * Checks whether an IP string is within a private, loopback, link-local, or restricted range.
 * @param {string} ipString
 * @returns {{ isSafe: boolean, range?: string, reason?: string }}
 */
export function isIpRestricted(ipString) {
  try {
    let addr = ipaddr.parse(ipString);

    // If it's an IPv4-mapped IPv6 address (e.g., ::ffff:192.168.1.1), inspect as IPv4
    if (addr.kind() === 'ipv6' && addr.isIPv4MappedAddress()) {
      addr = addr.toIPv4Address();
    }

    if (addr.kind() === 'ipv4') {
      const range = addr.range();
      if (DISALLOWED_IPV4_RANGES.includes(range)) {
        return { isSafe: false, range, reason: `Disallowed IPv4 range: ${range}` };
      }
      return { isSafe: true, range };
    }

    if (addr.kind() === 'ipv6') {
      const range = addr.range();
      if (DISALLOWED_IPV6_RANGES.includes(range)) {
        return { isSafe: false, range, reason: `Disallowed IPv6 range: ${range}` };
      }
      return { isSafe: true, range };
    }

    return { isSafe: false, reason: 'Unknown IP address family' };
  } catch (err) {
    return { isSafe: false, reason: `Invalid IP address: ${err.message}` };
  }
}

/**
 * Validates a target URL against SSRF threats, validates protocol, resolves DNS,
 * and confirms that the resolved IP is publicly routable.
 * @param {string} rawUrl
 * @returns {Promise<{ isSafe: boolean, parsedUrl?: URL, resolvedIp?: string, errorReason?: string }>}
 */
export async function validateUrlForSsrf(rawUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return { isSafe: false, errorReason: 'Invalid URL format' };
  }

  // Enforce protocol whitelist: only http or https allowed
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return {
      isSafe: false,
      errorReason: `Protocol '${parsedUrl.protocol}' is not supported. Only http: and https: are allowed.`
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // Strip brackets if hostname is an IPv6 literal (e.g. [::1])
  const cleanHost = hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;

  // Check disallowed hostnames or internal domain extensions
  if (DISALLOWED_HOSTNAMES.includes(cleanHost)) {
    return { isSafe: false, isSsrfBlocked: true, errorReason: `Target hostname '${hostname}' is a reserved internal name.` };
  }

  if (
    cleanHost.endsWith('.local') ||
    cleanHost.endsWith('.internal') ||
    cleanHost.endsWith('.lan') ||
    cleanHost.endsWith('.home') ||
    cleanHost.endsWith('.corp') ||
    cleanHost.endsWith('.test') ||
    cleanHost.endsWith('.invalid')
  ) {
    return { isSafe: false, isSsrfBlocked: true, errorReason: `Target hostname '${hostname}' belongs to a private/internal TLD.` };
  }

  // If host is already an IP address, validate it directly
  if (ipaddr.isValid(cleanHost)) {
    const ipCheck = isIpRestricted(cleanHost);
    if (!ipCheck.isSafe) {
      return { isSafe: false, isSsrfBlocked: true, errorReason: `Direct IP access blocked: ${ipCheck.reason}` };
    }
    return { isSafe: true, parsedUrl, resolvedIp: cleanHost };
  }

  // Perform DNS resolution to check actual routing IP
  try {
    const addresses = await dns.lookup(cleanHost, { all: true });
    if (!addresses || addresses.length === 0) {
      return { isSafe: false, isDnsError: true, errorReason: `DNS resolution returned no addresses for ${cleanHost}` };
    }

    // Every resolved IP must be safe
    for (const record of addresses) {
      const ipCheck = isIpRestricted(record.address);
      if (!ipCheck.isSafe) {
        return {
          isSafe: false,
          isSsrfBlocked: true,
          errorReason: `DNS resolution returned restricted IP ${record.address} (${ipCheck.reason})`
        };
      }
    }

    // Pick the primary IPv4 address or first resolved address
    const primaryAddress = addresses.find(a => a.family === 4) || addresses[0];
    return { isSafe: true, parsedUrl, resolvedIp: primaryAddress.address };
  } catch (dnsErr) {
    return { isSafe: false, isDnsError: true, errorReason: `DNS resolution failed: ${dnsErr.message}` };
  }
}
