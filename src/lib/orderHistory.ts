import { CartItem, TenantStoreInfo } from '@/types';

export interface LocalOrderHistoryItem {
  id: string;
  orderId?: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  tableCode: string;
  storeId: string;
  storeName: string;
  items: {
    name: string;
    quantity: number;
    totalPrice: number;
  }[];
}

const HISTORY_KEY_PREFIX = 'sagansa_menu_order_history:';
export const CUSTOMER_PROFILE_KEY = 'sagansa_menu_customer_profile';

export function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, '').trim();
}

function getHistoryKey(phone: string) {
  return `${HISTORY_KEY_PREFIX}${normalizePhone(phone)}`;
}

export function loadCustomerProfile(): { name: string; email: string; phoneNumber: string } {
  if (typeof window === 'undefined') {
    return { name: '', email: '', phoneNumber: '' };
  }

  try {
    const raw = window.localStorage.getItem(CUSTOMER_PROFILE_KEY);
    return raw ? { name: '', email: '', phoneNumber: '', ...JSON.parse(raw) } : { name: '', email: '', phoneNumber: '' };
  } catch {
    return { name: '', email: '', phoneNumber: '' };
  }
}

export function saveCustomerProfile(profile: { name: string; email: string; phoneNumber: string }) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
}

export function loadLocalOrderHistory(phone: string): LocalOrderHistoryItem[] {
  if (typeof window === 'undefined' || !normalizePhone(phone)) return [];

  try {
    const raw = window.localStorage.getItem(getHistoryKey(phone));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalOrderHistory(entry: LocalOrderHistoryItem) {
  if (typeof window === 'undefined') return;

  const history = loadLocalOrderHistory(entry.customerPhone);
  window.localStorage.setItem(
    getHistoryKey(entry.customerPhone),
    JSON.stringify([entry, ...history].slice(0, 25)),
  );
  window.dispatchEvent(new CustomEvent('sagansa-menu-order-history-updated'));
}

export function createLocalOrderHistoryItem(params: {
  orderId?: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  total: number;
  tenantStoreInfo: TenantStoreInfo;
  cart: CartItem[];
}): LocalOrderHistoryItem {
  return {
    id: `${Date.now()}`,
    orderId: params.orderId,
    customerName: params.customerName,
    customerPhone: normalizePhone(params.customerPhone),
    paymentMethod: params.paymentMethod,
    total: params.total,
    createdAt: new Date().toISOString(),
    tableCode: params.tenantStoreInfo.store.tableCode,
    storeId: params.tenantStoreInfo.store.id,
    storeName: params.tenantStoreInfo.store.name,
    items: params.cart.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
    })),
  };
}
