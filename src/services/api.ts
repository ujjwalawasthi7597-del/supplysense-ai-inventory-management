const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('supplysense_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('supplysense_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('supplysense_token');
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      removeAuthToken();
    }
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData: any) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    me: () => request('/auth/me'),
    updateProfile: (profile: { name?: string; phone?: string }) =>
      request('/auth/profile', { method: 'PUT', body: JSON.stringify(profile) }),
    users: () => request('/auth/users'),
  },

  // Products
  products: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/products${query}`);
    },
    getById: (id: string) => request(`/products/${id}`),
    create: (data: any) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/products/${id}`, { method: 'DELETE' }),
  },

  // Warehouses
  warehouses: {
    getAll: () => request('/warehouses'),
    getById: (id: string) => request(`/warehouses/${id}`),
    create: (data: any) => request('/warehouses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/warehouses/${id}`, { method: 'DELETE' }),
  },

  // Suppliers
  suppliers: {
    getAll: () => request('/suppliers'),
    getById: (id: string) => request(`/suppliers/${id}`),
    create: (data: any) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/suppliers/${id}`, { method: 'DELETE' }),
  },

  // Inventory & Stock Movements
  inventory: {
    getOverview: () => request('/inventory'),
    getMovements: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/inventory/movements${query}`);
    },
    stockIn: (data: { productId: string; warehouseId?: string; quantity: number; reason?: string }) =>
      request('/inventory/stock-in', { method: 'POST', body: JSON.stringify(data) }),
    stockOut: (data: { productId: string; warehouseId?: string; quantity: number; reason?: string }) =>
      request('/inventory/stock-out', { method: 'POST', body: JSON.stringify(data) }),
    adjust: (data: { productId: string; warehouseId?: string; newQuantity: number; reason: string }) =>
      request('/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Purchase Orders
  purchaseOrders: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/purchase-orders${query}`);
    },
    getById: (id: string) => request(`/purchase-orders/${id}`),
    create: (data: any) => request('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    approve: (id: string) => request(`/purchase-orders/${id}/approve`, { method: 'PUT' }),
    reject: (id: string, reason?: string) =>
      request(`/purchase-orders/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) }),
    receive: (id: string) => request(`/purchase-orders/${id}/receive`, { method: 'PUT' }),
  },

  // Sales
  sales: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/sales${query}`);
    },
    getById: (id: string) => request(`/sales/${id}`),
    create: (data: any) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Dashboard
  dashboard: {
    getOverview: () => request('/dashboard/overview'),
    getSales: () => request('/dashboard/sales'),
    getInventory: () => request('/dashboard/inventory'),
  },

  // AI Assistant
  ai: {
    getDemandForecast: () => request('/ai/demand-forecast'),
    getStockRisk: () => request('/ai/stock-risk'),
    getReorderSuggestions: () => request('/ai/reorder-suggestions'),
    getSlowMoving: () => request('/ai/slow-moving-products'),
    getSupplierAnalysis: () => request('/ai/supplier-analysis'),
    chat: (query: string) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ query }) }),
  },

  // Notifications
  notifications: {
    getAll: () => request('/notifications'),
    markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request('/notifications/mark-all-read', { method: 'PUT' }),
  },

  // Reports
  reports: {
    monthlySales: () => request('/reports/monthly-sales'),
    inventoryValuation: () => request('/reports/inventory-valuation'),
    productPerformance: () => request('/reports/product-performance'),
    supplierPerformance: () => request('/reports/supplier-performance'),
  },
};
