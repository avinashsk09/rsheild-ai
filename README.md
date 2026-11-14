# RShield AI — QR & Link Security Analysis Platform

**RShield AI** is a QR code and link security analysis platform designed to inspect where a QR code, URL, or suspicious message actually leads **before** you interact with it — revealing the real destination, flagging suspicious redirects, and computing an explainable, deterministic safety score.

---

## Key Capabilities

1. **Three Input Modes on One Clean Dashboard:**
   - **QR Code:** Live camera scan via `@zxing/browser` (with viewfinder and clean device lifecycle management) + drag-and-drop / file-picker image upload. Decodes payloads and classifies types (URL, Wi-Fi, UPI payment, Cryptocurrency, vCard contact, SMS/Tel, and Plain Text).
   - **URL / Link:** Input direct URLs or shortened links. Traces HTTP redirect chains hop-by-hop.
   - **Message:** Paste email, SMS, WhatsApp, or suspicious chat text. Automatically extracts embedded URLs and scans for social engineering cues (artificial urgency, fake security alerts, account suspension threats, entity impersonation, and credential/OTP solicitation).

2. **Destination Preview ("Where Does This QR / Link Take You?"):**
   - Traces the entire redirect chain hop-by-hop.
   - Shows initial URL, protocol, explicit port, intermediate hops with HTTP status codes (301, 302, 307, 308) and resolved IP addresses, and final verified destination.
   - Plain-language alerts if the domain changed across the redirect chain.
   - Explicit port details (80, 443, 8080, 8443) with clear note that unusual ports are a signal to inspect closer, not proof of compromise.
   - Unreachable destinations: Displays the last URL reached, clearly states why it could not be verified, never fabricates a final destination, and never auto-classifies "unreachable" as "malicious."
   - Display-only safe default: Never auto-redirects. Safe copy buttons provided.
   - **Visiting the Destination (Added Feature):** A user-initiated "Visit this destination" button opening with `rel="noopener noreferrer"`, gated strictly by safety score:
     - 🟢 Green: Button enabled normally.
     - 🟡 Yellow: Button enabled with an inline "Proceed with caution" alert.
     - 🟠 Orange / 🔴 Red: Button disabled until the user explicitly checks *"I understand this destination may be malicious"*.

3. **Deterministic Safety Scoring Engine (0–100):**
   - Completely rules-based and observable — **never AI-generated and never randomized**:
     - 🟢 **80–100: Low Observed Risk**
     - 🟡 **50–79: Caution**
     - 🟠 **20–49: High Risk**
     - 🔴 **0–19: Critical Risk**
   - **"Unable to Verify" State:** Activated when network evidence is insufficient, DNS lookups fail, or servers are unreachable.
   - Confirmed threat-intel matches force a critical warning regardless of computed score.
   - Explicitly rejects claims of being "100% safe" — a high score indicates no significant known risk was found during inspection.

4. **Security Findings & Clear Recommendation:**
   - Findings Breakdown: 3 distinct categories: Positive Safeguards (green), Suspicious Findings (red/amber), and Checks That Failed or Were Unavailable (grey).
   - Recommendation: One clear, actionable suggestion based on observed evidence.

5. **AI Integration (Gemini) with Strict Fallback:**
   - Gemini provides plain-language explanations only; never scores, never alters verdicts, never claims unchecked sites are safe.
   - If the Gemini API key is missing or an API call fails, the engine seamlessly switches to a structured deterministic template explanation and explicitly displays this status in the UI.

6. **Hard Privacy & SSRF Protection:**
   - **Hard OTP Privacy Rule:** Any 4–8 digit numeric code or PIN in message text is automatically masked as `[OTP_MASKED]` immediately upon submission before reaching any external API, AI layer, or log.
   - **Zero Content Retention:** Submitted URLs, QR payloads, and messages are processed strictly in-memory and discarded.
   - **SSRF & DNS Rebinding Mitigation:** Every URL and each intermediate redirect hop is validated against private, loopback, link-local, carrier-grade NAT, and internal IP ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `100.64.0.0/10`, IPv6 unique-local/loopback).
   - **Rate Limiting:** Protects endpoints against scripted abuse and open-proxy attacks.

