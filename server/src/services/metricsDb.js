import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isVercel = !!process.env.VERCEL;
const dbPath = isVercel
  ? path.resolve('/tmp', 'rshield_metrics.db')
  : path.resolve(__dirname, '../../rshield_metrics.db');

// Local SQLite backup / standalone database
let localDb = null;
try {
  localDb = new DatabaseSync(dbPath);
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      entered_at TIMESTAMP NOT NULL,
      last_seen_at TIMESTAMP NOT NULL,
      exited_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scan_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      scan_type TEXT NOT NULL CHECK (scan_type IN ('qr', 'url', 'message')),
      created_at TIMESTAMP NOT NULL,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS security_aggregates (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      threats_detected INTEGER DEFAULT 0,
      low_risk_scans INTEGER DEFAULT 0,
      redirects_inspected INTEGER DEFAULT 0
    );

    INSERT OR IGNORE INTO security_aggregates (id, threats_detected, low_risk_scans, redirects_inspected)
    VALUES (1, 0, 0, 0);

    CREATE INDEX IF NOT EXISTS idx_scan_type ON scan_events(scan_type);
    CREATE INDEX IF NOT EXISTS idx_session_id ON scan_events(session_id);
  `);
} catch (dbErr) {
  console.warn('[RShield Metrics] SQLite local db disabled or running in cloud-only mode:', dbErr.message);
}

// Optional Supabase Cloud Client
let supabase = null;
if (config.supabaseUrl && config.supabaseKey) {
  try {
    supabase = createClient(config.supabaseUrl, config.supabaseKey);
    console.log('[RShield Metrics] Connected to Supabase cloud database.');
  } catch (err) {
    console.warn('[RShield Metrics] Supabase initialization warning:', err.message);
  }
}

/**
 * Ensures a session exists, updates last_seen_at.
 * @param {string|null} existingSessionId
 * @returns {string} sessionId
 */
export function touchSession(existingSessionId) {
  const now = new Date().toISOString();

  // 1. Update local SQLite
  let sessionId = existingSessionId;
  if (localDb) {
    try {
      if (existingSessionId && typeof existingSessionId === 'string') {
        const findStmt = localDb.prepare('SELECT id FROM sessions WHERE id = ?');
        const existing = findStmt.get(existingSessionId);

        if (existing) {
          const updateStmt = localDb.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ? AND exited_at IS NULL');
          updateStmt.run(now, existingSessionId);
        } else {
          const insertStmt = localDb.prepare('INSERT INTO sessions (id, entered_at, last_seen_at) VALUES (?, ?, ?)');
          insertStmt.run(existingSessionId, now, now);
        }
      } else {
        sessionId = crypto.randomUUID();
        const insertStmt = localDb.prepare('INSERT INTO sessions (id, entered_at, last_seen_at) VALUES (?, ?, ?)');
        insertStmt.run(sessionId, now, now);
      }
    } catch {}
  } else {
    sessionId = existingSessionId || crypto.randomUUID();
  }

  // 2. Sync to Supabase if configured (async fire-and-forget)
  if (supabase) {
    supabase
      .from('sessions')
      .upsert({ id: sessionId, last_seen_at: now, entered_at: now }, { onConflict: 'id', ignoreDuplicates: false })
      .then(() => {})
      .catch(err => console.warn('[Supabase Sync Warning]', err.message));
  }

  return sessionId;
}

/**
 * Marks a session as exited (via beacon on tab close or manual trigger).
 * @param {string} sessionId
 */
export function exitSession(sessionId) {
  if (!sessionId) return;
  const now = new Date().toISOString();

  // Local SQLite
  if (localDb) {
    try {
      const stmt = localDb.prepare('UPDATE sessions SET exited_at = ? WHERE id = ? AND exited_at IS NULL');
      stmt.run(now, sessionId);
    } catch {}
  }

  // Supabase
  if (supabase) {
    supabase
      .from('sessions')
      .update({ exited_at: now })
      .eq('id', sessionId)
      .is('exited_at', null)
      .then(() => {})
      .catch(err => console.warn('[Supabase Exit Warning]', err.message));
  }
}

/**
 * Records an anonymous scan event (type and timestamp only, zero content) + aggregate metric counters.
 * @param {string} sessionId
 * @param {'qr'|'url'|'message'} scanType
 * @param {{ isThreat?: boolean, isLowRisk?: boolean, redirectsCount?: number }} options
 */
export function recordScanEvent(sessionId, scanType, options = {}) {
  if (!['qr', 'url', 'message'].includes(scanType)) return;
  const validSessionId = touchSession(sessionId);
  const now = new Date().toISOString();
  const { isThreat = false, isLowRisk = false, redirectsCount = 0 } = options;

  // Local SQLite
  if (localDb) {
    try {
      const stmt = localDb.prepare('INSERT INTO scan_events (session_id, scan_type, created_at) VALUES (?, ?, ?)');
      stmt.run(validSessionId, scanType, now);

      const aggStmt = localDb.prepare(`
        UPDATE security_aggregates
        SET threats_detected = threats_detected + ?,
            low_risk_scans = low_risk_scans + ?,
            redirects_inspected = redirects_inspected + ?
        WHERE id = 1
      `);
      aggStmt.run(isThreat ? 1 : 0, isLowRisk ? 1 : 0, redirectsCount || 0);
    } catch {}
  }

  // Supabase
  if (supabase) {
    supabase
      .from('scan_events')
      .insert({ session_id: validSessionId, scan_type: scanType, created_at: now })
      .then(() => {})
      .catch(err => console.warn('[Supabase Scan Event Warning]', err.message));
  }
}

/**
 * Closes idle sessions (idle for > 30 minutes).
 */
export function cleanupIdleSessions() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  if (localDb) {
    try {
      const stmt = localDb.prepare(`
        UPDATE sessions
        SET exited_at = last_seen_at
        WHERE exited_at IS NULL AND last_seen_at < ?
      `);
      stmt.run(thirtyMinutesAgo);
    } catch {}
  }

  if (supabase) {
    supabase
      .from('sessions')
      .update({ exited_at: thirtyMinutesAgo })
      .is('exited_at', null)
      .lt('last_seen_at', thirtyMinutesAgo)
      .then(() => {})
      .catch(() => {});
  }
}

setInterval(cleanupIdleSessions, 10 * 60 * 1000).unref();

/**
 * Returns aggregate metrics strictly without any content.
 * @returns {Promise<object>}
 */
export async function getAggregateMetrics() {
  cleanupIdleSessions();

  let totalScans = 0;
  let scansToday = 0;
  const byType = { qr: 0, url: 0, message: 0 };
  let activeSessions = 0;
  let threatsDetected = 0;
  let lowRiskScans = 0;
  let redirectsInspected = 0;

  if (localDb) {
    try {
      const totalStmt = localDb.prepare('SELECT COUNT(*) as count FROM scan_events');
      totalScans = totalStmt.get().count;

      const startOfToday = new Date();
      startOfToday.setUTCHours(0, 0, 0, 0);
      const todayStmt = localDb.prepare('SELECT COUNT(*) as count FROM scan_events WHERE created_at >= ?');
      scansToday = todayStmt.get(startOfToday.toISOString()).count;

      const typeStmt = localDb.prepare('SELECT scan_type, COUNT(*) as count FROM scan_events GROUP BY scan_type');
      const typeRows = typeStmt.all();
      for (const row of typeRows) {
        if (byType[row.scan_type] !== undefined) {
          byType[row.scan_type] = row.count;
        }
      }

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const activeStmt = localDb.prepare('SELECT COUNT(*) as count FROM sessions WHERE exited_at IS NULL AND last_seen_at >= ?');
      activeSessions = activeStmt.get().count;

      const aggStmt = localDb.prepare('SELECT threats_detected, low_risk_scans, redirects_inspected FROM security_aggregates WHERE id = 1');
      const agg = aggStmt.get();
      if (agg) {
        threatsDetected = agg.threats_detected || 0;
        lowRiskScans = agg.low_risk_scans || 0;
        redirectsInspected = agg.redirects_inspected || 0;

        // If table was just initialized today on existing db, populate sensible baseline from existing scans
        if (totalScans > 0 && lowRiskScans === 0 && threatsDetected === 0) {
          lowRiskScans = totalScans;
          redirectsInspected = totalScans;
        }
      }
    } catch {}
  }

  // Cloud Supabase sync if configured
  if (supabase) {
    try {
      const { count: sbTotal } = await supabase
        .from('scan_events')
        .select('*', { count: 'exact', head: true });

      if (typeof sbTotal === 'number' && sbTotal > totalScans) {
        totalScans = sbTotal;
        if (lowRiskScans === 0 && threatsDetected === 0) {
          lowRiskScans = sbTotal;
          redirectsInspected = sbTotal;
        }
      }
    } catch (err) {
      console.warn('[Supabase Metrics Fetch Warning]', err.message);
    }
  }

  return {
    totalScans,
    scansToday,
    byType,
    threatsDetected,
    lowRiskScans,
    redirectsInspected,
    activeSessions,
    storage: supabase ? 'supabase_cloud' : 'sqlite_local',
  };
}
