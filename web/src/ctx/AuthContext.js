import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('sk_user')) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  // Restore session on mount — verify token is still valid
  useEffect(() => {
    const token = localStorage.getItem('sk_token');
    if (!token) return;
    api.get('/auth/me')
      .then(({ data }) => { if (data.success) setUser(data.user); })
      .catch(() => {
        // Token expired or invalid — clear storage
        localStorage.removeItem('sk_token');
        localStorage.removeItem('sk_user');
        setUser(null);
      });
  }, []);

  // ── Send OTP ─────────────────────────────────────────────
  const sendOtp = async (email) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/send-otp', { email });
      if (!data.success) throw new Error(data.message);

      // In dev mode the server echoes a devCode when no SMTP is configured
      if (data.provider === 'console' && data.devCode) {
        toast('🛠 Dev mode — check console for OTP', { icon: '⚠️', duration: 5000 });
      } else {
        toast.success('Verification code sent to ' + email);
      }

      return data; // includes { isNewUser, provider, devCode? }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send verification code';
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ────────────────────────────────────────────
  const verifyOtp = async (email, code, name) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, code, name });
      if (!data.success) throw new Error(data.message);

      // Persist token and user profile
      localStorage.setItem('sk_token', data.token);
      localStorage.setItem('sk_user',  JSON.stringify(data.user));
      setUser(data.user);

      toast.success(data.isNew ? 'Account created! Welcome 🎉' : 'Login successful!');
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid verification code';
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };


  // ── Admin Login (email + password) ────────────────────────
  const adminLogin = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (!data.success) throw new Error(data.message);

      if (data.user?.role !== 'admin') {
        throw new Error('Access denied. Admin only.');
      }

      localStorage.setItem('sk_token', data.token);
      localStorage.setItem('sk_user',  JSON.stringify(data.user));
      setUser(data.user);

      toast.success('Welcome back, Admin! 👋');
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('sk_token');
    localStorage.removeItem('sk_user');
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      sendOtp,
      verifyOtp,
      adminLogin,
      logout,
      isAdmin: user?.role === 'admin',
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
