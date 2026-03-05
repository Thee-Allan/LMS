// Nanyuki Law Firm - API Client
// Replaces Supabase with direct calls to our Express/MySQL backend

const BASE = 'https://lms-loxl.onrender.com/api';

function getToken() {
  return localStorage.getItem('nlf_token');
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(e.error || 'API error');
  }
  return res.json();
}

export const authApi = {
  login: (email: string, password: string) =>
    req<{ token: string; user: object }>('POST', '/auth/login', { email, password }),
  me: () => req('GET', '/auth/me'),
  register: (data: { name: string; email: string; phone: string; role: string; password: string; confirmPassword: string }) =>
    req<{ message: string; email: string }>('POST', '/auth/register', data),
  verifyOtp: (email: string, otp: string) =>
    req<{ token: string; user: object }>('POST', '/auth/verify-otp', { email, otp }),
  resendOtp: (email: string) =>
    req<{ message: string; email: string }>('POST', '/auth/resend-otp', { email }),
};

export const clientsApi = {
  list: () => req<object[]>('GET', '/clients'),
  get: (id: string) => req('GET', `/clients/${id}`),
  create: (data: object) => req('POST', '/clients', data),
  update: (id: string, data: object) => req('PUT', `/clients/${id}`, data),
  delete: (id: string) => req('DELETE', `/clients/${id}`),
};

export const mattersApi = {
  list: () => req<object[]>('GET', '/matters'),
  create: (data: object) => req('POST', '/matters', data),
  update: (id: string, data: object) => req('PUT', `/matters/${id}`, data),
  delete: (id: string) => req('DELETE', `/matters/${id}`),
};

export const tasksApi = {
  list: () => req<object[]>('GET', '/tasks'),
  create: (data: object) => req('POST', '/tasks', data),
  update: (id: string, data: object) => req('PUT', `/tasks/${id}`, data),
  delete: (id: string) => req('DELETE', `/tasks/${id}`),
  addComment: (id: string, text: string) =>
    req('POST', `/tasks/${id}/comments`, { text }),
};

export const eventsApi = {
  list: () => req<object[]>('GET', '/events'),
  create: (data: object) => req('POST', '/events', data),
  update: (id: string, data: object) => req('PUT', `/events/${id}`, data),
  delete: (id: string) => req('DELETE', `/events/${id}`),
};

export const documentsApi = {
  list: () => req<object[]>('GET', '/documents'),
  create: (data: object) => req('POST', '/documents', data),
  upload: (file: File, data: object) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(data).forEach(key => {
      formData.append(key, data[key as keyof typeof data]);
    });
    
    const token = getToken();
    return fetch(`${BASE}/documents/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(res => {
      if (!res.ok) {
        return res.json().then(err => Promise.reject(err));
      }
      return res.json();
    });
  },
  delete: (id: string) => req('DELETE', `/documents/${id}`),
  download: (id: string) => req('GET', `/documents/${id}/download`),
};

export const invoicesApi = {
  list: () => req<object[]>('GET', '/invoices'),
  create: (data: object) => req('POST', '/invoices', data),
  update: (id: string, data: object) => req('PUT', `/invoices/${id}`, data),
  delete: (id: string) => req('DELETE', `/invoices/${id}`),
};

export const timeApi = {
  list: () => req<object[]>('GET', '/time-entries'),
  create: (data: object) => req('POST', '/time-entries', data),
  update: (id: string, data: object) => req('PUT', `/time-entries/${id}`, data),
  delete: (id: string) => req('DELETE', `/time-entries/${id}`),
};

export const notificationsApi = {
  list: () => req<object[]>('GET', '/notifications'),
  markRead: (id: string) => req('PUT', `/notifications/${id}/read`),
  markAllRead: () => req('PUT', '/notifications/read-all'),
};

export const usersApi = {
  list: () => req<object[]>('GET', '/users'),
  create: (data: object) => req('POST', '/users', data),
  update: (id: string, data: object) => req('PUT', `/users/${id}`, data),
};

export const auditApi = {
  list: () => req<object[]>('GET', '/audit-logs'),
};

// Multi-tenant APIs
export const firmsApi = {
  list: () => req<object[]>('GET', '/firms'),
  get: (id: string) => req('GET', `/firms/${id}`),
  create: (data: object) => req('POST', '/firms', data),
  update: (id: string, data: object) => req('PUT', `/firms/${id}`, data),
};

export const plansApi = {
  list: () => req<object[]>('GET', '/plans'),
  create: (data: object) => req('POST', '/plans', data),
};

export const subscriptionsApi = {
  list: () => req<object[]>('GET', '/subscriptions'),
  get: (id: string) => req('GET', `/firms/${id}/subscription`),
  create: (id: string, data: object) => req('POST', `/firms/${id}/subscription`, data),
};

export const paymentsApi = {
  list: (id: string) => req<object[]>('GET', `/firms/${id}/payments`),
  create: (id: string, data: object) => req('POST', `/firms/${id}/payments`, data),
};

export const usageApi = {
  get: (id: string) => req<object[]>('GET', `/firms/${id}/usage`),
};
