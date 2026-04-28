import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apolloClient } from '../lib/apolloClient';
import { getAccessToken, setAccessToken, clearTokens, parseJwt, refreshAccessToken, isTokenExpired } from '../lib/auth';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

interface RegisterData { email: string; password: string; role: string; nom: string; prenom: string }

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromToken(token: string): User | null {
  const p = parseJwt(token);
  if (!p) return null;
  return { id: p['id'] as string, email: p['email'] as string, role: p['role'] as User['role'], nom: p['nom'] as string, prenom: p['prenom'] as string };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = useCallback(async () => {
    let token = getAccessToken();
    if (token && isTokenExpired(token)) {
      token = await refreshAccessToken();
    }
    if (token) setUser(userFromToken(token));
    setLoading(false);
  }, []);

  useEffect(() => { initAuth(); }, [initAuth]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    const data = await res.json() as { accessToken?: string; error?: string };
    if (!res.ok || !data.accessToken) throw new Error(data.error ?? 'Connexion échouée');
    setAccessToken(data.accessToken);
    setUser(userFromToken(data.accessToken));
    await apolloClient.resetStore();
  };

  const register = async (formData: RegisterData) => {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'include',
    });
    const data = await res.json() as { accessToken?: string; error?: string };
    if (!res.ok || !data.accessToken) throw new Error(data.error ?? 'Inscription échouée');
    setAccessToken(data.accessToken);
    setUser(userFromToken(data.accessToken));
    await apolloClient.resetStore();
  };

  const logout = async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    clearTokens();
    setUser(null);
    await apolloClient.clearStore();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
