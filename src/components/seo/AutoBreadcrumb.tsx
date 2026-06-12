'use client';

import { usePathname } from 'next/navigation';
import { BreadcrumbJsonLd } from './JsonLd';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://menu.sagansa.id';

const PATH_LABELS: Record<string, string> = {
  order: 'Pesanan',
  success: 'Berhasil',
  failed: 'Gagal',
  'test-api': 'Test API',
  login: 'Masuk',
  register: 'Daftar',
};

export function AutoBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return (
      <BreadcrumbJsonLd
        items={[{ name: 'Home', url: SITE_URL }]}
      />
    );
  }

  const items = [
    { name: 'Home', url: SITE_URL },
    ...segments.map((segment, index) => ({
      name: PATH_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      url: `${SITE_URL}/${segments.slice(0, index + 1).join('/')}`,
    })),
  ];

  return <BreadcrumbJsonLd items={items} />;
}