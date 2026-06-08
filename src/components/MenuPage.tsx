'use client';

import { useState, useEffect } from 'react';
import { Product, CartItem, PublicPaymentMethod, TenantStoreInfo } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { CartSidebar } from '@/components/CartSidebar';
import apiService from '@/lib/api';
import {
  loadCustomerProfile,
  loadLocalOrderHistory,
  LocalOrderHistoryItem,
  normalizePhone,
} from '@/lib/orderHistory';
import { Share2, Check, Copy, ShoppingCart, UserRound, MapPin, MessageCircle } from 'lucide-react';

interface MenuPageProps {
  tenantStoreInfo: TenantStoreInfo;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api';
const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getApiOrigin(): string {
  try {
    if (API_BASE_URL.startsWith('/')) {
      return typeof window !== 'undefined' ? window.location.origin : '';
    }

    return new URL(API_BASE_URL).origin;
  } catch {
    return '';
  }
}

function resolveImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const imagePath = value.trim();
  if (!imagePath) {
    return undefined;
  }

  if (/^(https?:)?\/\//.test(imagePath) || imagePath.startsWith('data:') || imagePath.startsWith('blob:')) {
    return imagePath;
  }

  if (STORAGE_BASE_URL) {
    const storageBaseUrl = STORAGE_BASE_URL.replace(/\/$/, '');
    const cleanPath = imagePath.replace(/^\/?(storage\/)?/, '');
    return `${storageBaseUrl}/${cleanPath}`;
  }

  const apiOrigin = getApiOrigin();
  if (!apiOrigin) {
    return imagePath;
  }

  if (imagePath.startsWith('/storage/')) {
    return `${apiOrigin}${imagePath}`;
  }

  const cleanPath = imagePath.replace(/^\/?(storage\/)?/, '');
  return `${apiOrigin}/storage/${cleanPath}`;
}

function normalizePublicProduct(product: any): Product {
  const basePrice = toNumber(product.price);
  const productType = product.type === 'bundle' ? 'bundle' : 'single';
  const bundleStock = product.bundle_available_stock ?? product.bundleAvailableStock;
  const rawBundleItems = Array.isArray(product.bundle_items)
    ? product.bundle_items
    : (Array.isArray(product.bundleItems) ? product.bundleItems : []);
  const stock = productType === 'bundle' && bundleStock !== null && bundleStock !== undefined
    ? toNumber(bundleStock)
    : toNumber(product.stock);
  const variantsFromGroups = Array.isArray(product.variant_groups)
    ? product.variant_groups.flatMap((group: any) =>
        Array.isArray(group.variants)
          ? group.variants
              .filter((variant: any) => variant.is_active !== false)
              .map((variant: any) => {
                const priceAdjustment = toNumber(variant.price);
                return {
                  id: String(variant.id),
                  name: group.name ? `${group.name}: ${variant.name}` : String(variant.name),
                  price: basePrice + priceAdjustment,
                  isAvailable: variant.isAvailable ?? variant.is_active !== false,
                };
              })
          : [],
      )
    : [];

  const directVariants = Array.isArray(product.variants)
    ? product.variants.map((variant: any) => ({
        id: String(variant.id),
        name: String(variant.name),
        price: toNumber(variant.price, basePrice),
        isAvailable: variant.isAvailable ?? variant.is_active !== false,
      }))
    : [];

  return {
    id: String(product.id),
    name: String(product.name),
    description: product.description || undefined,
    type: productType,
    price: basePrice,
    image: resolveImageUrl(product.image_url ?? product.imageUrl ?? product.image),
    stock,
    category: typeof product.category === 'string'
      ? product.category
      : product.category_detail?.name,
    isAvailable: product.isAvailable ?? (
      product.is_active !== false &&
      (product.remaining === false || stock > 0)
    ),
    bundleItems: rawBundleItems
      .map((item: any) => {
        const componentProduct = item.component_product ?? item.componentProduct;

        return {
          id: String(item.id),
          componentProductId: String(item.component_product_id ?? item.componentProductId ?? ''),
          quantity: toNumber(item.quantity, 1),
          componentProduct: componentProduct
            ? {
                id: String(componentProduct.id),
                name: String(componentProduct.name),
                price: toNumber(componentProduct.price),
                stock: toNumber(componentProduct.stock),
              }
            : null,
        };
      }),
    variants: variantsFromGroups.length > 0 ? variantsFromGroups : directVariants,
    modifications: Array.isArray(product.modifications)
      ? product.modifications
          .filter((modification: any) => modification.is_active !== false)
          .map((modification: any) => ({
            id: String(modification.id),
            name: String(modification.name),
            price: toNumber(modification.price),
            isAvailable: modification.isAvailable ?? modification.is_active !== false,
            maxQuantity: modification.max_quantity,
          }))
      : [],
  };
}

