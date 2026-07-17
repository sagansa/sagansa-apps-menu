'use client';

import { useState, useEffect } from 'react';
import apiService from '@/lib/api';
import { TenantStoreInfo } from '@/types';
import { ChevronRight, Store, Users, MapPin, Loader2 } from 'lucide-react';

interface StoreSelectorProps {
  onSelect: (info: TenantStoreInfo) => void;
}

export function StoreSelector({ onSelect }: StoreSelectorProps) {
  const [tenants, setTenants] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStores, setLoadingStores] = useState(false);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await apiService.getPublicTenants();
        if (response.success) {
          setTenants(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const handleTenantSelect = async (tenant: any) => {
    setSelectedTenant(tenant);
    setLoadingStores(true);
    try {
      const response = await apiService.getPublicStores(tenant.id);
      if (response.success) {
        setStores(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoadingStores(false);
    }
  };

  const handleStoreSelect = (store: any) => {
    const info: TenantStoreInfo = {
      id: selectedTenant.id,
      name: selectedTenant.name,
      store: {
        id: store.id,
        name: store.name,
        nickname: store.nickname,
        phone: store.phone,
        no_telp: store.no_telp,
        latitude: store.latitude,
        longitude: store.longitude,
        tableCode: 'TAKEAWAY',
        orderType: 'takeaway',
        emailReceiptLogo: store.email_receipt_logo ?? null,
        receiptHeader: store.receipt_header ?? null,
        address: store.address ?? null,
      }
    };
    onSelect(info);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
        <p className="text-gray-500 animate-pulse">Loading amazing places...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-2xl mx-auto pt-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black tracking-tight uppercase mb-4">
            Sagan<span className="text-brand-600">sa</span> Menu
          </h1>
          <p className="text-gray-500 text-lg">
            {!selectedTenant 
              ? 'Select a merchant to browse their menu' 
              : `Browsing ${selectedTenant.name}`}
          </p>
        </div>

        {!selectedTenant ? (
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
              <Users className="w-4 h-4" /> Available Merchants
            </h2>
            <div className="grid gap-4">
              {tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleTenantSelect(tenant)}
                  className="group relative bg-white border border-gray-200 p-6 rounded-2xl flex items-center justify-between hover:bg-brand-50 hover:border-brand-300 transition-all duration-300 overflow-hidden shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <Users className="w-6 h-6 text-brand-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-xl group-hover:text-brand-700 transition-colors">{tenant.name}</h3>
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Merchant Partner</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                  
                  {/* Decorative Gradient */}
                  <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-500">
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => setSelectedTenant(null)}
                className="text-sm font-bold text-gray-500 hover:text-brand-600 flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Merchants
              </button>
              <h2 className="text-xs font-black uppercase tracking-widest text-brand-600 flex items-center gap-2">
                <Store className="w-4 h-4" /> Choose Store
              </h2>
            </div>

            {loadingStores ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-4">
                {stores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => handleStoreSelect(store)}
                    className="group relative bg-white border border-gray-200 p-6 rounded-2xl flex items-center justify-between hover:bg-brand-50 hover:border-brand-300 transition-all duration-300 overflow-hidden text-left shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Store className="w-6 h-6 text-brand-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl group-hover:text-brand-700 transition-colors">{store.name}</h3>
                        <div className="flex items-center gap-2 text-gray-400 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="text-xs uppercase tracking-widest">{store.nickname || 'Main Branch'}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
                
                {stores.length === 0 && (
                  <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl border-dashed">
                    <p className="text-gray-500 italic">No active stores found for this merchant.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowLeft({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
    </svg>
  );
}
