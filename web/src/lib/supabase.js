import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://goaslfqjjmywaowobbwj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvYXNsZnFqam15d2Fvd29iYndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDAwNjgsImV4cCI6MjA5NTk3NjA2OH0.SgkQiLDjiLfIQDdYCFF0EZcqyacUWMPQlb7XyDFrHrg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helper functions
export const signUp = async (email, password, options = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: options.data || {},
      ...options
    }
  });
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

export const signInWithPhone = async (phone, token) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms'
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

export default supabase;
