'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole, ROLE_CONFIG } from './permissions';

interface AuthContextType {
  user: AuthUser | null;
  roleMeta: (typeof ROLE_CONFIG)[UserRole] | null;
  permissions: {
    canManagePrices: boolean;
    canCreateQuote: boolean;
    canEditQuoteItems: boolean;
    canEditQuoteMeta: boolean;
    canDeleteQuote: boolean;
    canExportQuote: boolean;
    canManageUsers: boolean;
  } | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  roleMeta: null,
  permissions: null,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roleMeta, setRoleMeta] = useState<AuthContextType['roleMeta']>(null);
  const [permissions, setPermissions] = useState<AuthContextType['permissions']>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setRoleMeta(data.roleMeta);
        setPermissions(data.permissions);
      }
    } catch (e) {
      console.error('Session check failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetch('/api/auth/me').then(async res => {
      if (res.ok) { const data = await res.json(); setUser(data.user); setRoleMeta(data.roleMeta); setPermissions(data.permissions); }
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      await fetchSession();
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setRoleMeta(null);
      setPermissions(null);
      window.location.href = '/login';
    } catch (e) {
      console.error('Logout error', e);
    }
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        roleMeta,
        permissions,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

