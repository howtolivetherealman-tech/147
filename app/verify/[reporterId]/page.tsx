/* eslint-disable @next/next/no-img-element */
import React from 'react';
import Link from 'next/link';
import { loadPortalDatabase } from '@/lib/server-db';
import { sanitizePublicReporterVerification } from '@/lib/business-rules';
import { ShieldCheck, AlertTriangle, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';

interface VerifyPageProps {
  params: Promise<{ reporterId: string }>;
}

export default async function PublicReporterVerifyPage({ params }: VerifyPageProps) {
  const { reporterId } = await params;
  const decodedId = decodeURIComponent(reporterId).trim().toUpperCase();
  const dbState = loadPortalDatabase();

  const matched = dbState.reporters.find(
    (r) =>
      (r.reporterId && r.reporterId.toUpperCase() === decodedId) ||
      r.id.toUpperCase() === decodedId
  );

  const publicCard =
    matched && matched.reporterId ? sanitizePublicReporterVerification(matched) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src={
                dbState.websiteSettings.logoUrl ||
                '/assets/aistudio/Gemini_Generated_Image_ei76ftei76ftei76_1e454e87.png'
              }
              alt="NETI BHARATHAM"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-lg object-contain bg-slate-950 border border-slate-300 p-0.5"
            />
            {dbState.websiteSettings.secondaryLogoUrl && (
              <img
                src={dbState.websiteSettings.secondaryLogoUrl}
                alt="Channel Emblem"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-contain bg-white border border-amber-400 p-0.5"
              />
            )}
            <div>
              <span className="text-base font-black text-red-700 block leading-none">
                {dbState.websiteSettings.siteNameEn}
              </span>
              <span className="text-xs font-bold text-slate-800 block mt-0.5 leading-none">
                {dbState.websiteSettings.siteNameTe} • QR Press Verification
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Portal</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={
                  dbState.websiteSettings.logoUrl ||
                  '/assets/aistudio/Gemini_Generated_Image_ei76ftei76ftei76_1e454e87.png'
                }
                alt="NETI BHARATHAM Logo"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-lg bg-slate-950 p-0.5 object-contain border border-slate-700 shrink-0"
              />
              <div>
                <h1 className="text-lg font-extrabold tracking-wide">
                  ONLINE PRESS REPORTER ID VERIFICATION
                </h1>
                <p className="text-xs text-slate-300 mt-1">
                  నేటి భారతం ప్రెస్ రిపోర్టర్ అధికారిక గుర్తింపు ధృవీకరణ వ్యవస్థ
                </p>
              </div>
            </div>
            {dbState.websiteSettings.secondaryLogoUrl ? (
              <img
                src={dbState.websiteSettings.secondaryLogoUrl}
                alt="Official Emblem"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full bg-white p-0.5 object-contain border border-amber-400 shrink-0"
              />
            ) : (
              <ShieldCheck className="w-9 h-9 text-red-500 shrink-0" />
            )}
          </div>

          {!publicCard ? (
            <div className="p-8 text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">
                Unverified or Unknown Reporter ID ({decodedId})
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                No approved press identity record matches <strong>{decodedId}</strong> in the NETI BHARATHAM registry.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-md"
              >
                Return to Portal
              </Link>
            </div>
          ) : (
            <div className="p-6 sm:p-8 space-y-6">
              <div
                className={`p-4 rounded-lg border flex items-center justify-between ${
                  publicCard.status === 'ACTIVE'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {publicCard.status === 'ACTIVE' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
                  )}
                  <div>
                    <div className="text-sm font-extrabold">
                      CREDENTIAL STATUS: {publicCard.status}
                    </div>
                    <div className="text-xs opacity-90">
                      {publicCard.status === 'ACTIVE'
                        ? 'This Press Reporter is currently accredited and authorized by NETI BHARATHAM.'
                        : 'This Press Reporter membership has expired or is inactive.'}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold tabular-nums">
                  {publicCard.reporterId}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-200">
                <img
                  src={publicCard.photoUrl || '/icon.svg'}
                  alt={publicCard.fullName}
                  referrerPolicy="no-referrer"
                  className="w-24 h-28 rounded-lg border-2 border-red-700 object-cover bg-slate-100"
                />
                <div className="text-center sm:text-left space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-red-700">
                    {publicCard.designation}
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900">{publicCard.fullName}</h2>
                  <p className="text-xs font-mono text-slate-600">
                    Unique ID: <strong>{publicCard.reporterId}</strong>
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <dt className="text-xs text-slate-500">State (రాష్ట్రం)</dt>
                  <dd className="font-bold text-slate-900 mt-0.5">{publicCard.stateName}</dd>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <dt className="text-xs text-slate-500">District (జిల్లా)</dt>
                  <dd className="font-bold text-slate-900 mt-0.5">{publicCard.districtName}</dd>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <dt className="text-xs text-slate-500">Mandal (మండలం)</dt>
                  <dd className="font-bold text-slate-900 mt-0.5">{publicCard.mandalName}</dd>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <dt className="text-xs text-slate-500">Verified Mobile</dt>
                  <dd className="font-mono font-bold text-slate-900 mt-0.5 tabular-nums">
                    {publicCard.mobile}
                  </dd>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <dt className="text-xs text-slate-500">Date of Issue</dt>
                  <dd className="font-mono font-bold text-slate-900 mt-0.5 tabular-nums">
                    {publicCard.issuedAt}
                  </dd>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <dt className="text-xs text-slate-500">Expiry Date (6 Months Validity)</dt>
                  <dd className="font-mono font-bold text-slate-900 mt-0.5 tabular-nums">
                    {publicCard.expiresAt}
                  </dd>
                </div>
              </dl>

              <div className="p-3.5 bg-slate-100 rounded-lg border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
                <Lock className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Privacy &amp; Security Notice:</strong> In compliance with NETI BHARATHAM security standards, only approved public press accreditation fields are displayed here. Confidential Aadhaar documents, passwords, and private residential addresses are strictly isolated and never exposed publicly.
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
