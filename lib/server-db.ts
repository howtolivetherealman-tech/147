import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  createInitialPortalDatabase,
  PortalDatabaseState,
  ReporterRecord,
} from './default-data';
import { INITIAL_MANDALS } from './india-locations';
import {
  calculateSixMonthExpiry,
  isMembershipActive,
} from './business-rules';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE_PATH = path.join(DATA_DIR, 'neti-bharatham-db.json');

export function hashPassword(password: string, existingSalt?: string): { salt: string; hash: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (derived.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derived, storedBuf);
  } catch {
    return false;
  }
}

// Rate limiter memory store
const loginAttempts = new Map<string, { count: number; lockUntil: number }>();

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const record = loginAttempts.get(identifier);
  if (!record) return { allowed: true };
  if (record.lockUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((record.lockUntil - now) / 1000),
    };
  }
  return { allowed: true };
}

export function recordFailedLogin(identifier: string): void {
  const now = Date.now();
  const current = loginAttempts.get(identifier) || { count: 0, lockUntil: 0 };
  const nextCount = current.count + 1;
  const lockUntil = nextCount >= 6 ? now + 60 * 1000 : 0;
  loginAttempts.set(identifier, { count: nextCount, lockUntil });
}

export function clearFailedLogin(identifier: string): void {
  loginAttempts.delete(identifier);
}

/**
 * Automatically sweeps reporters whose 6-month validity has elapsed and transitions
 * their status from APPROVED to EXPIRED, recording a notification if newly expired.
 */
