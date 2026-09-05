import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ROLES, normalizeRole, ROLE_DEFAULT_ROUTES } from '../lib/roles';
import { ROLE_PERMISSIONS, checkPermission } from '../lib/permissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initAuth = () => {
    // Unconditionally sanitize and purge any sensitive tokens or credentials from URL
    try {
      const url = new URL(window.location.href);
      const urlToken = url.searchParams.get('token') || url.searchParams.get('accessToken');
      let cleaned = false;

      if (urlToken) {
        localStorage.setItem('accessToken', urlToken);
        url.searchParams.delete('token');
        url.searchParams.delete('accessToken');
        cleaned = true;
      }

      ['email', 'password', 'token', 'accessToken', 'secret', 'auth'].forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
          cleaned = true;
        }
      });

      if (cleaned) {
        const newSearch = url.searchParams.toString();
        const newUrl = url.pathname + (newSearch ? `?${newSearch}` : '') + url.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch (e) {
      // Ignore URL parsing errors on special protocols
    }

    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (userStr && token) {
      try {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
      } catch (e) {
        console.error('Failed to parse user session', e);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    initAuth();

    // Listen to storage events across tabs or logins
    window.addEventListener('storage', initAuth);
    return () => window.removeEventListener('storage', initAuth);
  }, []);

  const role = useMemo(() => {
    return normalizeRole(user?.role);
  }, [user]);

  const permissions = useMemo(() => {
    return ROLE_PERMISSIONS[role] || [];
  }, [role]);

  const hasPermission = (permission) => {
    return checkPermission(role, permission);
  };

  const hasRole = (allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));
    return normalizedAllowed.includes(role);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const login = (userData, token) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (updatedFields) => {
    const newUserData = { ...user, ...updatedFields };
    localStorage.setItem('user', JSON.stringify(newUserData));
    setUser(newUserData);
  };

  const defaultRoute = useMemo(() => {
    return ROLE_DEFAULT_ROUTES[role] || '/sales/dashboard';
  }, [role]);

  const value = {
    user,
    role,
    permissions,
    hasPermission,
    hasRole,
    loading,
    login,
    logout,
    updateUser,
    defaultRoute,
    isAuthenticated: !!user && !!localStorage.getItem('accessToken')
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
