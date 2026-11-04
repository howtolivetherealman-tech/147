import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#B91C1C',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'NETI BHARATHAM – నేటి భారతం | Official Telugu Digital News Portal',
  description:
    'NETI BHARATHAM (netibhaaratham.com) – Official Telugu Digital News Channel from Hyderabad, Telangana. Live National, State, District & Mandal News, Press Reporter Portal, and Online QR ID Verification.',
  metadataBase: new URL(process.env.APP_URL || 'https://netibhaaratham.com'),
  alternates: {
    canonical: '/',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'నేటి భారతం',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'NETI BHARATHAM – నేటి భారతం | Telugu Digital News Portal',
    description:
      'Breaking Telugu News across India, Telangana & Andhra Pradesh States, Districts, and Mandals. Official Press Reporter Portal & QR Verification.',
    type: 'website',
    siteName: 'NETI BHARATHAM – నేటి భారతం',
    locale: 'te_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NETI BHARATHAM – నేటి భారతం | Telugu Digital News Portal',
    description:
      'Official Telugu Digital News Network from Hyderabad, Telangana (netibhaaratham.com).',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'NETI BHARATHAM – నేటి భారతం',
    url: 'https://netibhaaratham.com',
    email: 'netibhaarathamtelugu@gmail.com',
    logo: 'https://netibhaaratham.com/icon.svg',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Hyderabad',
      addressRegion: 'Telangana',
      addressCountry: 'IN',
    },
  };

  return (
    <html lang="te">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Noto+Sans+Telugu:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
