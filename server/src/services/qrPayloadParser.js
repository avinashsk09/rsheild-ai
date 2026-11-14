/**
 * Parses decoded QR code payloads into structured, safe representations.
 * Never executes scripts, commands, or auto-connect routines.
 */

export function parseQrPayload(payload) {
  if (!payload || typeof payload !== 'string') {
    return {
      type: 'empty',
      label: 'Empty Payload',
      isUrl: false,
      data: null,
      rawPayload: ''
    };
  }

  const trimmed = payload.trim();

  // 1. URL Check
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      type: 'url',
      label: 'Web Link (URL)',
      isUrl: true,
      url: trimmed,
      rawPayload: trimmed,
    };
  }

  // Bare domain that looks like a URL (e.g. www.example.com or example.com/login)
  if (/^(www\.[a-z0-9-]+(\.[a-z]{2,})+|([a-z0-9-]+\.)+(com|org|net|io|co|in|ai|app|dev|xyz|info)\b)/i.test(trimmed)) {
    return {
      type: 'url',
      label: 'Web Link (URL)',
      isUrl: true,
      url: `https://${trimmed}`,
      rawPayload: trimmed,
    };
  }

  // 2. Wi-Fi Configuration
  // Format: WIFI:S:MySSID;T:WPA;P:MyPassword;H:false;;
  if (/^WIFI:/i.test(trimmed)) {
    const ssidMatch = trimmed.match(/S:([^;]+)/i);
    const authMatch = trimmed.match(/T:([^;]+)/i);
    const passMatch = trimmed.match(/P:([^;]+)/i);
    const hiddenMatch = trimmed.match(/H:([^;]+)/i);

    return {
      type: 'wifi',
      label: 'Wi-Fi Network Configuration',
      isUrl: false,
      rawPayload: trimmed,
      details: {
        ssid: ssidMatch ? ssidMatch[1] : 'Unknown Network',
        encryption: authMatch ? authMatch[1].toUpperCase() : 'Open / Unsecured',
        hasPassword: !!passMatch,
        password: passMatch ? passMatch[1] : null,
        isHidden: hiddenMatch ? hiddenMatch[1].toLowerCase() === 'true' : false,
      },
      warning: 'Connecting to unknown Wi-Fi networks can expose network traffic to packet sniffing or rogue gateway attacks.'
    };
  }

  // 3. Payment / UPI / Crypto
  if (/^upi:\/\/pay/i.test(trimmed)) {
    let upiUrl;
    try {
      upiUrl = new URL(trimmed);
    } catch {
      upiUrl = null;
    }

    const pa = upiUrl?.searchParams.get('pa') || 'Not specified';
    const pn = upiUrl?.searchParams.get('pn') || 'Not specified';
    const am = upiUrl?.searchParams.get('am') || 'Variable Amount';
    const cu = upiUrl?.searchParams.get('cu') || 'INR';
    const tn = upiUrl?.searchParams.get('tn') || 'None';

    return {
      type: 'payment_upi',
      label: 'UPI Payment Request',
      isUrl: false,
      rawPayload: trimmed,
      details: {
        payeeVpa: pa,
        payeeName: pn,
        amount: am,
        currency: cu,
        note: tn,
      },
      warning: 'Always verify the payee name and VPA address carefully before completing UPI payments. Malicious QR codes frequently swap merchant VPAs.'
    };
  }

  if (/^(bitcoin|ethereum|litecoin|solana|doge):/i.test(trimmed)) {
    const parts = trimmed.split(':');
    const currency = parts[0].toUpperCase();
    const addressAndParams = parts[1] || '';
    const [address, paramStr] = addressAndParams.split('?');

    return {
      type: 'crypto_wallet',
      label: `Cryptocurrency Transfer (${currency})`,
      isUrl: false,
      rawPayload: trimmed,
      details: {
        currency,
        recipientAddress: address,
        parameters: paramStr || 'None',
      },
      warning: 'Cryptocurrency transactions are irreversible. Check every character of the destination address before sending funds.'
    };
  }

  // 4. Contact Card (vCard / MeCard)
  if (/^BEGIN:VCARD/i.test(trimmed) || /^MECARD:/i.test(trimmed)) {
    const nameMatch = trimmed.match(/(?:FN|N):([^\r\n;]+)/i);
    const telMatch = trimmed.match(/TEL(?:;[^:]+)?:([^\r\n;]+)/i);
    const emailMatch = trimmed.match(/EMAIL(?:;[^:]+)?:([^\r\n;]+)/i);
    const orgMatch = trimmed.match(/ORG:([^\r\n;]+)/i);

    return {
      type: 'contact',
      label: 'Contact Card (vCard)',
      isUrl: false,
      rawPayload: trimmed,
      details: {
        name: nameMatch ? nameMatch[1].trim() : 'Unnamed Contact',
        phone: telMatch ? telMatch[1].trim() : 'Not provided',
        email: emailMatch ? emailMatch[1].trim() : 'Not provided',
        organization: orgMatch ? orgMatch[1].trim() : 'Not provided',
      },
      warning: 'Verify contact details before saving. Rogue contacts can direct subsequent calls or emails to malicious parties.'
    };
  }

  // 5. Tel / SMS / Mailto
  if (/^(tel|sms|smsto|mailto):/i.test(trimmed)) {
    const scheme = trimmed.split(':')[0].toLowerCase();
    const target = trimmed.slice(scheme.length + 1);

    return {
      type: 'communication',
      label: `Direct Communication Intent (${scheme.toUpperCase()})`,
      isUrl: false,
      rawPayload: trimmed,
      details: {
        channel: scheme.toUpperCase(),
        target,
      },
      warning: 'Triggering this communication could initiate premium SMS or telephone billing if dialed without confirmation.'
    };
  }

  // 6. Plain Text / Data
  return {
    type: 'text',
    label: 'Plain Text Content',
    isUrl: false,
    rawPayload: trimmed,
    details: {
      length: trimmed.length,
      sample: trimmed.length > 500 ? `${trimmed.slice(0, 500)}...` : trimmed,
    },
    warning: 'Plain text payload containing no interactive URL links.'
  };
}

