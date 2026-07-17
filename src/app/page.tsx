import type { Metadata } from 'next';
import { HomeContent } from '@/components/HomeContent';
import apiService from '@/lib/api';
import { resolveImageUrl } from '@/lib/images';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://menu.sagansa.id';
const SITE_NAME = 'Web Order by Sagansa';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

async function resolveStoreInfo(params: { [key: string]: string | string[] | undefined }) {
  const tenantId = firstValue(params.tenantId);
  const storeId = firstValue(params.storeId);

  if (!tenantId || !storeId) {
    return null;
  }

  try {
    const [tenantRes, storeRes] = await Promise.all([
      apiService.getPublicTenants().then(res => res.data.find(t => t.id === tenantId)),
      apiService.getPublicStores(tenantId).then(res => res.data.find(s => s.id === storeId)),
    ]);

    if (!tenantRes || !storeRes) {
      return null;
    }

    return {
      tenantName: tenantRes.name as string,
      storeName: storeRes.name as string,
      nickname: (storeRes.nickname as string) || undefined,
      logo: (storeRes.email_receipt_logo as string) || null,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const tenantId = firstValue(params.tenantId);
  const storeId = firstValue(params.storeId);
  const storeInfo = await resolveStoreInfo(params);

  if (!storeInfo) {
    return {
      title: SITE_NAME,
      description:
        'Pesan menu makanan & minuman langsung dari HP kamu. Sistem pemesanan online untuk restoran, kafe, dan bisnis F&B yang terhubung dengan SAGANSA.',
    };
  }

  const storeTitle = `${storeInfo.storeName} — ${SITE_NAME}`;
  const storeDescription = storeInfo.nickname
    ? `Lihat dan pesan menu dari ${storeInfo.storeName} (${storeInfo.nickname}). Pemesanan online cepat & mudah melalui ${SITE_NAME}.`
    : `Lihat dan pesan menu dari ${storeInfo.storeName}. Pemesanan online cepat & mudah melalui ${SITE_NAME}.`;

  const logoUrl = storeInfo.logo ? resolveImageUrl(storeInfo.logo) : null;
  const canonicalUrl = `${SITE_URL}/?tenantId=${tenantId}&storeId=${storeId}`;

  return {
    title: storeTitle,
    description: storeDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: storeTitle,
      description: storeDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      ...(logoUrl ? { images: [{ url: logoUrl }] } : {}),
    },
    twitter: {
      title: storeTitle,
      description: storeDescription,
      ...(logoUrl ? { images: [logoUrl] } : {}),
    },
  };
}

export default function Page() {
  return <HomeContent />;
}
