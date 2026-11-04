import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { loadPortalDatabase } from '@/lib/server-db';
import { ArrowLeft, Calendar, MapPin, UserCheck, Share2, Eye, ShieldCheck, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dbState = loadPortalDatabase();
  const article = dbState.news.find((n) => n.slug === slug && n.status === 'PUBLISHED');

  if (!article) {
    return {
      title: 'Article Not Found | NETI BHARATHAM – నేటి భారతం',
      description: 'Requested Telugu news report could not be found or is awaiting editorial approval.',
    };
  }

  const baseUrl = process.env.APP_URL || 'https://netibhaaratham.com';
  const canonicalUrl = `${baseUrl}/news/${article.slug}`;

  return {
    title: article.seoTitle || `${article.headline} | NETI BHARATHAM – నేటి భారతం`,
    description: article.seoDescription || article.subheadline || article.headline,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'article',
      title: article.seoTitle || article.headline,
      description: article.seoDescription || article.subheadline,
      url: canonicalUrl,
      siteName: 'NETI BHARATHAM – నేటి భారతం',
      publishedTime: article.createdAt,
      modifiedTime: article.updatedAt,
      images: [
        {
          url: article.featuredImage || '/images/hero-secretariat.svg',
          alt: article.imageCaption || article.headline,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.seoTitle || article.headline,
      description: article.seoDescription || article.subheadline,
    },
  };
}

export default async function NewsArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const dbState = loadPortalDatabase();
  const article = dbState.news.find((n) => n.slug === slug && n.status === 'PUBLISHED');

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">వార్త కనుగొనబడలేదు (Article Not Found)</h1>
        <p className="text-sm text-slate-600 mt-2 max-w-md">
          This article may be awaiting Super Admin approval or the URL has changed.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to NETI BHARATHAM Home</span>
        </Link>
      </div>
    );
  }

  const relatedNews = dbState.news
    .filter((n) => n.status === 'PUBLISHED' && n.id !== article.id)
    .slice(0, 4);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.headline,
    description: article.seoDescription || article.subheadline,
    image: [article.featuredImage],
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    author: [
      {
        '@type': 'Person',
        name: article.reporterName,
        identifier: article.reporterId,
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: 'NETI BHARATHAM – నేటి భారతం',
      url: 'https://netibhaaratham.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://netibhaaratham.com/icon.svg',
      },
    },
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Editorial Bar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
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
              <span className="text-lg font-black tracking-tight text-red-700 block leading-none">
                {dbState.websiteSettings.siteNameEn}
              </span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5 leading-none">
                {dbState.websiteSettings.siteNameTe}
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Front Page (ముఖచిత్రం)</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {dbState.websiteSettings.bannerEnabled && dbState.websiteSettings.bannerImageUrl && (
          <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 bg-slate-950">
            <img
              src={dbState.websiteSettings.bannerImageUrl}
              alt={dbState.websiteSettings.bannerTitle || dbState.websiteSettings.siteNameEn}
              referrerPolicy="no-referrer"
              className="w-full max-h-[220px] object-cover"
            />
            {dbState.websiteSettings.bannerTitle && (
              <div className="bg-slate-950 text-white px-4 py-2 text-xs font-bold">
                {dbState.websiteSettings.bannerTitle}
              </div>
            )}
          </div>
        )}
        {/* Clean Unboxed Location & Category Hierarchy Trail */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-red-700">
          <span>{article.categoryName}</span>
          <span aria-hidden="true">·</span>
          <span>India</span>
          <span aria-hidden="true">/</span>
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
          {article.villageTown && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-slate-600">{article.villageTown}</span>
            </>
          )}
        </div>

        {/* Headline & Subheadline */}
        <h1 className="mt-3 text-2xl sm:text-4xl font-extrabold text-slate-950 leading-tight">
          {article.headline}
        </h1>
        {article.subheadline && (
          <p className="mt-3 text-base sm:text-lg font-medium text-slate-600 leading-relaxed">
            {article.subheadline}
          </p>
        )}

        {/* Reporter Attribution & Dateline */}
        <div className="mt-5 py-3.5 border-y border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
              <UserCheck className="w-4 h-4 text-red-700" />
              <span>{article.reporterName}</span>
            </span>
            <span aria-hidden="true">·</span>
            <Link
              href={`/verify/${encodeURIComponent(article.reporterId)}`}
              className="inline-flex items-center gap-1 font-mono font-semibold text-blue-900 hover:underline"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Reporter ID: {article.reporterId}</span>
            </Link>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {[article.mandalName, article.districtName, article.stateName]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono tabular-nums">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(article.createdAt).toLocaleDateString('en-IN')}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{article.views.toLocaleString()} views</span>
            </span>
          </div>
        </div>

        {/* Featured Image */}
        <figure className="mt-6 rounded-lg overflow-hidden border border-slate-200 bg-slate-950">
          <img
            src={article.featuredImage || '/images/hero-secretariat.svg'}
            alt={article.imageCaption || article.headline}
            referrerPolicy="no-referrer"
            className="w-full max-h-[460px] object-cover"
          />
          {article.imageCaption && (
            <figcaption className="px-4 py-2.5 bg-slate-50 text-xs text-slate-600 border-t border-slate-200">
              {article.imageCaption}
            </figcaption>
          )}
        </figure>

        {/* Full Article Prose */}
        <article className="mt-8 max-w-3xl space-y-5 text-base sm:text-lg text-slate-800 leading-relaxed whitespace-pre-line">
          {article.content}
        </article>

        {/* Tags & Share Strip */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-bold text-slate-800">Tags:</span>
            {article.tags.map((tag, i) => (
              <React.Fragment key={tag}>
                {i > 0 && <span aria-hidden="true">·</span>}
                <span>#{tag}</span>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Share2 className="w-4 h-4 text-red-700" />
            <span>Share on WhatsApp / X / Facebook</span>
          </div>
        </div>

        {/* Related Stories */}
        {relatedNews.length > 0 && (
          <section className="mt-12 pt-8 border-t border-slate-200">
            <h2 className="text-lg font-extrabold text-slate-900">
              మరిన్ని వార్తలు (More Stories from NETI BHARATHAM)
            </h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {relatedNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group border border-slate-200 rounded-lg p-4 hover:border-red-700 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs text-slate-500">
                      <span>{item.categoryName}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{item.districtName || item.stateName}</span>
                    </div>
                    <h3 className="mt-1.5 text-base font-bold text-slate-900 group-hover:text-red-700 leading-snug">
                      {item.headline}
                    </h3>
                  </div>
                  <div className="mt-3 text-xs font-bold text-red-700 inline-flex items-center gap-1">
                    <span>పూర్తిగా చదవండి</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
