export type ReporterAccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'SUSPENDED';

export interface PublicReporterVerificationCard {
  reporterId: string;
  fullName: string;
  designation: 'PRESS REPORTER';
  photoUrl: string;
  stateName: string;
  districtName: string;
  mandalName: string;
  mobile: string;
  issuedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
}

/**
 * Calculates exact 6 calendar months validity from an approval date string (YYYY-MM-DD or ISO).
 * Example: Approval date 2026-01-10 -> Expiry date 2026-07-10.
 */
export function calculateSixMonthExpiry(approvalDateInput: string): string {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(approvalDateInput.trim());
  const date = isDateOnly
    ? new Date(`${approvalDateInput.trim()}T00:00:00.000Z`)
    : new Date(approvalDateInput);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid approval date provided');
  }

  const targetYear = date.getUTCFullYear();
  const targetMonth = date.getUTCMonth() + 6;
  const originalDay = date.getUTCDate();

  const result = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));
  const maxDaysInTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();

  result.setUTCDate(Math.min(originalDay, maxDaysInTargetMonth));
  return result.toISOString().split('T')[0];
}

/**
 * Checks whether a reporter's membership is currently active and within its 6-month validity window.
 */
export function isMembershipActive(
  status: ReporterAccountStatus,
  expiresAt?: string,
  nowDateInput?: string
): boolean {
  if (status !== 'APPROVED') return false;
  if (!expiresAt) return false;

  const now = nowDateInput ? new Date(nowDateInput) : new Date();
  const expiryEndOfDay = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(expiresAt) ? `${expiresAt}T23:59:59.999Z` : expiresAt
  );

  if (Number.isNaN(expiryEndOfDay.getTime())) return false;
  return now.getTime() <= expiryEndOfDay.getTime();
}

/**
 * Returns remaining calendar days until membership expiry (negative if already expired).
 */
export function getDaysRemaining(expiresAt?: string, nowDateInput?: string): number {
  if (!expiresAt) return 0;
  const now = nowDateInput ? new Date(nowDateInput) : new Date();
  const expiry = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(expiresAt) ? `${expiresAt}T23:59:59.999Z` : expiresAt
  );
  if (Number.isNaN(expiry.getTime())) return 0;
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Generates a unique, human-readable NETI BHARATHAM Press Reporter ID.
 * Format: NB-{STATE_CODE}-{DIST_CODE}-{YEAR}-{SEQ4}
 */
export function generateReporterId(
  stateCode: string,
  districtName: string,
  sequenceNumber: number,
  year = 2026
): string {
  const cleanState = (stateCode || 'IN').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2) || 'IN';
  const cleanDist =
    (districtName || 'GEN').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3) || 'GEN';
  const seqStr = String(Math.max(1, sequenceNumber)).padStart(4, '0');
  return `NB-${cleanState}-${cleanDist}-${year}-${seqStr}`;
}

/**
 * Evaluates whether a reporter is permitted to upload news articles.
 * Pending, Rejected, Suspended, and Expired reporters are strictly blocked.
 */
export function canReporterUploadNews(
  reporter: { status: ReporterAccountStatus; expiresAt?: string } | null | undefined,
  nowDateInput?: string
): { allowed: boolean; reason?: string; effectiveStatus: ReporterAccountStatus } {
  if (!reporter) {
    return {
      allowed: false,
      reason: 'Reporter account not found or not authenticated.',
      effectiveStatus: 'PENDING',
    };
  }

  if (reporter.status === 'PENDING') {
    return {
      allowed: false,
      reason: 'Your reporter application is PENDING Super Admin approval. News upload is locked until approved.',
      effectiveStatus: 'PENDING',
    };
  }

  if (reporter.status === 'REJECTED') {
    return {
      allowed: false,
      reason: 'Your reporter application was REJECTED. Please contact Super Admin.',
      effectiveStatus: 'REJECTED',
    };
  }

  if (reporter.status === 'SUSPENDED') {
    return {
      allowed: false,
      reason: 'Your reporter account is currently SUSPENDED by Super Admin.',
      effectiveStatus: 'SUSPENDED',
    };
  }

  if (reporter.status === 'EXPIRED' || !isMembershipActive(reporter.status, reporter.expiresAt, nowDateInput)) {
    return {
      allowed: false,
      reason: 'Your 6-month Press Reporter validity has EXPIRED. Please request membership renewal from Super Admin.',
      effectiveStatus: 'EXPIRED',
    };
  }

  return {
    allowed: true,
    effectiveStatus: 'APPROVED',
  };
}

const FORBIDDEN_REPORTER_SELF_EDIT_FIELDS = [
  'fullName',
  'fatherSpouseName',
  'dob',
  'gender',
  'mobile',
  'whatsappNumber',
  'email',
  'stateId',
  'stateName',
  'districtId',
  'districtName',
  'mandalId',
  'mandalName',
  'aadhaarDocUrl',
  'photoUrl',
  'reporterId',
  'status',
  'approvedAt',
  'expiresAt',
];

/**
 * Enforces rule #6 & #19:
 * Reporter can change ONLY: 1. Password, 2. Residential address.
 * Any attempt to modify restricted fields is rejected.
 */
