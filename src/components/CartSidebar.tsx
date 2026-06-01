'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import { CartItem, PublicPaymentMethod, TenantStoreInfo } from '@/types';
import apiService, { submitOrder } from '@/lib/api';
import {
  createLocalOrderHistoryItem,
  loadCustomerProfile,
  normalizePhone,
  saveCustomerProfile,
  saveLocalOrderHistory,
} from '@/lib/orderHistory';

interface CartSidebarProps {
  cart: CartItem[];
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  total: number;
  tenantStoreInfo: TenantStoreInfo;
  paymentMethods: PublicPaymentMethod[];
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ 
  cart, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart, 
  total, 
  tenantStoreInfo,
  paymentMethods,
  isOpen,
  onClose
}: CartSidebarProps) {
  const router = useRouter();
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('pay_at_counter');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [qrisSvg, setQrisSvg] = useState('');
  const [qrisError, setQrisError] = useState<string | null>(null);
  const [qrisLoading, setQrisLoading] = useState(false);
  const [qrisPayment, setQrisPayment] = useState<{
    orderId?: string;
    amount: number;
    methodId: string;
    paymentLabel: string;
    returnUrl: string;
  } | null>(null);
  const [paymentSecondsLeft, setPaymentSecondsLeft] = useState(60 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;
  const formatPaymentTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    return { minutes, seconds: remainingSeconds };
  };
  const escapeSvgText = (value: string) => value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    };

    return entities[character];
  });
  const encodeSvgDataUri = (svg: string) => {
    const encoded = window.btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${encoded}`;
  };
  const buildQrisPaymentSheet = () => {
    if (!qrisSvg || !qrisPayment) return '';

    const storeName = tenantStoreInfo.store.name || tenantStoreInfo.name;
    const tableCode = tenantStoreInfo.store.tableCode || 'TAKEAWAY';
    const orderType = tenantStoreInfo.store.orderType === 'takeaway' ? 'Takeaway / Non-online' : `Meja ${tableCode}`;
    const customerName = customerInfo.name.trim() || '-';
    const customerPhone = normalizePhone(customerInfo.phoneNumber) || '-';
    const shortOrderId = qrisPayment.orderId ? qrisPayment.orderId.slice(0, 8).toUpperCase() : '-';
    const qrDataUri = encodeSvgDataUri(qrisSvg);

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1040" viewBox="0 0 720 1040">
  <rect width="720" height="1040" fill="#f8fafc"/>
  <rect x="44" y="44" width="632" height="952" rx="28" fill="#ffffff" stroke="#e2e8f0"/>
  <rect x="44" y="44" width="632" height="150" rx="28" fill="#0f172a"/>
  <circle cx="112" cy="112" r="36" fill="#2563eb"/>
  <text x="112" y="125" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">S</text>
  <text x="166" y="102" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#ffffff">Sagansa</text>
  <text x="166" y="136" font-family="Arial, sans-serif" font-size="18" fill="#cbd5e1">${escapeSvgText(storeName)}</text>
  <text x="604" y="104" text-anchor="end" font-family="Arial, sans-serif" font-size="15" fill="#cbd5e1">Order</text>
  <text x="604" y="132" text-anchor="end" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff">#${escapeSvgText(shortOrderId)}</text>

  <text x="84" y="250" font-family="Arial, sans-serif" font-size="18" fill="#64748b">Total Payment</text>
  <text x="84" y="298" font-family="Arial, sans-serif" font-size="40" font-weight="700" fill="#dc2626">IDR ${escapeSvgText(qrisPayment.amount.toLocaleString('id-ID'))}</text>
  <text x="84" y="344" font-family="Arial, sans-serif" font-size="18" fill="#64748b">Customer</text>
  <text x="84" y="378" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#111827">${escapeSvgText(customerName)}</text>
  <text x="84" y="408" font-family="Arial, sans-serif" font-size="18" fill="#475569">${escapeSvgText(customerPhone)}</text>
  <text x="390" y="344" font-family="Arial, sans-serif" font-size="18" fill="#64748b">Order Type</text>
  <text x="390" y="378" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#111827">${escapeSvgText(orderType)}</text>
  <text x="390" y="408" font-family="Arial, sans-serif" font-size="18" fill="#475569">${escapeSvgText(qrisPayment.paymentLabel)}</text>

  <rect x="84" y="460" width="552" height="420" rx="22" fill="#ffffff" stroke="#e5e7eb"/>
  <text x="360" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#111827">Scan QRIS untuk Bayar</text>
  <image href="${qrDataUri}" x="190" y="560" width="340" height="340"/>
  <text x="360" y="936" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" fill="#64748b">Setelah pembayaran, tunjukkan bukti ke kasir/admin untuk approval.</text>
</svg>`.trim();
  };

  useEffect(() => {
    setCustomerInfo(loadCustomerProfile());
  }, []);

  useEffect(() => {
    if (customerInfo.name || customerInfo.email || customerInfo.phoneNumber) {
      saveCustomerProfile(customerInfo);
    }
  }, [customerInfo]);

  const activePaymentMethods = paymentMethods.filter((method) => method.is_active !== false);

  const paymentOptions = [
    { id: 'pay_at_counter', label: 'Bayar di Kasir', methodId: null, type: 'counter' },
    ...activePaymentMethods.map((method) => ({
      id: `payment_method:${method.id}`,
      label: method.name,
      methodId: method.id,
      type: method.type,
    })),
  ];

  const selectedPaymentOption = paymentOptions.find((option) => option.id === paymentMethod);

  useEffect(() => {
    if (!selectedPaymentOption) {
      setPaymentMethod('pay_at_counter');
    }
  }, [selectedPaymentOption]);

  useEffect(() => {
    let cancelled = false;

    const fetchQris = async () => {
      setQrisSvg('');
      setQrisError(null);

      if (!showQrisModal || !qrisPayment) {
        return;
      }

      setQrisLoading(true);

      try {
        const svg = await apiService.getPublicPaymentMethodQris(qrisPayment.methodId, qrisPayment.amount);
        if (!cancelled) {
          setQrisSvg(svg);
        }
      } catch (error) {
        if (!cancelled) {
          setQrisError(error instanceof Error ? error.message : 'QRIS gagal dibuat.');
        }
      } finally {
        if (!cancelled) {
          setQrisLoading(false);
        }
      }
    };

    fetchQris();

    return () => {
      cancelled = true;
    };
  }, [qrisPayment, showQrisModal]);

  useEffect(() => {
    if (!showQrisModal || !qrisPayment) {
      return;
    }

    setPaymentSecondsLeft(60 * 60);
    const interval = window.setInterval(() => {
      setPaymentSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [qrisPayment, showQrisModal]);

  const validateCustomerInfo = () => {
    const nextErrors: Record<string, string> = {};

    if (!customerInfo.name.trim()) {
      nextErrors.name = 'Nama wajib diisi agar pesanan bisa dipanggil.';
    }

    if (!normalizePhone(customerInfo.phoneNumber)) {
      nextErrors.phoneNumber = 'Nomor HP wajib diisi untuk tracking pesanan.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validatePayment = () => {
    const nextErrors: Record<string, string> = {};

    if (!paymentMethod) {
      nextErrors.paymentMethod = 'Pilih metode pembayaran terlebih dahulu.';
    }

    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const submitOrderWithCustomer = async (options?: { showQrisAfterSuccess?: boolean }) => {
    setIsSubmitting(true);
    const orderTotal = total;
    const cartSnapshot = cart;
    const selectedPaymentSnapshot = selectedPaymentOption;
    const returnUrl = typeof window !== 'undefined' ? window.location.href : '/';
    
    try {
      const orderData = {
        tenant_id: tenantStoreInfo.id,
        store_id: tenantStoreInfo.store.id,
        table_code: tenantStoreInfo.store.tableCode,
        order_type: tenantStoreInfo.store.orderType ?? (tenantStoreInfo.store.tableCode === 'TAKEAWAY' ? 'takeaway' : 'dine-in'),
        customer_name: customerInfo.name.trim(),
        customer_email: customerInfo.email.trim() || null,
        customer_phone: normalizePhone(customerInfo.phoneNumber),
        subtotal: orderTotal,
        discount_total: 0,
        tax_total: 0,
        service_total: 0,
        grand_total: orderTotal,
        payment_method: selectedPaymentSnapshot?.methodId ? selectedPaymentSnapshot.label : 'Bayar di Kasir',
        payment_method_id: selectedPaymentSnapshot?.methodId ?? null,
        order_items: cartSnapshot.map(item => ({
          product_id: item.productId,
          product_variant_id: item.variantId ?? null,
          name_snapshot: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          notes: null,
          modifications: item.modifications.map(mod => ({
            product_modification_id: mod.id,
            price: mod.price,
            quantity: mod.quantity
          })).filter(mod => mod.quantity > 0)
        }))
      };

      const response: any = await submitOrder(orderData);
      const orderId = response?.data?.id;
      saveLocalOrderHistory(createLocalOrderHistoryItem({
        orderId,
        customerName: customerInfo.name.trim(),
        customerPhone: customerInfo.phoneNumber,
        paymentMethod: selectedPaymentSnapshot?.label ?? paymentMethod,
        total: orderTotal,
        tenantStoreInfo,
        cart: cartSnapshot,
      }));

      if (options?.showQrisAfterSuccess && selectedPaymentSnapshot?.methodId) {
        setQrisPayment({
          orderId,
          amount: orderTotal,
          methodId: selectedPaymentSnapshot.methodId,
          paymentLabel: selectedPaymentSnapshot.label,
          returnUrl,
        });
        setShowQrisModal(true);
        onClearCart();
        return;
      }
      
      onClearCart();
      onClose();
      const params = new URLSearchParams({
        orderId: orderId ?? '',
        total: String(orderTotal),
        payment: selectedPaymentSnapshot?.label ?? 'Bayar di Kasir',
        paymentStatus: 'pending',
      });

      params.set('returnUrl', returnUrl);

      router.push(`/order/success?${params.toString()}`);
    } catch (error) {
      console.error('Order submission error:', error);
      const params = new URLSearchParams({
        message: error instanceof Error ? error.message : 'Pesanan gagal dikirim.',
      });

      params.set('returnUrl', returnUrl);

      router.push(`/order/failed?${params.toString()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    if (!validatePayment()) return;

    if (!customerInfo.name.trim() || !normalizePhone(customerInfo.phoneNumber)) {
      validateCustomerInfo();
      setShowCustomerModal(true);
      return;
    }

    if (selectedPaymentOption?.type === 'qris') {
      await submitOrderWithCustomer({ showQrisAfterSuccess: true });
      return;
    }

    await submitOrderWithCustomer();
  };

  const handleCustomerModalSubmit = async () => {
    if (!validateCustomerInfo()) return;

    saveCustomerProfile(customerInfo);
    setShowCustomerModal(false);

    if (selectedPaymentOption?.type === 'qris') {
      await submitOrderWithCustomer({ showQrisAfterSuccess: true });
      return;
    }

    await submitOrderWithCustomer();
  };

  const handleDownloadQris = () => {
    const paymentSheet = buildQrisPaymentSheet();
    if (!paymentSheet) return;

    const blob = new Blob([paymentSheet], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qris-order-${qrisPayment?.orderId ?? Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleCompleteQrisPayment = () => {
    if (!qrisPayment) {
      return;
    }

    const params = new URLSearchParams({
      orderId: qrisPayment.orderId ?? '',
      total: String(qrisPayment.amount),
      payment: qrisPayment.paymentLabel,
      paymentStatus: 'pending',
    });

    params.set('returnUrl', qrisPayment.returnUrl);

    setShowQrisModal(false);
    onClose();
    router.push(`/order/success?${params.toString()}`);
  };

  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 md:hidden"
              aria-label="Back to menu"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">Your Order</h2>
          </div>
          {cartItemCount > 0 && (
            <button 
              onClick={onClearCart}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Your cart is empty</p>
            <p className="text-sm text-gray-400 mt-1">Add items to get started</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between">
                    <div className="min-w-0 flex-1 pr-3">
                      <h3 className="font-medium">{item.productName}</h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div className="flex justify-between gap-3">
                          <span>Harga item</span>
                          <span className="shrink-0">{formatCurrency(item.basePrice ?? item.unitPrice)}</span>
                        </div>
                        {item.variantName && (
                          <div className="flex justify-between gap-3">
                            <span className="min-w-0 truncate">{item.variantName}</span>
                            {(item.variantPriceAdjustment ?? 0) > 0 && (
                              <span className="shrink-0">+ {formatCurrency(item.variantPriceAdjustment ?? 0)}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Modifications */}
                  {item.modifications && item.modifications.length > 0 && (
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      {item.modifications.map(mod => (
                        <div key={mod.id} className="flex justify-between gap-3">
                          <span>+ {mod.quantity}x {mod.name}</span>
                          <span className="shrink-0">{formatCurrency(mod.price * mod.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l text-gray-600"
                      >
                        -
                      </button>
                      <span className="w-10 h-8 flex items-center justify-center border-t border-b border-gray-300">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r text-gray-600"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{formatCurrency(item.unitPrice)} / item</div>
                      <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">Customer Information</h3>
                  {customerInfo.name && normalizePhone(customerInfo.phoneNumber) ? (
                    <p className="mt-1 text-sm text-gray-600">
                      {customerInfo.name} · {normalizePhone(customerInfo.phoneNumber)}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">Akan diminta saat place order.</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Metode Pembayaran</h3>
              <div className="grid grid-cols-1 gap-2">
                {paymentOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPaymentMethod(option.id)}
                    className={`rounded-md border px-3 py-3 text-left font-medium transition-colors ${
                      paymentMethod === option.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-blue-200 hover:bg-blue-50/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {errors.paymentMethod && <p className="mt-1 text-xs text-red-600">{errors.paymentMethod}</p>}

              {selectedPaymentOption?.type === 'qris' && (
                <p className="mt-3 rounded-md bg-gray-50 p-3 text-sm text-gray-600">
                  QRIS akan tampil setelah Place Order.
                </p>
              )}
            </div>

            {/* Order Summary */}
            <div className="space-y-2 mt-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || cart.length === 0}
              className={`w-full mt-6 py-3 px-4 rounded-md text-white font-medium ${
                isSubmitting || cart.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Place Order'}
            </button>
          </>
        )}
      </div>

      {showCustomerModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !isSubmitting && setShowCustomerModal(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                <p className="text-sm text-gray-500">Data ini dipakai untuk tracking pesanan.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                disabled={isSubmitting}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                aria-label="Close customer information"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label htmlFor="modal-customer-name" className="mb-1 block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  id="modal-customer-name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Your name"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="modal-customer-phone" className="mb-1 block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="modal-customer-phone"
                  value={customerInfo.phoneNumber}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phoneNumber: e.target.value })}
                  className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="+62 812 3456 7890"
                />
                {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>}
              </div>

              <div>
                <label htmlFor="modal-customer-email" className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="modal-customer-email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
              </div>

              <button
                type="button"
                onClick={handleCustomerModalSubmit}
                disabled={isSubmitting}
                className={`w-full rounded-md px-4 py-3 font-semibold text-white ${
                  isSubmitting ? 'cursor-not-allowed bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Simpan & Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showQrisModal && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-white">
          <div className="min-h-screen bg-gray-50">
            <div className="bg-slate-950 px-5 pb-8 pt-10 text-center text-white">
              <div className="text-sm font-medium tracking-wide text-slate-200">Complete Payment in</div>
              <div className="mt-4 flex items-center justify-center gap-3">
                <span className="rounded-md bg-red-600 px-3 py-2 text-lg font-bold">{formatPaymentTime(paymentSecondsLeft).minutes}</span>
                <span className="text-lg">Minutes,</span>
                <span className="rounded-md bg-red-600 px-3 py-2 text-lg font-bold">{formatPaymentTime(paymentSecondsLeft).seconds}</span>
                <span className="text-lg">Seconds</span>
              </div>
            </div>

            <div className="mx-auto -mt-4 w-full max-w-md px-4 pb-8">
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="text-sm text-gray-500">Total Payment</div>
                <div className="mt-2 text-3xl font-bold text-red-600">IDR {(qrisPayment?.amount ?? 0).toLocaleString('id-ID')}</div>
                {qrisPayment?.orderId && (
                  <div className="mt-2 text-xs text-gray-500">
                    Order #{qrisPayment.orderId.slice(0, 8)} · Menunggu approval kasir/admin
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900">Scan QR Code to Pay</h3>

                <div className="mt-5">
                  {qrisLoading && (
                    <div className="flex h-72 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
                      Generating QRIS...
                    </div>
                  )}

                  {qrisError && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {qrisError}
                    </div>
                  )}

                  {qrisSvg && (
                    <div className="mx-auto flex max-w-[280px] justify-center rounded-lg bg-white p-3">
                      <div
                        className="aspect-square w-full [&_svg]:h-full [&_svg]:w-full"
                        dangerouslySetInnerHTML={{ __html: qrisSvg }}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleDownloadQris}
                  disabled={!qrisSvg}
                  className={`mt-5 w-full rounded-md px-4 py-3 font-semibold text-white ${
                    qrisSvg ? 'bg-red-600 hover:bg-red-700' : 'cursor-not-allowed bg-gray-400'
                  }`}
                >
                  Download QR Code
                </button>
              </div>

              <div className="mt-5">
                <h3 className="text-xl font-bold text-gray-900">How to pay</h3>
                <div className="mt-3 rounded-lg border border-gray-200 bg-white p-5 text-sm leading-7 text-gray-600 shadow-sm">
                  <p>1. Scan QR Code atau download QR terlebih dahulu.</p>
                  <p>2. Pastikan nominal pembayaran sudah benar.</p>
                  <p>3. Setelah membayar, tunjukkan bukti pembayaran ke kasir/admin untuk approval manual.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCompleteQrisPayment}
                className="mt-5 w-full rounded-md bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Pesanan Berhasil Dikirim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
