// API service for apps/menu to communicate with services/api-mobile.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const isFormData = options.body instanceof FormData;

    const headers: HeadersInit = {
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    (headers as Record<string, string>)['Accept'] = 'application/json';

    if (!isFormData && !(headers as Record<string, string>)['Content-Type']) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      const text = await response.text();
      let data: any = null;

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!response.ok) {
        const message = this.extractErrorMessage(data) ?? `HTTP error! status: ${response.status}`;
        const errors = this.extractValidationErrors(data);
        throw new ApiError(message, response.status, errors);
      }

      return data as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private extractErrorMessage(body: unknown): string | null {
    if (this.isRecord(body) && typeof body.message === 'string') {
      return body.message;
    }

    if (typeof body === 'string' && body.trim() !== '') {
      return body;
    }

    return null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private extractValidationErrors(body: unknown): Record<string, string[]> | undefined {
    if (!this.isRecord(body) || !('errors' in body)) {
      return undefined;
    }

    const potentialErrors = (body as Record<string, unknown>).errors;
    return this.isRecordOfStringArray(potentialErrors) ? potentialErrors : undefined;
  }

  private isRecordOfStringArray(value: unknown): value is Record<string, string[]> {
    if (!this.isRecord(value)) {
      return false;
    }

    return Object.values(value).every(
      (entry) => Array.isArray(entry) && entry.every((item) => typeof item === 'string'),
    );
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response;
  }

  async register(data: { name: string; email: string; password: string; password_confirmation: string; tenant_name: string }) {
    const response = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async fetchProfile() {
    const response = await this.request<{ user: any }>('/auth/user');
    return response;
  }

  async getInvitation(token: string) {
    const response = await this.request(`/auth/invitations/${token}`);
    return response;
  }

  async completeInvitation(token: string, payload: { name: string; password: string; password_confirmation: string }) {
    const response = await this.request(`/auth/invitations/${token}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  }

  // Product endpoints
  async getProducts(params?: { includeInactive?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.includeInactive) {
      searchParams.set('include_inactive', '1');
    }

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await this.request(`/products${query}`);
    return response;
  }

  async getProduct(productId: string) {
    const response = await this.request(`/products/${productId}`);
    return response;
  }

  // Store endpoints
  async getStores() {
    const response = await this.request('/stores');
    return response;
  }

  async getStore(storeId: string) {
    const response = await this.request(`/stores/${storeId}`);
    return response;
  }

  // Order endpoints
  async createOrder(orderData: any) {
    const endpoint = this.token ? '/orders' : '/guest/orders';

    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    return response;
  }

  async getOrder(orderId: string) {
    const response = await this.request(`/orders/${orderId}`);
    return response;
  }

  async getOrders(params?: { storeId?: string; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.storeId) {
      searchParams.set('store_id', params.storeId);
    }
    if (params?.status) {
      searchParams.set('status', params.status);
    }

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await this.request(`/orders${query}`);
    return response;
  }

  // Tenant endpoints
  async getTenants() {
    const response = await this.request('/tenants');
    return response;
  }

  async getTenant(tenantId: string) {
    const response = await this.request(`/tenants/${tenantId}`);
    return response;
  }

  // Public discovery endpoints
  async getPublicTenants() {
    return this.request<{ success: boolean; data: any[] }>('/public/tenants');
  }

  async getPublicStores(tenantId: string) {
    return this.request<{ success: boolean; data: any[] }>(`/public/stores?tenant_id=${tenantId}`);
  }

  async getPublicProducts(storeId: string) {
    return this.request<{ success: boolean; data: any[] }>(`/public/products?store_id=${storeId}`);
  }

  async getPublicPaymentMethods(storeId: string) {
    return this.request<{ success: boolean; data: any[] }>(`/public/payment-methods?store_id=${storeId}`);
  }

  async getPublicPaymentMethodQris(paymentMethodId: string, amount: number) {
    const url = `${API_BASE_URL}/public/payment-methods/${paymentMethodId}/qris?amount=${encodeURIComponent(amount)}`;

    const response = await fetch(url, {
      headers: {
        Accept: 'image/svg+xml',
      },
    });

    const text = await response.text();

    if (!response.ok) {
      let message = text || `HTTP error! status: ${response.status}`;
      try {
        const body = JSON.parse(text);
        if (body?.message) {
          message = body.message;
        }
      } catch {
      }

      throw new ApiError(message, response.status);
    }

    return text;
  }

  async getGuestOrderHistory(params: { phone: string; storeId?: string }) {
    const searchParams = new URLSearchParams({ phone: params.phone });
    if (params.storeId) {
      searchParams.set('store_id', params.storeId);
    }

    return this.request<{ success: boolean; data: any[] }>(`/guest/orders?${searchParams.toString()}`);
  }
}

const apiService = new ApiService();

export function submitOrder(orderData: any) {
  return apiService.createOrder(orderData);
}

export default apiService;
