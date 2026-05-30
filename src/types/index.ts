export interface TenantStoreInfo {
  id: string;
  name: string;
  store: {
    id: string;
    name: string;
    nickname?: string;
    tableCode: string;
  };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  category?: string;
  variants?: ProductVariant[];
  modifications?: ProductModification[];
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
