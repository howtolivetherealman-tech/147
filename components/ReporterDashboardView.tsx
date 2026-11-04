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
  NotificationRecord,
} from '@/lib/default-data';
import {
  canReporterUploadNews,
  getDaysRemaining,
} from '@/lib/business-rules';
import { PressIdCardGenerator } from './PressIdCardGenerator';
import {
  FileText,
  Upload,
  CreditCard,
  Megaphone,
  UserCog,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  LogOut,
  PlusCircle,
} from 'lucide-react';

interface ReporterDashboardViewProps {
  reporter: ReporterRecord;
  privateDoc: ReporterPrivateDocRecord | null;
  myNews: NewsArticleRecord[];
  myAds: AdvertisementRecord[];
  myNotifications: NotificationRecord[];
  states: StateRecord[];
  districts: DistrictRecord[];
  mandals: MandalRecord[];
  categories: NewsCategoryRecord[];
  websiteSettings: WebsiteSettingsRecord;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
  onOpenPublicVerify: (reporterId: string) => void;
}

export const ReporterDashboardView: React.FC<ReporterDashboardViewProps> = ({
  reporter,
  privateDoc,
  myNews,
  myAds,
  myNotifications,
  states,
  districts,
  mandals,
  categories,
  websiteSettings,
  onRefresh,
  onLogout,
  onOpenPublicVerify,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'upload_news' | 'id_card' | 'ads' | 'profile_settings'
  >('overview');

  const uploadPermission = useMemo(() => canReporterUploadNews(reporter), [reporter]);
  const daysRemaining = useMemo(() => getDaysRemaining(reporter.expiresAt), [reporter.expiresAt]);

  // News Upload State (18 required fields)
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-state');
  const [newsStateId, setNewsStateId] = useState(reporter.stateId || 'st-tg');
  const newsDistricts = useMemo(
    () => districts.filter((d) => d.stateId === newsStateId && d.active),
    [districts, newsStateId]
  );
  const [newsDistrictId, setNewsDistrictId] = useState(
    reporter.districtId || newsDistricts[0]?.id || 'dt-tg-hyd'
  );
  const newsMandals = useMemo(
    () => getMandalsForDistrict(newsDistrictId, mandals, districts, states),
    [newsDistrictId, mandals, districts, states]
  );
  const [newsMandalId, setNewsMandalId] = useState(
    reporter.mandalId || newsMandals[0]?.id || 'mn-hyd-khairatabad'
  );
  const [villageTown, setVillageTown] = useState(reporter.villageTown || '');
  const [featuredImage, setFeaturedImage] = useState('/images/hero-secretariat.svg');
  const [galleryImages, setGalleryImages] = useState<string[]>(['/images/hero-secretariat.svg']);
  const [imageCaption, setImageCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tags, setTags] = useState('Telangana, LocalNews, NetiBharatham');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [language, setLanguage] = useState<'te' | 'en'>('te');
  const [isBreaking, setIsBreaking] = useState(false);

  // Private Advertisement State (Max 2 Images)
  const [adTitle, setAdTitle] = useState('');
  const [adBusinessName, setAdBusinessName] = useState('');
  const [adContactNumber, setAdContactNumber] = useState(reporter.mobile || '');
  const [adDescription, setAdDescription] = useState('');
  const [adImage1, setAdImage1] = useState('/images/news-agriculture.svg');
  const [adImage2, setAdImage2] = useState('');
  const [adLinkUrl, setAdLinkUrl] = useState('');
  const [adTargetStateId, setAdTargetStateId] = useState(reporter.stateId || 'st-tg');
  const adDistricts = useMemo(
    () => districts.filter((d) => d.stateId === adTargetStateId && d.active),
    [districts, adTargetStateId]
  );
  const [adTargetDistrictId, setAdTargetDistrictId] = useState(
    reporter.districtId || adDistricts[0]?.id || 'dt-tg-hyd'
  );
  const adMandals = useMemo(
    () => getMandalsForDistrict(adTargetDistrictId, mandals, districts, states),
    [adTargetDistrictId, mandals, districts, states]
  );
  const [adTargetMandalId, setAdTargetMandalId] = useState(
    reporter.mandalId || adMandals[0]?.id || 'mn-hyd-khairatabad'
  );
  const [adStartDate, setAdStartDate] = useState('2026-11-05');
  const [adExpiryDate, setAdExpiryDate] = useState('2026-12-05');

  // Restricted Profile Edit State (ONLY Residential Address & Password)
  const [residentialAddress, setResidentialAddress] = useState(
    privateDoc?.residentialAddress || ''
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const publishedCount = myNews.filter((n) => n.status === 'PUBLISHED').length;
  const pendingCount = myNews.filter((n) => n.status === 'PENDING').length;
  const rejectedCount = myNews.filter((n) => n.status === 'REJECTED').length;

  const handleImageFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    cb: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => cb(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusFeedback(null);

    if (!uploadPermission.allowed) {
      setStatusFeedback({
        type: 'error',
        message: uploadPermission.reason || 'You are not permitted to upload news.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_NEWS',
          actor: { role: 'REPORTER', reporterDocId: reporter.id },
          payload: {
            reporterDocId: reporter.id,
            headline,
            subheadline,
            content,
            categoryId,
            stateId: newsStateId,
            districtId: newsDistrictId,
            mandalId: newsMandalId,
            villageTown,
            featuredImage,
            galleryImages,
            imageCaption: imageCaption || headline,
            videoUrl,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            seoTitle: seoTitle || headline,
            seoDescription: seoDescription || subheadline || headline,
            language,
            isBreaking,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setStatusFeedback({ type: 'error', message: data.error || 'Failed to submit news.' });
      } else {
        setStatusFeedback({
          type: 'success',
          message:
            'వార్త వెంటనే వెబ్‌సైట్‌లో ప్రచురించబడింది! (News published immediately on NETI BHARATHAM without waiting for approval).',
        });
        setHeadline('');
        setSubheadline('');
        setContent('');
        setImageCaption('');
        await onRefresh();
        setActiveTab('overview');
      }
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Network error.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusFeedback(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_AD',
          actor: { role: 'REPORTER', reporterDocId: reporter.id },
          payload: {
            reporterDocId: reporter.id,
            title: adTitle,
            businessName: adBusinessName,
            contactNumber: adContactNumber,
            description: adDescription,
            image1: adImage1,
            image2: adImage2,
            linkUrl: adLinkUrl,
            targetStateId: adTargetStateId,
            targetDistrictId: adTargetDistrictId,
            targetMandalId: adTargetMandalId,
            startDate: adStartDate,
            expiryDate: adExpiryDate,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setStatusFeedback({ type: 'error', message: data.error || 'Failed to submit ad.' });
      } else {
        setStatusFeedback({
          type: 'success',
          message:
            'ప్రైవేట్ ప్రకటన వెంటనే వెబ్‌సైట్‌లో ప్రచురించబడింది! (Advertisement is now ACTIVE on NETI BHARATHAM without waiting for approval).',
        });
        setAdTitle('');
        setAdBusinessName('');
        setAdDescription('');
        await onRefresh();
      }
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Network error.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestrictedProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusFeedback(null);

    if (newPassword && newPassword !== confirmNewPassword) {
      setStatusFeedback({
        type: 'error',
        message: 'New password and confirmation password do not match.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REPORTER_UPDATE_PROFILE',
          actor: { role: 'REPORTER', reporterDocId: reporter.id },
          payload: {
            reporterDocId: reporter.id,
            residentialAddress,
            newPassword: newPassword || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setStatusFeedback({ type: 'error', message: data.error || 'Update failed.' });
      } else {
        setStatusFeedback({
          type: 'success',
          message:
            'మీ నివాస చిరునామా / పాస్‌వర్డ్ విజయవంతంగా అప్‌డేట్ చేయబడింది! (Permitted fields updated).',
        });
        setNewPassword('');
        setConfirmNewPassword('');
        await onRefresh();
      }
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error updating profile.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Reporter Header & 6-Month Validity Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border-b-4 border-red-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <img
              src={
                websiteSettings.logoUrl ||
                '/assets/aistudio/Gemini_Generated_Image_ei76ftei76ftei76_1e454e87.png'
              }
              alt={websiteSettings.siteNameEn}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-lg object-contain border border-slate-700 bg-slate-950 p-0.5 shrink-0"
            />
            {websiteSettings.secondaryLogoUrl && (
              <img
                src={websiteSettings.secondaryLogoUrl}
                alt="Channel Emblem"
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-contain border border-amber-400 bg-white p-0.5 shrink-0"
              />
            )}
          </div>
          <img
            src={
              reporter.photoUrl ||
              websiteSettings.logoUrl ||
              '/assets/aistudio/Gemini_Generated_Image_ei76ftei76ftei76_1e454e87.png'
            }
            alt={reporter.fullName}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-lg object-cover border-2 border-red-600 bg-white shrink-0"
          />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-red-400">
              NETI BHARATHAM PRESS REPORTER DASHBOARD
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-0.5">{reporter.fullName}</h1>
            <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-white">
                ID: {reporter.reporterId || 'AWAITING APPROVAL'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{reporter.mandalName}</span>
              <span aria-hidden="true">·</span>
              <span>{reporter.districtName}</span>
              <span aria-hidden="true">·</span>
              <span>{reporter.stateName}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-xs">
            <div className="text-slate-400">Account &amp; 6-Month Validity</div>
            <div className="font-bold mt-0.5 flex items-center gap-2 tabular-nums">
              {uploadPermission.allowed ? (
                <span className="text-emerald-400">
                  ACTIVE • Expires {reporter.expiresAt} ({daysRemaining} days left)
                </span>
              ) : (
                <span className="text-amber-400">
                  STATUS: {uploadPermission.effectiveStatus}
                  {reporter.expiresAt ? ` (Expired ${reporter.expiresAt})` : ''}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500">Total Uploaded News</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
            {myNews.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500">Published News</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono tabular-nums">
            {publishedCount}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500">Pending Review</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1 font-mono tabular-nums">
            {pendingCount}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500">Rejected News</div>
          <div className="text-2xl font-extrabold text-red-700 mt-1 font-mono tabular-nums">
            {rejectedCount}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 col-span-2 sm:col-span-1">
          <div className="text-xs text-slate-500">Ad Submissions</div>
          <div className="text-2xl font-extrabold text-blue-900 mt-1 font-mono tabular-nums">
            {myAds.length}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'overview'
              ? 'bg-red-700 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>My News &amp; Notifications</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload_news')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'upload_news'
              ? 'bg-red-700 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Upload News (వార్త అప్‌లోడ్)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('id_card')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'id_card'
              ? 'bg-red-700 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Digital Press ID Card</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ads')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'ads'
              ? 'bg-red-700 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Private Advertisements</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile_settings')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'profile_settings'
              ? 'bg-red-700 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <UserCog className="w-3.5 h-3.5" />
          <span>Profile &amp; Address / Password</span>
        </button>
      </div>

      {statusFeedback && (
        <div
          role="alert"
          className={`p-4 rounded-lg border text-xs font-semibold flex items-center justify-between ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span>{statusFeedback.message}</span>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
            className="underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: OVERVIEW & MY NEWS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {!uploadPermission.allowed && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-bold text-sm">
                  News Upload Locked — Account Status: {uploadPermission.effectiveStatus}
                </div>
                <p>{uploadPermission.reason}</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-base font-extrabold text-slate-900">
                My Submitted News Articles ({myNews.length})
              </h2>
              {uploadPermission.allowed && (
                <button
                  type="button"
                  onClick={() => setActiveTab('upload_news')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-md"
                >
                  + Upload New Article
                </button>
              )}
            </div>

            {myNews.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                No news articles uploaded yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-200">
                {myNews.map((article) => (
                  <div
                    key={article.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-bold text-slate-900">{article.categoryName}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {[article.mandalName, article.districtName, article.stateName]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {new Date(article.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        <a
                          href={`/news/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-red-700 hover:underline"
                        >
                          {article.headline}
                        </a>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Address: <span className="font-mono">/news/{article.slug}</span> • Live on NETI BHARATHAM
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <a
                        href={`/news/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-md"
                      >
                        పూర్తిగా చదవండి ↗
                      </a>
                      <span
                        className={`text-xs font-extrabold uppercase tracking-wider ${
                          article.status === 'PUBLISHED'
                            ? 'text-emerald-700'
                            : article.status === 'PENDING'
                            ? 'text-amber-600'
                            : 'text-red-700'
                        }`}
                      >
                        {article.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-200">
              Official Desk Notifications ({myNotifications.length})
            </h2>
            {myNotifications.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No notifications yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {myNotifications.map((n) => (
                  <div key={n.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{n.title}</span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {new Date(n.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: UNLIMITED NEWS UPLOAD SYSTEM */}
      {activeTab === 'upload_news' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-lg font-extrabold text-slate-900">
              Unlimited News Upload System (వార్తల అప్‌లోడ్ విభాగం)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              అప్రూవల్ అవసరం లేకుండానే రిపోర్టర్ అప్‌లోడ్ చేసిన వార్తలు వెంటనే వెబ్‌సైట్‌లో ప్రచురించబడతాయి (Instant Live Publication — No Admin Approval Required).
            </p>
          </div>

          {!uploadPermission.allowed ? (
            <div className="my-8 p-6 rounded-xl bg-red-50 border border-red-200 text-center space-y-3">
              <Lock className="w-10 h-10 text-red-700 mx-auto" />
              <h3 className="text-base font-extrabold text-red-950">
                News Upload Permission Restricted ({uploadPermission.effectiveStatus})
              </h3>
              <p className="text-xs text-red-800 max-w-lg mx-auto">{uploadPermission.reason}</p>
            </div>
          ) : (
            <form onSubmit={handleNewsSubmit} className="mt-6 space-y-5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    1. News Headline (వార్త శీర్షిక) *
                  </label>
                  <input
                    type="text"
                    required
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Enter compelling Telugu or English headline"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    18. Assigned Reporter ID (Auto)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={reporter.reporterId || reporter.id}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-700 font-mono rounded-md"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    2. Subheadline (ఉప శీర్షిక)
                  </label>
                  <input
                    type="text"
                    value={subheadline}
                    onChange={(e) => setSubheadline(e.target.value)}
                    placeholder="Concise summary deck"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    3. Full News Content (పూర్తి వార్తా కథనం - Unlimited Length Supported) *
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write complete detailed news report..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    4. News Category (విభాగం) *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    {categories
                      .filter((c) => c.active)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nameEn} ({cat.nameTe})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    5. State (రాష్ట్రం) *
                  </label>
                  <select
                    value={newsStateId}
                    onChange={(e) => {
                      const nextSt = e.target.value;
                      setNewsStateId(nextSt);
                      const dts = districts.filter((d) => d.stateId === nextSt && d.active);
                      const firstDt = dts[0]?.id || '';
                      setNewsDistrictId(firstDt);
                      const mns = getMandalsForDistrict(firstDt, mandals, districts, states);
                      setNewsMandalId(mns[0]?.id || '');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    {states
                      .filter((s) => s.active)
                      .map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.nameEn} ({st.nameTe})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    6. District (జిల్లా) *
                  </label>
                  <select
                    value={newsDistrictId}
                    onChange={(e) => {
                      const nextDt = e.target.value;
                      setNewsDistrictId(nextDt);
                      const mns = getMandalsForDistrict(nextDt, mandals, districts, states);
                      setNewsMandalId(mns[0]?.id || '');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    {newsDistricts.map((dt) => (
                      <option key={dt.id} value={dt.id}>
                        {dt.nameEn} ({dt.nameTe})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    7. Mandal / Tehsil / Taluk *
                  </label>
                  <select
                    value={newsMandalId}
                    onChange={(e) => setNewsMandalId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    {newsMandals.map((mn) => (
                      <option key={mn.id} value={mn.id}>
                        {mn.nameEn} ({mn.nameTe})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    8. Village / Town (గ్రామం / పట్టణం)
                  </label>
                  <input
                    type="text"
                    value={villageTown}
                    onChange={(e) => setVillageTown(e.target.value)}
                    placeholder="Locality or Town"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    16. News Language (భాష)
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'te' | 'en')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="te">Telugu (తెలుగు)</option>
                    <option value="en">English (ఇంగ్లీష్)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    9 &amp; 10. Featured &amp; Gallery Images (Camera / Gallery)
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md bg-slate-50 hover:bg-slate-100 text-xs font-semibold w-full">
                    <Upload className="w-4 h-4 text-red-700" />
                    <span>Upload News Photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      capture="environment"
                      onChange={(e) =>
                        handleImageFileSelect(e, (url) => {
                          setFeaturedImage(url);
                          setGalleryImages((prev) => [url, ...prev.slice(0, 3)]);
                        })
                      }
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    11. Image Caption
                  </label>
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="Photo description & location"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    12. Video URL (Optional YouTube/Video link)
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    13. News Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    14. SEO Title
                  </label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="English/Telugu SEO Headline"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    15. SEO Description
                  </label>
                  <input
                    type="text"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Search engine meta description"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-red-700">
                  <input
                    type="checkbox"
                    checked={isBreaking}
                    onChange={(e) => setIsBreaking(e.target.checked)}
                    className="rounded border-slate-300 text-red-700"
                  />
                  <span>17. Request Breaking News Ticker Priority (బ్రేకింగ్ న్యూస్)</span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-md"
                >
                  {submitting ? 'Publishing Article...' : 'Publish News Immediately (వార్తను వెంటనే ప్రచురించండి)'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: DIGITAL PRESS ID CARD */}
      {activeTab === 'id_card' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          {reporter.status === 'PENDING' || !reporter.reporterId ? (
            <div className="py-12 text-center space-y-3">
              <Clock className="w-10 h-10 text-amber-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">
                Press Identity Card Pending Super Admin Approval
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Your Reporter ID card and 6-month validity QR code will be generated automatically as soon as Super Admin approves your application.
              </p>
            </div>
          ) : (
            <PressIdCardGenerator
              reporter={reporter}
              websiteSettings={websiteSettings}
              onOpenPublicVerify={onOpenPublicVerify}
            />
          )}
        </div>
      )}

      {/* TAB 4: PRIVATE ADVERTISEMENT SYSTEM (MAX 2 IMAGES) */}
      {activeTab === 'ads' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-200">
              Submit Private Advertisement (ప్రైవేట్ ప్రకటన సమర్పణ - Max 2 Images)
            </h2>
            <form onSubmit={handleAdSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Advertisement Title *
                </label>
                <input
                  type="text"
                  required
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  placeholder="e.g., Grand Showroom Opening Offer"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Business / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={adBusinessName}
                    onChange={(e) => setAdBusinessName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={adContactNumber}
                    onChange={(e) => setAdContactNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Advertisement Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={adDescription}
                  onChange={(e) => setAdDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              {/* Strictly 2 Image Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Advertisement Image 1 (Required) *
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold">
                    <Upload className="w-3.5 h-3.5 text-red-700" />
                    <span>Upload Slot 1</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => handleImageFileSelect(e, setAdImage1)}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Advertisement Image 2 (Optional - Max 2)
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold">
                    <Upload className="w-3.5 h-3.5 text-red-700" />
                    <span>Upload Slot 2</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => handleImageFileSelect(e, setAdImage2)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Advertisement Target Link (Optional)
                </label>
                <input
                  type="url"
                  value={adLinkUrl}
                  onChange={(e) => setAdLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target State</label>
                  <select
                    value={adTargetStateId}
                    onChange={(e) => setAdTargetStateId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    {states
                      .filter((s) => s.active)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nameEn}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target District</label>
                  <select
                    value={adTargetDistrictId}
                    onChange={(e) => setAdTargetDistrictId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    {adDistricts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Mandal</label>
                  <select
                    value={adTargetMandalId}
                    onChange={(e) => setAdTargetMandalId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    {adMandals.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valid From *</label>
                  <input
                    type="date"
                    required
                    value={adStartDate}
                    onChange={(e) => setAdStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valid Until *</label>
                  <input
                    type="date"
                    required
                    value={adExpiryDate}
                    onChange={(e) => setAdExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-md"
              >
                {submitting ? 'Publishing...' : 'Publish Advertisement Immediately (ప్రకటనను వెంటనే ప్రచురించండి)'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-200">
              My Advertisement Submissions ({myAds.length})
            </h2>
            {myAds.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                No advertisements submitted yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-200">
                {myAds.map((ad) => (
                  <div key={ad.id} className="py-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{ad.title}</span>
                      <span
                        className={`font-extrabold ${
                          ad.status === 'ACTIVE' ? 'text-emerald-700' : 'text-amber-600'
                        }`}
                      >
                        {ad.status}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      {ad.businessName} • {ad.contactNumber}
                    </p>
                    <p className="text-slate-500 font-mono tabular-nums">
                      Validity: {ad.startDate} to {ad.expiryDate} • Payment: {ad.paymentStatus}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PROFILE & STRICT EDIT PERMISSIONS (ONLY PASSWORD & RESIDENTIAL ADDRESS) */}
      {activeTab === 'profile_settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Read-Only Locked Core Identity Fields */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Locked Press Accreditation Fields (సూపర్ అడ్మిన్ మాత్రమే మార్చగలరు)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Per NETI BHARATHAM security rules, reporters cannot modify core identity, location, or Aadhaar fields.
                </p>
              </div>
              <Lock className="w-5 h-5 text-slate-400 shrink-0" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Full Name (Locked)</span>
                <strong className="text-slate-900">{reporter.fullName}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Unique Reporter ID (Locked)</span>
                <strong className="text-slate-900 font-mono">
                  {reporter.reporterId || 'PENDING'}
                </strong>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Date of Birth (Locked)</span>
                <strong className="text-slate-900 font-mono">{privateDoc?.dob || 'Locked'}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Mobile Number (Locked)</span>
                <strong className="text-slate-900 font-mono">{reporter.mobile}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Email Address (Locked)</span>
                <strong className="text-slate-900">{privateDoc?.email || 'Locked'}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">State / District / Mandal (Locked)</span>
                <strong className="text-slate-900">
                  {reporter.mandalName}, {reporter.districtName}, {reporter.stateName}
                </strong>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Aadhaar Document &amp; Photo (Locked)</span>
                <strong className="text-emerald-700">Verified in Private Vault</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Approval Status (Locked)</span>
                <strong className="text-slate-900">{reporter.status}</strong>
              </div>
            </div>
          </div>

          {/* Editable Section: ONLY Residential Address & Password */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-200">
              Permitted Reporter Updates (1. Residential Address &amp; 2. Password Only)
            </h2>
            <form onSubmit={handleRestrictedProfileSave} className="mt-4 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  1. Complete Residential Address (నివాస చిరునామా మార్పు)
                </label>
                <textarea
                  rows={3}
                  required
                  value={residentialAddress}
                  onChange={(e) => setResidentialAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  2. New Password (పాస్‌వర్డ్ మార్పు - Leave blank to keep current password)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password (min 8 chars)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Saving Changes...' : 'Save Address / Password'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
