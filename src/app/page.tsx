'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MenuPage } from '@/components/MenuPage';
import { StoreSelector } from '@/components/StoreSelector';
import { TenantStoreInfo } from '@/types';
import apiService from '@/lib/api';

export default function Home() {
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
            tableCode: tableCode,
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0A]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mb-4"></div>
        <p className="text-slate-400 animate-pulse">Initializing Sagansa...</p>
      </div>
    );
  }

  if (tenantStoreInfo) {
    return <MenuPage tenantStoreInfo={tenantStoreInfo} />;
  }

  // If no info and not loading, show selection
  return (
    <StoreSelector onSelect={(info) => setTenantStoreInfo(info)} />
  );
}