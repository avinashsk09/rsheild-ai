/**
 * Deterministic rules-based safety scoring engine for QR Shield AI.
 * Computes a transparent 0-100 score based solely on concrete observable signals.
 */

export function calculateSafetyScore({
  redirectResult,
  heuristics,
  safeBrowsingResult,
}) {
  const positiveFindings = [];
  const suspiciousFindings = [];
  const unavailableChecks = [];

  // Check 1: Did threat-intel query fail or is unconfigured?
  if (!safeBrowsingResult || !safeBrowsingResult.available) {
    unavailableChecks.push({
      type: 'unavailable',
      title: 'Real-time Google Safe Browsing Feed',
      description: safeBrowsingResult?.reason || safeBrowsingResult?.error || 'Threat intelligence service not configured.'
    });
  } else if (safeBrowsingResult.isThreat) {
    suspiciousFindings.push({
      type: 'critical',
      title: 'Known Malicious Threat Intelligence Match',
      description: `Target was identified by threat intelligence databases as malicious: ${safeBrowsingResult.threats?.join(', ')}.`
    });
  } else {
    positiveFindings.push({
      type: 'positive',
      title: 'Threat Intelligence Cleared',
      description: 'URL is not currently listed on known active malware or phishing blacklists.'
    });
  }

  // Check 2: Unreachable destination or SSRF block
  if (!redirectResult || redirectResult.isUnreachable || redirectResult.isSsrfBlocked) {
    if (redirectResult?.isSsrfBlocked) {
      suspiciousFindings.push({
        type: 'critical',
        title: 'Restricted Internal / SSRF Target Blocked',
        description: redirectResult.error || 'The destination resolves to private, loopback, or internal network infrastructure.'
      });
      return {
        score: 0,
        band: 'Critical Risk',
        bandColor: 'red',
        isUnableToVerify: false,
        isThreatIntelMatch: false,
        summaryReason: 'Target destination is an unauthorized internal network or loopback address.',
        recommendation: 'Do not access this link. It targets private network systems.',
        positiveFindings,
        suspiciousFindings,
        unavailableChecks,
      };
    }

    unavailableChecks.push({
      type: 'unavailable',
      title: 'Live Destination Reachability',
      description: redirectResult?.unreachableReason || 'Could not establish connection to the final destination server.'
    });

    // If unreachable and we have heuristics
    if (heuristics?.findings) {
      for (const finding of heuristics.findings) {
        suspiciousFindings.push(finding);
      }
    }

    return {
      score: null,
      band: 'Unable to Verify',
      bandColor: 'gray',
      isUnableToVerify: true,
      isThreatIntelMatch: false,
      summaryReason: `Destination inspection was incomplete: ${redirectResult?.unreachableReason || 'Destination server was unreachable.'}`,
      recommendation: 'Proceed with caution. The destination server could not be reached to verify its redirect path or final safety.',
      positiveFindings,
      suspiciousFindings,
      unavailableChecks,
    };
  }

  // Baseline score start
  let score = 100;

  // Add heuristic findings
  if (heuristics?.findings) {
    for (const finding of heuristics.findings) {
      suspiciousFindings.push(finding);
    }
  }

  // 1. Confirmed Threat Intel match
  if (safeBrowsingResult?.isThreat) {
    score = 5;
    return {
      score,
      band: 'Critical Risk',
      bandColor: 'red',
      isUnableToVerify: false,
      isThreatIntelMatch: true,
      summaryReason: 'Confirmed malicious target flagged by real-time threat intelligence.',
      recommendation: 'Avoid this known malicious destination immediately. Do not visit or enter any information.',
      positiveFindings,
      suspiciousFindings,
      unavailableChecks,
    };
  }

  // 2. Protocol Check
  if (redirectResult.finalProtocol === 'https') {
    positiveFindings.push({
      type: 'positive',
      title: 'Encrypted Transport (HTTPS)',
      description: 'Destination uses secure HTTPS encryption for in-transit communication.'
    });
  } else {
    score -= 20;
    suspiciousFindings.push({
      type: 'suspicious',
      title: 'Unencrypted Connection (HTTP)',
      description: 'Destination uses unencrypted plain HTTP. Any data submitted can be intercepted by third parties on the same network.'
    });
  }

  // 3. Port Check
  const finalPortInfo = redirectResult.finalPortInfo;
  if (!finalPortInfo?.isStandard) {
    score -= 15;
    suspiciousFindings.push({
      type: 'suspicious',
      title: `Non-Standard Port (${finalPortInfo.effectivePort})`,
      description: finalPortInfo.explanation || `Destination explicitly specifies non-standard port ${finalPortInfo.effectivePort}. An unusual port is a signal to look closer, not proof of compromise.`
    });
  } else {
    positiveFindings.push({
      type: 'positive',
      title: `Standard Web Port (${finalPortInfo.effectivePort})`,
      description: finalPortInfo.explanation
    });
  }

  // 4. Redirect Behavior & Domain Shift
  if (redirectResult.domainChanged) {
    score -= 15;
    suspiciousFindings.push({
      type: 'suspicious',
      title: 'Domain Shift Across Redirect Chain',
      description: `The destination domain (${redirectResult.finalDomain}) differs from the initial entry domain (${redirectResult.originalDomain}). Verify that you recognize the final organization.`
    });
  } else if (redirectResult.hops.length > 1) {
    positiveFindings.push({
      type: 'positive',
      title: 'Consistent Domain Chain',
      description: 'Redirects remained within the same domain organization throughout inspection.'
    });
  } else {
    positiveFindings.push({
      type: 'positive',
      title: 'Direct Destination (No Redirects)',
      description: 'URL points directly to the destination server without intermediate routing hops.'
    });
  }

  if (redirectResult.hops.length > 3) {
    score -= 10;
    suspiciousFindings.push({
      type: 'suspicious',
      title: `Multiple Redirect Hops (${redirectResult.hops.length} hops)`,
      description: 'Extended redirect chains are frequently leveraged by obfuscation tactics to bypass automated scanners.'
    });
  }

  // 5. Heuristic Penalties
  if (heuristics.isBrandImpersonation) {
    score -= 40;
  }
  if (heuristics.isDirectIpHost) {
    score -= 25;
  }
  if (heuristics.isPunycode) {
    score -= 25;
  }
  if (heuristics.isSuspiciousTld) {
    score -= 20;
  }
  if (heuristics.hasDangerousDownload) {
    score -= 40;
  }
  if (heuristics.hasCredentialsInUrl) {
    score -= 30;
  }
  if (heuristics.excessiveSubdomains) {
    score -= 15;
  }
  if (heuristics.isShortener && !redirectResult.domainChanged) {
    // Shortener that stayed or resolved
    score -= 5;
  }

  // Ensure score stays bounded [0, 100]
  score = Math.max(0, Math.min(100, score));

  // Determine Band
  let band = 'Low Observed Risk';
  let bandColor = 'green';
  let recommendation = 'No known threats detected. Always verify the domain name before entering credentials.';
  let summaryReason = 'Destination exhibits standard security characteristics with no active threat flags.';

  if (score < 20) {
    band = 'Critical Risk';
    bandColor = 'red';
    recommendation = 'Avoid this destination. Multiple critical risk factors indicate a high likelihood of compromise or deception.';
    summaryReason = 'Multiple severe security indicators identified (possible phishing, unauthorized impersonation, or dangerous download).';
  } else if (score < 50) {
    band = 'High Risk';
    bandColor = 'orange';
    recommendation = 'Do not proceed unless you have independently verified this exact destination and host.';
    summaryReason = 'Several high-risk patterns detected in domain naming, redirect chain, or connection configuration.';
  } else if (score < 80) {
    band = 'Caution';
    bandColor = 'yellow';
    recommendation = 'Verify the final domain carefully before proceeding or providing sensitive information.';
    summaryReason = 'Some unusual characteristics detected (e.g., domain shifts, unencrypted HTTP, or non-standard ports).';
  } else {
    // 80 - 100
    band = 'Low Observed Risk';
    bandColor = 'green';
    // Emphasize never 100% safe
    summaryReason = 'No significant known risks identified in the redirect structure or threat intelligence.';
    recommendation = 'No known threats detected. Inspect the final domain above before entering account credentials.';
  }

  return {
    score,
    band,
    bandColor,
    isUnableToVerify: false,
    isThreatIntelMatch: false,
    summaryReason,
    recommendation,
    positiveFindings,
    suspiciousFindings,
    unavailableChecks,
  };
}

