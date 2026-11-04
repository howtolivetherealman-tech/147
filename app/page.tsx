'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from '@/lib/firebase';
import {
  INITIAL_STATES,
  INITIAL_DISTRICTS,
  INITIAL_MANDALS,
  StateRecord,
  DistrictRecord,
  MandalRecord,
  getMandalsForDistrict,
} from '@/lib/india-locations';
import {
  INITIAL_CATEGORIES,
  INITIAL_WEBSITE_SETTINGS,
  INITIAL_ADSENSE_SETTINGS,
  INITIAL_NEWS,
  INITIAL_ADVERTISEMENTS,
  NewsCategoryRecord,
  NewsArticleRecord,
  AdvertisementRecord,
  WebsiteSettingsRecord,
  AdSenseSettingsRecord,
  ReporterRecord,
  ReporterPrivateDocRecord,
  NotificationRecord,
  AuditLogRecord,
  MembershipRenewalRecord,
} from '@/lib/default-data';
import { PublicReporterVerificationCard } from '@/lib/business-rules';
import { PWAInstallButton, OfflineIndicator } from '@/components/PWAInstallButton';
import { ReporterRegistrationModal } from '@/components/ReporterRegistrationModal';
import { ReporterDashboardView } from '@/components/ReporterDashboardView';
import { SuperAdminDashboardView } from '@/components/SuperAdminDashboardView';
import {
  Search,
  MapPin,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Video,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  Share2,
  Eye,
  Clock,
  Globe,
  Mail,
  X,
} from 'lucide-react';

type ActivePortalView =
  | 'home'
  | 'verify_id'
  | 'register_reporter'
  | 'login'
  | 'reporter_dashboard'
  | 'admin_dashboard'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'disclaimer';

interface ActiveSession {
  role: 'PUBLIC' | 'REPORTER' | 'SUPER_ADMIN';
  reporterDocId?: string;
  reporterId?: string;
  username?: string;
  fullName?: string;
  email?: string;
  status?: string;
}

