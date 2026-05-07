const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://shalukhina.danbel.ru';
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
    const error = new Error(await response.text() || `HTTP ${response.status}`);
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
  createItem: (body) => request('/api/items', { method: 'POST', body: JSON.stringify(body) }),
  receiveItem: (id, body) => request(`/api/items/${id}/receive`, { method: 'POST', body: JSON.stringify(body) }),
  getUsers: () => request('/api/users'),
  getDepartments: () => request('/api/departments'),
  getCategories: () => request('/api/categories'),
  getMovements: () => request('/api/inventory/movements'),
  getToken,
};
