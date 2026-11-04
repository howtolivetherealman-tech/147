# NETI BHARATHAM – Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Default-Deny Catch-All**: Any path not explicitly matched in `firestore.rules` is unconditionally denied (`allow read, write: if false;`).
2. **PII & Aadhaar Strict Isolation (`/reporterPrivateDocuments/{reporterId}`)**:
   - Aadhaar photographs, residential addresses, DOB, and father/spouse names are stored exclusively in `/reporterPrivateDocuments/{reporterId}`.
   - Public users and other reporters can NEVER read (`get` or `list`) `/reporterPrivateDocuments`.
   - Only the owning reporter (`request.auth.uid == resource.data.uid`) or a verified Super Admin (`isAdmin()`) can read a private document.
   - Reporters can ONLY update `residentialAddress` and `updatedAt` in `/reporterPrivateDocuments/{reporterId}`. All other fields (`aadhaarDocUrl`, `dob`, `fatherSpouseName`, `email`, `pinCode`) are immutable for non-admin users.
3. **Public QR Verification Safety (`/reporterIds/{cardNumber}`)**:
   - Contains strictly non-sensitive press badge verification fields (`reporterId`, `fullName`, `designation`, `stateName`, `districtName`, `mandalName`, `mobile`, `photoUrl`, `issuedAt`, `expiresAt`, `status`).
   - Only Super Admin (`isAdmin()`) can create, update, or delete `/reporterIds/{cardNumber}` records.
4. **Reporter Profile Restrictions (`/reporters/{reporterId}`)**:
   - Upon creation by a registering reporter, `status` MUST be `'PENDING'`. A reporter cannot self-approve (`status: 'APPROVED'`) or assign a `reporterId`.
   - Reporters are strictly forbidden from updating their own `/reporters/{reporterId}` document (`fullName`, `mobile`, `stateId`, `districtId`, `mandalId`, `photoUrl`, `reporterId`, `status` are Admin-only).
5. **News Publishing & Attribution Gate (`/news/{newsId}`)**:
   - Public visitors can only read (`get`/`list`) news documents where `resource.data.status == 'PUBLISHED'`.
   - A reporter can only create a news article with `status == 'PENDING'` and `authorUid == request.auth.uid`, and only if their `/reporters/$(incoming().reporterDocId)` record exists and has `status == 'APPROVED'`.
   - Only Super Admin (`isAdmin()`) can transition `status` to `'PUBLISHED'` or `'REJECTED'`.
6. **Private Advertisement Gate (`/advertisements/{adId}`)**:
   - Public visitors can only read (`get`/`list`) advertisements where `resource.data.status == 'ACTIVE'`.
   - Reporters can only submit advertisements with `status == 'PENDING'` and at most 2 image slots (`image1`, optional `image2`).
   - Only Super Admin can approve (`status == 'ACTIVE'`), reject, or modify pricing/payment status.
7. **Admin-Only Governance Collections**:
   - `/admins`, `/states`, `/districts`, `/mandals`, `/newsCategories`, `/websiteSettings`, `/adSenseSettings`, `/auditLogs`, and `/membershipRenewals` can only be mutated by a verified Super Admin (`isAdmin()`).

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Self-Approved Reporter Registration)**:
   - Target: `CREATE /reporters/rep_01`
   - Attack: `{ status: "APPROVED", reporterId: "NB-FAKE-001", ... }` by non-admin user.
   - Expected: `PERMISSION_DENIED` (Reporter creation enforces `incoming().status == 'PENDING'`).
2. **Payload 2 (Shadow Field Injection on Reporter Creation)**:
   - Target: `CREATE /reporters/rep_01`
   - Attack: Includes unauthorized field `{ isSuperAdmin: true }`.
   - Expected: `PERMISSION_DENIED` (`hasOnly()` key allowlist rejects shadow keys).
3. **Payload 3 (Horizontal PII / Aadhaar Scraping)**:
   - Target: `GET /reporterPrivateDocuments/rep_victim`
   - Attack: Authenticated reporter `uid_attacker` attempts to read `rep_victim`'s Aadhaar document.
   - Expected: `PERMISSION_DENIED` (Restricted to `resource.data.uid == request.auth.uid || isAdmin()`).
4. **Payload 4 (Forbidden Reporter Profile Self-Edit)**:
   - Target: `UPDATE /reporters/rep_01`
   - Attack: Approved reporter attempts to change `fullName` or `stateId` or `expiresAt`.
   - Expected: `PERMISSION_DENIED` (Only `isAdmin()` can update `/reporters/{reporterId}`).
5. **Payload 5 (Forbidden Aadhaar Replacement by Reporter)**:
   - Target: `UPDATE /reporterPrivateDocuments/rep_01`
   - Attack: Reporter attempts to modify `aadhaarDocUrl` alongside `residentialAddress`.
   - Expected: `PERMISSION_DENIED` (`affectedKeys().hasOnly(['residentialAddress', 'updatedAt'])` blocks any change to `aadhaarDocUrl`).
6. **Payload 6 (Unapproved Direct News Publication)**:
   - Target: `CREATE /news/news_01`
   - Attack: Reporter submits news with `status: "PUBLISHED"`.
   - Expected: `PERMISSION_DENIED` (Non-admin news creation requires `incoming().status == 'PENDING'`).
7. **Payload 7 (Pending Reporter Uploading News)**:
   - Target: `CREATE /news/news_01`
   - Attack: Reporter whose `/reporters/{id}` status is `PENDING` attempts to create a news document.
   - Expected: `PERMISSION_DENIED` (Relational `get()` check verifies reporter `status == 'APPROVED'`).
8. **Payload 8 (Public Visitor Listing Unpublished Drafts)**:
   - Target: `LIST /news` without `where('status', '==', 'PUBLISHED')`
   - Attack: Anonymous visitor queries all `/news` documents.
   - Expected: `PERMISSION_DENIED` (`allow list` enforces `resource.data.status == 'PUBLISHED' || isAdmin()`).
9. **Payload 9 (Fake QR Press ID Card Injection)**:
   - Target: `CREATE /reporterIds/NB-TS-9999`
   - Attack: Authenticated non-admin attempts to mint a public verification badge.
   - Expected: `PERMISSION_DENIED` (Only `isAdmin()` can write to `/reporterIds`).
10. **Payload 10 (Auto-Activated Private Advertisement)**:
    - Target: `CREATE /advertisements/ad_01`
    - Attack: Reporter creates an ad with `status: "ACTIVE"` and `paymentStatus: "PAID"`.
    - Expected: `PERMISSION_DENIED` (Non-admin ad creation enforces `status == 'PENDING'` and `paymentStatus == 'PENDING'`).
11. **Payload 11 (Unverified Email Spoofing Admin)**:
    - Target: `UPDATE /websiteSettings/global`
    - Attack: Token has `email == 'brkr1042@gmail.com'` but `email_verified == false`.
    - Expected: `PERMISSION_DENIED` (`isAdmin()` requires `request.auth.token.email_verified == true`).
12. **Payload 12 (Denial-of-Wallet Oversized String Poisoning)**:
    - Target: `CREATE /news/news_01`
    - Attack: `headline` is a 50,000-character string or `newsId` is 500 characters of special symbols.
    - Expected: `PERMISSION_DENIED` (`isValidId(newsId)` and `headline.size() <= 300` reject oversized inputs).
