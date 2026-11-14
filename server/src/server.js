import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import analyzeRouter from './routes/analyze.js';
import { touchSession, exitSession, getAggregateMetrics } from './services/metricsDb.js';

const app = express();

// Security: Trust proxy only if configured or in standard deployment
app.set('trust proxy', 1);

// Standard CORS configuration with credentials support for session cookies
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// Cookie parser for anonymous session tracking (§11a)
app.use(cookieParser());

// Body parser with strict size cap (prevents payload flood)
app.use(express.json({ limit: '1mb' }));
app.use(express.text({ type: 'text/plain' }));

// Anonymous session middleware (§11a)
app.use((req, res, next) => {
  const existingSession = req.cookies?.rshield_session;
  const sessionId = touchSession(existingSession);
  req.sessionId = sessionId;

  // Set anonymous session cookie
  res.cookie('rshield_session', sessionId, {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: false, // Accessible to sendBeacon if needed
    sameSite: 'lax',
  });

  next();
});

// Rate limiter on analysis endpoints: max 60 requests per 15 minutes per IP
const analyzeLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many analysis requests from this IP. Please wait a few minutes before scanning again.',
  },
});

app.use('/api/analyze', analyzeLimiter, analyzeRouter);

// Session exit beacon endpoint (§11a)
app.post('/api/session/exit', (req, res) => {
  const sessionId = req.sessionId || req.cookies?.rshield_session;
  if (sessionId) {
    exitSession(sessionId);
  }
  res.status(204).end();
});

// Aggregate scan and session metrics internal endpoint (§11a)
app.get('/api/metrics', (req, res) => {
  res.json(getAggregateMetrics());
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RShield AI Analysis Engine',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!config.geminiApiKey,
    safeBrowsingConfigured: !!config.googleSafeBrowsingKey,
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  // Operational error handling - never log raw body or credentials
  console.error('[RShield Error]', err.message);
  res.status(500).json({
    error: 'Internal server error occurred during processing',
  });
});

app.listen(config.port, () => {
  console.log(`[RShield AI] Backend server running on port ${config.port}`);
});
