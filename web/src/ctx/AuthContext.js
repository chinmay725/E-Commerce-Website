import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, signUp, signIn, signInWithPhone, signOut, getCurrentUser, onAuthStateChange } from '../lib/supabase';
import api from '../lib/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const { user: authUser } = await getCurrentUser();
        if (authUser) {
          // Fetch user profile from public.user_profiles table
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
          
          setUser({ ...authUser, ...profile });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUser({ ...session.user, ...profile });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendOtp = async (phone) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms'
        }
      });
      if (error) throw error;
      toast.success('OTP sent successfully');
      return { success: true };
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (phone, code, name) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: 'sms'
      });
      
      if (error) throw error;
      
      // Update user profile with name if provided
      if (name && data.user) {
        await supabase
          .from('user_profiles')
          .update({ name })
          .eq('id', data.user.id);
      }
      
      toast.success('Login successful');
      return { success: true, user: data.user };
    } catch (error) {
      toast.error(error.message || 'Invalid OTP');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await signIn(email, password);
      if (error) throw error;
      
      // Check if user is admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      
      if (profile?.role !== 'admin') {
        await signOut();
        throw new Error('Access denied. Admin only.');
      }
      
      toast.success('Welcome back, Admin!');
      return { success: true, user: data.user };
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      await signOut();
      setUser(null);
      setSession(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, sendOtp, verifyOtp, adminLogin, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
