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
  quickSwitchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  roleMeta: null,
  permissions: null,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  quickSwitchRole: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roleMeta, setRoleMeta] = useState<any | null>(null);
  const [permissions, setPermissions] = useState<any | null>(null);
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
    fetchSession();
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
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
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

  const quickSwitchRole = async (role: UserRole) => {
    const roleCredentials: Record<UserRole, { email: string; pass: string }> = {
      ADMIN: { email: 'admin@alnamariq.ae', pass: 'Admin@1234' },
      ESTIMATOR: { email: 'estimator@alnamariq.ae', pass: 'Estimator@1234' },
      SALES: { email: 'sales@alnamariq.ae', pass: 'Sales@1234' },
      VIEWER: { email: 'viewer@alnamariq.ae', pass: 'Viewer@1234' },
    };

    const cred = roleCredentials[role];
    if (cred) {
      await login(cred.email, cred.pass);
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
        quickSwitchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

