'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TenantStoreInfo } from '@/types';

interface QrResolverProps {
  onResolved: (tenantStoreInfo: TenantStoreInfo) => void;
}

export function QrResolver({ onResolved }: QrResolverProps) {
  const searchParams = useSearchParams();
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
          throw new Error('Invalid QR code. Missing tenant or store information.');
        }

        // In a real application, you would fetch this info from the API
        // For now, we'll mock the response
        const mockTenantStoreInfo: TenantStoreInfo = {
          id: tenantId,
          name: 'Demo Tenant',
          store: {
            id: storeId,
            name: 'Demo Store',
            nickname: 'Main Store',
            tableCode: tableCode,
          }
        };

        onResolved(mockTenantStoreInfo);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error resolving tenant/store');
        console.error('Error resolving tenant/store:', err);
      } finally {
        setLoading(false);
      }
    };

    resolveTenantStore();
  }, [searchParams, onResolved]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <p className="mt-2 text-sm">
            Please scan a valid QR code to access the menu.
          </p>
        </div>
      </div>
    );
  }

  return null;
}