function enforceAutomaticValiditySweep(dbState: PortalDatabaseState): boolean {
  let mutated = false;
  const nowIso = new Date().toISOString();

  dbState.reporters.forEach((rep: ReporterRecord) => {
    if (rep.status === 'APPROVED' && rep.expiresAt) {
      if (!isMembershipActive('APPROVED', rep.expiresAt, nowIso)) {
        rep.status = 'EXPIRED';
        mutated = true;
        dbState.notifications.unshift({
          id: `notif-exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          recipientId: rep.id,
          title: '6 నెలల రిపోర్టర్ సభ్యత్వ గడువు ముగిసింది (Validity Expired)',
          message: `మీ రిపోర్టర్ గుర్తింపు కార్డు (${rep.reporterId || rep.username}) గడువు ${rep.expiresAt}న ముగిసింది. వార్తల అప్‌లోడ్ తాత్కాలికంగా నిలిపివేయబడింది.`,
          type: 'EXPIRY_REMINDER',
          read: false,
          createdAt: nowIso,
        });
      }
    }
  });

  return mutated;
}

export function loadPortalDatabase(): PortalDatabaseState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE_PATH)) {
    const initialAdminCred = hashPassword(process.env.INITIAL_ADMIN_PASSWORD || '1977');
    const repCred1 = hashPassword('Reporter@2026');
    const repCred2 = hashPassword('Reporter@2026');
    const repCred3 = hashPassword('Reporter@2026');
    const repCred4 = hashPassword('Reporter@2026');

    const initial = createInitialPortalDatabase(
      initialAdminCred.salt,
      initialAdminCred.hash,
      {
        'rep-approved-1': repCred1,
        'rep-approved-2': repCred2,
        'rep-pending-1': repCred3,
        'rep-expired-1': repCred4,
      }
    );
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }

  try {
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as PortalDatabaseState;
    let shouldSave = false;
    if (parsed.adminAccount && parsed.adminAccount.username === 'Admin') {
      const updatedCred = hashPassword('1977');
      parsed.adminAccount.username = 'chakri';
      parsed.adminAccount.passwordSalt = updatedCred.salt;
      parsed.adminAccount.passwordHash = updatedCred.hash;
      parsed.adminAccount.updatedAt = new Date().toISOString();
      shouldSave = true;
    }
    if (Array.isArray(parsed.mandals) && parsed.mandals.length < INITIAL_MANDALS.length) {
      const existingIds = new Set(parsed.mandals.map((m) => m.id));
      for (const initMandal of INITIAL_MANDALS) {
        if (!existingIds.has(initMandal.id)) {
          parsed.mandals.push(initMandal);
          existingIds.add(initMandal.id);
        }
      }
      shouldSave = true;
    }
    if (Array.isArray(parsed.news)) {
      for (const n of parsed.news) {
        if (n.status === 'PENDING') {
          n.status = 'PUBLISHED';
          shouldSave = true;
        }
      }
    }
    if (Array.isArray(parsed.advertisements)) {
      for (const a of parsed.advertisements) {
        if (a.status === 'PENDING') {
          a.status = 'ACTIVE';
          shouldSave = true;
        }
      }
    }
    if (parsed.websiteSettings) {
      if (
        !parsed.websiteSettings.logoUrl ||
        parsed.websiteSettings.logoUrl === '/icon.svg'
      ) {
        parsed.websiteSettings.logoUrl =
          '/assets/aistudio/Gemini_Generated_Image_ei76ftei76ftei76_1e454e87.png';
        shouldSave = true;
      }
      if (!parsed.websiteSettings.secondaryLogoUrl) {
        parsed.websiteSettings.secondaryLogoUrl =
          '/assets/aistudio/Gemini_Generated_Image_qkr1reqkr1reqkr1_459f1767.png';
        shouldSave = true;
      }
      if (parsed.websiteSettings.bannerImageUrl === undefined) {
        parsed.websiteSettings.bannerImageUrl =
          '/assets/aistudio/Gemini_Generated_Image_ei76ftei76ftei76_1e454e87.png';
        parsed.websiteSettings.bannerTitle =
          'నేటి భారతం (NETI BHARATHAM) – వార్తా తరంగిణి • ఏది నిజం చానెల్';
        parsed.websiteSettings.bannerLinkUrl = 'https://netibhaaratham.com';
        parsed.websiteSettings.bannerEnabled = false;
        shouldSave = true;
      }
    }
    if (enforceAutomaticValiditySweep(parsed)) {
      shouldSave = true;
    }
    if (shouldSave) {
      savePortalDatabase(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error reading portal database, re-initializing:', err);
    const initialAdminCred = hashPassword('1977');
    const repCred = hashPassword('Reporter@2026');
    const fallback = createInitialPortalDatabase(initialAdminCred.salt, initialAdminCred.hash, {
      'rep-approved-1': repCred,
      'rep-approved-2': repCred,
      'rep-pending-1': repCred,
      'rep-expired-1': repCred,
    });
    return fallback;
  }
}

export function savePortalDatabase(state: PortalDatabaseState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

export function createPublicSafeSnapshot(state: PortalDatabaseState) {
  return {
    states: state.states,
    districts: state.districts,
    mandals: state.mandals,
    categories: state.categories,
    // Public visitors only receive published news articles
    news: state.news.filter((n) => n.status === 'PUBLISHED'),
    // Public visitors only receive active approved advertisements
    advertisements: state.advertisements.filter((a) => a.status === 'ACTIVE'),
    websiteSettings: state.websiteSettings,
    adSenseSettings: state.adSenseSettings,
    // Public statistics summary without exposing any PII or Aadhaar
    publicStats: {
      totalStates: state.states.filter((s) => s.active).length,
      totalDistricts: state.districts.filter((d) => d.active).length,
      totalMandals: state.mandals.filter((m) => m.active).length,
      activeReportersCount: state.reporters.filter(
        (r) => r.status === 'APPROVED' && isMembershipActive(r.status, r.expiresAt)
      ).length,
      publishedNewsCount: state.news.filter((n) => n.status === 'PUBLISHED').length,
    },
    adminBootstrapped: state.adminAccount.bootstrapped,
  };
}

export { calculateSixMonthExpiry };
