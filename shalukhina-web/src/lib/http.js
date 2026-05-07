const API_BASE_URL = globalThis.__APP_CONFIG__?.API_BASE_URL || window.location.origin || 'https://shalukhina.danbel.ru';
const TOKEN_KEY = 'shalukhina-auth-token';

function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = options.noAuth ? null : getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const responseText = await response.text();
    let message = responseText || `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(responseText);
      if (parsed?.message) {
        message = parsed.message;
      }
    } catch {
      // keep plain text body
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body), noAuth: true }),
  me: () => request('/api/auth/me'),
  getDashboard: () => request('/api/dashboard'),
  getRequests: () => request('/api/requests'),
  getRequest: (id) => request(`/api/requests/${id}`),
  getRequestChatMessages: (id) => request(`/api/requests/${id}/chat`),
  getRequestChatLast: (id) => request(`/api/requests/${id}/chat/last`),
  sendRequestChatMessage: (id, body) => request(`/api/requests/${id}/chat`, { method: 'POST', body: JSON.stringify(body) }),
  createRequest: (body) => request('/api/requests', { method: 'POST', body: JSON.stringify(body) }),
  updateRequest: (id, body) => request(`/api/requests/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  changeRequestStatus: (id, body) => request(`/api/requests/${id}/status`, { method: 'POST', body: JSON.stringify(body) }),
  approveRequest: (id, body) => request(`/api/requests/${id}/approve`, { method: 'POST', body: JSON.stringify(body) }),
  rejectRequest: (id, body) => request(`/api/requests/${id}/reject`, { method: 'POST', body: JSON.stringify(body) }),
  issueRequest: (id, body) => request(`/api/requests/${id}/issue`, { method: 'POST', body: JSON.stringify(body) }),
  getItems: () => request('/api/items'),
  getStockBalances: () => request('/api/inventory/balances'),
  createItem: (body) => request('/api/items', { method: 'POST', body: JSON.stringify(body) }),
  receiveItem: (id, body) => request(`/api/items/${id}/receive`, { method: 'POST', body: JSON.stringify(body) }),
  getPurchases: () => request('/api/purchases'),
  createPurchase: (body) => request('/api/purchases', { method: 'POST', body: JSON.stringify(body) }),
  changePurchaseStatus: (id, body) => request(`/api/purchases/${id}/status`, { method: 'POST', body: JSON.stringify(body) }),
  getWarehouses: () => request('/api/warehouses'),
  createWarehouse: (body) => request('/api/warehouses', { method: 'POST', body: JSON.stringify(body) }),
  getUsers: () => request('/api/users'),
  createUser: (body) => request('/api/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id, body) => request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),
  updateItem: (id, body) => request(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteItem: (id) => request(`/api/items/${id}`, { method: 'DELETE' }),
  getDepartments: () => request('/api/departments'),
  getCategories: () => request('/api/categories'),
  getMovements: () => request('/api/inventory/movements'),
  getToken,
};
