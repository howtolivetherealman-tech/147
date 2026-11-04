/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useMemo } from 'react';
import {
  StateRecord,
  DistrictRecord,
  MandalRecord,
  getMandalsForDistrict,
} from '@/lib/india-locations';
import {
  NewsArticleRecord,
  NewsCategoryRecord,
  AdvertisementRecord,
  ReporterRecord,
  ReporterPrivateDocRecord,
  WebsiteSettingsRecord,
  AdSenseSettingsRecord,
  AuditLogRecord,
  MembershipRenewalRecord,
} from '@/lib/default-data';
import { PressIdCardGenerator } from './PressIdCardGenerator';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Clock,
  CreditCard,
  Newspaper,
  Zap,
  Tags,
  MapPin,
  Megaphone,
  DollarSign,
  Settings,
  ShieldAlert,
  Download,
  LogOut,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Edit3,
  Eye,
  Plus,
  Search,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

interface SuperAdminDashboardViewProps {
  states: StateRecord[];
  districts: DistrictRecord[];
  mandals: MandalRecord[];
  categories: NewsCategoryRecord[];
  allReporters: ReporterRecord[];
  allReporterPrivateDocs: ReporterPrivateDocRecord[];
  allNews: NewsArticleRecord[];
  allAdvertisements: AdvertisementRecord[];
  websiteSettings: WebsiteSettingsRecord;
  adSenseSettings: AdSenseSettingsRecord;
  auditLogs: AuditLogRecord[];
  membershipRenewals: MembershipRenewalRecord[];
  onRefresh: () => Promise<void>;
  onLogout: () => void;
  onOpenPublicVerify: (reporterId: string) => void;
}

type AdminSection =
  | 'dashboard'
  | 'reporter_applications'
  | 'approved_reporters'
  | 'expired_reporters'
  | 'id_cards'
  | 'news_management'
  | 'breaking_news'
  | 'categories'
  | 'locations'
  | 'advertisements'
  | 'adsense'
  | 'website_settings'
  | 'security_audit';

