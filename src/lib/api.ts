/**
 * API Client for MySQL Backend
 * Replaces Supabase client with REST API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get current user info from context/localStorage
const getUserInfo = () => {
  // Get from localStorage (set by RoleContext)
  const role = localStorage.getItem('currentRole') || 'onsite_team';
  const userName = localStorage.getItem('userName') || 'Unknown User';
  return { role, userName };
};

// API request helper
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const { role, userName } = getUserInfo();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': role,
      'x-user-name': userName,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// API client methods
export const api = {
  // Inventory
  inventory: {
    getAll: () => apiRequest('/inventory'),
    getById: (id: string) => apiRequest(`/inventory/${id}`),
    getVendors: (id: string) => apiRequest(`/inventory/${id}/vendors`),
  },

  // Projects
  projects: {
    getAll: (status?: string) => 
      apiRequest(`/projects${status && status !== 'all' ? `?status=${status}` : ''}`),
    getById: (id: string) => apiRequest(`/projects/${id}`),
    getMaterials: (id: string) => apiRequest(`/projects/${id}/materials`),
    create: (data: any) => apiRequest('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => 
      apiRequest(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest(`/projects/${id}`, { method: 'DELETE' }),
  },

  // Claims
  claims: {
    getAll: (filters?: { projectId?: string; status?: string }) => {
      const params = new URLSearchParams();
      if (filters?.projectId) params.append('projectId', filters.projectId);
      if (filters?.status) params.append('status', filters.status);
      return apiRequest(`/claims?${params.toString()}`);
    },
    getPending: () => apiRequest('/claims/pending'),
    getById: (id: string) => apiRequest(`/claims/${id}`),
    create: (data: any) => apiRequest('/claims', { method: 'POST', body: JSON.stringify(data) }),
    approve: (id: string, approvalQuantities: Record<string, number>) =>
      apiRequest(`/claims/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approvalQuantities }),
      }),
    deny: (id: string, denialReason: string, denialNotes?: string) =>
      apiRequest(`/claims/${id}/deny`, {
        method: 'POST',
        body: JSON.stringify({ denialReason, denialNotes }),
      }),
  },

  // Returns
  returns: {
    getAll: (status?: string) =>
      apiRequest(`/returns${status && status !== 'all' ? `?status=${status}` : ''}`),
    getPending: () => apiRequest('/returns/pending'),
    create: (data: any) => apiRequest('/returns', { method: 'POST', body: JSON.stringify(data) }),
    approve: (id: string) => apiRequest(`/returns/${id}/approve`, { method: 'POST' }),
    reject: (id: string, rejectReason: string, rejectNotes?: string) =>
      apiRequest(`/returns/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectReason, rejectNotes }),
      }),
  },

  // Stock Adjustments
  stockAdjustments: {
    getAll: (filters?: { reason?: string; startDate?: string; endDate?: string }) => {
      const params = new URLSearchParams();
      if (filters?.reason) params.append('reason', filters.reason);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      return apiRequest(`/stock-adjustments?${params.toString()}`);
    },
    create: (data: any) =>
      apiRequest('/stock-adjustments', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Notifications
  notifications: {
    getAll: (userId?: string, role?: string) => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (role) params.append('role', role);
      return apiRequest(`/notifications?${params.toString()}`);
    },
    getUnreadCount: (userId?: string, role?: string) => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (role) params.append('role', role);
      return apiRequest(`/notifications/unread-count?${params.toString()}`);
    },
    create: (data: any) =>
      apiRequest('/notifications', { method: 'POST', body: JSON.stringify(data) }),
    markAsRead: (id: string) =>
      apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllAsRead: (userId: string, role: string) =>
      apiRequest('/notifications/mark-all-read', {
        method: 'PATCH',
        body: JSON.stringify({ userId, role }),
      }),
  },

  // Project Templates
  projectTemplates: {
    getAll: () => apiRequest('/project-templates'),
    getById: (id: string) => apiRequest(`/project-templates/${id}`),
    create: (data: any) =>
      apiRequest('/project-templates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest(`/project-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest(`/project-templates/${id}`, { method: 'DELETE' }),
    addItem: (templateId: string, data: any) =>
      apiRequest(`/project-templates/${templateId}/items`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateItem: (templateId: string, itemId: string, data: any) =>
      apiRequest(`/project-templates/${templateId}/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteItem: (templateId: string, itemId: string) =>
      apiRequest(`/project-templates/${templateId}/items/${itemId}`, { method: 'DELETE' }),
  },

  // Vendors
  vendors: {
    getAll: () => apiRequest('/vendors'),
    getProducts: (id: string) => apiRequest(`/vendors/${id}/products`),
  },

  // Audit Logs
  auditLogs: {
    getAll: (filters?: { actionType?: string; userName?: string; startDate?: string; endDate?: string }) => {
      const params = new URLSearchParams();
      if (filters?.actionType) params.append('actionType', filters.actionType);
      if (filters?.userName) params.append('userName', filters.userName);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      return apiRequest(`/audit-logs?${params.toString()}`);
    },
    create: (data: any) =>
      apiRequest('/audit-logs', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Requests
  requests: {
    getAll: (status?: string) =>
      apiRequest(`/requests${status && status !== 'all' ? `?status=${status}` : ''}`),
    getById: (id: string) => apiRequest(`/requests/${id}`),
    create: (data: any) => apiRequest('/requests', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string, fulfilledDate?: string) =>
      apiRequest(`/requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, fulfilledDate }),
      }),
  },

  // Purchase Orders
  purchaseOrders: {
    getAll: (status?: string) =>
      apiRequest(`/purchase-orders${status && status !== 'all' ? `?status=${status}` : ''}`),
    getById: (id: string) => apiRequest(`/purchase-orders/${id}`),
    create: (data: any) =>
      apiRequest('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // Project Materials
  projectMaterials: {
    getByProject: (projectId: string) => apiRequest(`/project-materials/${projectId}`),
    create: (data: any) =>
      apiRequest('/project-materials', { method: 'POST', body: JSON.stringify(data) }),
  },

  // User Projects
  userProjects: {
    getByUser: (userId: string) => apiRequest(`/user-projects/${userId}`),
    assign: (data: any) =>
      apiRequest('/user-projects', { method: 'POST', body: JSON.stringify(data) }),
  },
};

export default api;