export default function NetiBharathamPortal() {
  // Active View & Session State
  const [activeView, setActiveView] = useState<ActivePortalView>('home');
  const [session, setSession] = useState<ActiveSession>(() => {
    if (typeof window !== 'undefined') {
      const savedSessionRaw = sessionStorage.getItem('nb_portal_session');
      if (savedSessionRaw) {
        try {
          return JSON.parse(savedSessionRaw) as ActiveSession;
        } catch {
          // ignore
        }
      }
    }
    return { role: 'PUBLIC' };
  });

  // Portal Data State
  const [states, setStates] = useState<StateRecord[]>(INITIAL_STATES);
  const [districts, setDistricts] = useState<DistrictRecord[]>(INITIAL_DISTRICTS);
  const [mandals, setMandals] = useState<MandalRecord[]>(INITIAL_MANDALS);
  const [categories, setCategories] = useState<NewsCategoryRecord[]>(INITIAL_CATEGORIES);
  const [publicNews, setPublicNews] = useState<NewsArticleRecord[]>(
    INITIAL_NEWS.filter((n) => n.status === 'PUBLISHED')
  );
  const [publicAds, setPublicAds] = useState<AdvertisementRecord[]>(
    INITIAL_ADVERTISEMENTS.filter((a) => a.status === 'ACTIVE')
  );
  const [websiteSettings, setWebsiteSettings] =
    useState<WebsiteSettingsRecord>(INITIAL_WEBSITE_SETTINGS);
  const [adSenseSettings, setAdSenseSettings] =
    useState<AdSenseSettingsRecord>(INITIAL_ADSENSE_SETTINGS);

  // Authenticated Reporter Data
  const [reporterProfile, setReporterProfile] = useState<ReporterRecord | null>(null);
  const [reporterPrivateDoc, setReporterPrivateDoc] = useState<ReporterPrivateDocRecord | null>(
    null
  );
  const [myNews, setMyNews] = useState<NewsArticleRecord[]>([]);
  const [myAds, setMyAds] = useState<AdvertisementRecord[]>([]);
  const [myNotifications, setMyNotifications] = useState<NotificationRecord[]>([]);

  // Super Admin Data
  const [allReporters, setAllReporters] = useState<ReporterRecord[]>([]);
  const [allReporterPrivateDocs, setAllReporterPrivateDocs] = useState<ReporterPrivateDocRecord[]>(
    []
  );
  const [allNews, setAllNews] = useState<NewsArticleRecord[]>([]);
  const [allAds, setAllAds] = useState<AdvertisementRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [membershipRenewals, setMembershipRenewals] = useState<MembershipRenewalRecord[]>([]);

  // Location & Category Filtering State
  const [locationScopeTab, setLocationScopeTab] = useState<
    'ALL' | 'NATIONAL' | 'STATE' | 'DISTRICT' | 'MANDAL' | 'INTERNATIONAL'
  >('ALL');
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedMandalId, setSelectedMandalId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Featured Slider Index & Article Reader Modal
  const [sliderIndex, setSliderIndex] = useState(0);
  const [readingArticle, setReadingArticle] = useState<NewsArticleRecord | null>(null);

  // Live Date & Time Display
  const [liveDateTime, setLiveDateTime] = useState<string>(
    'బుధవారం, 4 నవంబర్ 2026 • Hyderabad IST'
  );

  // QR Verification Lookup State
  const [verifyInputId, setVerifyInputId] = useState('NB-TG-HYD-2026-0001');
  const [verifiedCardResult, setVerifiedCardResult] =
    useState<PublicReporterVerificationCard | null>(null);
  const [verifyError, setVerifyError] = useState('');
  const [verifyingLoading, setVerifyingLoading] = useState(false);

  // Login Form State
  const [loginMode, setLoginMode] = useState<'REPORTER' | 'ADMIN'>('REPORTER');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Fetch Portal State from Backend API
  const fetchPortalData = useCallback(
    async (overrideSession?: ActiveSession) => {
      const currentSess = overrideSession || session;
      try {
        const params = new URLSearchParams();
        params.set('role', currentSess.role);
        if (currentSess.reporterDocId) {
          params.set('reporterDocId', currentSess.reporterDocId);
        }
        const res = await fetch(`/api/portal?${params.toString()}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.states) setStates(data.states);
        if (data.districts) setDistricts(data.districts);
        if (data.mandals) setMandals(data.mandals);
        if (data.categories) setCategories(data.categories);
        if (data.news) setPublicNews(data.news);
        if (data.advertisements) setPublicAds(data.advertisements);
        if (data.websiteSettings) setWebsiteSettings(data.websiteSettings);
        if (data.adSenseSettings) setAdSenseSettings(data.adSenseSettings);

        if (currentSess.role === 'REPORTER') {
          setReporterProfile(data.reporterProfile || null);
          setReporterPrivateDoc(data.reporterPrivateDoc || null);
          setMyNews(data.myNews || []);
          setMyAds(data.myAdvertisements || []);
          setMyNotifications(data.myNotifications || []);
        } else if (currentSess.role === 'SUPER_ADMIN') {
          setAllReporters(data.allReporters || []);
          setAllReporterPrivateDocs(data.allReporterPrivateDocs || []);
          setAllNews(data.allNews || []);
          setAllAds(data.allAdvertisements || []);
          setAuditLogs(data.auditLogs || []);
          setMembershipRenewals(data.membershipRenewals || []);
        }
      } catch (err) {
        console.error('Error syncing portal data:', err);
      }
    },
    [session]
  );

  // Initial Boot: Test Firestore Connection & Load Persistent Data
  useEffect(() => {
    testFirestoreConnection();
    fetchPortalData(session);
  }, []);

  // Update Live Date & Time every 30s
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formatted = now.toLocaleString('te-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      });
      setLiveDateTime(`${formatted} IST • హైదరాబాద్ ఎడిషన్`);
    };
    updateClock();
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, []);

  // Dependent Location Options for Public Visitor Filter Bar
  const activeStates = useMemo(() => states.filter((s) => s.active), [states]);
  const filterDistricts = useMemo(
    () =>
      selectedStateId
        ? districts.filter((d) => d.stateId === selectedStateId && d.active)
        : [],
    [districts, selectedStateId]
  );
  const filterMandals = useMemo(
    () =>
      selectedDistrictId
        ? getMandalsForDistrict(selectedDistrictId, mandals, districts, states)
        : [],
    [selectedDistrictId, mandals, districts, states]
  );

  // Filtered Published News Stream
  const filteredNews = useMemo(() => {
    return publicNews.filter((item) => {
      if (locationScopeTab === 'NATIONAL' && item.scope !== 'NATIONAL' && item.categoryId !== 'cat-national') {
        return false;
      }
      if (locationScopeTab === 'INTERNATIONAL' && item.scope !== 'INTERNATIONAL' && item.categoryId !== 'cat-international') {
        return false;
      }
      if (selectedStateId && item.stateId !== selectedStateId) {
        return false;
      }
      if (selectedDistrictId && item.districtId !== selectedDistrictId) {
        return false;
      }
      if (selectedMandalId && item.mandalId !== selectedMandalId) {
        return false;
      }
      if (selectedCategoryId !== 'ALL' && item.categoryId !== selectedCategoryId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchHeadline = item.headline.toLowerCase().includes(q);
        const matchSub = item.subheadline.toLowerCase().includes(q);
        const matchContent = item.content.toLowerCase().includes(q);
        const matchCat = item.categoryName.toLowerCase().includes(q);
        const matchState = item.stateName.toLowerCase().includes(q);
        const matchDist = item.districtName.toLowerCase().includes(q);
        const matchMandal = item.mandalName.toLowerCase().includes(q);
        const matchReporter = item.reporterId.toLowerCase().includes(q);
        if (
          !matchHeadline &&
          !matchSub &&
          !matchContent &&
          !matchCat &&
          !matchState &&
          !matchDist &&
          !matchMandal &&
          !matchReporter
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    publicNews,
    locationScopeTab,
    selectedStateId,
    selectedDistrictId,
    selectedMandalId,
    selectedCategoryId,
    searchQuery,
  ]);

  const featuredNewsList = useMemo(() => {
    const feat = publicNews.filter((n) => n.isFeatured || n.isBreaking);
    return feat.length > 0 ? feat : publicNews.slice(0, 3);
  }, [publicNews]);

  const currentFeatured = featuredNewsList[sliderIndex % Math.max(1, featuredNewsList.length)];

  const trendingNewsList = useMemo(
    () => publicNews.filter((n) => n.isTrending || n.isBreaking).slice(0, 5),
    [publicNews]
  );

  const mostReadNewsList = useMemo(
    () =>
      publicNews
        .slice()
        .sort((a, b) => b.views - a.views)
        .slice(0, 5),
    [publicNews]
  );

  // QR Verification Lookup Handler
  const handleVerifyReporterId = useCallback(
    async (targetId?: string) => {
      const idToLookup = (targetId ?? verifyInputId).trim();
      if (!idToLookup) return;
      setVerifyingLoading(true);
      setVerifyError('');
      setVerifiedCardResult(null);

      try {
        const res = await fetch(
          `/api/portal?mode=verify_qr&verifyId=${encodeURIComponent(idToLookup)}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (!res.ok || !data.found) {
          setVerifyError(
            data.error || `No accredited Press Reporter found with ID "${idToLookup}".`
          );
        } else {
          setVerifiedCardResult(data.card);
        }
      } catch (err) {
        setVerifyError(err instanceof Error ? err.message : 'Verification lookup failed.');
      } finally {
        setVerifyingLoading(false);
      }
    },
    [verifyInputId]
  );

  const openPublicVerificationForId = (repId: string) => {
    setVerifyInputId(repId);
    setActiveView('verify_id');
    handleVerifyReporterId(repId);
  };

  // Login Handler (Reporter & Super Admin)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const action = loginMode === 'ADMIN' ? 'ADMIN_LOGIN' : 'REPORTER_LOGIN';
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          payload: {
            username: loginUsername,
            password: loginPassword,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setLoginError(data.error || 'Authentication failed.');
        setLoginLoading(false);
        return;
      }

      const newSession: ActiveSession = data.session;
      setSession(newSession);
      sessionStorage.setItem('nb_portal_session', JSON.stringify(newSession));
      await fetchPortalData(newSession);
      setLoginLoading(false);
      setLoginPassword('');
      setActiveView(
        newSession.role === 'SUPER_ADMIN' ? 'admin_dashboard' : 'reporter_dashboard'
      );
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login error.');
      setLoginLoading(false);
    }
  };

  const handleGoogleAdminSignIn = async () => {
    setLoginError('');
    setLoginLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const email = cred.user.email || '';
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADMIN_GOOGLE_SYNC',
          payload: { email },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setLoginError(data.error || 'Google account is not authorized as Super Admin.');
        setLoginLoading(false);
        return;
      }
      const newSession: ActiveSession = data.session;
      setSession(newSession);
      sessionStorage.setItem('nb_portal_session', JSON.stringify(newSession));
      await fetchPortalData(newSession);
      setLoginLoading(false);
      setActiveView('admin_dashboard');
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : 'Google Sign-In popup closed or unavailable.'
      );
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    const publicSess: ActiveSession = { role: 'PUBLIC' };
    setSession(publicSess);
    sessionStorage.removeItem('nb_portal_session');
    fetchPortalData(publicSess);
    setActiveView('home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <OfflineIndicator />

      {/* =====================================================================
          1. STRICT 3-ZONE TOP BAR CONTRACT (Brand — 5 Nav Links — Primary CTA)
         ===================================================================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single Brand Wordmark + Official Logos */}
          <button
            type="button"
            onClick={() => {
              setSelectedStateId('');
              setSelectedDistrictId('');
              setSelectedMandalId('');
              setSelectedCategoryId('ALL');
              setLocationScopeTab('ALL');
              setActiveView('home');
            }}
            className="flex items-center gap-2.5 text-lg sm:text-xl font-black tracking-tight text-red-700 whitespace-nowrap shrink-0 text-left"
          >
            <img
              src={
                websiteSettings.logoUrl ||
                '/assets/aistudio/Gemini_Generated_Image_ei76ftei76ftei76_1e454e87.png'
              }
              alt={websiteSettings.siteNameEn}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-lg object-contain bg-slate-950 border border-slate-300 p-0.5 shrink-0"
            />
            {websiteSettings.secondaryLogoUrl && (
              <img
                src={websiteSettings.secondaryLogoUrl}
                alt="Channel Emblem"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-contain bg-white border border-amber-400 p-0.5 shrink-0"
              />
            )}
            <span>
              {websiteSettings.siteNameEn} · {websiteSettings.siteNameTe}
            </span>
          </button>

          {/* Zone 2: 5 Concise Single-Line Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700"
            aria-label="Primary Navigation"
          >
            <button
              type="button"
              onClick={() => {
                setLocationScopeTab('ALL');
                setActiveView('home');
              }}
              className={`hover:text-red-700 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'home' && locationScopeTab === 'ALL'
                  ? 'text-red-700 underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              ముఖచిత్రం (Home)
            </button>
            <button
              type="button"
              onClick={() => {
                setLocationScopeTab('STATE');
                setSelectedStateId('st-tg');
                setActiveView('home');
              }}
              className={`hover:text-red-700 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'home' && locationScopeTab === 'STATE'
                  ? 'text-red-700 underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              రాష్ట్ర &amp; జిల్లా వార్తలు
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('verify_id');
                handleVerifyReporterId('NB-TG-HYD-2026-0001');
              }}
              className={`hover:text-red-700 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'verify_id'
                  ? 'text-red-700 underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Verify Press ID
            </button>
            <button
              type="button"
              onClick={() => setActiveView('register_reporter')}
              className={`hover:text-red-700 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'register_reporter'
                  ? 'text-red-700 underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Reporter Registration
            </button>
            <button
              type="button"
              onClick={() => setActiveView('contact')}
              className={`hover:text-red-700 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'contact'
                  ? 'text-red-700 underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Contact Desk
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            {session.role === 'SUPER_ADMIN' ? (
              <button
                type="button"
                onClick={() => setActiveView('admin_dashboard')}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Super Admin Console
              </button>
            ) : session.role === 'REPORTER' ? (
              <button
                type="button"
                onClick={() => setActiveView('reporter_dashboard')}
                className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Reporter Dashboard ({session.username})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveView('login')}
                className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Reporter / Admin Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. BROADCAST UTILITY RIBBON & RED BREAKING NEWS TICKER
         ===================================================================== */}
      <div className="bg-slate-950 text-slate-200 border-b border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-white">{liveDateTime}</span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-slate-300">{websiteSettings.location}</span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="font-mono text-slate-300">{websiteSettings.contactEmail}</span>
          </div>

          <div className="flex items-center gap-3">
            <PWAInstallButton />
            {session.role === 'PUBLIC' && (
              <button
                type="button"
                onClick={() => setActiveView('register_reporter')}
                className="text-xs font-bold text-red-400 hover:text-red-300 underline whitespace-nowrap"
              >
                Apply for Press ID Card →
              </button>
            )}
          </div>
        </div>

        {/* RED BREAKING NEWS SCROLLING TICKER */}
        <div className="bg-red-700 text-white border-t border-red-800 overflow-hidden flex items-center">
          <div className="bg-slate-950 text-white px-4 py-2 font-black text-xs tracking-wider uppercase shrink-0 z-10 border-r border-red-600">
            BREAKING NEWS • బ్రేకింగ్ న్యూస్
          </div>
          <div className="overflow-hidden whitespace-nowrap py-2 flex-1">
            <div className="animate-breaking-ticker text-xs sm:text-sm font-bold tracking-wide">
              <span className="mx-6">{websiteSettings.breakingTickerText}</span>
              <span className="mx-6">{websiteSettings.breakingTickerText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. VIEW ROUTER: HOME / VERIFY ID / REGISTER / LOGIN / DASHBOARDS / PAGES
         ===================================================================== */}
      <main className="flex-1">
        {/* VIEW A: REPORTER REGISTRATION */}
        {activeView === 'register_reporter' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <ReporterRegistrationModal
              states={states}
              districts={districts}
              mandals={mandals}
              onClose={() => setActiveView('home')}
              onSuccess={async (newSess) => {
                setSession(newSess);
                sessionStorage.setItem('nb_portal_session', JSON.stringify(newSess));
                await fetchPortalData(newSess);
                setActiveView('reporter_dashboard');
              }}
            />
          </div>
        )}

        {/* VIEW B: REPORTER DASHBOARD */}
        {activeView === 'reporter_dashboard' && reporterProfile && (
          <ReporterDashboardView
            reporter={reporterProfile}
            privateDoc={reporterPrivateDoc}
            myNews={myNews}
            myAds={myAds}
            myNotifications={myNotifications}
            states={states}
            districts={districts}
            mandals={mandals}
            categories={categories}
            websiteSettings={websiteSettings}
            onRefresh={() => fetchPortalData(session)}
            onLogout={handleLogout}
            onOpenPublicVerify={openPublicVerificationForId}
          />
        )}

        {/* VIEW C: SUPER ADMIN DASHBOARD */}
        {activeView === 'admin_dashboard' && session.role === 'SUPER_ADMIN' && (
          <SuperAdminDashboardView
            states={states}
            districts={districts}
            mandals={mandals}
            categories={categories}
            allReporters={allReporters}
            allReporterPrivateDocs={allReporterPrivateDocs}
            allNews={allNews}
            allAdvertisements={allAds}
            websiteSettings={websiteSettings}
            adSenseSettings={adSenseSettings}
            auditLogs={auditLogs}
            membershipRenewals={membershipRenewals}
            onRefresh={() => fetchPortalData(session)}
            onLogout={handleLogout}
            onOpenPublicVerify={openPublicVerificationForId}
          />
        )}

        {/* VIEW D: PUBLIC REPORTER ID QR VERIFICATION */}
        {activeView === 'verify_id' && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b-4 border-red-700">
                <div>
                  <h1 className="text-lg font-extrabold tracking-wide">
                    ONLINE PRESS REPORTER ID &amp; QR VERIFICATION
                  </h1>
                  <p className="text-xs text-slate-300 mt-1">
                    నేటి భారతం ప్రెస్ రిపోర్టర్ అధికారిక గుర్తింపు కార్డు ఆన్‌లైన్ ధృవీకరణ
                  </p>
                </div>
                <ShieldCheck className="w-8 h-8 text-red-500 shrink-0" />
              </div>

              <div className="p-6 space-y-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleVerifyReporterId();
                  }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="text"
                    required
                    value={verifyInputId}
                    onChange={(e) => setVerifyInputId(e.target.value)}
                    placeholder="Enter Unique Reporter ID (e.g., NB-TG-HYD-2026-0001)"
                    aria-label="Enter Unique Reporter ID"
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-md font-mono text-sm focus:outline-none focus:border-red-700"
                  />
                  <button
                    type="submit"
                    disabled={verifyingLoading}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-md whitespace-nowrap"
                  >
                    {verifyingLoading ? 'Verifying...' : 'Verify Reporter ID'}
                  </button>
                </form>

                {/* Quick sample IDs to test Active vs Expired QR records */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Quick Verify Registry IDs:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyInputId('NB-TG-HYD-2026-0001');
                      handleVerifyReporterId('NB-TG-HYD-2026-0001');
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-mono text-slate-900"
                  >
                    NB-TG-HYD-2026-0001 (Active)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyInputId('NB-AP-VSP-2026-0002');
                      handleVerifyReporterId('NB-AP-VSP-2026-0002');
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-mono text-slate-900"
                  >
                    NB-AP-VSP-2026-0002 (Active)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyInputId('NB-TG-KNR-2026-0003');
                      handleVerifyReporterId('NB-TG-KNR-2026-0003');
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-mono text-red-700"
                  >
                    NB-TG-KNR-2026-0003 (Expired)
                  </button>
                </div>

                {verifyError && (
                  <div
                    role="alert"
                    className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs font-semibold"
                  >
                    {verifyError}
                  </div>
                )}

                {verifiedCardResult && (
                  <div className="border border-slate-200 rounded-xl p-6 space-y-5 bg-slate-50/50">
                    <div
                      className={`p-4 rounded-lg border flex items-center justify-between ${
                        verifiedCardResult.status === 'ACTIVE'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : 'bg-red-50 border-red-200 text-red-950'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {verifiedCardResult.status === 'ACTIVE' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
                        )}
                        <div>
                          <div className="text-sm font-extrabold">
                            STATUS: {verifiedCardResult.status}
                          </div>
                          <div className="text-xs">
                            {verifiedCardResult.status === 'ACTIVE'
                              ? 'Verified Accredited Press Reporter for NETI BHARATHAM'
                              : '6-Month Validity Expired — Requires Super Admin Renewal'}
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/verify/${encodeURIComponent(verifiedCardResult.reporterId)}`}
                        className="text-xs font-mono font-bold underline flex items-center gap-1"
                      >
                        <span>Direct QR URL</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pb-4 border-b border-slate-200">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <img
                          src={verifiedCardResult.photoUrl || websiteSettings.logoUrl || '/icon.svg'}
                          alt={verifiedCardResult.fullName}
                          referrerPolicy="no-referrer"
                          className="w-20 h-24 rounded-lg border-2 border-red-700 object-cover bg-white"
                        />
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-red-700">
                            {verifiedCardResult.designation}
                          </div>
                          <h2 className="text-xl font-extrabold text-slate-900">
                            {verifiedCardResult.fullName}
                          </h2>
                          <div className="text-xs font-mono font-bold text-slate-700 mt-0.5">
                            ID: {verifiedCardResult.reporterId}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <img
                          src={
                            websiteSettings.logoUrl ||
                            '/assets/aistudio/Gemini_Generated_Image_ei76ftei76ftei76_1e454e87.png'
                          }
                          alt="NETI BHARATHAM Logo"
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-contain bg-slate-950 p-0.5 border border-slate-300"
                        />
                        {websiteSettings.secondaryLogoUrl && (
                          <img
                            src={websiteSettings.secondaryLogoUrl}
                            alt="Channel Emblem"
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-contain bg-white p-0.5 border border-amber-400"
                          />
                        )}
                      </div>
                    </div>

                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-white rounded border border-slate-200">
                        <dt className="text-slate-500">State (రాష్ట్రం)</dt>
                        <dd className="font-bold text-slate-900 mt-0.5">
                          {verifiedCardResult.stateName}
                        </dd>
                      </div>
                      <div className="p-3 bg-white rounded border border-slate-200">
                        <dt className="text-slate-500">District (జిల్లా)</dt>
                        <dd className="font-bold text-slate-900 mt-0.5">
                          {verifiedCardResult.districtName}
                        </dd>
                      </div>
                      <div className="p-3 bg-white rounded border border-slate-200">
                        <dt className="text-slate-500">Mandal (మండలం)</dt>
                        <dd className="font-bold text-slate-900 mt-0.5">
                          {verifiedCardResult.mandalName}
                        </dd>
                      </div>
                      <div className="p-3 bg-white rounded border border-slate-200">
                        <dt className="text-slate-500">Mobile Number</dt>
                        <dd className="font-mono font-bold text-slate-900 mt-0.5 tabular-nums">
                          {verifiedCardResult.mobile}
                        </dd>
                      </div>
                      <div className="p-3 bg-white rounded border border-slate-200">
                        <dt className="text-slate-500">Date of Issue</dt>
                        <dd className="font-mono font-bold text-slate-900 mt-0.5 tabular-nums">
                          {verifiedCardResult.issuedAt}
                        </dd>
                      </div>
                      <div className="p-3 bg-white rounded border border-slate-200">
                        <dt className="text-slate-500">Expiry Date (6 Months)</dt>
                        <dd className="font-mono font-bold text-slate-900 mt-0.5 tabular-nums">
                          {verifiedCardResult.expiresAt}
                        </dd>
                      </div>
                    </dl>

                    <div className="p-3 bg-slate-100 rounded border border-slate-200 flex items-center gap-2 text-xs text-slate-600">
                      <Lock className="w-4 h-4 text-slate-700 shrink-0" />
                      <span>
                        Public Verification Privacy Guarantee: Aadhaar documents, passwords, and residential addresses are strictly isolated and never exposed on public verification pages.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW E: SECURE REPORTER & SUPER ADMIN LOGIN */}
        {activeView === 'login' && (
          <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-5 border-b-4 border-red-700">
                <h1 className="text-lg font-extrabold">
                  NETI BHARATHAM – SECURE PORTAL LOGIN
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sign in as an Accredited Press Reporter or Super Admin
                </p>
              </div>

              <div className="p-6 space-y-5">
                {/* Role Switch Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('REPORTER');
                      setLoginError('');
                    }}
                    className={`py-2 text-xs font-bold rounded-md transition-colors ${
                      loginMode === 'REPORTER'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Reporter Login (రిపోర్టర్)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('ADMIN');
                      setLoginError('');
                    }}
                    className={`py-2 text-xs font-bold rounded-md transition-colors ${
                      loginMode === 'ADMIN'
                        ? 'bg-red-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Super Admin Login
                  </button>
                </div>

                {loginError && (
                  <div
                    role="alert"
                    className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs font-semibold"
                  >
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {loginMode === 'ADMIN'
                        ? 'Admin Username'
                        : 'Reporter Username / Reporter ID / Mobile'}
                    </label>
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder={loginMode === 'ADMIN' ? 'chakri' : 'venkat_hyd'}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:border-red-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-red-700"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-2.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-md flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>
                      {loginLoading
                        ? 'Authenticating...'
                        : loginMode === 'ADMIN'
                        ? 'Sign In to Super Admin Console'
                        : 'Sign In to Reporter Dashboard'}
                    </span>
                  </button>
                </form>

                {loginMode === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={handleGoogleAdminSignIn}
                    className="w-full py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md"
                  >
                    Sign In with Google (Authorized Super Admin)
                  </button>
                )}

                {/* Quick Role Credential Fillers for Verification */}
                <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-700">
                    Quick Role Test Autofill (Verify All 3 Roles):
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMode('ADMIN');
                        setLoginUsername('chakri');
                        setLoginPassword('1977');
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded font-semibold text-left"
                    >
                      1. Super Admin (chakri)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMode('REPORTER');
                        setLoginUsername('venkat_hyd');
                        setLoginPassword('Reporter@2026');
                      }}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded font-semibold text-left"
                    >
                      2. Approved Reporter
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMode('REPORTER');
                        setLoginUsername('suresh_wgl');
                        setLoginPassword('Reporter@2026');
                      }}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded font-semibold text-left"
                    >
                      3. Pending Reporter
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMode('REPORTER');
                        setLoginUsername('raju_knr');
                        setLoginPassword('Reporter@2026');
                      }}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-900 rounded font-semibold text-left"
                    >
                      4. Expired Reporter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW F: INSTITUTIONAL & POLICY PAGES */}
        {(['about', 'contact', 'privacy', 'terms', 'disclaimer'] as const).includes(
          activeView as any
        ) && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
              <h1 className="text-2xl font-extrabold text-slate-900 pb-3 border-b border-slate-200">
                {activeView === 'about' && 'About NETI BHARATHAM (మా గురించి)'}
                {activeView === 'contact' && 'Contact Us (సంప్రదించండి)'}
                {activeView === 'privacy' && 'Privacy Policy (గోప్యతా విధానం)'}
                {activeView === 'terms' && 'Terms & Conditions (నిబంధనలు)'}
                {activeView === 'disclaimer' && 'Editorial Disclaimer (నిరాకరణ)'}
              </h1>

              <div className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {activeView === 'about' && websiteSettings.aboutUsContent}
                {activeView === 'contact' && websiteSettings.contactUsContent}
                {activeView === 'privacy' && websiteSettings.privacyPolicyContent}
                {activeView === 'terms' && websiteSettings.termsContent}
                {activeView === 'disclaimer' && websiteSettings.disclaimerContent}
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs text-slate-700">
                <div className="font-bold text-slate-900 text-sm">
                  Official Publication Details
                </div>
                <div>
                  <strong>Brand Name:</strong> {websiteSettings.siteNameEn} (
                  {websiteSettings.siteNameTe})
                </div>
                <div>
                  <strong>Official Domain:</strong> {websiteSettings.domain}
                </div>
                <div>
                  <strong>Contact Email:</strong> {websiteSettings.contactEmail}
                </div>
                <div>
                  <strong>Location:</strong> {websiteSettings.location}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW G: PUBLIC FRONT PAGE (TELUGU DIGITAL NEWS PORTAL)
           ===================================================================== */}
        {activeView === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
            {/* 0. ADMIN-CONFIGURABLE WEBSITE TOP BANNER IMAGE */}
            {websiteSettings.bannerEnabled && websiteSettings.bannerImageUrl && (
              <section
                aria-label="Official Portal Banner"
                className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 shadow-xs relative"
              >
                {websiteSettings.bannerLinkUrl ? (
                  <a
                    href={websiteSettings.bannerLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative group"
                  >
                    <img
                      src={websiteSettings.bannerImageUrl}
                      alt={websiteSettings.bannerTitle || websiteSettings.siteNameEn}
                      referrerPolicy="no-referrer"
                      className="w-full max-h-[260px] sm:max-h-[320px] object-cover"
                    />
                    {websiteSettings.bannerTitle && (
                      <div className="bg-slate-950/90 text-white px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-between gap-3">
                        <span>{websiteSettings.bannerTitle}</span>
                        <ExternalLink className="w-4 h-4 text-red-400 shrink-0" />
                      </div>
                    )}
                  </a>
                ) : (
                  <div className="relative">
                    <img
                      src={websiteSettings.bannerImageUrl}
                      alt={websiteSettings.bannerTitle || websiteSettings.siteNameEn}
                      referrerPolicy="no-referrer"
                      className="w-full max-h-[260px] sm:max-h-[320px] object-cover"
                    />
                    {websiteSettings.bannerTitle && (
                      <div className="bg-slate-950/90 text-white px-4 py-2.5 text-xs sm:text-sm font-bold">
                        {websiteSettings.bannerTitle}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* 1. INDIA HIERARCHICAL LOCATION FILTER & SEARCH ENGINE */}
            <section
              aria-label="India News Location Hierarchy and Search"
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                {/* Public News Scope Tabs: National / State / District / Mandal */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'ALL', label: 'All News (అన్ని వార్తలు)' },
                      { id: 'NATIONAL', label: 'India / National (జాతీయ)' },
                      { id: 'STATE', label: 'State-wise (రాష్ట్రం)' },
                      { id: 'DISTRICT', label: 'District-wise (జిల్లా)' },
                      { id: 'MANDAL', label: 'Mandal-wise (మండలం)' },
                      { id: 'INTERNATIONAL', label: 'International (అంతర్జాతీయ)' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setLocationScopeTab(tab.id);
                        if (tab.id === 'ALL' || tab.id === 'NATIONAL' || tab.id === 'INTERNATIONAL') {
                          setSelectedStateId('');
                          setSelectedDistrictId('');
                          setSelectedMandalId('');
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        locationScopeTab === tab.id
                          ? 'bg-red-700 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Input across Headline, Content, Category, Location, Reporter ID */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search news, mandal, district, Reporter ID..."
                    aria-label="Search news by headline, content, location, or Reporter ID"
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-red-700"
                  />
                </div>
              </div>

              {/* Dependent Dropdowns: Country (India) → State/UT → District → Mandal/Tehsil/Taluk */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    1. State / UT (రాష్ట్రం ఎంచుకోండి)
                  </label>
                  <select
                    aria-label="Select State"
                    value={selectedStateId}
                    onChange={(e) => {
                      setSelectedStateId(e.target.value);
                      setSelectedDistrictId('');
                      setSelectedMandalId('');
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium"
                  >
                    <option value="">All 36 Indian States &amp; UTs (భారత్ అంతటా)</option>
                    {activeStates.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.nameEn} ({st.nameTe})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    2. District (జిల్లా ఎంచుకోండి)
                  </label>
                  <select
                    aria-label="Select District"
                    value={selectedDistrictId}
                    disabled={!selectedStateId}
                    onChange={(e) => {
                      setSelectedDistrictId(e.target.value);
                      setSelectedMandalId('');
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">
                      {selectedStateId ? 'All Districts in State' : 'Select a State First'}
                    </option>
                    {filterDistricts.map((dt) => (
                      <option key={dt.id} value={dt.id}>
                        {dt.nameEn} ({dt.nameTe})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    3. Mandal / Tehsil / Taluk (మండలం)
                  </label>
                  <select
                    aria-label="Select Mandal"
                    value={selectedMandalId}
                    disabled={!selectedDistrictId}
                    onChange={(e) => setSelectedMandalId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">
                      {selectedDistrictId ? 'All Mandals in District' : 'Select a District First'}
                    </option>
                    {filterMandals.map((mn) => (
                      <option key={mn.id} value={mn.id}>
                        {mn.nameEn} ({mn.nameTe})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStateId('');
                      setSelectedDistrictId('');
                      setSelectedMandalId('');
                      setSelectedCategoryId('ALL');
                      setLocationScopeTab('ALL');
                      setSearchQuery('');
                    }}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md"
                  >
                    Reset Location Filters
                  </button>
                </div>
              </div>

              {/* Category Filter Strip (All 29 Categories) */}
              <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('ALL')}
                  className={`px-3 py-1 text-xs font-bold rounded transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategoryId === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  అన్ని విభాగాలు (All Categories)
                </button>
                {categories
                  .filter((c) => c.active)
                  .sort((a, b) => a.order - b.order)
                  .map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                        selectedCategoryId === cat.id
                          ? 'bg-red-700 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.nameTe} ({cat.nameEn})
                    </button>
                  ))}
              </div>
            </section>

            {/* 2. TIER 1: MAIN FEATURED NEWS SLIDER & BREAKING SPOTLIGHT */}
            {currentFeatured && !selectedStateId && !searchQuery && selectedCategoryId === 'ALL' && (
              <section
                aria-label="Featured Lead News Slider"
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
              >
                {/* Dominant Lead Slider (8 Columns) */}
                <div className="lg:col-span-8 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex flex-col justify-end min-h-[380px] sm:min-h-[430px]">
                  <img
                    src={currentFeatured.featuredImage || '/images/hero-secretariat.svg'}
                    alt={currentFeatured.headline}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent" />

                  <div className="relative z-10 p-6 sm:p-8 text-white space-y-3">
                    {/* Unboxed Metadata Kicker */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-red-400">
                      <span>{currentFeatured.categoryName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-200">
                        {[
                          currentFeatured.mandalName,
                          currentFeatured.districtName,
                          currentFeatured.stateName,
                        ]
                          .filter(Boolean)
                          .join(' / ')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-300">
                        Reporter ID: {currentFeatured.reporterId}
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-3xl font-extrabold leading-tight text-white">
                      <Link
                        href={`/news/${currentFeatured.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-left hover:underline block"
                      >
                        {currentFeatured.headline}
                      </Link>
                    </h1>

                    {currentFeatured.subheadline && (
                      <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 max-w-2xl">
                        {currentFeatured.subheadline}
                      </p>
                    )}

                    <div className="pt-2 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/news/${currentFeatured.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-md inline-flex items-center gap-1.5"
                        >
                          <span>పూర్తిగా చదవండి (Read Full Story)</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setSliderIndex((prev) =>
                              prev === 0 ? featuredNewsList.length - 1 : prev - 1
                            )
                          }
                          aria-label="Previous Featured Story"
                          className="p-2 rounded bg-white/15 hover:bg-white/25 text-white"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSliderIndex((prev) => (prev + 1) % featuredNewsList.length)
                          }
                          aria-label="Next Featured Story"
                          className="p-2 rounded bg-white/15 hover:bg-white/25 text-white"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Secondary Stories Column (4 Columns) */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
                  <div className="pb-2.5 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-sm font-extrabold uppercase tracking-wider text-red-700">
                      ముఖ్య వార్తలు • Top Headlines
                    </h2>
                    <span className="text-xs font-mono text-slate-500 tabular-nums">
                      {publicNews.length} Stories
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200 flex-1">
                    {publicNews.slice(0, 4).map((item) => (
                      <article key={item.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-semibold text-red-700">
                            {item.districtName || item.stateName}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.mandalName || item.categoryName}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 hover:text-red-700 leading-snug">
                          <Link
                            href={`/news/${item.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-left block"
                          >
                            {item.headline}
                          </Link>
                        </h3>
                      </article>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setVerifyInputId('NB-TG-HYD-2026-0001');
                      setActiveView('verify_id');
                      handleVerifyReporterId('NB-TG-HYD-2026-0001');
                    }}
                    className="w-full py-2.5 px-3 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-red-700" />
                      <span>Verify Press Reporter QR Card</span>
                    </span>
                    <span>→</span>
                  </button>
                </div>
              </section>
            )}

            {/* 3. TIER 2: LATEST NEWS STREAM (8 COLS) + TRENDING / MOST READ / ADS SIDEBAR (4 COLS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 8 Columns: Filtered / Latest News Cards */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      తాజా వార్తలు • Latest Verified News ({filteredNews.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Real-time articles filtered by India State, District, Mandal &amp; Category
                    </p>
                  </div>
                </div>

                {filteredNews.length === 0 ? (
                  <div className="p-10 border border-slate-200 rounded-xl text-center space-y-3 bg-slate-50">
                    <p className="text-base font-bold text-slate-800">
                      ఈ ప్రాంతం / విభాగంలో ప్రస్తుతం వార్తలు లేవు (No news articles match the current filter)
                    </p>
                    <p className="text-xs text-slate-600">
                      Try clearing the Mandal/District filter or upload a new report via the Reporter Dashboard.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStateId('');
                        setSelectedDistrictId('');
                        setSelectedMandalId('');
                        setSelectedCategoryId('ALL');
                        setLocationScopeTab('ALL');
                        setSearchQuery('');
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-red-700 rounded-md"
                    >
                      Show All India News
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {filteredNews.map((article) => (
                      <article
                        key={article.id}
                        className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-slate-300 transition-colors flex flex-col justify-between"
                      >
                        <div>
                          <Link
                            href={`/news/${article.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-[16/9] bg-slate-900 overflow-hidden block"
                          >
                            <img
                              src={article.featuredImage || '/images/hero-secretariat.svg'}
                              alt={article.headline}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </Link>

                          <div className="p-4 space-y-2">
                            {/* Clean Unboxed Metadata (Zero Static Pill Enclosures) */}
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                              <span className="font-bold text-red-700">{article.categoryName}</span>
                              <span aria-hidden="true">·</span>
                              <span>{article.stateName}</span>
                              {article.districtName && (
                                <>
                                  <span aria-hidden="true">/</span>
                                  <span>{article.districtName}</span>
                                </>
                              )}
                              {article.mandalName && (
                                <>
                                  <span aria-hidden="true">/</span>
                                  <span>{article.mandalName}</span>
                                </>
                              )}
                            </div>

                            <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                              <Link
                                href={`/news/${article.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-left hover:text-red-700 transition-colors block"
                              >
                                {article.headline}
                              </Link>
                            </h3>

                            {article.subheadline && (
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                {article.subheadline}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-mono">By {article.reporterId}</span>
                          <Link
                            href={`/news/${article.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-700 hover:bg-red-800 text-white font-bold transition-colors"
                          >
                            <span>పూర్తిగా చదవండి</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {/* VIDEO NEWS BULLETIN SECTION */}
                <section className="pt-6 border-t border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Video className="w-4 h-4 text-red-700" />
                      <span>వీడియో వార్తలు • Video News Bulletins</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {publicNews.slice(0, 2).map((vItem) => (
                      <div
                        key={`vid-${vItem.id}`}
                        className="p-4 border border-slate-200 rounded-xl bg-slate-950 text-white space-y-2"
                      >
                        <div className="text-xs text-red-400 font-bold">
                          NETI BHARATHAM VIDEO DESK • {vItem.districtName || vItem.stateName}
                        </div>
                        <h3 className="text-sm font-bold leading-snug">{vItem.headline}</h3>
                        <Link
                          href={`/news/${vItem.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-slate-300 hover:text-white underline inline-flex items-center gap-1"
                        >
                          <span>పూర్తిగా చదవండి • Watch Bulletin &amp; Full Story</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right 4 Columns: Trending, Most Read, Private Advertisements & AdSense */}
              <aside className="lg:col-span-4 space-y-6">
                {/* Trending News */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-red-700 pb-2.5 border-b border-slate-200">
                    ట్రెండింగ్ వార్తలు • Trending Now
                  </h2>
                  <ol className="divide-y divide-slate-100 text-xs">
                    {trendingNewsList.map((item, idx) => (
                      <li key={item.id} className="py-2.5 flex items-start gap-3">
                        <span className="font-mono font-extrabold text-slate-400 text-sm tabular-nums">
                          0{idx + 1}
                        </span>
                        <Link
                          href={`/news/${item.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-left font-bold text-slate-900 hover:text-red-700 leading-snug block"
                        >
                          {item.headline}
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Most Read News */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 pb-2.5 border-b border-slate-200">
                    అత్యధికంగా చదివినవి • Most Read
                  </h2>
                  <div className="divide-y divide-slate-100 text-xs">
                    {mostReadNewsList.map((item) => (
                      <div key={item.id} className="py-2.5 space-y-1">
                        <Link
                          href={`/news/${item.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-left font-bold text-slate-900 hover:text-red-700 leading-snug block"
                        >
                          {item.headline}
                        </Link>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {item.views.toLocaleString()} views · {item.districtName || item.stateName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Approved Private Advertisements Showcase */}
                {publicAds.length > 0 && (
                  <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-4">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      Sponsored • ప్రైవేట్ ప్రకటనలు
                    </div>
                    {publicAds.map((ad) => (
                      <div
                        key={ad.id}
                        className="bg-white border border-slate-200 rounded-lg p-4 space-y-2.5"
                      >
                        <div className="grid grid-cols-1 gap-2">
                          <img
                            src={ad.image1 || '/images/news-agriculture.svg'}
                            alt={ad.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-32 object-cover rounded"
                          />
                          {ad.image2 && (
                            <img
                              src={ad.image2}
                              alt={`${ad.title} secondary`}
                              referrerPolicy="no-referrer"
                              className="w-full h-24 object-cover rounded"
                            />
                          )}
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-900">{ad.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{ad.description}</p>
                        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                          <span className="font-bold text-slate-800">{ad.businessName}</span>
                          <span className="font-mono">{ad.contactNumber}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Google AdSense Placement (Displayed ONLY if enabled & configured by Super Admin) */}
                {adSenseSettings.enabled && adSenseSettings.adClientId && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 text-center space-y-1 text-xs text-slate-500">
                    <div className="font-mono text-[10px] uppercase">
                      Google AdSense • {adSenseSettings.adClientId}
                    </div>
                    <div className="py-6 bg-white border border-dashed border-slate-300 rounded">
                      Slot ID: {adSenseSettings.sidebarSlotId || adSenseSettings.homepageSlotId}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
          4. INLINE FULL ARTICLE READER MODAL
         ===================================================================== */}
      {readingArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-red-700">
                <span>{readingArticle.categoryName}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {[
                    readingArticle.mandalName,
                    readingArticle.districtName,
                    readingArticle.stateName,
                  ]
                    .filter(Boolean)
                    .join(' / ')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReadingArticle(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
                aria-label="Close article reader"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 leading-snug">
              {readingArticle.headline}
            </h2>
            {readingArticle.subheadline && (
              <p className="text-sm font-medium text-slate-600">{readingArticle.subheadline}</p>
            )}

            <div className="py-2.5 border-y border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <div>
                Reporter: <strong>{readingArticle.reporterName}</strong> (
                <button
                  type="button"
                  onClick={() => {
                    const repId = readingArticle.reporterId;
                    setReadingArticle(null);
                    openPublicVerificationForId(repId);
                  }}
                  className="font-mono text-red-700 underline"
                >
                  {readingArticle.reporterId}
                </button>
                )
              </div>
              <div className="font-mono tabular-nums">
                {new Date(readingArticle.createdAt).toLocaleDateString('en-IN')}
              </div>
            </div>

            <img
              src={readingArticle.featuredImage || '/images/hero-secretariat.svg'}
              alt={readingArticle.headline}
              referrerPolicy="no-referrer"
              className="w-full max-h-80 object-cover rounded-lg border border-slate-200"
            />

            <div className="text-base text-slate-800 leading-relaxed whitespace-pre-line">
              {readingArticle.content}
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Link
                href={`/news/${readingArticle.slug}`}
                className="text-xs font-bold text-red-700 hover:underline"
              >
                Open Dedicated SEO URL (/news/{readingArticle.slug}) →
              </Link>
              <button
                type="button"
                onClick={() => setReadingArticle(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-md"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. PROFESSIONAL EDITORIAL FOOTER
         ===================================================================== */}
      <footer className="bg-slate-950 text-slate-300 border-t-4 border-red-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          {/* Column 1: Brand & Contact Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src={
                  websiteSettings.logoUrl ||
                  '/assets/aistudio/Gemini_Generated_Image_ei76ftei76ftei76_1e454e87.png'
                }
                alt="NETI BHARATHAM"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-700 p-0.5 object-contain"
              />
              {websiteSettings.secondaryLogoUrl && (
                <img
                  src={websiteSettings.secondaryLogoUrl}
                  alt="Channel Emblem"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full bg-white border border-amber-400 p-0.5 object-contain"
                />
              )}
              <div>
                <div className="text-base font-black text-white leading-none">
                  {websiteSettings.siteNameEn}
                </div>
                <div className="text-sm font-bold text-red-400 mt-0.5 leading-none">
                  {websiteSettings.siteNameTe}
                </div>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed">{websiteSettings.taglineTe}</p>
            <div className="space-y-1 text-slate-300">
              <div>
                <strong>Official Domain:</strong> {websiteSettings.domain}
              </div>
              <div>
                <strong>Email:</strong> {websiteSettings.contactEmail}
              </div>
              <div>
                <strong>Location:</strong> {websiteSettings.location}
              </div>
            </div>
          </div>

          {/* Column 2: Regional & National Desks */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Regional &amp; National Desks
            </h3>
            <ul className="space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setLocationScopeTab('NATIONAL');
                    setActiveView('home');
                  }}
                  className="hover:text-white"
                >
                  National News (జాతీయ వార్తలు)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setLocationScopeTab('STATE');
                    setSelectedStateId('st-tg');
                    setActiveView('home');
                  }}
                  className="hover:text-white"
                >
                  Telangana State Desk (తెలంగాణ)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setLocationScopeTab('STATE');
                    setSelectedStateId('st-ap');
                    setActiveView('home');
                  }}
                  className="hover:text-white"
                >
                  Andhra Pradesh State Desk (ఆంధ్రప్రదేశ్)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setLocationScopeTab('DISTRICT');
                    setSelectedStateId('st-tg');
                    setSelectedDistrictId('dt-tg-hyd');
                    setActiveView('home');
                  }}
                  className="hover:text-white"
                >
                  Hyderabad Bureau (హైదరాబాద్)
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Press Accreditation & Portals */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Press Accreditation &amp; Portals
            </h3>
            <ul className="space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('register_reporter')}
                  className="hover:text-white"
                >
                  Reporter Registration (21-Field Form)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('login')}
                  className="hover:text-white"
                >
                  Reporter Dashboard Login
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('verify_id');
                    handleVerifyReporterId('NB-TG-HYD-2026-0001');
                  }}
                  className="hover:text-white"
                >
                  Online QR Reporter ID Verification
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('ADMIN');
                    setActiveView('login');
                  }}
                  className="hover:text-white"
                >
                  Super Admin Governance Console
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Policies & Legal Pages */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Policies &amp; Editorial Standards
            </h3>
            <ul className="space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('about')}
                  className="hover:text-white"
                >
                  About Us (మా గురించి)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('contact')}
                  className="hover:text-white"
                >
                  Contact Us (సంప్రదించండి)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('privacy')}
                  className="hover:text-white"
                >
                  Privacy Policy (గోప్యతా విధానం)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('terms')}
                  className="hover:text-white"
                >
                  Terms &amp; Conditions (నిబంధనలు)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('disclaimer')}
                  className="hover:text-white"
                >
                  Disclaimer (నిరాకరణ)
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 py-4 text-center text-[11px] text-slate-400">
          © {new Date().getFullYear()} {websiteSettings.siteNameEn} ({websiteSettings.siteNameTe}) •{' '}
          {websiteSettings.domain} • {websiteSettings.location} • All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
