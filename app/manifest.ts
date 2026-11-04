import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'NETI BHARATHAM – నేటి భారతం Telugu News Portal',
    short_name: 'నేటి భారతం',
    description:
      'Official Telugu Digital News Channel (netibhaaratham.com) from Hyderabad, Telangana. Breaking National, State, District & Mandal News.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#B91C1C',
    icons: [
      {
        src: '/icon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
