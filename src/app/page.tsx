'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MenuPage } from '@/components/MenuPage';
import { StoreSelector } from '@/components/StoreSelector';
import { TenantStoreInfo } from '@/types';
import apiService from '@/lib/api';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A]">
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-gold"></div>
      <p className="animate-pulse text-slate-400">Initializing Sagansa...</p>
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [tenantStoreInfo, setTenantStoreInfo] = useState<TenantStoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveTenantStore = async () => {
      try {
        // Extract tenant and store info from URL query parameters
        const tenantId = searchParams.get('tenantId');
        const storeId = searchParams.get('storeId');
        const tableCode = searchParams.get('tableCode') || 'default';
        const orderTypeParam = searchParams.get('orderType');
        const orderType = orderTypeParam === 'takeaway' ? 'takeaway' : orderTypeParam === 'dine-in' ? 'dine-in' : undefined;
        
        if (!tenantId || !storeId) {
          setLoading(false);
          return;
        }

        // Fetch real tenant and store info
        const [tenantRes, storeRes] = await Promise.all([
          apiService.getPublicTenants().then(res => res.data.find(t => t.id === tenantId)),
          apiService.getPublicStores(tenantId).then(res => res.data.find(s => s.id === storeId))
        ]);

        if (!tenantRes || !storeRes) {
          setLoading(false);
          return;
        }

        const realTenantStoreInfo: TenantStoreInfo = {
          id: tenantId,
          name: tenantRes.name,
          store: {
            id: storeId,
            name: storeRes.name,
            nickname: storeRes.nickname,
            phone: storeRes.phone,
            no_telp: storeRes.no_telp,
            latitude: storeRes.latitude,
            longitude: storeRes.longitude,
            tableCode: tableCode,
            orderType,
          }
        };

        setTenantStoreInfo(realTenantStoreInfo);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error resolving tenant/store');
        console.error('Error resolving tenant/store:', err);
      } finally {
        setLoading(false);
      }
    };

    resolveTenantStore();
  }, [searchParams]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (tenantStoreInfo) {
    return <MenuPage tenantStoreInfo={tenantStoreInfo} />;
  }

  // If no info and not loading, show selection
  return (
    <StoreSelector onSelect={(info) => setTenantStoreInfo(info)} />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomeContent />
    </Suspense>
  );
}