function normalizeCoordinate(value: unknown): number | null {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function buildGoogleMapsUrl(latitude: unknown, longitude: unknown): string | null {
  const lat = normalizeCoordinate(latitude);
  const lng = normalizeCoordinate(longitude);

  if (lat === null || lng === null) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function normalizeWhatsAppPhone(phone?: string | null): string | null {
  const digits = (phone || '').replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith('62')) {
    return digits;
  }

  return digits;
}

function buildWhatsAppUrl(phone?: string | null): string | null {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  return normalizedPhone ? `https://wa.me/${normalizedPhone}` : null;
}

function sortProductsByName(products: Product[]) {
  return [...products].sort((a, b) =>
    a.name.localeCompare(b.name, 'id', { sensitivity: 'base' })
  );
}

function normalizePublicPaymentMethods(methods: unknown): PublicPaymentMethod[] {
  if (!Array.isArray(methods)) {
    return [];
  }

  return methods.filter((method): method is PublicPaymentMethod => {
    if (!method || typeof method !== 'object') {
      return false;
    }

    const paymentMethod = method as PublicPaymentMethod;
    return Boolean(paymentMethod.id && paymentMethod.name) && paymentMethod.is_active !== false;
  });
}

export function MenuPage({ tenantStoreInfo }: MenuPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PublicPaymentMethod[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPhone, setHistoryPhone] = useState('');
  const [localHistory, setLocalHistory] = useState<LocalOrderHistoryItem[]>([]);
  const [serverHistory, setServerHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | LocalOrderHistoryItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch real products data
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await apiService.getPublicProducts(tenantStoreInfo.store.id);
        if (response.success) {
          setProducts(sortProductsByName(response.data.map(normalizePublicProduct)));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [tenantStoreInfo.store.id]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await apiService.getPublicPaymentMethods(tenantStoreInfo.store.id);
        if (response.success) {
          setPaymentMethods(normalizePublicPaymentMethods(response.data));
        }
      } catch (err) {
        console.error('Error fetching payment methods:', err);
        setPaymentMethods([]);
      }
    };

    fetchPaymentMethods();
  }, [tenantStoreInfo.store.id]);

  useEffect(() => {
    const profile = loadCustomerProfile();
    setHistoryPhone(profile.phoneNumber);
    setLocalHistory(loadLocalOrderHistory(profile.phoneNumber));

    const refreshLocalHistory = () => {
      const currentPhone = loadCustomerProfile().phoneNumber;
      setHistoryPhone(currentPhone);
      setLocalHistory(loadLocalOrderHistory(currentPhone));
    };

    window.addEventListener('sagansa-menu-order-history-updated', refreshLocalHistory);
    return () => window.removeEventListener('sagansa-menu-order-history-updated', refreshLocalHistory);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#profile') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      openHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToCart = (product: Product, variantId?: string, modifications: { id: string; quantity: number }[] = []) => {
    setCart(prevCart => {
      // Check if item already exists in cart
      const existingItemIndex = prevCart.findIndex(
        item => 
          item.productId === product.id && 
          item.variantId === variantId &&
          JSON.stringify(item.modifications.map(m => ({ id: m.id, quantity: m.quantity }))) === 
          JSON.stringify(modifications)
      );

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        const newCart = [...prevCart];
        const existingItem = newCart[existingItemIndex];
        const newQuantity = existingItem.quantity + 1;
        const newTotalPrice = existingItem.unitPrice * newQuantity;
        newCart[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          totalPrice: newTotalPrice
        };
        return newCart;
      } else {
        // Add new item to cart
        const variant = variantId ? product.variants?.find(v => v.id === variantId) : undefined;
        const basePrice = product.price;
        const variantPriceAdjustment = variant ? Math.max(variant.price - basePrice, 0) : 0;
        const modificationDetails = modifications.map(mod => {
          const modDetail = product.modifications?.find(m => m.id === mod.id);
          return {
            id: modDetail?.id || '',
            name: modDetail?.name || '',
            price: modDetail?.price || 0,
            quantity: 1
          };
        });
        
        // Calculate total price including modifications
        const modificationsTotal = modificationDetails.reduce((sum, mod) => sum + mod.price, 0);
        const unitPrice = basePrice + variantPriceAdjustment + modificationsTotal;
        const totalPrice = unitPrice * 1; // Quantity is 1 for new items
        
        const newItem: CartItem = {
          id: `${product.id}-${variantId || 'default'}-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          variantId: variant?.id,
          variantName: variant?.name,
          basePrice,
          variantPriceAdjustment,
          quantity: 1,
          unitPrice,
          totalPrice: totalPrice,
          modifications: modificationDetails
        };

        return [...prevCart, newItem];
      }
    });
  };

  const updateCartQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }

    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === itemId) {
          const newTotalPrice = item.unitPrice * newQuantity;
          return { ...item, quantity: newQuantity, totalPrice: newTotalPrice };
        }
        return item;
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const isViewOnly = tenantStoreInfo.store.tableCode === 'VIEW';
  const mapsUrl = buildGoogleMapsUrl(tenantStoreInfo.store.latitude, tenantStoreInfo.store.longitude);
  const whatsappUrl = buildWhatsAppUrl(tenantStoreInfo.store.phone || tenantStoreInfo.store.no_telp);
  const cartTotal = cart.reduce((total, item) => total + item.totalPrice, 0);
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?tenantId=${tenantStoreInfo.id}&storeId=${tenantStoreInfo.store.id}&tableCode=VIEW`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Check out the menu at ${tenantStoreInfo.store.name}: ${getShareUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const openHistory = async () => {
    setShowHistoryModal(true);
    const phone = normalizePhone(loadCustomerProfile().phoneNumber);
    setHistoryPhone(phone);
    setLocalHistory(loadLocalOrderHistory(phone));
    setServerHistory([]);
    setHistoryError(null);

    if (!phone) {
      return;
    }

    setHistoryLoading(true);
    try {
      const response = await apiService.getGuestOrderHistory({
        phone,
        storeId: tenantStoreInfo.store.id,
      });
      setServerHistory(response.data);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Failed to load order history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;
  const formatDate = (value: string) => new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

  const getOrderDetailItems = (order: any | LocalOrderHistoryItem) => {
    if ('items' in order && Array.isArray(order.items)) {
      return order.items.map((item: LocalOrderHistoryItem['items'][number]) => ({
        name: item.name,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        variantName: null,
        modifications: [],
      }));
    }

    return (order.order_items ?? []).map((item: any) => ({
      name: item.product_snapshot?.name ?? 'Item',
      quantity: Number(item.quantity ?? 0),
      totalPrice: Number(item.total_price ?? 0),
      variantName: item.variant_snapshot?.name ?? null,
      modifications: Array.isArray(item.modifications_snapshot) ? item.modifications_snapshot : [],
    }));
  };

  const getOrderDetailTotal = (order: any | LocalOrderHistoryItem) => {
    if ('total' in order) {
      return order.total;
    }

    return Number(order.grand_total ?? 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{tenantStoreInfo.store.name}</h1>
            <p className="text-sm text-gray-500">
              {tenantStoreInfo.store.orderType === 'takeaway'
                ? 'Takeaway / Non-online'
                : `Table: ${tenantStoreInfo.store.tableCode}`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
                title="Buka lokasi di Google Maps"
                aria-label="Buka lokasi store di Google Maps"
              >
                <MapPin className="w-5 h-5" />
              </a>
            )}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-gray-200"
                title="Hubungi store via WhatsApp"
                aria-label="Hubungi store via WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            )}
            <button
              onClick={openHistory}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
              title="Profile"
            >
              <UserRound className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowShareModal(true)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
              title="Share Menu"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {!isViewOnly && (
              <div className="relative">
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700"
                  aria-label="Open cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 sm:px-6 lg:px-8 md:pb-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Menu</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={isViewOnly ? undefined : addToCart} 
                />
              ))}
            </div>
          </div>
          <div className="hidden md:block">
            <CartSidebar 
              cart={cart}
              onUpdateQuantity={updateCartQuantity}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
              total={cartTotal}
              tenantStoreInfo={tenantStoreInfo}
              paymentMethods={paymentMethods}
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
            />
          </div>
        </div>
      </main>

      {/* Mobile Cart Button */}
      {cartItemCount > 0 && !isViewOnly && (
        <div className="fixed inset-x-4 bottom-4 z-40 md:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/20"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            <span>{cartItemCount} item · Rp {cartTotal.toLocaleString('id-ID')}</span>
          </button>
        </div>
      )}

      <div className={`fixed inset-0 z-50 md:hidden ${isCartOpen ? 'block' : 'hidden'}`}>
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsCartOpen(false)}
        ></div>
        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
          <CartSidebar 
            cart={cart}
            onUpdateQuantity={updateCartQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            total={cartTotal}
            tenantStoreInfo={tenantStoreInfo}
            paymentMethods={paymentMethods}
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
          />
        </div>
      </div>
      {/* Share Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
            onClick={() => setShowHistoryModal(false)}
          />
          <div className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Profil</h3>
                <p className="text-sm text-gray-500">Customer information dan pesanan saya.</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label="Close order history"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {(() => {
                const profile = loadCustomerProfile();

                return (
                  <div className="mb-5 rounded-lg border border-gray-200 p-4">
                    <div className="text-sm font-semibold text-gray-900">Customer Information</div>
                    {profile.name || profile.phoneNumber ? (
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {profile.name && <div>{profile.name}</div>}
                        {profile.phoneNumber && <div>{normalizePhone(profile.phoneNumber)}</div>}
                        {profile.email && <div>{profile.email}</div>}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">Belum ada customer information tersimpan.</p>
                    )}
                  </div>
                );
              })()}

              {!normalizePhone(historyPhone) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Isi nomor HP saat checkout agar pesanan tersimpan dan mudah dicari lagi.
                </div>
              )}

              {historyError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {historyError}
                </div>
              )}

              {historyLoading ? (
                <div className="py-8 text-center text-gray-500">Loading history...</div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-900">Pesanan Saya</div>

                  {[...serverHistory, ...localHistory].length === 0 && normalizePhone(historyPhone) && (
                    <div className="py-8 text-center text-gray-500">Belum ada riwayat pesanan.</div>
                  )}

                  {serverHistory.map((order) => (
                    <button
                      key={`server-${order.id}`}
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="w-full rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-gray-900">Order #{String(order.id).slice(0, 8)}</div>
                          <div className="text-sm text-gray-500">{order.created_at ? formatDate(order.created_at) : '-'}</div>
                          <div className="text-sm text-gray-500">Status: {order.status ?? 'pending'}</div>
                        </div>
                        <div className="text-right font-semibold">{formatCurrency(Number(order.grand_total ?? 0))}</div>
                      </div>
                    </button>
                  ))}

                  {localHistory.map((order) => (
                    <button
                      key={`local-${order.id}`}
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="w-full rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {order.orderId ? `Order #${order.orderId.slice(0, 8)}` : order.storeName}
                          </div>
                          <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                          <div className="text-sm text-gray-500">Payment: {order.paymentMethod}</div>
                        </div>
                        <div className="text-right font-semibold">{formatCurrency(order.total)}</div>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-gray-600">
                        {order.items.map((item, index) => (
                          <div key={`${order.id}-${index}`} className="flex justify-between gap-3">
                            <span>{item.quantity}x {item.name}</span>
                            <span>{formatCurrency(item.totalPrice)}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                Untuk tracking lintas device, login atau daftar akun customer. Saat endpoint histori login sudah aktif penuh, data tidak bergantung pada localStorage perangkat.
                <div className="mt-3 flex gap-2">
                  <a href="/login" className="rounded-md border border-gray-200 bg-white px-3 py-2 font-medium text-gray-700 hover:bg-gray-50">Login</a>
                  <a href="/register" className="rounded-md bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700">Daftar</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedOrder(null)} />
          <div className="relative flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {'orderId' in selectedOrder && selectedOrder.orderId
                    ? `Order #${selectedOrder.orderId.slice(0, 8)}`
                    : `Order #${String(selectedOrder.id).slice(0, 8)}`}
                </h3>
                <p className="text-sm text-gray-500">
                  {'createdAt' in selectedOrder
                    ? formatDate(selectedOrder.createdAt)
                    : selectedOrder.created_at ? formatDate(selectedOrder.created_at) : '-'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label="Close order detail"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <div className="space-y-3">
                {getOrderDetailItems(selectedOrder).map((item: any, index: number) => (
                  <div key={`${index}-${item.name}`} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{item.quantity}x {item.name}</div>
                        {item.variantName && <div className="text-sm text-gray-500">{item.variantName}</div>}
                      </div>
                      <div className="font-medium text-gray-900">{formatCurrency(item.totalPrice)}</div>
                    </div>

                    {item.modifications.length > 0 && (
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {item.modifications.map((modification: any, modIndex: number) => (
                          <div key={`${modIndex}-${modification.id ?? modification.name}`} className="flex justify-between gap-3">
                            <span>+ {modification.name ?? 'Add-on'}</span>
                            <span>{formatCurrency(Number(modification.price ?? 0))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-between border-t border-gray-200 pt-4 text-lg font-semibold">
                <span>Total</span>
                <span>{formatCurrency(getOrderDetailTotal(selectedOrder))}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Share Menu</h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500 truncate mr-2">{getShareUrl()}</span>
                  <button 
                    onClick={handleCopyLink}
                    className="flex-shrink-0 bg-white p-2 rounded-lg border border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button 
                  onClick={handleShareWhatsApp}
                  className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-[#20bd5a] transition-colors shadow-lg shadow-green-200"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span>WhatsApp Menu</span>
                </button>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 text-center">
              <p className="text-xs text-gray-400">Anyone with this link can view the menu</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
