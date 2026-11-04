import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSixMonthExpiry,
  isMembershipActive,
  getDaysRemaining,
  generateReporterId,
  canReporterUploadNews,
  validateReporterSelfUpdate,
  sanitizePublicReporterVerification,
  validateAdSubmission,
  generateNewsSlug,
} from './business-rules';

test('calculateSixMonthExpiry computes exact 6 calendar months (10 Jan -> 10 Jul)', () => {
  assert.equal(calculateSixMonthExpiry('2026-01-10'), '2026-07-10');
  assert.equal(calculateSixMonthExpiry('2026-05-15'), '2026-11-15');
  assert.equal(calculateSixMonthExpiry('2026-08-31'), '2027-02-28');
});

test('isMembershipActive and getDaysRemaining accurately track 6-month validity', () => {
  assert.equal(isMembershipActive('APPROVED', '2026-12-31', '2026-11-04T12:00:00Z'), true);
  assert.equal(isMembershipActive('APPROVED', '2026-10-01', '2026-11-04T12:00:00Z'), false);
  assert.equal(isMembershipActive('PENDING', '2026-12-31', '2026-11-04T12:00:00Z'), false);
  assert.equal(isMembershipActive('EXPIRED', '2026-12-31', '2026-11-04T12:00:00Z'), false);
  assert.ok(getDaysRemaining('2026-11-14', '2026-11-04T00:00:00Z') >= 10);
});

test('canReporterUploadNews enforces Pending, Approved, and Expired reporter permissions', () => {
  const pending = canReporterUploadNews({ status: 'PENDING' }, '2026-11-04T00:00:00Z');
  assert.equal(pending.allowed, false);
  assert.equal(pending.effectiveStatus, 'PENDING');

  const approvedActive = canReporterUploadNews(
    { status: 'APPROVED', expiresAt: '2027-04-04' },
    '2026-11-04T00:00:00Z'
  );
  assert.equal(approvedActive.allowed, true);
  assert.equal(approvedActive.effectiveStatus, 'APPROVED');

  const approvedButPastExpiry = canReporterUploadNews(
    { status: 'APPROVED', expiresAt: '2026-09-01' },
    '2026-11-04T00:00:00Z'
  );
  assert.equal(approvedButPastExpiry.allowed, false);
  assert.equal(approvedButPastExpiry.effectiveStatus, 'EXPIRED');
});

test('validateReporterSelfUpdate permits ONLY residentialAddress and newPassword', () => {
  const validEdit = validateReporterSelfUpdate({
    residentialAddress: 'Flat 402, Banjara Hills Road No 12, Hyderabad',
    newPassword: 'SecurePassword#2026',
  });
  assert.equal(validEdit.valid, true);
  assert.equal(
    validEdit.sanitizedUpdate?.residentialAddress,
    'Flat 402, Banjara Hills Road No 12, Hyderabad'
  );

  // Attempting to edit restricted fields must fail
  for (const field of [
    'fullName',
    'dob',
    'mobile',
    'email',
    'stateId',
    'districtId',
    'mandalId',
    'aadhaarDocUrl',
    'photoUrl',
    'reporterId',
    'status',
  ]) {
    const attempt = validateReporterSelfUpdate({
      residentialAddress: 'Valid Address 123',
      [field]: 'TamperedValue',
    });
    assert.equal(attempt.valid, false, `Should block reporter from editing ${field}`);
  }
});

test('sanitizePublicReporterVerification strips Aadhaar, password, and residential address', () => {
  const rawRecord = {
    reporterId: 'NB-TG-HYD-2026-0001',
    fullName: 'K. Venkata Ramana',
    photoUrl: '/images/reporter-1.svg',
    stateName: 'Telangana (తెలంగాణ)',
    districtName: 'Hyderabad (హైదరాబాద్)',
    mandalName: 'Khairatabad (ఖైరతాబాద్)',
    mobile: '9848012345',
    approvedAt: '2026-06-04',
    expiresAt: '2026-12-04',
    status: 'APPROVED' as const,
    aadhaarDocUrl: 'data:image/png;base64,SECRET_AADHAAR_SCAN',
    residentialAddress: 'Secret House No 12-3-456, Hyderabad',
    passwordHash: 'pbkdf2_secret_hash',
    dob: '1988-05-12',
    email: 'private@example.com',
  };

  const publicCard = sanitizePublicReporterVerification(rawRecord, '2026-11-04T00:00:00Z');
  assert.equal(publicCard.reporterId, 'NB-TG-HYD-2026-0001');
  assert.equal(publicCard.status, 'ACTIVE');
  assert.equal(publicCard.designation, 'PRESS REPORTER');
  assert.equal('aadhaarDocUrl' in publicCard, false);
  assert.equal('residentialAddress' in publicCard, false);
  assert.equal('passwordHash' in publicCard, false);
  assert.equal('dob' in publicCard, false);
});

test('validateAdSubmission enforces max 2 images', () => {
  const validTwoImages = validateAdSubmission({
    title: 'Dasara & Deepavali Grand Textile Mela',
    businessName: 'Sri Lakshmi Silks',
    contactNumber: '9848099887',
    images: ['img1.png', 'img2.png'],
    startDate: '2026-11-01',
    expiryDate: '2026-12-01',
  });
  assert.equal(validTwoImages.valid, true);

  const threeImages = validateAdSubmission({
    title: 'Invalid Ad With 3 Images',
    businessName: 'Test Corp',
    contactNumber: '9848099887',
    images: ['img1.png', 'img2.png', 'img3.png'],
    startDate: '2026-11-01',
    expiryDate: '2026-12-01',
  });
  assert.equal(threeImages.valid, false);
});

test('generateReporterId and generateNewsSlug format cleanly', () => {
  assert.equal(generateReporterId('TG', 'Hyderabad', 7, 2026), 'NB-TG-HYD-2026-0007');
  assert.equal(
    generateNewsSlug('Telangana', 'Hyderabad', 'Metro Rail Phase 2 Expansion Approved'),
    'telangana-hyderabad-metro-rail-phase-2-expansion-approved'
  );
});
