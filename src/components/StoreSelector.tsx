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
      }
    };
    onSelect(info);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0A] text-white">
        <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
        <p className="text-slate-400 animate-pulse">Loading amazing places...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 selection:bg-gold/30">
      <div className="max-w-2xl mx-auto pt-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black tracking-tight uppercase mb-4">
            Sagan<span className="text-gold">sa</span> Menu
          </h1>
          <p className="text-slate-400 text-lg">
            {!selectedTenant 
              ? 'Select a merchant to browse their menu' 
              : `Browsing ${selectedTenant.name}`}
          </p>
        </div>

        {!selectedTenant ? (
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <Users className="w-4 h-4" /> Available Merchants
            </h2>
            <div className="grid gap-4">
              {tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleTenantSelect(tenant)}
                  className="group relative bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between hover:bg-white/10 hover:border-gold/50 transition-all duration-300 overflow-hidden"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <Users className="w-6 h-6 text-gold" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-xl group-hover:text-gold transition-colors">{tenant.name}</h3>
                      <p className="text-xs text-slate-500 uppercase tracking-widest">Merchant Partner</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                  
                  {/* Decorative Gradient */}
                  <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-500">
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => setSelectedTenant(null)}
                className="text-sm font-bold text-slate-500 hover:text-gold flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Merchants
              </button>
              <h2 className="text-xs font-black uppercase tracking-widest text-gold flex items-center gap-2">
                <Store className="w-4 h-4" /> Choose Store
              </h2>
            </div>

            {loadingStores ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
              </div>
            ) : (
              <div className="grid gap-4">
                {stores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => handleStoreSelect(store)}
                    className="group relative bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between hover:bg-white/10 hover:border-gold/50 transition-all duration-300 overflow-hidden text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Store className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl group-hover:text-gold transition-colors">{store.name}</h3>
                        <div className="flex items-center gap-2 text-slate-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="text-xs uppercase tracking-widest">{store.nickname || 'Main Branch'}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
                
                {stores.length === 0 && (
                  <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl border-dashed">
                    <p className="text-slate-500 italic">No active stores found for this merchant.</p>
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
