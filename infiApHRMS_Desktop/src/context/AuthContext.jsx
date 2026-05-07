/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import apiClient from '../services/apiClient';

const AuthContext = createContext();

const normalizeRole = (role) => {
  const value = (role || '').toString().trim().toLowerCase();

  if (value === 'main admin') return 'Main Admin';
  if (value === 'admin') return 'Admin';
  if (value === 'hr') return 'HR';
  if (value === 'employee') return 'Employee';

  return role || null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(() => localStorage.getItem('userRole') || null);
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') || localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pending 2FA challenge state
  const [pending2FA, setPending2FA] = useState(null);

  // ── Persist auth state ──────────────────────────────────────────────────
  const storeAuth = (authToken, userData) => {
    const normalizedUser = userData || {};
    const normalizedRole = normalizeRole(normalizedUser.role);
    localStorage.setItem('accessToken', authToken);
    localStorage.setItem('token', authToken); // Legacy support
    localStorage.setItem('userRole', normalizedRole || '');
    localStorage.setItem('userName', normalizedUser.name || '');
    localStorage.setItem('userEmail', normalizedUser.email || '');
    localStorage.setItem('userId', normalizedUser.id || normalizedUser._id || '');
    setToken(authToken);
    setRole(normalizedRole);
    setUser({ ...normalizedUser, role: normalizedRole });
  };

  const clearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    setToken(null);
    setRole(null);
    setUser(null);
    setPending2FA(null);
  };

  // ── Hydrate on mount — check stored token ───────────────────────────────
  const hydrate = useCallback(async () => {
    const storedToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.get('/auth/me');
      const userData = res.data?.data;
      if (userData) {
        const normalizedRole = normalizeRole(userData.role);
        setUser({ ...userData, role: normalizedRole });
        setRole(normalizedRole);
        setToken(storedToken);
      } else {
        clearAuth();
      }
    } catch {
      // Token expired or invalid
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // ── Login → triggers 2FA ────────────────────────────────────────────────
  const login = async (email, password, role) => {
    try {
      setError(null);
      setLoading(true);
      const data = await authService.login(email, password, role);

      if (data.require2FA || data.requires2FA) {
        setPending2FA({
          userId: data.userId,
          role: normalizeRole(data.role),
          devOtp: data.devOtp,
        });
        return { success: true, requires2FA: true, devOtp: data.devOtp };
      }

      if (data.token) {
        storeAuth(data.token, data.user || data);
        return { success: true, requires2FA: false, role: normalizeRole(data.role || data.user?.role) };
      }

      return { success: false, error: 'Unexpected response' };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Login failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // ── Verify 2FA → get token ──────────────────────────────────────────────
  const verify2FA = async (otp) => {
    if (!pending2FA?.userId) {
      return { success: false, error: 'No pending 2FA challenge' };
    }

    try {
      setError(null);
      setLoading(true);
      const data = await authService.verify2FA(pending2FA.userId, otp);

      if (data.token) {
        storeAuth(data.token, data.user || data);
        setPending2FA(null);
        return { success: true, role: normalizeRole(data.role || data.user?.role) };
      }

      return { success: false, error: 'Verification failed' };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'OTP verification failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };


  // ── Register ────────────────────────────────────────────────────────────
  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      const res = await apiClient.post('/auth/register', userData);
      if (res.data?.token) {
        storeAuth(res.data.token, res.data.user || res.data.data);
        return { success: true, data: res.data.user || res.data.data };
      }
      return { success: true, data: res.data };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // ── Get profile ─────────────────────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      const userData = res.data?.data;
      if (userData) {
        const normalizedRole = normalizeRole(userData.role);
        setUser({ ...userData, role: normalizedRole });
        setRole(normalizedRole);
      }
      return userData;
    } catch {
      return null;
    }
  };

  // ── User management (admin) ─────────────────────────────────────────────
  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/auth/users');
      setLoading(false);
      return { success: true, data: res.data.data };
    } catch (err) {
      setLoading(false);
      return { success: false, error: err.response?.data?.error || 'Failed to fetch users', data: [] };
    }
  };

  const deleteUser = async (id) => {
    try {
      await apiClient.delete(`/auth/users/${id}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to delete user' };
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────
  const logout = () => {
    clearAuth();
  };

  // Legacy compat — switchRole for role-based nav
  const switchRole = (newRole) => {
    const normalizedRole = normalizeRole(newRole);
    setRole(normalizedRole);
    if (normalizedRole) {
      localStorage.setItem('userRole', normalizedRole);
    } else {
      localStorage.removeItem('userRole');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        loading,
        error,
        pending2FA,
        login,
        verify2FA,
        register,
        logout,
        switchRole,
        fetchProfile,
        fetchAllUsers,
        deleteUser,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
