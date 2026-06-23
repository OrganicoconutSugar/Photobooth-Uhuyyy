import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const API = '/api/auth';

function api(path, options = {}) {
  return fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  }).then(async (r) => {
    let data;
    try {
      data = await r.json();
    } catch {
      if (r.status === 502) throw new Error('Server backend tidak aktif — jalankan "npm run dev"');
      throw new Error(`Server ${r.status} — no response body`);
    }
    if (!r.ok) throw new Error(data.error || 'Request failed');
    return data;
  }).catch((err) => {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('Gagal terhubung ke server — pastikan "npm run dev" berjalan');
    }
    throw err;
  });
}

function authedApi(path, token, options = {}) {
  return api(path, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('pb_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }
    Promise.resolve().then(() => setLoading(true));
    authedApi('/me', token)
      .then((data) => setUser(data.user))
      .catch(() => { localStorage.removeItem('pb_token'); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (email, password) => {
    const data = await api('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('pb_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const data = await api('/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    localStorage.setItem('pb_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pb_token');
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!token) throw new Error('Not authenticated');
    const data = await authedApi('/profile', token, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    setUser(data.user);
    return data.user;
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}