7. **Anonymous User Activity & Scan Metrics (SQLite §11a):**
   - Stores only aggregate counts and anonymous session timestamps — **never stores scanned content or user identities**.
   - Schema:
     - `sessions`: `id` (random cookie UUID), `entered_at`, `last_seen_at`, `exited_at` (set on unload beacon or 30-min idle timeout).
     - `scan_events`: `id`, `session_id`, `scan_type` ('qr', 'url', 'message'), `created_at`.
   - Internal endpoint: `GET /api/metrics` returns `{ totalScans, byType: {qr, url, message}, activeSessions }`.
   - Beacon endpoint: `POST /api/session/exit` triggers on tab close / `pagehide`.

---

## Project Structure

```
├── package.json                         # Root workspace scripts
├── .env.example                         # Root environment template
├── .env                                 # Local environment file
├── README.md                            # Complete documentation & run guide
├── rshield_metrics.db                   # SQLite database for anonymous metrics (§11a)
├── server/
│   ├── package.json                     # Express, Zod, ipaddr.js, cookie-parser, etc.
│   ├── .env.example                     # Backend environment template
│   ├── .env                             # Local backend environment
│   └── src/
│       ├── server.js                    # Express app, sessions, rate limiting, CORS
│       ├── config.js                    # Config & operational caps (timeouts, max hops)
│       ├── routes/
│       │   └── analyze.js               # POST /api/analyze/url, /qr, /message
│       └── services/
│           ├── metricsDb.js             # SQLite session & scan count tracking (§11a)
│           ├── ssrfGuard.js             # SSRF prevention & IP range checking
│           ├── redirectResolver.js      # Hop-by-hop HTTP redirect inspection
│           ├── threatIntel.js           # Safe Browsing lookup & domain heuristics
│           ├── scoringEngine.js         # Deterministic 0-100 rules engine
│           ├── messageAnalyzer.js       # Social engineering detection & OTP masking
│           ├── qrPayloadParser.js       # Multi-type QR payload parser
│           └── geminiService.js         # Gemini explanation layer + fallback
└── client/
    ├── package.json                     # React 18, Vite, Tailwind CSS, ZXing, Lucide
    ├── vite.config.js                   # Vite config with /api proxy to localhost:5000
    ├── tailwind.config.js               # Light-neutral security theme configuration
    ├── postcss.config.js                # PostCSS configuration
    ├── index.html                       # HTML head, typography, and meta tags
    └── src/
        ├── main.jsx                     # React root mount
        ├── App.jsx                      # Single dashboard container, beacon on unload
        ├── index.css                    # Tailwind imports & scrollbar styles
        ├── services/
        │   └── api.js                   # Axios client for backend endpoints
        └── components/
            ├── Header.jsx              # RShield AI logo, title, purpose
            ├── ScanSection.jsx         # 3 scanning modes (QR, URL, Message)
            ├── CameraScanner.jsx       # ZXing webcam scanner with viewfinder
            ├── ImageUploader.jsx       # ZXing QR image drag-and-drop decode
            ├── SecurityScore.jsx       # 0-100 score gauge & risk band badge
            ├── DestinationPreview.jsx  # "Where Does This QR / Link Take You?"
            ├── SecurityFindings.jsx    # Positive / Suspicious / Limitations breakdown
            ├── AIExplanation.jsx       # Gemini / Deterministic explanation
            ├── Recommendation.jsx      # Clear action recommendation
            └── NonUrlPayloadView.jsx   # Safe viewer for non-URL QR payloads
```

---

## Run Instructions

### Prerequisites
- Node.js (v18+ or v20+ / v24+)
- npm

### 1. Backend Server

```bash
cd server
npm install
npm run dev
```
*Backend runs on `http://localhost:5000`.*
- Health check: `http://localhost:5000/api/health`
- Internal metrics: `http://localhost:5000/api/metrics`

### 2. Frontend Client

Open a second terminal window:
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## Known Limitations Stated Plainly

1. **Anti-Bot Gates & Captchas:** If a destination server uses Cloudflare Turnstile, anti-bot challenge walls, or geo-blocking, the scanner records the HTTP challenge status or declares the destination `Unable to Verify` rather than attempting to guess internal contents.
2. **Dynamic Client-Side Redirects:** RShield AI traces standard HTTP redirect status codes (301, 302, 303, 307, 308). Client-side JavaScript execution is intentionally disabled in the scanner to protect the sandbox environment.
3. **External Threat Intelligence API:** If Google Safe Browsing returns permission denied (or if the key is omitted), the system transparently notes this under Limitations and computes the deterministic score using domain heuristics and redirect signals.
