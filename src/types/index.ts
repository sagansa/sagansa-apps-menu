export interface TenantStoreInfo {
  id: string;
  name: string;
  store: {
    id: string;
    name: string;
    nickname?: string;
    phone?: string | null;
    no_telp?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    tableCode: string;
    orderType?: 'dine-in' | 'takeaway';
  };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  type?: 'single' | 'bundle';
  price: number;
  image?: string;
  isAvailable: boolean;
  remaining?: boolean;
  category?: string;
  stock?: number;
  bundleItems?: ProductBundleItem[];
  variants?: ProductVariant[];
  modifications?: ProductModification[];
}

export interface ProductBundleItem {
  id: string;
  componentProductId: string;
  quantity: number;
  componentProduct?: {
    id: string;
    name: string;
    price?: number;
    stock?: number;
    remaining?: boolean;
    isAvailable?: boolean;
    isActive?: boolean;
  } | null;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface ProductModification {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  maxQuantity?: number;
  linkedProductId?: string | null;
  linkedProductQuantity?: number | null;
  linkedProduct?: {
    id: string;
    name: string;
    price?: number;
    stock?: number;
    isActive?: boolean;
  } | null;
}

export interface PublicPaymentMethod {
  id: string;
  store_id: string;
  type: string;
  name: string;
  is_active?: boolean;
  require_proof?: boolean;
  details?: Record<string, unknown> | null;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  basePrice?: number;
  variantPriceAdjustment?: number;
  quantity: number;
  maxStock?: number;
  unitPrice: number;
  totalPrice: number;
  modifications: CartItemModification[];
}

export interface CartItemModification {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  tenantId: string;
  storeId: string;
  tableCode: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  taxTotal: number;
  serviceTotal: number;
  discountTotal: number;
  grandTotal: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface OrderSubmissionRequest {
  storeId: string;
  tableCode: string;
  customerName?: string;
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
    modifications?: {
      id: string;
      quantity: number;
    }[];
  }[];
}
