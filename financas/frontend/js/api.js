const Api = (() => {
 const Api_URL = 'https://financeiro-tcc-backend.onrender.com/api';
  const TOKEN_KEY = 'cf_token';
  const USER_KEY  = 'cf_user';

  const token = {
    const Api_URL = 'https://financeiro-tcc-backend.onrender.com/api';
    set:    (t) => localStorage.setItem(TOKEN_KEY, t),
    remove: () => localStorage.removeItem(TOKEN_KEY),
  };

  const userCache = {
    get:    () => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } },
    set:    (u) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
    remove: () => localStorage.removeItem(USER_KEY),
  };

  async function request(path, opts = {}, auth = true) {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (auth) {
      const t = token.get();
      if (!t) { window.location.href = 'index.html'; throw new Error('Não autenticado.'); }
      headers['Authorization'] = `Bearer ${t}`;
    }
    let res;
    try {
      res = await fetch(`${Api_URL}${path}`, { ...opts, headers });
    } catch {
      throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
    }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) { _logout(); window.location.href = 'index.html'; }
      throw new Error(data.error || data.message || `Erro ${res.status}`);
    }
    return data;
  }

  function _logout() { token.remove(); userCache.remove(); }

  const auth = {
    async register(name, email, password) {
      const data = await request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }, false);
      token.set(data.token); userCache.set(data.user); return data;
    },
    async login(email, password) {
      const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
      token.set(data.token); userCache.set(data.user); return data;
    },
    logout() { _logout(); window.location.href = 'index.html'; },
    async getProfile() { const data = await request('/auth/me'); userCache.set(data); return data; },
    async updateProfile(payload) {
      const data = await request('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) });
      if (data.user) userCache.set(data.user); return data;
    },
    async changePassword(currentPassword, newPassword) { return request('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }); },
    isLoggedIn()        { return !!token.get(); },
    requireAuth()       { if (!token.get()) { window.location.href = 'index.html'; return false; } return true; },
    redirectIfLoggedIn(){ if (token.get()) window.location.href = 'dashboard.html'; },
    getCachedUser()     { return userCache.get(); },
  };

  const transactions = {
    async list(filters = {}) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, v); });
      const qs = params.toString() ? `?${params}` : ''; return request(`/transactions${qs}`);
    },
    async summary(month, year) {
      const params = new URLSearchParams(); if (month) params.set('month', month); if (year) params.set('year', year);
      const qs = params.toString() ? `?${params}` : ''; return request(`/transactions/summary${qs}`);
    },
    async create(payload)     { return request('/transactions',      { method: 'POST',   body: JSON.stringify(payload) }); },
    async update(id, payload) { return request(`/transactions/${id}`,{ method: 'PUT',    body: JSON.stringify(payload) }); },
    async remove(id)          { return request(`/transactions/${id}`,{ method: 'DELETE' }); },
  };

  const goals = {
    async list()              { return request('/goals'); },
    async create(payload)     { return request('/goals',      { method: 'POST',   body: JSON.stringify(payload) }); },
    async update(id, payload) { return request(`/goals/${id}`,{ method: 'PUT',    body: JSON.stringify(payload) }); },
    async remove(id)          { return request(`/goals/${id}`,{ method: 'DELETE' }); },
  };

  return { auth, transactions, goals };
})();

// Garante que o navegador reconheça o objeto globalmente
window.Api = Api;
