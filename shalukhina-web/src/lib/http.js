const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  getDashboard: () => request('/api/dashboard'),
  getRequests: () => request('/api/requests'),
  createRequest: (body) => request('/api/requests', { method: 'POST', body: JSON.stringify(body) }),
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
};
