import { NextRequest, NextResponse } from 'next/server';
import {
  loadPortalDatabase,
  savePortalDatabase,
  createPublicSafeSnapshot,
  hashPassword,
  verifyPassword,
  checkRateLimit,
  recordFailedLogin,
  clearFailedLogin,
  calculateSixMonthExpiry,
} from '@/lib/server-db';
import {
  canReporterUploadNews,
  generateNewsSlug,
  generateReporterId,
  sanitizePublicReporterVerification,
  validateAdSubmission,
  validateReporterSelfUpdate,
} from '@/lib/business-rules';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'public';
  const role = searchParams.get('role') || 'PUBLIC';
  const reporterDocId = searchParams.get('reporterDocId') || '';
  const verifyId = searchParams.get('verifyId') || '';

  const dbState = loadPortalDatabase();

  // 1. Public QR Verification Lookup (Strictly Sanitized - No Aadhaar or Residential Address)
  if (mode === 'verify_qr' && verifyId) {
    const queryClean = verifyId.trim().toUpperCase();
    const matchedReporter = dbState.reporters.find(
      (r) => (r.reporterId && r.reporterId.toUpperCase() === queryClean) || r.id.toUpperCase() === queryClean
    );

    if (!matchedReporter || !matchedReporter.reporterId) {
      return NextResponse.json(
        { found: false, error: 'No approved Press Reporter ID found matching this code.' },
        { status: 404 }
      );
    }

    const publicCard = sanitizePublicReporterVerification(matchedReporter);
    return NextResponse.json({
      found: true,
      card: publicCard,
      issuer: {
        portalName: dbState.websiteSettings.siteNameEn,
        portalNameTe: dbState.websiteSettings.siteNameTe,
        domain: dbState.websiteSettings.domain,
        contactEmail: dbState.websiteSettings.contactEmail,
        location: dbState.websiteSettings.location,
        emergencyContact: dbState.websiteSettings.emergencyContact,
      },
    });
  }

  // 2. Super Admin Full Portal Snapshot
  if (role === 'SUPER_ADMIN') {
    return NextResponse.json({
      ...createPublicSafeSnapshot(dbState),
      allNews: dbState.news,
      allReporters: dbState.reporters,
      allReporterPrivateDocs: dbState.reporterPrivateDocs.map((doc) => ({
        ...doc,
        passwordHash: undefined, // Never transmit password hashes
      })),
      allAdvertisements: dbState.advertisements,
      notifications: dbState.notifications,
      auditLogs: dbState.auditLogs,
      membershipRenewals: dbState.membershipRenewals,
    });
  }

  // 3. Authenticated Reporter Dashboard Snapshot (Only Own Profile, Own News, Own Ads, Own Notifications)
  if (role === 'REPORTER' && reporterDocId) {
    const reporter = dbState.reporters.find((r) => r.id === reporterDocId);
    const privateDoc = dbState.reporterPrivateDocs.find((p) => p.reporterDocId === reporterDocId);

    if (reporter) {
      return NextResponse.json({
        ...createPublicSafeSnapshot(dbState),
        reporterProfile: reporter,
        reporterPrivateDoc: privateDoc
          ? { ...privateDoc, passwordHash: undefined }
          : null,
        myNews: dbState.news.filter(
          (n) => n.reporterId === reporter.reporterId || n.authorUid === reporter.uid || n.authorUid === reporter.id
        ),
        myAdvertisements: dbState.advertisements.filter(
          (a) => a.reporterId === reporter.reporterId || a.reporterId === reporter.id
        ),
        myNotifications: dbState.notifications.filter((n) => n.recipientId === reporter.id),
        myRenewals: dbState.membershipRenewals.filter(
          (m) => m.reporterId === reporter.reporterId || m.reporterId === reporter.id
        ),
      });
    }
  }

  // 4. Default Public Visitor Snapshot
  return NextResponse.json(createPublicSafeSnapshot(dbState));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload, actor } = body;
    const dbState = loadPortalDatabase();
    const nowIso = new Date().toISOString();

    const logAudit = (
      actorId: string,
      actorRole: 'SUPER_ADMIN' | 'REPORTER' | 'SYSTEM',
      actionName: string,
      targetType: string,
      targetId: string,
      details: string
    ) => {
      dbState.auditLogs.unshift({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorId,
        actorRole,
        action: actionName,
        targetType,
        targetId,
        details,
        createdAt: nowIso,
      });
    };

    // =========================================================================
    // AUTHENTICATION & BOOTSTRAP ACTIONS
    // =========================================================================
    if (action === 'ADMIN_LOGIN') {
      const username = String(payload?.username || '').trim();
      const password = String(payload?.password || '');
      const rateKey = `admin:${username.toLowerCase()}`;
      const limitCheck = checkRateLimit(rateKey);

      if (!limitCheck.allowed) {
        return NextResponse.json(
          { error: `Too many login attempts. Please wait ${limitCheck.retryAfterSec}s.` },
          { status: 429 }
        );
      }

      const isUserMatch =
        username.toLowerCase() === dbState.adminAccount.username.toLowerCase() ||
        username.toLowerCase() === dbState.adminAccount.email.toLowerCase();

      const isPassValid = verifyPassword(
        password,
        dbState.adminAccount.passwordSalt,
        dbState.adminAccount.passwordHash
      );

      if (!isUserMatch || !isPassValid) {
        recordFailedLogin(rateKey);
        return NextResponse.json(
          { error: 'Invalid Super Admin credentials. Access denied.' },
          { status: 401 }
        );
      }

      clearFailedLogin(rateKey);
      logAudit(
        dbState.adminAccount.username,
        'SUPER_ADMIN',
        'ADMIN_LOGIN',
        'AUTH',
        dbState.adminAccount.username,
        'Super Admin signed in securely.'
      );
      savePortalDatabase(dbState);

      return NextResponse.json({
        success: true,
        session: {
          role: 'SUPER_ADMIN',
          username: dbState.adminAccount.username,
          email: dbState.adminAccount.email,
        },
      });
    }

    if (action === 'ADMIN_GOOGLE_SYNC') {
      const email = String(payload?.email || '').toLowerCase();
      if (email !== 'brkr1042@gmail.com' && email !== dbState.adminAccount.email.toLowerCase()) {
        return NextResponse.json(
          { error: 'This Google account is not authorized as Super Admin.' },
          { status: 403 }
        );
      }
      logAudit(email, 'SUPER_ADMIN', 'ADMIN_GOOGLE_AUTH', 'AUTH', dbState.adminAccount.username, `Super Admin authenticated via Google (${email}).`);
      savePortalDatabase(dbState);
      return NextResponse.json({
        success: true,
        session: {
          role: 'SUPER_ADMIN',
          username: dbState.adminAccount.username,
          email,
        },
      });
    }

    if (action === 'ADMIN_CHANGE_PASSWORD') {
      if (actor?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized: Super Admin required.' }, { status: 403 });
      }
      const newPassword = String(payload?.newPassword || '');
      if (newPassword.length < 4) {
        return NextResponse.json({ error: 'Admin password must be at least 4 characters.' }, { status: 400 });
      }
      const { salt, hash } = hashPassword(newPassword);
      dbState.adminAccount.passwordSalt = salt;
      dbState.adminAccount.passwordHash = hash;
      dbState.adminAccount.bootstrapped = true;
      dbState.adminAccount.updatedAt = nowIso;
      logAudit(dbState.adminAccount.username, 'SUPER_ADMIN', 'UPDATE_ADMIN_PASSWORD', 'SECURITY', dbState.adminAccount.username, 'Updated Super Admin password credential.');
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true });
    }

    if (action === 'REPORTER_LOGIN') {
      const identifier = String(payload?.username || '').trim();
      const password = String(payload?.password || '');
      const rateKey = `rep:${identifier.toLowerCase()}`;
      const limitCheck = checkRateLimit(rateKey);

      if (!limitCheck.allowed) {
        return NextResponse.json(
          { error: `Too many failed login attempts. Try again in ${limitCheck.retryAfterSec}s.` },
          { status: 429 }
        );
      }

      const reporter = dbState.reporters.find(
        (r) =>
          r.username.toLowerCase() === identifier.toLowerCase() ||
          (r.reporterId && r.reporterId.toLowerCase() === identifier.toLowerCase()) ||
          r.mobile === identifier
      );

      if (!reporter) {
        recordFailedLogin(rateKey);
        return NextResponse.json({ error: 'Invalid Reporter username/ID or password.' }, { status: 401 });
      }

      const privateDoc = dbState.reporterPrivateDocs.find((p) => p.reporterDocId === reporter.id);
      if (!privateDoc?.passwordHash) {
        recordFailedLogin(rateKey);
        return NextResponse.json({ error: 'Account credentials not configured.' }, { status: 401 });
      }

      const [salt, storedHash] = privateDoc.passwordHash.split(':');
      if (!verifyPassword(password, salt, storedHash)) {
        recordFailedLogin(rateKey);
        return NextResponse.json({ error: 'Invalid Reporter username/ID or password.' }, { status: 401 });
      }

      clearFailedLogin(rateKey);
      logAudit(reporter.username, 'REPORTER', 'REPORTER_LOGIN', 'AUTH', reporter.id, `Reporter ${reporter.fullName} signed in.`);
      savePortalDatabase(dbState);

      return NextResponse.json({
        success: true,
        session: {
          role: 'REPORTER',
          reporterDocId: reporter.id,
          reporterId: reporter.reporterId,
          username: reporter.username,
          fullName: reporter.fullName,
          status: reporter.status,
        },
      });
    }

    // =========================================================================
    // REPORTER REGISTRATION (21 Required Fields)
    // =========================================================================
    if (action === 'REGISTER_REPORTER') {
      const {
        fullName,
        fatherSpouseName,
        dob,
        gender,
        mobile,
        whatsappNumber,
        email,
        residentialAddress,
        stateId,
        districtId,
        mandalId,
        villageTown,
        pinCode,
        experience,
        previousOrganization,
        photoUrl,
        aadhaarDocUrl,
        username,
        password,
        termsConsent,
      } = payload || {};

      if (
        !fullName ||
        !fatherSpouseName ||
        !dob ||
        !gender ||
        !mobile ||
        !whatsappNumber ||
        !email ||
        !residentialAddress ||
        !stateId ||
        !districtId ||
        !mandalId ||
        !villageTown ||
        !pinCode ||
        !photoUrl ||
        !aadhaarDocUrl ||
        !username ||
        !password ||
        !termsConsent
      ) {
        return NextResponse.json(
          { error: 'All 21 required registration fields, photographs, and consent must be completed.' },
          { status: 400 }
        );
      }

      if (!/^[0-9]{10}$/.test(String(mobile).replace(/\D/g, '').slice(-10))) {
        return NextResponse.json({ error: 'Valid 10-digit mobile number is required.' }, { status: 400 });
      }

      if (String(password).length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
      }

      const cleanUsername = String(username).trim();
      const existsUsername = dbState.reporters.some(
        (r) => r.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (existsUsername || cleanUsername.toLowerCase() === 'admin') {
        return NextResponse.json(
          { error: `Username '${cleanUsername}' is already taken. Please choose a unique username.` },
          { status: 409 }
        );
      }

      const stateObj = dbState.states.find((s) => s.id === stateId);
      const distObj = dbState.districts.find((d) => d.id === districtId);
      const mandalObj = dbState.mandals.find((m) => m.id === mandalId);

      const newId = `rep-${Date.now()}`;
      const newUid = `uid-${Date.now()}`;
      const { salt, hash } = hashPassword(String(password));

      const newReporter: any = {
        id: newId,
        uid: newUid,
        username: cleanUsername,
        fullName: String(fullName).trim(),
        gender,
        mobile: String(mobile).trim(),
        stateId,
        stateName: stateObj ? `${stateObj.nameEn} (${stateObj.nameTe})` : stateId,
        districtId,
        districtName: distObj ? `${distObj.nameEn} (${distObj.nameTe})` : districtId,
        mandalId,
        mandalName: mandalObj ? `${mandalObj.nameEn} (${mandalObj.nameTe})` : mandalId,
        villageTown: String(villageTown).trim(),
        photoUrl,
        status: 'PENDING', // Strictly PENDING upon registration
        createdAt: nowIso,
      };

      const newPrivateDoc = {
        reporterDocId: newId,
        uid: newUid,
        fatherSpouseName: String(fatherSpouseName).trim(),
        dob: String(dob),
        whatsappNumber: String(whatsappNumber).trim(),
        email: String(email).trim(),
        residentialAddress: String(residentialAddress).trim(),
        pinCode: String(pinCode).trim(),
        experience: String(experience || 'Fresher').trim(),
        previousOrganization: String(previousOrganization || 'Independent').trim(),
        aadhaarDocUrl,
        termsConsent: Boolean(termsConsent),
        passwordHash: `${salt}:${hash}`,
        updatedAt: nowIso,
      };

      dbState.reporters.unshift(newReporter);
      dbState.reporterPrivateDocs.unshift(newPrivateDoc);

      dbState.notifications.unshift({
        id: `notif-${Date.now()}`,
        recipientId: newId,
        title: 'రిపోర్టర్ దరఖాస్తు స్వీకరించబడింది (Application Pending)',
        message: 'మీ నేటి భారతం రిపోర్టర్ రిజిస్ట్రేషన్ దరఖాస్తు పరిశీలనలో (PENDING) ఉంది. సూపర్ అడ్మిన్ ఆమోదం తర్వాత మీకు 6 నెలల చెల్లుబాటు గల ప్రెస్ ఐడి కార్డు జారీ చేయబడుతుంది.',
        type: 'SYSTEM',
        read: false,
        createdAt: nowIso,
      });

      logAudit(cleanUsername, 'REPORTER', 'REGISTER_REPORTER', 'REPORTER', newId, `Submitted new reporter registration for ${fullName} (${newReporter.mandalName}, ${newReporter.districtName}).`);
      savePortalDatabase(dbState);

      return NextResponse.json({
        success: true,
        reporter: newReporter,
        session: {
          role: 'REPORTER',
          reporterDocId: newReporter.id,
          username: newReporter.username,
          fullName: newReporter.fullName,
          status: 'PENDING',
        },
      });
    }

    // =========================================================================
    // REPORTER RESTRICTED SELF-UPDATE (ONLY Password & Residential Address)
    // =========================================================================
    if (action === 'REPORTER_UPDATE_PROFILE') {
      const reporterDocId = String(payload?.reporterDocId || actor?.reporterDocId || '');
      const reporter = dbState.reporters.find((r) => r.id === reporterDocId);
      const privateDoc = dbState.reporterPrivateDocs.find((p) => p.reporterDocId === reporterDocId);

      if (!reporter || !privateDoc) {
        return NextResponse.json({ error: 'Reporter record not found.' }, { status: 404 });
      }

      const validation = validateReporterSelfUpdate(payload || {});
      if (!validation.valid || !validation.sanitizedUpdate) {
        return NextResponse.json({ error: validation.error }, { status: 403 });
      }

      if (validation.sanitizedUpdate.residentialAddress) {
        privateDoc.residentialAddress = validation.sanitizedUpdate.residentialAddress;
      }

      if (validation.sanitizedUpdate.newPassword) {
        const { salt, hash } = hashPassword(validation.sanitizedUpdate.newPassword);
        privateDoc.passwordHash = `${salt}:${hash}`;
      }

      privateDoc.updatedAt = nowIso;
      logAudit(
        reporter.username,
        'REPORTER',
        'REPORTER_SELF_UPDATE',
        'REPORTER_PRIVATE',
        reporter.id,
        'Updated permitted fields (residentialAddress / password).'
      );
      savePortalDatabase(dbState);

      return NextResponse.json({
        success: true,
        residentialAddress: privateDoc.residentialAddress,
      });
    }

    // =========================================================================
    // REPORTER NEWS SUBMISSION (Requires Approved & Active 6-Month Validity)
    // =========================================================================
    if (action === 'SUBMIT_NEWS') {
      const isSuperAdmin = actor?.role === 'SUPER_ADMIN';
      const reporterDocId = String(payload?.reporterDocId || actor?.reporterDocId || '');
      const reporter = dbState.reporters.find((r) => r.id === reporterDocId);

      if (!isSuperAdmin) {
        const uploadCheck = canReporterUploadNews(reporter, nowIso);
        if (!uploadCheck.allowed) {
          return NextResponse.json({ error: uploadCheck.reason }, { status: 403 });
        }
      }

      const {
        headline,
        subheadline,
        content,
        categoryId,
        scope,
        stateId,
        districtId,
        mandalId,
        villageTown,
        featuredImage,
        galleryImages,
        imageCaption,
        videoUrl,
        tags,
        seoTitle,
        seoDescription,
        language,
        isBreaking,
      } = payload || {};

      if (!headline || String(headline).trim().length < 5) {
        return NextResponse.json({ error: 'News Headline is required (min 5 characters).' }, { status: 400 });
      }
      if (!content || String(content).trim().length < 15) {
        return NextResponse.json({ error: 'Full News Content is required.' }, { status: 400 });
      }
      if (!categoryId || !stateId) {
        return NextResponse.json({ error: 'News Category and State selection are required.' }, { status: 400 });
      }

      const catObj = dbState.categories.find((c) => c.id === categoryId);
      const stateObj = dbState.states.find((s) => s.id === stateId);
      const distObj = dbState.districts.find((d) => d.id === districtId);
      const mandalObj = dbState.mandals.find((m) => m.id === mandalId);

      const newsId = `news-${Date.now()}`;
      const slug = generateNewsSlug(
        stateObj?.nameEn || 'india',
        distObj?.nameEn || 'bureau',
        seoTitle || headline,
        String(Date.now()).slice(-4)
      );

      const newArticle = {
        id: newsId,
        slug,
        headline: String(headline).trim(),
        subheadline: String(subheadline || '').trim(),
        content: String(content).trim(),
        categoryId,
        categoryName: catObj ? `${catObj.nameEn} (${catObj.nameTe})` : categoryId,
        scope: scope || (mandalId ? 'MANDAL' : districtId ? 'DISTRICT' : 'STATE'),
        stateId,
        stateName: stateObj?.nameEn || 'Telangana',
        districtId: districtId || '',
        districtName: distObj?.nameEn || '',
        mandalId: mandalId || '',
        mandalName: mandalObj?.nameEn || '',
        villageTown: String(villageTown || '').trim(),
        featuredImage: featuredImage || '/images/hero-secretariat.svg',
        galleryImages: Array.isArray(galleryImages) && galleryImages.length > 0 ? galleryImages : [featuredImage || '/images/hero-secretariat.svg'],
        imageCaption: String(imageCaption || headline).trim(),
        videoUrl: String(videoUrl || '').trim(),
        tags: Array.isArray(tags) ? tags : String(tags || '').split(',').map((t) => t.trim()).filter(Boolean),
        seoTitle: String(seoTitle || headline).trim(),
        seoDescription: String(seoDescription || subheadline || headline).trim().slice(0, 300),
        language: language === 'en' ? ('en' as const) : ('te' as const),
        isBreaking: Boolean(isBreaking),
        isFeatured: Boolean(isSuperAdmin ? payload?.isFeatured : true),
        isTrending: Boolean(isBreaking),
        views: 1,
        reporterId: isSuperAdmin ? 'ADMIN-DESK' : (reporter?.reporterId || reporter?.id || 'REPORTER'),
        reporterName: isSuperAdmin ? 'NETI BHARATHAM Editorial Desk' : (reporter?.fullName || 'Reporter'),
        authorUid: isSuperAdmin ? 'chakri' : (reporter?.uid || reporter?.id || ''),
        status: 'PUBLISHED' as const,
        revisions: [
          {
            timestamp: nowIso,
            editorName: isSuperAdmin ? 'Super Admin' : (reporter?.fullName || 'Reporter'),
            action: isSuperAdmin
              ? 'Published directly by Editorial Admin'
              : 'Published directly by Accredited Reporter (Immediate Live Publication)',
          },
        ],
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      if (newArticle.isBreaking && newArticle.headline) {
        const currentTicker = dbState.websiteSettings.breakingTickerText || '';
        if (!currentTicker.includes(newArticle.headline)) {
          dbState.websiteSettings.breakingTickerText = currentTicker
            ? `${newArticle.headline} • ${currentTicker}`
            : newArticle.headline;
        }
      }

      dbState.news.unshift(newArticle);
      logAudit(
        isSuperAdmin ? dbState.adminAccount.username : (reporter?.reporterId || reporter?.username || 'Reporter'),
        isSuperAdmin ? 'SUPER_ADMIN' : 'REPORTER',
        'SUBMIT_NEWS',
        'NEWS',
        newsId,
        `Published news article "${newArticle.headline}" immediately [Status: PUBLISHED]`
      );
      savePortalDatabase(dbState);

      return NextResponse.json({
        success: true,
        article: newArticle,
      });
    }

    // =========================================================================
    // PRIVATE ADVERTISEMENT SUBMISSION (Max 2 Images, Immediate ACTIVE Status)
    // =========================================================================
    if (action === 'SUBMIT_AD') {
      const isSuperAdmin = actor?.role === 'SUPER_ADMIN';
      const reporterDocId = String(payload?.reporterDocId || actor?.reporterDocId || '');
      const reporter = dbState.reporters.find((r) => r.id === reporterDocId);

      if (!isSuperAdmin) {
        const uploadCheck = canReporterUploadNews(reporter);
        if (!uploadCheck.allowed) {
          return NextResponse.json({ error: uploadCheck.reason }, { status: 403 });
        }
      }

      const images: string[] = [];
      if (payload?.image1) images.push(String(payload.image1));
      if (payload?.image2) images.push(String(payload.image2));
      if (Array.isArray(payload?.extraImages)) {
        images.push(...payload.extraImages);
      }

      const validation = validateAdSubmission({
        title: payload?.title,
        businessName: payload?.businessName,
        contactNumber: payload?.contactNumber,
        description: payload?.description,
        images,
        startDate: payload?.startDate,
        expiryDate: payload?.expiryDate,
      });

      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const stateObj = dbState.states.find((s) => s.id === payload?.targetStateId);
      const distObj = dbState.districts.find((d) => d.id === payload?.targetDistrictId);
      const mandalObj = dbState.mandals.find((m) => m.id === payload?.targetMandalId);

      const newAd = {
        id: `ad-${Date.now()}`,
        title: String(payload.title).trim(),
        businessName: String(payload.businessName).trim(),
        contactNumber: String(payload.contactNumber).trim(),
        description: String(payload.description || '').trim(),
        image1: images[0],
        image2: images[1] || '',
        linkUrl: String(payload.linkUrl || '').trim(),
        targetStateId: payload.targetStateId || 'st-tg',
        targetStateName: stateObj?.nameEn || 'All India',
        targetDistrictId: payload.targetDistrictId || '',
        targetDistrictName: distObj?.nameEn || 'All Districts',
        targetMandalId: payload.targetMandalId || '',
        targetMandalName: mandalObj?.nameEn || 'All Mandals',
        startDate: String(payload.startDate),
        expiryDate: String(payload.expiryDate),
        position: payload.position || 'HOMEPAGE_BANNER',
        priceAmount: Number(payload.priceAmount || 5000),
        paymentStatus: (payload.paymentStatus || 'PAID') as 'PENDING' | 'PAID' | 'WAIVED',
        reporterId: isSuperAdmin ? 'ADMIN' : (reporter?.reporterId || reporter?.id || 'REPORTER'),
        reporterName: isSuperAdmin ? 'Super Admin' : (reporter?.fullName || 'Reporter'),
        status: 'ACTIVE' as const,
        createdAt: nowIso,
      };

      dbState.advertisements.unshift(newAd);
      logAudit(
        newAd.reporterId,
        isSuperAdmin ? 'SUPER_ADMIN' : 'REPORTER',
        'SUBMIT_ADVERTISEMENT',
        'ADVERTISEMENT',
        newAd.id,
        `Published advertisement "${newAd.title}" for ${newAd.businessName} immediately [Status: ACTIVE]`
      );
      savePortalDatabase(dbState);

      return NextResponse.json({
        success: true,
        advertisement: newAd,
      });
    }

    // =========================================================================
    // SUPER ADMIN EXCLUSIVE GOVERNANCE ACTIONS
    // =========================================================================
    if (actor?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: Only Super Admin can perform this operation.' },
        { status: 403 }
      );
    }

    if (action === 'APPROVE_REPORTER') {
      const { reporterDocId } = payload || {};
      const reporter = dbState.reporters.find((r) => r.id === reporterDocId);
      if (!reporter) {
        return NextResponse.json({ error: 'Reporter application not found.' }, { status: 404 });
      }

      const approvalDate = payload?.approvalDate || nowIso.split('T')[0];
      const expiryDate = calculateSixMonthExpiry(approvalDate);
      const stateObj = dbState.states.find((s) => s.id === reporter.stateId);
      const distObj = dbState.districts.find((d) => d.id === reporter.districtId);

      if (!reporter.reporterId) {
        const seq = dbState.reporters.filter((r) => Boolean(r.reporterId)).length + 1;
        reporter.reporterId = generateReporterId(
          stateObj?.code || 'TG',
          distObj?.nameEn || 'HYD',
          seq,
          new Date(approvalDate).getUTCFullYear()
        );
      }

      reporter.status = 'APPROVED';
      reporter.approvedAt = approvalDate;
      reporter.expiresAt = expiryDate;
      reporter.rejectionRemarks = '';

      dbState.notifications.unshift({
        id: `notif-${Date.now()}`,
        recipientId: reporter.id,
        title: 'అభినందనలు! మీ ప్రెస్ రిపోర్టర్ అప్లికేషన్ ఆమోదించబడింది (Approved)',
        message: `మీ నేటి భారతం ప్రెస్ రిపోర్టర్ గుర్తింపు కార్డు (ID: ${reporter.reporterId}) ఆమోదించబడింది. చెల్లుబాటు: ${approvalDate} నుండి ${expiryDate} వరకు (6 నెలలు).`,
        type: 'APPROVAL',
        read: false,
        createdAt: nowIso,
      });

      logAudit(
        'Admin',
        'SUPER_ADMIN',
        'APPROVE_REPORTER',
        'REPORTER',
        reporter.id,
        `Approved reporter ${reporter.fullName} with ID ${reporter.reporterId}. Valid ${approvalDate} to ${expiryDate}.`
      );
      savePortalDatabase(dbState);

      return NextResponse.json({
        success: true,
        reporter,
      });
    }

    if (action === 'REJECT_REPORTER') {
      const { reporterDocId, remarks } = payload || {};
      const reporter = dbState.reporters.find((r) => r.id === reporterDocId);
      if (!reporter) {
        return NextResponse.json({ error: 'Reporter application not found.' }, { status: 404 });
      }

      reporter.status = 'REJECTED';
      reporter.rejectionRemarks = String(remarks || 'Incomplete verification documents.').trim();

      dbState.notifications.unshift({
        id: `notif-${Date.now()}`,
        recipientId: reporter.id,
        title: 'రిపోర్టర్ దరఖాస్తు తిరస్కరించబడింది (Application Rejected)',
        message: `మీ రిపోర్టర్ దరఖాస్తు తిరస్కరించబడింది. కారణం: ${reporter.rejectionRemarks}`,
        type: 'REJECTION',
        read: false,
        createdAt: nowIso,
      });

      logAudit(
        'Admin',
        'SUPER_ADMIN',
        'REJECT_REPORTER',
        'REPORTER',
        reporter.id,
        `Rejected reporter ${reporter.fullName}. Remarks: ${reporter.rejectionRemarks}`
      );
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true, reporter });
    }

    if (action === 'RENEW_REPORTER') {
      const { reporterDocId, remarks } = payload || {};
      const reporter = dbState.reporters.find((r) => r.id === reporterDocId);
      if (!reporter) {
        return NextResponse.json({ error: 'Reporter not found.' }, { status: 404 });
      }

      const previousExpiry = reporter.expiresAt || nowIso.split('T')[0];
      const baseDate =
        reporter.expiresAt && new Date(reporter.expiresAt).getTime() > Date.now()
          ? reporter.expiresAt
          : nowIso.split('T')[0];
      const newExpiry = calculateSixMonthExpiry(baseDate);

      if (!reporter.reporterId) {
        const seq = dbState.reporters.filter((r) => Boolean(r.reporterId)).length + 1;
        reporter.reporterId = generateReporterId('TG', reporter.districtName, seq);
      }

      reporter.status = 'APPROVED';
      if (!reporter.approvedAt) {
        reporter.approvedAt = nowIso.split('T')[0];
      }
      reporter.expiresAt = newExpiry;

      const renewalRecord = {
        id: `ren-${Date.now()}`,
        reporterId: reporter.reporterId,
        reporterName: reporter.fullName,
        previousExpiry,
        newExpiry,
        renewedBy: 'Admin',
        remarks: String(remarks || 'Renewed for 6 calendar months by Super Admin.'),
        renewedAt: nowIso,
      };

      dbState.membershipRenewals.unshift(renewalRecord);
      dbState.notifications.unshift({
        id: `notif-${Date.now()}`,
        recipientId: reporter.id,
        title: 'రిపోర్టర్ సభ్యత్వం 6 నెలలు పొడిగించబడింది (Membership Renewed)',
        message: `మీ ప్రెస్ రిపోర్టర్ గుర్తింపు కార్డు (${reporter.reporterId}) ${newExpiry} వరకు 6 నెలల పాటు రెన్యువల్ చేయబడింది.`,
        type: 'RENEWAL',
        read: false,
        createdAt: nowIso,
      });

      logAudit(
        'Admin',
        'SUPER_ADMIN',
        'RENEW_REPORTER_MEMBERSHIP',
        'REPORTER',
        reporter.id,
        `Renewed ${reporter.fullName} (${reporter.reporterId}) for 6 months until ${newExpiry}.`
      );
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true, reporter, renewalRecord });
    }

    if (action === 'ADMIN_UPDATE_REPORTER') {
      const { reporterDocId, updates, privateUpdates, newPassword } = payload || {};
      const reporter = dbState.reporters.find((r) => r.id === reporterDocId);
      if (!reporter) {
        return NextResponse.json({ error: 'Reporter not found.' }, { status: 404 });
      }

      const previousReporterId = reporter.reporterId;
      let privDoc = dbState.reporterPrivateDocs.find((p) => p.reporterDocId === reporterDocId);
      if (!privDoc) {
        const defaultCred = hashPassword('Reporter@2026');
        privDoc = {
          reporterDocId: reporter.id,
          uid: reporter.uid,
          fatherSpouseName: '',
          dob: '1990-01-01',
          whatsappNumber: reporter.mobile || '',
          email: `${reporter.username}@netibhaaratham.com`,
          residentialAddress: `${reporter.mandalName}, ${reporter.districtName}, ${reporter.stateName}`,
          pinCode: '500001',
          experience: '2 Years',
          previousOrganization: 'Independent',
          aadhaarDocUrl: '/icon.svg',
          termsConsent: true,
          passwordHash: `${defaultCred.salt}:${defaultCred.hash}`,
          updatedAt: nowIso,
        };
        dbState.reporterPrivateDocs.push(privDoc);
      }

      if (updates && typeof updates === 'object') {
        if (updates.stateId) {
          const stObj = dbState.states.find((s) => s.id === updates.stateId);
          if (stObj) updates.stateName = stObj.nameEn;
        }
        if (updates.districtId) {
          const dtObj = dbState.districts.find((d) => d.id === updates.districtId);
          if (dtObj) updates.districtName = dtObj.nameEn;
        }
        if (updates.mandalId) {
          const mnObj = dbState.mandals.find((m) => m.id === updates.mandalId);
          if (mnObj) updates.mandalName = mnObj.nameEn;
        }
        if (updates.whatsappNumber) {
          privDoc.whatsappNumber = updates.whatsappNumber;
        }
        Object.assign(reporter, updates);
      }

      // Sync updated reporterId and fullName across published news & advertisements
      if (reporter.reporterId || reporter.fullName) {
        dbState.news.forEach((n) => {
          if (
            n.authorUid === reporter.uid ||
            n.authorUid === reporter.id ||
            (previousReporterId && n.reporterId === previousReporterId)
          ) {
            if (reporter.reporterId) n.reporterId = reporter.reporterId;
            if (reporter.fullName) n.reporterName = reporter.fullName;
          }
        });
        dbState.advertisements.forEach((a) => {
          if (previousReporterId && a.reporterId === previousReporterId) {
            if (reporter.reporterId) a.reporterId = reporter.reporterId;
            if (reporter.fullName) a.reporterName = reporter.fullName;
          }
        });
      }

      if (privateUpdates && typeof privateUpdates === 'object') {
        if (privateUpdates.gender) {
          reporter.gender = privateUpdates.gender;
        }
        Object.assign(privDoc, privateUpdates);
        privDoc.updatedAt = nowIso;
      }
      if (typeof newPassword === 'string' && newPassword.trim().length >= 4) {
        const { salt, hash } = hashPassword(newPassword.trim());
        privDoc.passwordHash = `${salt}:${hash}`;
      }

      logAudit(
        'chakri',
        'SUPER_ADMIN',
        'ADMIN_EDIT_REPORTER',
        'REPORTER',
        reporter.id,
        `Super Admin updated complete profile & ID (${reporter.reporterId || 'NO-ID'}) for reporter ${reporter.fullName}.`
      );
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true, reporter, privateDoc: privDoc });
    }

    if (action === 'DELETE_REPORTER') {
      const { reporterDocId } = payload || {};
      dbState.reporters = dbState.reporters.filter((r) => r.id !== reporterDocId);
      dbState.reporterPrivateDocs = dbState.reporterPrivateDocs.filter(
        (p) => p.reporterDocId !== reporterDocId
      );
      logAudit('Admin', 'SUPER_ADMIN', 'DELETE_REPORTER', 'REPORTER', reporterDocId, `Deleted reporter account ${reporterDocId}.`);
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true });
    }

    // =========================================================================
    // NEWS MANAGEMENT (Approve, Reject, Edit, Delete, Toggle Breaking/Featured)
    // =========================================================================
    if (action === 'UPDATE_NEWS_STATUS') {
      const { newsId, status, isBreaking, isFeatured, headline, subheadline, content, categoryId, stateId, districtId, mandalId } = payload || {};
      const article = dbState.news.find((n) => n.id === newsId);
      if (!article) {
        return NextResponse.json({ error: 'News article not found.' }, { status: 404 });
      }

      if (status) article.status = status;
      if (typeof isBreaking === 'boolean') article.isBreaking = isBreaking;
      if (typeof isFeatured === 'boolean') article.isFeatured = isFeatured;
      if (headline) article.headline = String(headline).trim();
      if (subheadline !== undefined) article.subheadline = String(subheadline).trim();
      if (content) article.content = String(content).trim();
      if (categoryId) {
        article.categoryId = categoryId;
        const cat = dbState.categories.find((c) => c.id === categoryId);
        if (cat) article.categoryName = `${cat.nameEn} (${cat.nameTe})`;
      }
      if (stateId) {
        article.stateId = stateId;
        const st = dbState.states.find((s) => s.id === stateId);
        if (st) article.stateName = st.nameEn;
      }
      if (districtId !== undefined) {
        article.districtId = districtId;
        const dt = dbState.districts.find((d) => d.id === districtId);
        article.districtName = dt?.nameEn || '';
      }
      if (mandalId !== undefined) {
        article.mandalId = mandalId;
        const mn = dbState.mandals.find((m) => m.id === mandalId);
        article.mandalName = mn?.nameEn || '';
      }

      article.updatedAt = nowIso;
      article.revisions.push({
        timestamp: nowIso,
        editorName: 'Super Admin',
        action: `Updated article [Status: ${article.status}, Breaking: ${article.isBreaking}]`,
      });

      logAudit('Admin', 'SUPER_ADMIN', 'MANAGE_NEWS', 'NEWS', article.id, `Updated news "${article.headline}" -> ${article.status}`);
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true, article });
    }

    if (action === 'DELETE_NEWS') {
      const { newsId } = payload || {};
      dbState.news = dbState.news.filter((n) => n.id !== newsId);
      logAudit('Admin', 'SUPER_ADMIN', 'DELETE_NEWS', 'NEWS', newsId, `Deleted news article ${newsId}.`);
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true });
    }

    // =========================================================================
    // ADVERTISEMENT MANAGEMENT
    // =========================================================================
    if (action === 'MANAGE_AD') {
      const { adId, status, paymentStatus, position, priceAmount, startDate, expiryDate, title } = payload || {};
      const ad = dbState.advertisements.find((a) => a.id === adId);
      if (!ad) {
        return NextResponse.json({ error: 'Advertisement not found.' }, { status: 404 });
      }

      if (status) ad.status = status;
      if (paymentStatus) ad.paymentStatus = paymentStatus;
      if (position) ad.position = position;
      if (priceAmount !== undefined) ad.priceAmount = Number(priceAmount);
      if (startDate) ad.startDate = startDate;
      if (expiryDate) ad.expiryDate = expiryDate;
      if (title) ad.title = title;

      logAudit('Admin', 'SUPER_ADMIN', 'MANAGE_ADVERTISEMENT', 'ADVERTISEMENT', ad.id, `Updated advertisement "${ad.title}" -> Status: ${ad.status}, Payment: ${ad.paymentStatus}`);
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true, advertisement: ad });
    }

    if (action === 'DELETE_AD') {
      const { adId } = payload || {};
      dbState.advertisements = dbState.advertisements.filter((a) => a.id !== adId);
      logAudit('Admin', 'SUPER_ADMIN', 'DELETE_ADVERTISEMENT', 'ADVERTISEMENT', adId, `Deleted advertisement ${adId}.`);
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true });
    }

    // =========================================================================
    // INDIA LOCATION HIERARCHY MANAGEMENT (States, Districts, Mandals)
    // =========================================================================
    if (action === 'UPSERT_STATE') {
      const { id, code, nameEn, nameTe, type, subdivisionTerm, active } = payload || {};
      const existingIdx = dbState.states.findIndex((s) => s.id === id);
      const record = {
        id: id || `st-${Date.now()}`,
        code: String(code || 'IN').toUpperCase(),
        nameEn: String(nameEn).trim(),
        nameTe: String(nameTe || nameEn).trim(),
        type: type === 'UT' ? ('UT' as const) : ('STATE' as const),
        subdivisionTerm: subdivisionTerm || 'Mandal',
        active: active !== undefined ? Boolean(active) : true,
      };
      if (existingIdx >= 0) {
        dbState.states[existingIdx] = record;
      } else {
        dbState.states.push(record);
      }
      logAudit('Admin', 'SUPER_ADMIN', 'UPSERT_STATE', 'LOCATION_STATE', record.id, `Saved state ${record.nameEn} (${record.nameTe}).`);
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true, state: record });
    }

    if (action === 'DELETE_STATE') {
      const { stateId } = payload || {};
      dbState.states = dbState.states.filter((s) => s.id !== stateId);
      logAudit('Admin', 'SUPER_ADMIN', 'DELETE_STATE', 'LOCATION_STATE', stateId, `Deleted state ${stateId}.`);
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true });
    }

    if (action === 'UPSERT_DISTRICT') {
      const { id, stateId, nameEn, nameTe, active } = payload || {};
      const existingIdx = dbState.districts.findIndex((d) => d.id === id);
      const record = {
        id: id || `dt-${Date.now()}`,
        stateId,
        nameEn: String(nameEn).trim(),
        nameTe: String(nameTe || nameEn).trim(),
        active: active !== undefined ? Boolean(active) : true,
      };
      if (existingIdx >= 0) {
        dbState.districts[existingIdx] = record;
      } else {
        dbState.districts.push(record);
      }
      logAudit('Admin', 'SUPER_ADMIN', 'UPSERT_DISTRICT', 'LOCATION_DISTRICT', record.id, `Saved district ${record.nameEn} (${record.nameTe}).`);
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true, district: record });
    }

    if (action === 'DELETE_DISTRICT') {
      const { districtId } = payload || {};
      dbState.districts = dbState.districts.filter((d) => d.id !== districtId);
      logAudit('Admin', 'SUPER_ADMIN', 'DELETE_DISTRICT', 'LOCATION_DISTRICT', districtId, `Deleted district ${districtId}.`);
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true });
    }

    if (action === 'UPSERT_MANDAL') {
      const { id, stateId, districtId, nameEn, nameTe, divisionType, active } = payload || {};
      const existingIdx = dbState.mandals.findIndex((m) => m.id === id);
      const record = {
        id: id || `mn-${Date.now()}`,
        stateId,
        districtId,
        nameEn: String(nameEn).trim(),
        nameTe: String(nameTe || nameEn).trim(),
        divisionType: divisionType || 'Mandal',
        active: active !== undefined ? Boolean(active) : true,
      };
      if (existingIdx >= 0) {
        dbState.mandals[existingIdx] = record;
      } else {
        dbState.mandals.push(record);
      }
      logAudit('Admin', 'SUPER_ADMIN', 'UPSERT_MANDAL', 'LOCATION_MANDAL', record.id, `Saved mandal ${record.nameEn} (${record.nameTe}).`);
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true, mandal: record });
    }

    if (action === 'DELETE_MANDAL') {
      const { mandalId } = payload || {};
      dbState.mandals = dbState.mandals.filter((m) => m.id !== mandalId);
      logAudit('Admin', 'SUPER_ADMIN', 'DELETE_MANDAL', 'LOCATION_MANDAL', mandalId, `Deleted mandal ${mandalId}.`);
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true });
    }

    // =========================================================================
    // CATEGORY MANAGEMENT
    // =========================================================================
    if (action === 'UPSERT_CATEGORY') {
      const { id, slug, nameEn, nameTe, order, active } = payload || {};
      const existingIdx = dbState.categories.findIndex((c) => c.id === id);
      const record = {
        id: id || `cat-${Date.now()}`,
        slug: slug || String(nameEn).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        nameEn: String(nameEn).trim(),
        nameTe: String(nameTe || nameEn).trim(),
        order: Number(order || dbState.categories.length + 1),
        active: active !== undefined ? Boolean(active) : true,
      };
      if (existingIdx >= 0) {
        dbState.categories[existingIdx] = record;
      } else {
        dbState.categories.push(record);
      }
      logAudit('Admin', 'SUPER_ADMIN', 'UPSERT_CATEGORY', 'CATEGORY', record.id, `Saved category ${record.nameEn} (${record.nameTe}).`);
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true, category: record });
    }

    if (action === 'DELETE_CATEGORY') {
      const { categoryId } = payload || {};
      dbState.categories = dbState.categories.filter((c) => c.id !== categoryId);
      logAudit('Admin', 'SUPER_ADMIN', 'DELETE_CATEGORY', 'CATEGORY', categoryId, `Deleted category ${categoryId}.`);
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true });
    }

    // =========================================================================
    // WEBSITE SETTINGS & GOOGLE ADSENSE MANAGEMENT
    // =========================================================================
    if (action === 'UPDATE_WEBSITE_SETTINGS') {
      dbState.websiteSettings = {
        ...dbState.websiteSettings,
        ...payload,
        updatedAt: nowIso,
      };
      logAudit('Admin', 'SUPER_ADMIN', 'UPDATE_WEBSITE_SETTINGS', 'SETTINGS', 'global', 'Updated global website branding, ticker, contact details, and policy pages.');
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true, websiteSettings: dbState.websiteSettings });
    }

    if (action === 'UPDATE_ADSENSE_SETTINGS') {
      dbState.adSenseSettings = {
        ...dbState.adSenseSettings,
        ...payload,
        updatedAt: nowIso,
      };
      logAudit('Admin', 'SUPER_ADMIN', 'UPDATE_ADSENSE_SETTINGS', 'ADSENSE', 'global', `Updated Google AdSense configuration [Enabled: ${dbState.adSenseSettings.enabled}].`);
      savePortalDatabase(dbState);
      return NextResponse.json({ success: true, adSenseSettings: dbState.adSenseSettings });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error('Portal API Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
