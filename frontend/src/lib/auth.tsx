'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User> | FormData) => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const { data } = await api.get('/api/auth/me/');
      setUser(data);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      // Only clear tokens on explicit 401 (unauthorized)
      // Do NOT clear on network errors, timeouts, CORS issues, etc.
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      }
      // On network error — keep tokens, user stays null but can retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (username: string, password: string) => {
    const { data } = await api.post('/api/auth/login/', { username, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    await fetchUser();
    router.push('/dashboard');
  };

  const register = async (registerData: RegisterData) => {
    try {
      await api.post('/api/auth/register/', registerData);
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      if (error.response?.data) {
        const messages = Object.values(error.response.data).flat().join('. ');
        throw new Error(messages || 'Помилка реєстрації');
      }
      throw err;
    }
    await login(registerData.username, registerData.password);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    router.push('/login');
  };

  const updateUser = async (data: Partial<User> | FormData) => {
    const config = data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const { data: updated } = await api.patch('/api/auth/me/', data, config);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