export const SuperAdminDashboardView: React.FC<SuperAdminDashboardViewProps> = ({
  states,
  districts,
  mandals,
  categories,
  allReporters,
  allReporterPrivateDocs,
  allNews,
  allAdvertisements,
  websiteSettings,
  adSenseSettings,
  auditLogs,
  membershipRenewals,
  onRefresh,
  onLogout,
  onOpenPublicVerify,
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  // Search & Filter states
  const [reporterSearch, setReporterSearch] = useState('');
  const [newsSearch, setNewsSearch] = useState('');
  const [selectedCardReporterId, setSelectedCardReporterId] = useState(
    allReporters.find((r) => r.status === 'APPROVED')?.id || allReporters[0]?.id || ''
  );

  // Private Aadhaar & Complete Application Inspector Modal
  const [inspectReporterId, setInspectReporterId] = useState<string | null>(null);
  const [rejectionRemarksInput, setRejectionRemarksInput] = useState(
    'Incomplete Aadhaar scan or unverified address details.'
  );

  // Full Reporter Editor Modal (Super Admin Exclusive - All 21+ Fields & Reporter ID)
  const [editingReporter, setEditingReporter] = useState<ReporterRecord | null>(null);
  const [editingPrivateDoc, setEditingPrivateDoc] = useState<ReporterPrivateDocRecord | null>(null);
  const [editRepPass, setEditRepPass] = useState('');

  const openFullReporterEditor = (rep: ReporterRecord) => {
    const priv = allReporterPrivateDocs.find((p) => p.reporterDocId === rep.id);
    setEditingReporter({ ...rep });
    setEditingPrivateDoc(
      priv
        ? { ...priv }
        : {
            reporterDocId: rep.id,
            uid: rep.uid,
            fatherSpouseName: '',
            dob: '1990-01-01',
            whatsappNumber: rep.mobile || '',
            email: `${rep.username}@netibhaaratham.com`,
            residentialAddress: `${rep.mandalName}, ${rep.districtName}, ${rep.stateName}`,
            pinCode: '500001',
            experience: '2 Years',
            previousOrganization: 'Independent',
            aadhaarDocUrl: '/icon.svg',
            termsConsent: true,
            passwordHash: '',
            updatedAt: new Date().toISOString(),
          }
    );
    setEditRepPass('');
  };

  // Admin Direct News Upload / Editor
  const [adminHeadline, setAdminHeadline] = useState('');
  const [adminSubheadline, setAdminSubheadline] = useState('');
  const [adminContent, setAdminContent] = useState('');
  const [adminCatId, setAdminCatId] = useState(categories[0]?.id || 'cat-state');
  const [adminStateId, setAdminStateId] = useState('st-tg');
  const [adminDistrictId, setAdminDistrictId] = useState('dt-tg-hyd');
  const [adminMandalId, setAdminMandalId] = useState('mn-hyd-khairatabad');
  const [adminIsBreaking, setAdminIsBreaking] = useState(true);

  // Location Management Forms
  const [locTab, setLocTab] = useState<'states' | 'districts' | 'mandals'>('states');
  const [newStateCode, setNewStateCode] = useState('');
  const [newStateNameEn, setNewStateNameEn] = useState('');
  const [newStateNameTe, setNewStateNameTe] = useState('');
  const [newStateTerm, setNewStateTerm] = useState<
    'Mandal' | 'Tehsil' | 'Taluk' | 'Block' | 'Sub-Division'
  >('Mandal');

  const [newDistStateId, setNewDistStateId] = useState('st-tg');
  const [newDistNameEn, setNewDistNameEn] = useState('');
  const [newDistNameTe, setNewDistNameTe] = useState('');

  const [newMandalStateId, setNewMandalStateId] = useState('st-tg');
  const [newMandalDistId, setNewMandalDistId] = useState('dt-tg-hyd');
  const [newMandalNameEn, setNewMandalNameEn] = useState('');
  const [newMandalNameTe, setNewMandalNameTe] = useState('');

  // Category Form
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatNameTe, setNewCatNameTe] = useState('');
  const [newCatOrder, setNewCatOrder] = useState(categories.length + 1);

  // Website Settings Form
  const [siteForm, setSiteForm] = useState<WebsiteSettingsRecord>(websiteSettings);

  // AdSense Settings Form
  const [adSenseForm, setAdSenseForm] = useState<AdSenseSettingsRecord>(adSenseSettings);

  // Admin Password Update
  const [newAdminPassword, setNewAdminPassword] = useState('');

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const callAdminApi = async (action: string, payload: Record<string, unknown>, successMsg: string) => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          actor: { role: 'SUPER_ADMIN', username: 'Admin' },
          payload,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setFeedback({ type: 'error', text: data.error || 'Operation failed.' });
      } else {
        setFeedback({ type: 'success', text: successMsg });
        await onRefresh();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Network error.',
      });
    } finally {
      setBusy(false);
    }
  };

  // Computed Statistics
  const pendingReporters = useMemo(
    () => allReporters.filter((r) => r.status === 'PENDING'),
    [allReporters]
  );
  const approvedReporters = useMemo(
    () => allReporters.filter((r) => r.status === 'APPROVED'),
    [allReporters]
  );
  const rejectedReporters = useMemo(
    () => allReporters.filter((r) => r.status === 'REJECTED'),
    [allReporters]
  );
  const expiredReporters = useMemo(
    () => allReporters.filter((r) => r.status === 'EXPIRED' || r.status === 'SUSPENDED'),
    [allReporters]
  );

  const pendingNews = useMemo(() => allNews.filter((n) => n.status === 'PENDING'), [allNews]);
  const publishedNews = useMemo(() => allNews.filter((n) => n.status === 'PUBLISHED'), [allNews]);
  const rejectedNews = useMemo(() => allNews.filter((n) => n.status === 'REJECTED'), [allNews]);

  const pendingAds = useMemo(
    () => allAdvertisements.filter((a) => a.status === 'PENDING'),
    [allAdvertisements]
  );
  const activeAds = useMemo(
    () => allAdvertisements.filter((a) => a.status === 'ACTIVE'),
    [allAdvertisements]
  );

  // State-wise, District-wise, Mandal-wise reporter statistics
  const locationReporterStats = useMemo(() => {
    const byState: Record<string, number> = {};
    const byDistrict: Record<string, number> = {};
    const byMandal: Record<string, number> = {};

    allReporters.forEach((r) => {
      byState[r.stateName] = (byState[r.stateName] || 0) + 1;
      byDistrict[r.districtName] = (byDistrict[r.districtName] || 0) + 1;
      byMandal[r.mandalName] = (byMandal[r.mandalName] || 0) + 1;
    });

    return { byState, byDistrict, byMandal };
  }, [allReporters]);

  const handleExportFullBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      portal: 'NETI BHARATHAM (https://netibhaaratham.com)',
      states,
      districts,
      mandals,
      categories,
      reporters: allReporters,
      news: allNews,
      advertisements: allAdvertisements,
      websiteSettings,
      adSenseSettings,
      auditLogs,
      membershipRenewals,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neti-bharatham-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const navItems: { id: AdminSection; label: string; badge?: number; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'reporter_applications',
      label: 'Reporter Applications',
      badge: pendingReporters.length,
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'approved_reporters',
      label: 'Approved Reporters',
      badge: approvedReporters.length,
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: 'expired_reporters',
      label: 'Expired / Renewals',
      badge: expiredReporters.length,
      icon: <Clock className="w-4 h-4" />,
    },
    { id: 'id_cards', label: 'Reporter ID Cards', icon: <CreditCard className="w-4 h-4" /> },
    {
      id: 'news_management',
      label: 'News Management',
      badge: pendingNews.length,
      icon: <Newspaper className="w-4 h-4" />,
    },
    { id: 'breaking_news', label: 'Breaking News & Ticker', icon: <Zap className="w-4 h-4" /> },
    {
      id: 'categories',
      label: 'Categories (29+)',
      badge: categories.length,
      icon: <Tags className="w-4 h-4" />,
    },
    {
      id: 'locations',
      label: 'States / Districts / Mandals',
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      id: 'advertisements',
      label: 'Private Advertisements',
      badge: pendingAds.length,
      icon: <Megaphone className="w-4 h-4" />,
    },
    { id: 'adsense', label: 'Google AdSense', icon: <DollarSign className="w-4 h-4" /> },
    {
      id: 'website_settings',
      label: 'Logo, Banner & Site Settings',
      icon: <ImageIcon className="w-4 h-4" />,
    },
    {
      id: 'security_audit',
      label: 'Hostinger Files, Security & Backup',
      icon: <ShieldAlert className="w-4 h-4" />,
    },
  ];

  const downloadSupportingFile = (filename: string, content: string, mime = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImageFileSelect = (
    file: File | undefined,
    onDataUrlReady: (dataUrl: string) => void
  ) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setFeedback({
        type: 'error',
        text: 'Image file size must be under 4 MB. Please choose a smaller image.',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onDataUrlReady(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const inspectedReporter = inspectReporterId
    ? allReporters.find((r) => r.id === inspectReporterId)
    : null;
  const inspectedPrivateDoc = inspectReporterId
    ? allReporterPrivateDocs.find((p) => p.reporterDocId === inspectReporterId)
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col lg:flex-row">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-64 bg-slate-900 text-slate-200 shrink-0 border-r border-slate-800 flex flex-col justify-between">
        <div className="p-4">
          <div className="pb-4 mb-4 border-b border-slate-800">
            <div className="text-xs font-extrabold uppercase tracking-wider text-red-400">
              SUPER ADMIN CONSOLE
            </div>
            <div className="text-base font-black text-white mt-0.5">
              NETI BHARATHAM • నేటి భారతం
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Full Portal CMS &amp; RBAC Governance
            </div>
          </div>

          <nav className="space-y-1" aria-label="Super Admin Sidebar">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeSection === item.id
                    ? 'bg-red-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-950/50 text-white tabular-nums">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            type="button"
            onClick={handleExportFullBackup}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON Backup</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Admin</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT VIEWPORT */}
      <div className="flex-1 p-4 sm:p-8 space-y-6 overflow-x-hidden">
        {feedback && (
          <div
            role="alert"
            className={`p-4 rounded-lg border text-xs font-semibold flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="underline ml-4"
            >
              Close
            </button>
          </div>
        )}

        {/* 1. DASHBOARD OVERVIEW & 16 KPI STATISTICS */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  Super Admin Governance Dashboard (సూపర్ అడ్మిన్ డాష్‌బోర్డ్)
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Complete real-time statistics across Reporters, News, Advertisements, Categories, and India Locations
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSection('approved_reporters')}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-lg shadow-xs"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Reporters &amp; IDs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('website_settings')}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Change Logo &amp; Banner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('security_audit')}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Hostinger Hosting Files</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500">Total Reporters</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
                  {allReporters.length}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500">Pending Applications</div>
                <div className="text-2xl font-extrabold text-amber-600 mt-1 font-mono tabular-nums">
                  {pendingReporters.length}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500">Approved Reporters</div>
                <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono tabular-nums">
                  {approvedReporters.length}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500">Expired / Rejected</div>
                <div className="text-2xl font-extrabold text-red-700 mt-1 font-mono tabular-nums">
                  {expiredReporters.length + rejectedReporters.length}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500">Total News Articles</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
                  {allNews.length}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500">Pending News Review</div>
                <div className="text-2xl font-extrabold text-amber-600 mt-1 font-mono tabular-nums">
                  {pendingNews.length}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500">Published News</div>
                <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono tabular-nums">
                  {publishedNews.length}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500">Rejected News</div>
                <div className="text-2xl font-extrabold text-red-700 mt-1 font-mono tabular-nums">
                  {rejectedNews.length}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500">Total Advertisements</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
                  {allAdvertisements.length}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500">Pending Ads</div>
                <div className="text-2xl font-extrabold text-amber-600 mt-1 font-mono tabular-nums">
                  {pendingAds.length}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500">Active Ads</div>
                <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono tabular-nums">
                  {activeAds.length}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500">Total Categories</div>
                <div className="text-2xl font-extrabold text-blue-900 mt-1 font-mono tabular-nums">
                  {categories.length}
                </div>
              </div>
            </div>

            {/* State-wise, District-wise, Mandal-wise Reporter Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-200">
                  State-wise Reporter Statistics
                </h2>
                <div className="mt-3 space-y-2 text-xs">
                  {Object.entries(locationReporterStats.byState).map(([name, count]) => (
                    <div key={name} className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-700 font-medium">{name}</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-200">
                  District-wise Reporter Statistics
                </h2>
                <div className="mt-3 space-y-2 text-xs">
                  {Object.entries(locationReporterStats.byDistrict).map(([name, count]) => (
                    <div key={name} className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-700 font-medium">{name}</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-200">
                  Mandal-wise Reporter Statistics
                </h2>
                <div className="mt-3 space-y-2 text-xs">
                  {Object.entries(locationReporterStats.byMandal).map(([name, count]) => (
                    <div key={name} className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-700 font-medium">{name}</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. REPORTER APPLICATIONS (PENDING APPROVAL) */}
        {activeSection === 'reporter_applications' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Pending Reporter Applications ({pendingReporters.length})
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Review complete application and confidential Aadhaar documents. Approving automatically generates a unique Reporter ID and 6-calendar-month validity.
              </p>
            </div>

            {pendingReporters.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                All reporter applications have been reviewed.
              </p>
            ) : (
              <div className="divide-y divide-slate-200">
                {pendingReporters.map((rep) => {
                  const priv = allReporterPrivateDocs.find((p) => p.reporterDocId === rep.id);
                  return (
                    <div
                      key={rep.id}
                      className="py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={rep.photoUrl || '/icon.svg'}
                          alt={rep.fullName}
                          referrerPolicy="no-referrer"
                          className="w-14 h-16 rounded object-cover border border-slate-300 bg-slate-100 shrink-0"
                        />
                        <div className="space-y-1 text-xs">
                          <div className="text-base font-extrabold text-slate-900">
                            {rep.fullName} (@{rep.username})
                          </div>
                          <div className="text-slate-600">
                            Location: <strong>{rep.mandalName}</strong>, {rep.districtName},{' '}
                            {rep.stateName} • Village: {rep.villageTown}
                          </div>
                          <div className="text-slate-600">
                            Mobile: <span className="font-mono font-bold">{rep.mobile}</span> •
                            Email: {priv?.email || 'N/A'} • DOB: {priv?.dob || 'N/A'}
                          </div>
                          <div className="text-slate-500">
                            Residential Address: {priv?.residentialAddress || 'N/A'} (PIN:{' '}
                            {priv?.pinCode})
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openFullReporterEditor(rep)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Details &amp; ID</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setInspectReporterId(rep.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Aadhaar &amp; Docs</span>
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            callAdminApi(
                              'APPROVE_REPORTER',
                              { reporterDocId: rep.id },
                              `Approved ${rep.fullName}! Unique Reporter ID & 6-Month Validity Card generated.`
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve (Generate ID &amp; 6M Validity)</span>
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            callAdminApi(
                              'REJECT_REPORTER',
                              {
                                reporterDocId: rep.id,
                                remarks: rejectionRemarksInput,
                              },
                              `Rejected application for ${rep.fullName}.`
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-md"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. APPROVED REPORTERS DIRECTORY & FULL ADMIN EDITING */}
        {activeSection === 'approved_reporters' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  All Reporters Directory &amp; Full Details / ID Editor ({allReporters.length} Total)
                </h2>
                <p className="text-xs text-slate-600">
                  Super Admin can edit all reporter fields, change Unique Reporter ID, locations, photos, Aadhaar, passwords, or renew 6-month validity.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="search"
                  value={reporterSearch}
                  onChange={(e) => setReporterSearch(e.target.value)}
                  placeholder="Search name, ID, district, mobile..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase">
                    <th className="py-3 px-2">Reporter &amp; ID</th>
                    <th className="py-3 px-2">Hierarchy (Mandal / District / State)</th>
                    <th className="py-3 px-2">Mobile</th>
                    <th className="py-3 px-2">6-Month Validity</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allReporters
                    .filter((r) => {
                      const q = reporterSearch.toLowerCase();
                      return (
                        !q ||
                        r.fullName.toLowerCase().includes(q) ||
                        (r.reporterId || '').toLowerCase().includes(q) ||
                        r.districtName.toLowerCase().includes(q) ||
                        r.mandalName.toLowerCase().includes(q) ||
                        r.mobile.includes(q)
                      );
                    })
                    .map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50">
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-900">{rep.fullName}</div>
                          <div className="font-mono text-slate-500">
                            {rep.reporterId || 'NO-ID'} (@{rep.username})
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div>{rep.mandalName}</div>
                          <div className="text-slate-500">
                            {rep.districtName}, {rep.stateName}
                          </div>
                        </td>
                        <td className="py-3 px-2 font-mono tabular-nums">{rep.mobile}</td>
                        <td className="py-3 px-2 font-mono tabular-nums">
                          {rep.approvedAt ? `${rep.approvedAt} → ${rep.expiresAt}` : 'Not Approved'}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`font-extrabold ${
                              rep.status === 'APPROVED'
                                ? 'text-emerald-700'
                                : rep.status === 'PENDING'
                                ? 'text-amber-600'
                                : 'text-red-700'
                            }`}
                          >
                            {rep.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setInspectReporterId(rep.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold"
                          >
                            Aadhaar
                          </button>
                          <button
                            type="button"
                            onClick={() => openFullReporterEditor(rep)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
                          >
                            Edit All &amp; ID
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              callAdminApi(
                                'RENEW_REPORTER',
                                { reporterDocId: rep.id },
                                `Renewed ${rep.fullName} for 6 calendar months!`
                              )
                            }
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold"
                          >
                            +6M Renew
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDialog({
                                title: 'Delete Reporter Account',
                                message: `Are you sure you want to permanently delete reporter ${rep.fullName} (${rep.reporterId || rep.username})?`,
                                onConfirm: async () => {
                                  await callAdminApi(
                                    'DELETE_REPORTER',
                                    { reporterDocId: rep.id },
                                    `Deleted reporter ${rep.fullName}.`
                                  );
                                  setConfirmDialog(null);
                                },
                              })
                            }
                            className="px-2 py-1 text-red-700 hover:bg-red-50 rounded"
                            aria-label={`Delete reporter ${rep.fullName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. EXPIRED REPORTERS & 6-MONTH RENEWAL LOGS */}
        {activeSection === 'expired_reporters' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900">
                Expired &amp; Suspended Reporters ({expiredReporters.length})
              </h2>
              <p className="text-xs text-slate-600">
                Reporters whose 6-month validity has ended cannot upload news until renewed by Super Admin.
              </p>

              {expiredReporters.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No expired reporters currently.</p>
              ) : (
                <div className="divide-y divide-slate-200">
                  {expiredReporters.map((rep) => (
                    <div
                      key={rep.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {rep.fullName} ({rep.reporterId})
                        </div>
                        <div className="text-slate-600">
                          {rep.mandalName}, {rep.districtName}, {rep.stateName} • Expired on:{' '}
                          <span className="font-mono font-bold text-red-700">{rep.expiresAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openFullReporterEditor(rep)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Details &amp; ID</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            callAdminApi(
                              'RENEW_REPORTER',
                              {
                                reporterDocId: rep.id,
                                remarks: 'Renewed for 6 calendar months from Admin Renewal Console.',
                              },
                              `Renewed ${rep.fullName} for 6 months! Status restored to APPROVED.`
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Renew Membership (+6 Months)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">
                Membership Renewal History ({membershipRenewals.length})
              </h2>
              <div className="divide-y divide-slate-100 text-xs">
                {membershipRenewals.map((ren) => (
                  <div key={ren.id} className="py-3 flex justify-between gap-4">
                    <div>
                      <span className="font-bold text-slate-900">{ren.reporterName}</span> (
                      <span className="font-mono">{ren.reporterId}</span>) • {ren.remarks}
                    </div>
                    <div className="font-mono text-emerald-700 font-bold shrink-0 tabular-nums">
                      {ren.previousExpiry} → {ren.newExpiry}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. REPORTER ID CARDS GENERATOR */}
        {activeSection === 'id_cards' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Press Reporter ID Card Generator &amp; Print Studio
                </h2>
                <p className="text-xs text-slate-600">
                  Select any reporter to preview, edit all details/ID, or download their official dual-sided NETI BHARATHAM Press Card
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={selectedCardReporterId}
                  onChange={(e) => setSelectedCardReporterId(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md text-xs font-bold bg-white"
                >
                  {allReporters.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fullName} ({r.reporterId || r.status}) - {r.districtName}
                    </option>
                  ))}
                </select>
                {allReporters.find((r) => r.id === selectedCardReporterId) && (
                  <button
                    type="button"
                    onClick={() =>
                      openFullReporterEditor(
                        allReporters.find((r) => r.id === selectedCardReporterId)!
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-md"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Reporter All Details &amp; ID</span>
                  </button>
                )}
              </div>
            </div>

            {allReporters.find((r) => r.id === selectedCardReporterId) && (
              <PressIdCardGenerator
                reporter={allReporters.find((r) => r.id === selectedCardReporterId)!}
                websiteSettings={websiteSettings}
                onOpenPublicVerify={onOpenPublicVerify}
              />
            )}
          </div>
        )}

        {/* 6. NEWS MANAGEMENT & EDITORIAL DESK UPLOAD */}
        {activeSection === 'news_management' && (
          <div className="space-y-6">
            {/* Editorial Direct Publish Form */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-200">
                Publish News Article Directly (Editorial Desk Upload)
              </h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await callAdminApi(
                    'SUBMIT_NEWS',
                    {
                      headline: adminHeadline,
                      subheadline: adminSubheadline,
                      content: adminContent,
                      categoryId: adminCatId,
                      stateId: adminStateId,
                      districtId: adminDistrictId,
                      mandalId: adminMandalId,
                      isBreaking: adminIsBreaking,
                      isFeatured: true,
                    },
                    'Published news article directly to NETI BHARATHAM front page!'
                  );
                  setAdminHeadline('');
                  setAdminSubheadline('');
                  setAdminContent('');
                }}
                className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs"
              >
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Headline *</label>
                  <input
                    type="text"
                    required
                    value={adminHeadline}
                    onChange={(e) => setAdminHeadline(e.target.value)}
                    placeholder="Enter Telugu/English Headline"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={adminCatId}
                    onChange={(e) => setAdminCatId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameEn} ({c.nameTe})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">Content *</label>
                  <textarea
                    rows={3}
                    required
                    value={adminContent}
                    onChange={(e) => setAdminContent(e.target.value)}
                    placeholder="Full news article body..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <select
                    value={adminStateId}
                    onChange={(e) => {
                      const st = e.target.value;
                      setAdminStateId(st);
                      const dts = districts.filter((d) => d.stateId === st);
                      setAdminDistrictId(dts[0]?.id || '');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameEn} ({s.nameTe})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">District</label>
                  <select
                    value={adminDistrictId}
                    onChange={(e) => setAdminDistrictId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    {districts
                      .filter((d) => d.stateId === adminStateId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nameEn} ({d.nameTe})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <label className="flex items-center gap-1.5 font-bold text-red-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adminIsBreaking}
                      onChange={(e) => setAdminIsBreaking(e.target.checked)}
                    />
                    <span>Breaking News</span>
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-5 py-2 font-bold text-white bg-red-700 hover:bg-red-800 rounded-md"
                  >
                    Publish Now
                  </button>
                </div>
              </form>
            </div>

            {/* All News Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
                <h2 className="text-lg font-extrabold text-slate-900">
                  All News Articles ({allNews.length})
                </h2>
                <input
                  type="search"
                  value={newsSearch}
                  onChange={(e) => setNewsSearch(e.target.value)}
                  placeholder="Search headline, reporter ID, location..."
                  className="w-full sm:w-72 px-3 py-2 text-xs border border-slate-300 rounded-md"
                />
              </div>

              <div className="divide-y divide-slate-200">
                {allNews
                  .filter((n) => {
                    const q = newsSearch.toLowerCase();
                    return (
                      !q ||
                      n.headline.toLowerCase().includes(q) ||
                      n.reporterId.toLowerCase().includes(q) ||
                      n.districtName.toLowerCase().includes(q)
                    );
                  })
                  .map((article) => (
                    <div
                      key={article.id}
                      className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-slate-500">
                          <span className="font-bold text-red-700">{article.categoryName}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {[article.mandalName, article.districtName, article.stateName]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">Reporter: {article.reporterId}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-extrabold text-slate-900">
                            Status: {article.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{article.headline}</h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {article.status !== 'PUBLISHED' && (
                          <button
                            type="button"
                            onClick={() =>
                              callAdminApi(
                                'UPDATE_NEWS_STATUS',
                                { newsId: article.id, status: 'PUBLISHED' },
                                `Approved & published "${article.headline}"`
                              )
                            }
                            className="px-3 py-1.5 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded"
                          >
                            Approve &amp; Publish
                          </button>
                        )}
                        {article.status === 'PUBLISHED' && (
                          <button
                            type="button"
                            onClick={() =>
                              callAdminApi(
                                'UPDATE_NEWS_STATUS',
                                { newsId: article.id, status: 'UNPUBLISHED' },
                                `Unpublished "${article.headline}"`
                              )
                            }
                            className="px-3 py-1.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                          >
                            Unpublish
                          </button>
                        )}
                        {article.status !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() =>
                              callAdminApi(
                                'UPDATE_NEWS_STATUS',
                                { newsId: article.id, status: 'REJECTED' },
                                `Rejected "${article.headline}"`
                              )
                            }
                            className="px-3 py-1.5 font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            callAdminApi(
                              'UPDATE_NEWS_STATUS',
                              { newsId: article.id, isBreaking: !article.isBreaking },
                              `Toggled Breaking News status for "${article.headline}"`
                            )
                          }
                          className={`px-3 py-1.5 font-semibold rounded ${
                            article.isBreaking
                              ? 'bg-red-700 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {article.isBreaking ? 'Breaking: ON' : 'Breaking: OFF'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDialog({
                              title: 'Delete News Article',
                              message: `Permanently delete "${article.headline}"?`,
                              onConfirm: async () => {
                                await callAdminApi(
                                  'DELETE_NEWS',
                                  { newsId: article.id },
                                  'Deleted news article.'
                                );
                                setConfirmDialog(null);
                              },
                            })
                          }
                          className="p-1.5 text-red-700 hover:bg-red-50 rounded"
                          aria-label={`Delete article ${article.headline}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. BREAKING NEWS TICKER MANAGER */}
        {activeSection === 'breaking_news' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <h2 className="text-lg font-extrabold text-slate-900">
              Breaking News Ticker &amp; Homepage Slider Control
            </h2>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Live Red Breaking News Scrolling Ticker Text (బ్రేకింగ్ న్యూస్ స్క్రోలింగ్ టెక్స్ట్)
              </label>
              <textarea
                rows={3}
                value={siteForm.breakingTickerText}
                onChange={(e) =>
                  setSiteForm({ ...siteForm, breakingTickerText: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  callAdminApi(
                    'UPDATE_WEBSITE_SETTINGS',
                    { breakingTickerText: siteForm.breakingTickerText },
                    'Updated live Breaking News scrolling ticker!'
                  )
                }
                className="mt-3 px-5 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-md"
              >
                Save Breaking Ticker
              </button>
            </div>
          </div>
        )}

        {/* 8. NEWS CATEGORIES MANAGEMENT (ALL 29 CATEGORIES) */}
        {activeSection === 'categories' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Manage News Categories ({categories.length})
              </h2>
              <p className="text-xs text-slate-600">
                Add, edit, reorder, activate, or deactivate Telugu &amp; English news categories
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await callAdminApi(
                  'UPSERT_CATEGORY',
                  {
                    nameEn: newCatNameEn,
                    nameTe: newCatNameTe,
                    order: newCatOrder,
                    active: true,
                  },
                  `Added category ${newCatNameEn} (${newCatNameTe})!`
                );
                setNewCatNameEn('');
                setNewCatNameTe('');
              }}
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <input
                type="text"
                required
                value={newCatNameEn}
                onChange={(e) => setNewCatNameEn(e.target.value)}
                placeholder="Category Name (English)"
                className="px-3 py-2 border border-slate-300 rounded bg-white"
              />
              <input
                type="text"
                required
                value={newCatNameTe}
                onChange={(e) => setNewCatNameTe(e.target.value)}
                placeholder="Category Name (తెలుగు)"
                className="px-3 py-2 border border-slate-300 rounded bg-white"
              />
              <input
                type="number"
                value={newCatOrder}
                onChange={(e) => setNewCatOrder(Number(e.target.value))}
                placeholder="Order"
                className="px-3 py-2 border border-slate-300 rounded bg-white font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 font-bold text-white bg-red-700 hover:bg-red-800 rounded"
              >
                + Add Category
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {categories
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 border border-slate-200 rounded-lg flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {cat.order}. {cat.nameEn}
                      </div>
                      <div className="text-slate-600">{cat.nameTe}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          callAdminApi(
                            'UPSERT_CATEGORY',
                            { ...cat, active: !cat.active },
                            `Updated category ${cat.nameEn}`
                          )
                        }
                        className={`px-2 py-1 rounded font-semibold ${
                          cat.active
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {cat.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 9. INDIA LOCATION MANAGEMENT (STATES, DISTRICTS, MANDALS) */}
        {activeSection === 'locations' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  India Location Management System (Country → State/UT → District → Mandal/Tehsil/Taluk)
                </h2>
                <p className="text-xs text-slate-600">
                  {states.length} States/UTs • {districts.length} Districts • {mandals.length}{' '}
                  Explicit Mandals/Tehsils/Taluks
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(['states', 'districts', 'mandals'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLocTab(t)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded capitalize ${
                      locTab === t
                        ? 'bg-red-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {locTab === 'states' && (
              <div className="space-y-4">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await callAdminApi(
                      'UPSERT_STATE',
                      {
                        code: newStateCode,
                        nameEn: newStateNameEn,
                        nameTe: newStateNameTe,
                        subdivisionTerm: newStateTerm,
                        type: 'STATE',
                        active: true,
                      },
                      `Added State ${newStateNameEn}`
                    );
                    setNewStateCode('');
                    setNewStateNameEn('');
                    setNewStateNameTe('');
                  }}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <input
                    type="text"
                    required
                    value={newStateCode}
                    onChange={(e) => setNewStateCode(e.target.value)}
                    placeholder="Code (e.g. TG)"
                    className="px-3 py-2 border border-slate-300 rounded bg-white font-mono"
                  />
                  <input
                    type="text"
                    required
                    value={newStateNameEn}
                    onChange={(e) => setNewStateNameEn(e.target.value)}
                    placeholder="State Name (English)"
                    className="px-3 py-2 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    required
                    value={newStateNameTe}
                    onChange={(e) => setNewStateNameTe(e.target.value)}
                    placeholder="State Name (తెలుగు)"
                    className="px-3 py-2 border border-slate-300 rounded bg-white"
                  />
                  <select
                    value={newStateTerm}
                    onChange={(e) => setNewStateTerm(e.target.value as any)}
                    className="px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="Mandal">Mandal</option>
                    <option value="Tehsil">Tehsil</option>
                    <option value="Taluk">Taluk</option>
                    <option value="Block">Block</option>
                    <option value="Sub-Division">Sub-Division</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 font-bold text-white bg-red-700 hover:bg-red-800 rounded"
                  >
                    + Add State
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {states.map((st) => (
                    <div
                      key={st.id}
                      className="p-3 border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          [{st.code}] {st.nameEn}
                        </div>
                        <div className="text-slate-600">
                          {st.nameTe} • Division: {st.subdivisionTerm}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          callAdminApi(
                            'UPSERT_STATE',
                            { ...st, active: !st.active },
                            `Toggled state ${st.nameEn}`
                          )
                        }
                        className={`px-2 py-1 rounded font-semibold ${
                          st.active
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {st.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {locTab === 'districts' && (
              <div className="space-y-4">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await callAdminApi(
                      'UPSERT_DISTRICT',
                      {
                        stateId: newDistStateId,
                        nameEn: newDistNameEn,
                        nameTe: newDistNameTe,
                        active: true,
                      },
                      `Added District ${newDistNameEn}`
                    );
                    setNewDistNameEn('');
                    setNewDistNameTe('');
                  }}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <select
                    value={newDistStateId}
                    onChange={(e) => setNewDistStateId(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameEn} ({s.nameTe})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={newDistNameEn}
                    onChange={(e) => setNewDistNameEn(e.target.value)}
                    placeholder="District Name (English)"
                    className="px-3 py-2 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    required
                    value={newDistNameTe}
                    onChange={(e) => setNewDistNameTe(e.target.value)}
                    placeholder="District Name (తెలుగు)"
                    className="px-3 py-2 border border-slate-300 rounded bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 font-bold text-white bg-red-700 hover:bg-red-800 rounded"
                  >
                    + Add District
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {districts
                    .filter((d) => d.stateId === newDistStateId)
                    .map((dt) => (
                      <div
                        key={dt.id}
                        className="p-3 border border-slate-200 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{dt.nameEn}</div>
                          <div className="text-slate-600">{dt.nameTe}</div>
                        </div>
                        <span className="text-emerald-700 font-semibold">Active</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {locTab === 'mandals' && (
              <div className="space-y-4">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await callAdminApi(
                      'UPSERT_MANDAL',
                      {
                        stateId: newMandalStateId,
                        districtId: newMandalDistId,
                        nameEn: newMandalNameEn,
                        nameTe: newMandalNameTe,
                        divisionType: 'Mandal',
                        active: true,
                      },
                      `Added Mandal ${newMandalNameEn}`
                    );
                    setNewMandalNameEn('');
                    setNewMandalNameTe('');
                  }}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <select
                    value={newMandalStateId}
                    onChange={(e) => {
                      const st = e.target.value;
                      setNewMandalStateId(st);
                      const dts = districts.filter((d) => d.stateId === st);
                      setNewMandalDistId(dts[0]?.id || '');
                    }}
                    className="px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameEn}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newMandalDistId}
                    onChange={(e) => setNewMandalDistId(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    {districts
                      .filter((d) => d.stateId === newMandalStateId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nameEn}
                        </option>
                      ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={newMandalNameEn}
                    onChange={(e) => setNewMandalNameEn(e.target.value)}
                    placeholder="Mandal Name (English)"
                    className="px-3 py-2 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    required
                    value={newMandalNameTe}
                    onChange={(e) => setNewMandalNameTe(e.target.value)}
                    placeholder="Mandal Name (తెలుగు)"
                    className="px-3 py-2 border border-slate-300 rounded bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 font-bold text-white bg-red-700 hover:bg-red-800 rounded"
                  >
                    + Add Mandal
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {getMandalsForDistrict(newMandalDistId, mandals, districts, states).map((mn) => (
                    <div
                      key={mn.id}
                      className="p-3 border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{mn.nameEn}</div>
                        <div className="text-slate-600">
                          {mn.nameTe} ({mn.divisionType})
                        </div>
                      </div>
                      <span className="text-emerald-700 font-semibold">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 10. PRIVATE ADVERTISEMENT MANAGEMENT */}
        {activeSection === 'advertisements' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Private Advertisements Management ({allAdvertisements.length})
              </h2>
              <p className="text-xs text-slate-600">
                Review reporter-submitted private advertisements (max 2 images each), approve/reject, set placement &amp; payment status
              </p>
            </div>

            <div className="divide-y divide-slate-200 text-xs">
              {allAdvertisements.map((ad) => (
                <div
                  key={ad.id}
                  className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-900">{ad.title}</div>
                    <div className="text-slate-600">
                      Business: <strong>{ad.businessName}</strong> • Contact: {ad.contactNumber} •
                      Submitted by: {ad.reporterName} ({ad.reporterId})
                    </div>
                    <div className="text-slate-500 font-mono tabular-nums">
                      Target: {ad.targetMandalName}, {ad.targetDistrictName}, {ad.targetStateName} •
                      Valid: {ad.startDate} to {ad.expiryDate} • Price: ₹{ad.priceAmount} (
                      {ad.paymentStatus}) • Status: <strong>{ad.status}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {ad.status !== 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() =>
                          callAdminApi(
                            'MANAGE_AD',
                            { adId: ad.id, status: 'ACTIVE', paymentStatus: 'PAID' },
                            `Approved & activated advertisement "${ad.title}"`
                          )
                        }
                        className="px-3 py-1.5 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded"
                      >
                        Approve &amp; Activate
                      </button>
                    )}
                    {ad.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() =>
                          callAdminApi(
                            'MANAGE_AD',
                            { adId: ad.id, status: 'INACTIVE' },
                            `Deactivated advertisement "${ad.title}"`
                          )
                        }
                        className="px-3 py-1.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                      >
                        Deactivate
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        callAdminApi(
                          'MANAGE_AD',
                          { adId: ad.id, status: 'REJECTED' },
                          `Rejected advertisement "${ad.title}"`
                        )
                      }
                      className="px-3 py-1.5 font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. GOOGLE ADSENSE INTEGRATION SETTINGS */}
        {activeSection === 'adsense' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Google AdSense Configuration (Admin-Only)
              </h2>
              <p className="text-xs text-slate-600">
                Configure Publisher ID, Client ID, and Slot IDs. Ads are hidden publicly unless enabled and configured.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await callAdminApi(
                  'UPDATE_ADSENSE_SETTINGS',
                  adSenseForm as unknown as Record<string, unknown>,
                  'Saved Google AdSense configuration!'
                );
              }}
              className="space-y-4 text-xs"
            >
              <label className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer font-bold text-slate-900">
                <input
                  type="checkbox"
                  checked={adSenseForm.enabled}
                  onChange={(e) =>
                    setAdSenseForm({ ...adSenseForm, enabled: e.target.checked })
                  }
                />
                <span>Enable Google AdSense Globally Across Portal</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Publisher ID (e.g. pub-XXXXXXXXXXXXXXXX)
                  </label>
                  <input
                    type="text"
                    value={adSenseForm.publisherId}
                    onChange={(e) =>
                      setAdSenseForm({ ...adSenseForm, publisherId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ad Client ID (ca-pub-XXXXXXXXXXXXXXXX)
                  </label>
                  <input
                    type="text"
                    value={adSenseForm.adClientId}
                    onChange={(e) =>
                      setAdSenseForm({ ...adSenseForm, adClientId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Header Ad Slot ID</label>
                  <input
                    type="text"
                    value={adSenseForm.headerSlotId}
                    onChange={(e) =>
                      setAdSenseForm({ ...adSenseForm, headerSlotId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Homepage Ad Slot ID
                  </label>
                  <input
                    type="text"
                    value={adSenseForm.homepageSlotId}
                    onChange={(e) =>
                      setAdSenseForm({ ...adSenseForm, homepageSlotId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    News Article Ad Slot ID
                  </label>
                  <input
                    type="text"
                    value={adSenseForm.articleSlotId}
                    onChange={(e) =>
                      setAdSenseForm({ ...adSenseForm, articleSlotId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sidebar &amp; Footer Ad Slot ID
                  </label>
                  <input
                    type="text"
                    value={adSenseForm.sidebarSlotId}
                    onChange={(e) =>
                      setAdSenseForm({ ...adSenseForm, sidebarSlotId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 font-bold text-white bg-red-700 hover:bg-red-800 rounded-md"
              >
                Save AdSense Settings
              </button>
            </form>
          </div>
        )}

        {/* 12. WEBSITE SETTINGS, LOGO, BANNER IMAGE, CONTACT DETAILS & POLICIES */}
        {activeSection === 'website_settings' && (
          <div className="space-y-6">
            {/* A. CHANGE WEBSITE LOGO & ADD TOP BANNER IMAGE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CARD 1: CHANGE WEBSITE LOGO & PRESS ID EMBLEM */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-red-700" />
                      <span>Change Website Logos &amp; Reporter ID Emblem (లోగోలు మార్చండి)</span>
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Updates Primary &amp; Secondary Logos across Header, Footer &amp; Press Reporter ID Cards
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const nextForm = {
                        ...siteForm,
                        logoUrl:
                          '/assets/aistudio/Gemini_Generated_Image_ei76ftei76ftei76_1e454e87.png',
                        secondaryLogoUrl:
                          '/assets/aistudio/Gemini_Generated_Image_qkr1reqkr1reqkr1_459f1767.png',
                      };
                      setSiteForm(nextForm);
                      await callAdminApi(
                        'UPDATE_WEBSITE_SETTINGS',
                        nextForm as unknown as Record<string, unknown>,
                        'Restored official NETI BHARATHAM & Channel Emblem logos!'
                      );
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                  >
                    Restore Official Logos
                  </button>
                </div>

                {/* Live Dual Logo Preview */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="w-20 h-20 rounded-lg border border-slate-300 bg-slate-950 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
                    <img
                      src={
                        siteForm.logoUrl ||
                        '/assets/aistudio/Gemini_Generated_Image_ei76ftei76ftei76_1e454e87.png'
                      }
                      alt="Primary Website Logo"
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="w-20 h-20 rounded-full border-2 border-amber-400 bg-white flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
                    <img
                      src={
                        siteForm.secondaryLogoUrl ||
                        '/assets/aistudio/Gemini_Generated_Image_qkr1reqkr1reqkr1_459f1767.png'
                      }
                      alt="Secondary Emblem Logo"
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-slate-900">
                      {siteForm.siteNameEn} • {siteForm.siteNameTe}
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      Both logos appear on the Website Header, Footer, QR Verification Page, and Press Reporter Identity Cards.
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        1. Upload Primary Logo (నేటి భారతం లోగో)
                      </label>
                      <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer w-full justify-center">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Primary Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleImageFileSelect(file, (dataUrl) => {
                              setSiteForm((prev) => ({ ...prev, logoUrl: dataUrl }));
                            });
                          }}
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        2. Upload Emblem Logo (ఏది నిజం లోగో)
                      </label>
                      <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-md cursor-pointer w-full justify-center">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Secondary Emblem</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleImageFileSelect(file, (dataUrl) => {
                              setSiteForm((prev) => ({ ...prev, secondaryLogoUrl: dataUrl }));
                            });
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Primary Logo URL
                    </label>
                    <input
                      type="text"
                      value={siteForm.logoUrl || ''}
                      onChange={(e) => setSiteForm({ ...siteForm, logoUrl: e.target.value })}
                      placeholder="/assets/aistudio/Gemini_Generated_Image_ei76ftei76ftei76_1e454e87.png"
                      className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Secondary Emblem Logo URL (Press ID &amp; Header)
                    </label>
                    <input
                      type="text"
                      value={siteForm.secondaryLogoUrl || ''}
                      onChange={(e) =>
                        setSiteForm({ ...siteForm, secondaryLogoUrl: e.target.value })
                      }
                      placeholder="/assets/aistudio/Gemini_Generated_Image_qkr1reqkr1reqkr1_459f1767.png"
                      className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      await callAdminApi(
                        'UPDATE_WEBSITE_SETTINGS',
                        siteForm as unknown as Record<string, unknown>,
                        'Website & Reporter ID Card Logos updated and published across the portal!'
                      );
                    }}
                    className="w-full py-2.5 font-bold text-white bg-red-700 hover:bg-red-800 rounded-md"
                  >
                    Save &amp; Apply Website &amp; ID Card Logos
                  </button>
                </div>
              </div>

              {/* CARD 2: ADD / CHANGE WEBSITE TOP BANNER IMAGE */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-red-700" />
                      <span>Website Banner Image (వెబ్‌సైట్ బ్యానర్ ఇమేజ్)</span>
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Displays a prominent top banner image on the Home Page &amp; News Reader
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(siteForm.bannerEnabled)}
                      onChange={(e) =>
                        setSiteForm({ ...siteForm, bannerEnabled: e.target.checked })
                      }
                      className="w-4 h-4 accent-red-700"
                    />
                    <span>Show Banner on Site</span>
                  </label>
                </div>

                {/* Live Banner Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>Banner Preview:</span>
                    <span
                      className={`font-bold ${
                        siteForm.bannerEnabled ? 'text-emerald-700' : 'text-amber-600'
                      }`}
                    >
                      {siteForm.bannerEnabled ? '● ACTIVE ON WEBSITE' : '○ HIDDEN (Toggle "Show Banner" to enable)'}
                    </span>
                  </div>
                  <div className="w-full h-32 rounded-lg border border-slate-300 bg-slate-950 overflow-hidden relative flex items-center justify-center">
                    {siteForm.bannerImageUrl ? (
                      <img
                        src={siteForm.bannerImageUrl}
                        alt={siteForm.bannerTitle || 'Website Banner Preview'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">No Banner Image Selected</span>
                    )}
                    {siteForm.bannerTitle && (
                      <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white px-3 py-1.5 text-[11px] font-bold truncate">
                        {siteForm.bannerTitle}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Upload Banner Image from Device (బ్యానర్ ఇమేజ్ అప్‌లోడ్ చేయండి)
                    </label>
                    <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Banner Image (JPG / PNG / WebP / SVG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          handleImageFileSelect(file, (dataUrl) => {
                            setSiteForm((prev) => ({
                              ...prev,
                              bannerImageUrl: dataUrl,
                              bannerEnabled: true,
                            }));
                          });
                        }}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Or Enter Banner Image URL
                    </label>
                    <input
                      type="text"
                      value={siteForm.bannerImageUrl || ''}
                      onChange={(e) =>
                        setSiteForm({
                          ...siteForm,
                          bannerImageUrl: e.target.value,
                          bannerEnabled: e.target.value ? true : siteForm.bannerEnabled,
                        })
                      }
                      placeholder="https://example.com/banner.jpg or /images/hero-secretariat.svg"
                      className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Banner Caption / Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={siteForm.bannerTitle || ''}
                        onChange={(e) =>
                          setSiteForm({ ...siteForm, bannerTitle: e.target.value })
                        }
                        placeholder="ప్రత్యేక ప్రకటన / బ్యానర్ శీర్షిక"
                        className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Banner Click Link URL (Optional)
                      </label>
                      <input
                        type="text"
                        value={siteForm.bannerLinkUrl || ''}
                        onChange={(e) =>
                          setSiteForm({ ...siteForm, bannerLinkUrl: e.target.value })
                        }
                        placeholder="https://netibhaaratham.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        const nextForm = {
                          ...siteForm,
                          bannerEnabled: Boolean(siteForm.bannerImageUrl),
                        };
                        setSiteForm(nextForm);
                        await callAdminApi(
                          'UPDATE_WEBSITE_SETTINGS',
                          nextForm as unknown as Record<string, unknown>,
                          'Website Banner Image saved and published live on the portal!'
                        );
                      }}
                      className="flex-1 py-2.5 font-bold text-white bg-red-700 hover:bg-red-800 rounded-md"
                    >
                      Save &amp; Publish Banner Image
                    </button>
                    {siteForm.bannerEnabled && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          const nextForm = { ...siteForm, bannerEnabled: false };
                          setSiteForm(nextForm);
                          await callAdminApi(
                            'UPDATE_WEBSITE_SETTINGS',
                            nextForm as unknown as Record<string, unknown>,
                            'Website Banner hidden from public view.'
                          );
                        }}
                        className="px-3 py-2.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                      >
                        Hide Banner
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* B. WEBSITE BRANDING, CONTACT DETAILS & POLICY CONTENT CMS */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <h2 className="text-lg font-extrabold text-slate-900">
                Website Branding, Contact Details &amp; Policy Content CMS
              </h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await callAdminApi(
                    'UPDATE_WEBSITE_SETTINGS',
                    siteForm as unknown as Record<string, unknown>,
                    'Saved all website branding, logo, banner, contact details, and policy pages!'
                  );
                }}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Website Name (English)
                    </label>
                    <input
                      type="text"
                      value={siteForm.siteNameEn}
                      onChange={(e) => setSiteForm({ ...siteForm, siteNameEn: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Website Name (Telugu)
                    </label>
                    <input
                      type="text"
                      value={siteForm.siteNameTe}
                      onChange={(e) => setSiteForm({ ...siteForm, siteNameTe: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Official Domain</label>
                    <input
                      type="text"
                      value={siteForm.domain}
                      onChange={(e) => setSiteForm({ ...siteForm, domain: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={siteForm.contactEmail}
                      onChange={(e) => setSiteForm({ ...siteForm, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Headquarters Location
                    </label>
                    <input
                      type="text"
                      value={siteForm.location}
                      onChange={(e) => setSiteForm({ ...siteForm, location: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ID Card Emergency Contact
                    </label>
                    <input
                      type="text"
                      value={siteForm.emergencyContact}
                      onChange={(e) =>
                        setSiteForm({ ...siteForm, emergencyContact: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">About Us Content</label>
                  <textarea
                    rows={2}
                    value={siteForm.aboutUsContent}
                    onChange={(e) => setSiteForm({ ...siteForm, aboutUsContent: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Privacy Policy Content
                  </label>
                  <textarea
                    rows={2}
                    value={siteForm.privacyPolicyContent}
                    onChange={(e) =>
                      setSiteForm({ ...siteForm, privacyPolicyContent: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Terms &amp; Conditions Content
                  </label>
                  <textarea
                    rows={2}
                    value={siteForm.termsContent}
                    onChange={(e) => setSiteForm({ ...siteForm, termsContent: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 font-bold text-white bg-red-700 hover:bg-red-800 rounded-md"
                >
                  Save All Website Settings
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 13. HOSTINGER HOSTING FILES, SECURITY SETTINGS & IMMUTABLE AUDIT LOGS */}
        {activeSection === 'security_audit' && (
          <div className="space-y-6">
            {/* HOSTINGER HOSTING SUPPORTING FILES DOWNLOAD CENTER */}
            <div className="bg-white border-2 border-red-700 rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Hostinger Hosting Deployment &amp; Supporting Files (హోస్టింగర్ హోస్టింగ్ సపోర్టింగ్ ఫైల్స్)
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Ready-to-upload configuration files for hosting <strong>netibhaaratham.com</strong> on Hostinger (Node.js Web App / Cloud / Business / VPS)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportFullBackup}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full Database Backup (.json)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="font-mono font-bold text-red-700 text-sm">1. server.js</div>
                    <p className="text-slate-600 mt-1">
                      Main Node.js startup script required by Hostinger hPanel Node.js Selector (Application Startup File: <code>server.js</code>).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      downloadSupportingFile(
                        'server.js',
                        `const { createServer } = require('node:http');\nconst { parse } = require('node:url');\nconst next = require('next');\n\nconst dev = process.env.NODE_ENV !== 'production';\nconst hostname = process.env.HOSTNAME || '0.0.0.0';\nconst port = parseInt(process.env.PORT || '3000', 10);\n\nconst app = next({ dev, hostname, port });\nconst handle = app.getRequestHandler();\n\napp.prepare().then(() => {\n  createServer(async (req, res) => {\n    try {\n      const parsedUrl = parse(req.url, true);\n      await handle(req, res, parsedUrl);\n    } catch (err) {\n      res.statusCode = 500;\n      res.end('Internal Server Error - NETI BHARATHAM');\n    }\n  }).listen(port, hostname, () => {\n    console.log('> NETI BHARATHAM ready on port ' + port);\n  });\n});\n`,
                        'application/javascript;charset=utf-8'
                      )
                    }
                    className="w-full py-2 font-bold text-white bg-red-700 hover:bg-red-800 rounded flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download server.js</span>
                  </button>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="font-mono font-bold text-blue-900 text-sm">2. .htaccess</div>
                    <p className="text-slate-600 mt-1">
                      Apache / LiteSpeed configuration for Hostinger <code>public_html</code> (HTTPS redirect, GZIP compression, static asset cache &amp; port 3000 proxy).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      downloadSupportingFile(
                        '.htaccess',
                        `<IfModule mod_rewrite.c>\n  RewriteEngine On\n  RewriteCond %{HTTPS} off\n  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]\n  RewriteCond %{REQUEST_FILENAME} -f [OR]\n  RewriteCond %{REQUEST_FILENAME} -d\n  RewriteRule ^ - [L]\n  <IfModule mod_proxy.c>\n    RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]\n  </IfModule>\n</IfModule>\n`
                      )
                    }
                    className="w-full py-2 font-bold text-white bg-blue-900 hover:bg-blue-950 rounded flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .htaccess</span>
                  </button>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="font-mono font-bold text-emerald-800 text-sm">
                      3. ecosystem.config.cjs
                    </div>
                    <p className="text-slate-600 mt-1">
                      PM2 process manager configuration for Hostinger Cloud / VPS hosting with auto-restart and production environment variables.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      downloadSupportingFile(
                        'ecosystem.config.cjs',
                        `module.exports = {\n  apps: [\n    {\n      name: 'neti-bharatham-portal',\n      script: 'server.js',\n      instances: 1,\n      exec_mode: 'fork',\n      autorestart: true,\n      env: {\n        NODE_ENV: 'production',\n        PORT: 3000,\n        HOSTNAME: '0.0.0.0',\n        APP_URL: 'https://netibhaaratham.com',\n      },\n    },\n  ],\n};\n`,
                        'application/javascript;charset=utf-8'
                      )
                    }
                    className="w-full py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PM2 Config</span>
                  </button>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      4. HOSTINGER_GUIDE.txt
                    </div>
                    <p className="text-slate-600 mt-1">
                      Step-by-step instructions in Telugu &amp; English for uploading project files and connecting <code>netibhaaratham.com</code> on Hostinger.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      downloadSupportingFile(
                        'HOSTINGER-DEPLOYMENT-GUIDE.txt',
                        `NETI BHARATHAM (నేటి భారతం) - HOSTINGER DEPLOYMENT GUIDE\nOfficial Domain: https://netibhaaratham.com\nSuper Admin Login: chakri / 1977\n\nSTEP 1: Download Project ZIP from AI Studio (or push to GitHub).\nSTEP 2: Upload files to Hostinger File Manager -> public_html (include server.js, package.json, next.config.ts, app/, components/, lib/, public/).\nSTEP 3: In Hostinger hPanel -> Advanced -> Node.js:\n  - Node.js Version: 20.x or 22.x\n  - Application Mode: Production\n  - Application Root: public_html\n  - Application Startup File: server.js\nSTEP 4: Click "NPM Install", run "npm run build", and click "Restart App".\n`
                      )
                    }
                    className="w-full py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Guide (.txt)</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">
                Super Admin Credential Security (Username: chakri)
              </h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await callAdminApi(
                    'ADMIN_CHANGE_PASSWORD',
                    { newPassword: newAdminPassword },
                    'Updated Super Admin password credential with scrypt cryptographic hashing!'
                  );
                  setNewAdminPassword('');
                }}
                className="flex flex-wrap items-center gap-3 text-xs"
              >
                <input
                  type="password"
                  required
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Enter new Super Admin password (min 4 chars)"
                  className="w-72 px-3 py-2 border border-slate-300 rounded"
                />
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded"
                >
                  Update Admin Password
                </button>
              </form>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">
                Immutable Security &amp; Operational Audit Logs ({auditLogs.length})
              </h2>
              <div className="divide-y divide-slate-100 text-xs max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex justify-between gap-4">
                    <div>
                      <span className="font-mono font-bold text-red-700">[{log.action}]</span>{' '}
                      <strong className="text-slate-900">{log.actorId}</strong> ({log.actorRole}) →{' '}
                      {log.details}
                    </div>
                    <span className="font-mono text-slate-400 shrink-0 tabular-nums">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONFIDENTIAL AADHAAR & APPLICATION INSPECTOR MODAL */}
      {inspectedReporter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900">
                Confidential Reporter Vault: {inspectedReporter.fullName}
              </h3>
              <button
                type="button"
                onClick={() => setInspectReporterId(null)}
                className="font-bold text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-semibold text-slate-500 mb-1">Profile Photograph</div>
                <img
                  src={inspectedReporter.photoUrl || '/icon.svg'}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="w-28 h-32 object-cover rounded border border-slate-300"
                />
              </div>
              <div>
                <div className="font-semibold text-slate-500 mb-1">
                  Private Aadhaar Document (Admin Only)
                </div>
                <img
                  src={inspectedPrivateDoc?.aadhaarDocUrl || '/icon.svg'}
                  alt="Aadhaar Document"
                  referrerPolicy="no-referrer"
                  className="w-full h-32 object-contain rounded border border-slate-300 bg-slate-50"
                />
              </div>
            </div>
            <div className="space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
              <div>
                <strong>Unique Reporter ID:</strong>{' '}
                <span className="font-mono font-bold text-red-700">
                  {inspectedReporter.reporterId || 'Not Assigned'}
                </span>
              </div>
              <div>
                <strong>Father/Spouse:</strong> {inspectedPrivateDoc?.fatherSpouseName}
              </div>
              <div>
                <strong>DOB:</strong> {inspectedPrivateDoc?.dob} • <strong>Email:</strong>{' '}
                {inspectedPrivateDoc?.email}
              </div>
              <div>
                <strong>Residential Address:</strong> {inspectedPrivateDoc?.residentialAddress} (PIN:{' '}
                {inspectedPrivateDoc?.pinCode})
              </div>
              <div>
                <strong>Experience:</strong> {inspectedPrivateDoc?.experience} (
                {inspectedPrivateDoc?.previousOrganization})
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const rep = inspectedReporter;
                  setInspectReporterId(null);
                  openFullReporterEditor(rep);
                }}
                className="px-4 py-2 font-bold text-white bg-blue-900 hover:bg-blue-950 rounded"
              >
                Edit Reporter All Details &amp; ID
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN FULL REPORTER PROFILE, ID & DOCUMENTS EDITOR MODAL (ALL 21+ FIELDS) */}
      {editingReporter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 text-xs max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Edit Reporter All Details &amp; Unique ID (రిపోర్టర్ పూర్తి వివరాలు &amp; ఐడి మార్పు)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Super Admin full override: edit Unique Reporter ID, Name, Location Hierarchy, Photos, Aadhaar, Validity Dates &amp; Password
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingReporter(null);
                  setEditingPrivateDoc(null);
                }}
                className="px-3 py-1.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
              >
                Close ✕
              </button>
            </div>

            {/* SECTION 1: UNIQUE REPORTER ID, STATUS & VALIDITY DATES */}
            <div className="p-4 bg-red-50/60 border border-red-200 rounded-lg space-y-3">
              <div className="font-extrabold text-red-800 uppercase tracking-wider text-[11px]">
                1. Unique Press Reporter ID &amp; 6-Month Validity Credentials
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Unique Reporter ID (ఐడి నంబర్) *
                  </label>
                  <input
                    type="text"
                    value={editingReporter.reporterId || ''}
                    onChange={(e) =>
                      setEditingReporter({
                        ...editingReporter,
                        reporterId: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g. NB-TG-HYD-2026-0001"
                    className="w-full px-3 py-2 border-2 border-red-600 rounded font-mono font-bold text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Account Status</label>
                  <select
                    value={editingReporter.status}
                    onChange={(e) =>
                      setEditingReporter({
                        ...editingReporter,
                        status: e.target.value as ReporterRecord['status'],
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded font-bold bg-white"
                  >
                    <option value="APPROVED">APPROVED (Active)</option>
                    <option value="PENDING">PENDING</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Date of Issue (జారీ తేదీ)
                  </label>
                  <input
                    type="date"
                    value={editingReporter.approvedAt || ''}
                    onChange={(e) =>
                      setEditingReporter({ ...editingReporter, approvedAt: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Expiry Date (గడువు తేదీ)
                  </label>
                  <input
                    type="date"
                    value={editingReporter.expiresAt || ''}
                    onChange={(e) =>
                      setEditingReporter({ ...editingReporter, expiresAt: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: PERSONAL IDENTITY & CONTACT DETAILS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name (పూర్తి పేరు) *
                </label>
                <input
                  type="text"
                  value={editingReporter.fullName}
                  onChange={(e) =>
                    setEditingReporter({ ...editingReporter, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Father / Husband Name
                </label>
                <input
                  type="text"
                  value={editingPrivateDoc?.fatherSpouseName || ''}
                  onChange={(e) =>
                    setEditingPrivateDoc((prev) =>
                      prev ? { ...prev, fatherSpouseName: e.target.value } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Date of Birth (పుట్టిన తేదీ)
                </label>
                <input
                  type="date"
                  value={editingPrivateDoc?.dob || ''}
                  onChange={(e) =>
                    setEditingPrivateDoc((prev) =>
                      prev ? { ...prev, dob: e.target.value } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={editingReporter.gender || 'Male'}
                  onChange={(e) =>
                    setEditingReporter({
                      ...editingReporter,
                      gender: e.target.value as ReporterRecord['gender'],
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile Number (మొబైల్ నంబర్) *
                </label>
                <input
                  type="text"
                  value={editingReporter.mobile}
                  onChange={(e) =>
                    setEditingReporter({ ...editingReporter, mobile: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  WhatsApp Number (వాట్సాప్)
                </label>
                <input
                  type="text"
                  value={editingPrivateDoc?.whatsappNumber || editingReporter.mobile || ''}
                  onChange={(e) =>
                    setEditingPrivateDoc((prev) =>
                      prev ? { ...prev, whatsappNumber: e.target.value } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editingPrivateDoc?.email || ''}
                  onChange={(e) =>
                    setEditingPrivateDoc((prev) =>
                      prev ? { ...prev, email: e.target.value } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Login Username (యూజర్ నేమ్)
                </label>
                <input
                  type="text"
                  value={editingReporter.username}
                  onChange={(e) =>
                    setEditingReporter({ ...editingReporter, username: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Set New Password (Optional, min 4 chars)
                </label>
                <input
                  type="text"
                  value={editRepPass}
                  onChange={(e) => setEditRepPass(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            {/* SECTION 3: LOCATION HIERARCHY (STATE -> DISTRICT -> MANDAL -> VILLAGE -> PIN) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                2. Assigned Location Jurisdiction (రాష్ట్రం → జిల్లా → మండలం)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <select
                    value={editingReporter.stateId}
                    onChange={(e) => {
                      const nextStateId = e.target.value;
                      const stObj = states.find((s) => s.id === nextStateId);
                      const firstDist = districts.find((d) => d.stateId === nextStateId);
                      const firstMandal = firstDist
                        ? getMandalsForDistrict(firstDist.id, mandals, districts, states)[0]
                        : undefined;
                      setEditingReporter({
                        ...editingReporter,
                        stateId: nextStateId,
                        stateName: stObj?.nameEn || '',
                        districtId: firstDist?.id || '',
                        districtName: firstDist?.nameEn || '',
                        mandalId: firstMandal?.id || '',
                        mandalName: firstMandal?.nameEn || '',
                      });
                    }}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                  >
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameEn} ({s.nameTe})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">District</label>
                  <select
                    value={editingReporter.districtId}
                    onChange={(e) => {
                      const nextDistId = e.target.value;
                      const dtObj = districts.find((d) => d.id === nextDistId);
                      const firstMandal = getMandalsForDistrict(
                        nextDistId,
                        mandals,
                        districts,
                        states
                      )[0];
                      setEditingReporter({
                        ...editingReporter,
                        districtId: nextDistId,
                        districtName: dtObj?.nameEn || '',
                        mandalId: firstMandal?.id || '',
                        mandalName: firstMandal?.nameEn || '',
                      });
                    }}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                  >
                    {districts
                      .filter((d) => d.stateId === editingReporter.stateId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nameEn} ({d.nameTe})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mandal</label>
                  <select
                    value={editingReporter.mandalId}
                    onChange={(e) => {
                      const nextMandalId = e.target.value;
                      const mnList = getMandalsForDistrict(
                        editingReporter.districtId,
                        mandals,
                        districts,
                        states
                      );
                      const mnObj = mnList.find((m) => m.id === nextMandalId);
                      setEditingReporter({
                        ...editingReporter,
                        mandalId: nextMandalId,
                        mandalName: mnObj?.nameEn || '',
                      });
                    }}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                  >
                    {getMandalsForDistrict(
                      editingReporter.districtId,
                      mandals,
                      districts,
                      states
                    ).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nameEn} ({m.nameTe})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Village / Town</label>
                  <input
                    type="text"
                    value={editingReporter.villageTown || ''}
                    onChange={(e) =>
                      setEditingReporter({ ...editingReporter, villageTown: e.target.value })
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={editingPrivateDoc?.pinCode || ''}
                    onChange={(e) =>
                      setEditingPrivateDoc((prev) =>
                        prev ? { ...prev, pinCode: e.target.value } : null
                      )
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="sm:col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={editingPrivateDoc?.residentialAddress || ''}
                    onChange={(e) =>
                      setEditingPrivateDoc((prev) =>
                        prev ? { ...prev, residentialAddress: e.target.value } : null
                      )
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Media Experience
                  </label>
                  <input
                    type="text"
                    value={editingPrivateDoc?.experience || ''}
                    onChange={(e) =>
                      setEditingPrivateDoc((prev) =>
                        prev ? { ...prev, experience: e.target.value } : null
                      )
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Previous Media Organization
                  </label>
                  <input
                    type="text"
                    value={editingPrivateDoc?.previousOrganization || ''}
                    onChange={(e) =>
                      setEditingPrivateDoc((prev) =>
                        prev ? { ...prev, previousOrganization: e.target.value } : null
                      )
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: PROFILE PHOTOGRAPH & AADHAAR DOCUMENT UPLOAD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-200 rounded-lg space-y-2.5">
                <div className="font-bold text-slate-800">
                  Profile Photograph (ID Card Photo)
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={editingReporter.photoUrl || '/icon.svg'}
                    alt="Reporter Profile"
                    referrerPolicy="no-referrer"
                    className="w-16 h-20 object-cover rounded border border-red-600 bg-slate-100 shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload New Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          handleImageFileSelect(file, (dataUrl) => {
                            setEditingReporter((prev) =>
                              prev ? { ...prev, photoUrl: dataUrl } : null
                            );
                          });
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      value={editingReporter.photoUrl || ''}
                      onChange={(e) =>
                        setEditingReporter({ ...editingReporter, photoUrl: e.target.value })
                      }
                      placeholder="Or paste photo URL"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg space-y-2.5">
                <div className="font-bold text-slate-800">
                  Private Aadhaar Document (ఆధార్ డాక్యుమెంట్)
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={editingPrivateDoc?.aadhaarDocUrl || '/icon.svg'}
                    alt="Aadhaar Document"
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 object-contain rounded border border-slate-300 bg-slate-100 shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload New Aadhaar</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          handleImageFileSelect(file, (dataUrl) => {
                            setEditingPrivateDoc((prev) =>
                              prev ? { ...prev, aadhaarDocUrl: dataUrl } : null
                            );
                          });
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      value={editingPrivateDoc?.aadhaarDocUrl || ''}
                      onChange={(e) =>
                        setEditingPrivateDoc((prev) =>
                          prev ? { ...prev, aadhaarDocUrl: e.target.value } : null
                        )
                      }
                      placeholder="Or paste Aadhaar scan URL"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setEditingReporter(null);
                  setEditingPrivateDoc(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-md font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  await callAdminApi(
                    'ADMIN_UPDATE_REPORTER',
                    {
                      reporterDocId: editingReporter.id,
                      updates: {
                        reporterId: editingReporter.reporterId,
                        fullName: editingReporter.fullName,
                        gender: editingReporter.gender,
                        mobile: editingReporter.mobile,
                        username: editingReporter.username,
                        stateId: editingReporter.stateId,
                        stateName: editingReporter.stateName,
                        districtId: editingReporter.districtId,
                        districtName: editingReporter.districtName,
                        mandalId: editingReporter.mandalId,
                        mandalName: editingReporter.mandalName,
                        villageTown: editingReporter.villageTown,
                        photoUrl: editingReporter.photoUrl,
                        status: editingReporter.status,
                        approvedAt: editingReporter.approvedAt,
                        expiresAt: editingReporter.expiresAt,
                      },
                      privateUpdates: editingPrivateDoc
                        ? {
                            fatherSpouseName: editingPrivateDoc.fatherSpouseName,
                            dob: editingPrivateDoc.dob,
                            whatsappNumber: editingPrivateDoc.whatsappNumber,
                            email: editingPrivateDoc.email,
                            residentialAddress: editingPrivateDoc.residentialAddress,
                            pinCode: editingPrivateDoc.pinCode,
                            experience: editingPrivateDoc.experience,
                            previousOrganization: editingPrivateDoc.previousOrganization,
                            aadhaarDocUrl: editingPrivateDoc.aadhaarDocUrl,
                          }
                        : undefined,
                      newPassword: editRepPass || undefined,
                    },
                    `Saved all details & Unique Reporter ID (${editingReporter.reporterId || 'Updated'}) for ${editingReporter.fullName}!`
                  );
                  setEditingReporter(null);
                  setEditingPrivateDoc(null);
                  setEditRepPass('');
                }}
                className="px-6 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md font-bold"
              >
                Save All Reporter Details &amp; ID
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESTRUCTIVE ACTION CONFIRMATION DIALOG */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 text-xs">
            <h3 className="text-base font-extrabold text-slate-900">{confirmDialog.title}</h3>
            <p className="text-slate-600">{confirmDialog.message}</p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-slate-100 rounded font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-red-700 text-white rounded font-bold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