export function validateReporterSelfUpdate(payload: Record<string, unknown>): {
  valid: boolean;
  error?: string;
  sanitizedUpdate?: { residentialAddress?: string; newPassword?: string };
} {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid update payload.' };
  }

  for (const forbiddenKey of FORBIDDEN_REPORTER_SELF_EDIT_FIELDS) {
    if (forbiddenKey in payload && payload[forbiddenKey] !== undefined) {
      return {
        valid: false,
        error: `Security Violation: Reporters are not permitted to modify '${forbiddenKey}'. Only Super Admin can edit core identity and location fields.`,
      };
    }
  }

  const allowedKeys = ['residentialAddress', 'newPassword', 'currentPassword', 'reporterDocId'];
  for (const key of Object.keys(payload)) {
    if (!allowedKeys.includes(key)) {
      return {
        valid: false,
        error: `Unauthorized field '${key}' in reporter profile update.`,
      };
    }
  }

  const sanitizedUpdate: { residentialAddress?: string; newPassword?: string } = {};

  if (typeof payload.residentialAddress === 'string') {
    const trimmed = payload.residentialAddress.trim();
    if (trimmed.length < 5 || trimmed.length > 500) {
      return {
        valid: false,
        error: 'Residential address must be between 5 and 500 characters.',
      };
    }
    sanitizedUpdate.residentialAddress = trimmed;
  }

  if (typeof payload.newPassword === 'string' && payload.newPassword.length > 0) {
    if (payload.newPassword.length < 8) {
      return {
        valid: false,
        error: 'New password must be at least 8 characters long.',
      };
    }
    sanitizedUpdate.newPassword = payload.newPassword;
  }

  if (!sanitizedUpdate.residentialAddress && !sanitizedUpdate.newPassword) {
    return {
      valid: false,
      error: 'Please provide a valid residential address or new password to update.',
    };
  }

  return { valid: true, sanitizedUpdate };
}

/**
 * Sanitizes a reporter record into a public QR verification card.
 * Strictly strips Aadhaar, password hashes, residential address, DOB, and private fields.
 */
export function sanitizePublicReporterVerification(
  reporter: {
    reporterId?: string;
    fullName: string;
    photoUrl: string;
    stateName: string;
    districtName: string;
    mandalName: string;
    mobile: string;
    approvedAt?: string;
    expiresAt?: string;
    status: ReporterAccountStatus;
  },
  nowDateInput?: string
): PublicReporterVerificationCard {
  const active = isMembershipActive(reporter.status, reporter.expiresAt, nowDateInput);
  const publicStatus: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' =
    reporter.status === 'SUSPENDED'
      ? 'SUSPENDED'
      : active
      ? 'ACTIVE'
      : 'EXPIRED';

  return {
    reporterId: reporter.reporterId || '',
    fullName: reporter.fullName,
    designation: 'PRESS REPORTER',
    photoUrl: reporter.photoUrl,
    stateName: reporter.stateName,
    districtName: reporter.districtName,
    mandalName: reporter.mandalName,
    mobile: reporter.mobile,
    issuedAt: reporter.approvedAt || '',
    expiresAt: reporter.expiresAt || '',
    status: publicStatus,
  };
}

/**
 * Validates a private advertisement submission from a reporter.
 * Enforces max 2 images and default PENDING status.
 */
export function validateAdSubmission(input: {
  title?: string;
  businessName?: string;
  contactNumber?: string;
  description?: string;
  images?: string[];
  startDate?: string;
  expiryDate?: string;
}): { valid: boolean; error?: string } {
  if (!input.title || input.title.trim().length < 3) {
    return { valid: false, error: 'Advertisement title is required (min 3 characters).' };
  }
  if (!input.businessName || input.businessName.trim().length < 2) {
    return { valid: false, error: 'Business/Organization name is required.' };
  }
  if (!input.contactNumber || !/^[0-9+\-\s]{10,15}$/.test(input.contactNumber.trim())) {
    return { valid: false, error: 'Valid 10-digit contact number is required.' };
  }
  if (!Array.isArray(input.images) || input.images.length === 0) {
    return { valid: false, error: 'At least one advertisement image is required.' };
  }
  if (input.images.length > 2) {
    return {
      valid: false,
      error: 'Maximum of TWO advertisement images are allowed per submission.',
    };
  }
  if (!input.startDate || !input.expiryDate) {
    return { valid: false, error: 'Advertisement start and expiry validity dates are required.' };
  }
  return { valid: true };
}

/**
 * Generates an SEO-friendly news slug such as:
 * telangana-hyderabad-local-news-example
 */
export function generateNewsSlug(
  stateNameEn: string,
  districtNameEn: string,
  headlineOrSeoTitle: string,
  uniqueSuffix?: string
): string {
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const statePart = normalize(stateNameEn || 'india');
  const distPart = normalize(districtNameEn || 'national');
  const titlePart = normalize(headlineOrSeoTitle || 'breaking-report').slice(0, 60);

  const base = [statePart, distPart, titlePart || 'news-report']
    .filter(Boolean)
    .join('-')
    .replace(/-+/g, '-');

  return uniqueSuffix ? `${base}-${normalize(uniqueSuffix)}` : base;
}
