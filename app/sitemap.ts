import type { MetadataRoute } from 'next';
import { loadPortalDatabase } from '@/lib/server-db';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.APP_URL || 'https://netibhaaratham.com';
  const dbState = loadPortalDatabase();

  const publishedNewsEntries: MetadataRoute.Sitemap = dbState.news
    .filter((n) => n.status === 'PUBLISHED')
    .map((article) => ({
      url: `${baseUrl}/news/${article.slug}`,
      lastModified: new Date(article.updatedAt || article.createdAt),
      changeFrequency: 'hourly',
      priority: 0.9,
    }));

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/verify/NB-TG-HYD-2026-0001',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  }));

  return [...staticRoutes, ...publishedNewsEntries];
}
