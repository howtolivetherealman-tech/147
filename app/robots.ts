import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || 'https://netibhaaratham.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin-private/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
