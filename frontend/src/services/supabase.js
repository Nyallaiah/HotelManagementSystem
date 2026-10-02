import { createClient } from '@supabase/supabase-js';

// Supabase Environment Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-hotel-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key-for-local-development-mode';

export const isSupabaseConfigured = 
  Boolean(import.meta.env.VITE_SUPABASE_URL) && 
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY) && 
  !import.meta.env.VITE_SUPABASE_URL.includes('mock');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Initiates Google OAuth Sign-In via Supabase
 */
export const signInWithGoogle = async (redirectTo = window.location.origin) => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase keys not detected in .env. Running local simulated Google sign-in.');
    return {
      data: null,
      error: null,
      simulated: true,
      user: {
        id: `sb_sim_${Date.now()}`,
        email: 'rajesh.sharma@gmail.com',
        user_metadata: {
          full_name: 'Rajesh Sharma',
          name: 'Rajesh Sharma',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        },
      },
    };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  return { data, error };
};

/**
 * Email & Password Sign-In via Supabase
 */
export const signInWithEmail = async (email, password) => {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is running in local fallback mode. Use direct password or instant test options.') };
  }
  return supabase.auth.signInWithPassword({ email, password });
};

/**
 * Email & Password Registration via Supabase
 */
export const signUpWithEmail = async (email, password, metadata = {}) => {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is in local fallback mode.') };
  }
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
};

/**
 * Phone OTP Sign-In (India +91) via Supabase
 */
export const signInWithPhoneOtp = async (phone) => {
  if (!isSupabaseConfigured) {
    return { data: null, error: null, simulated: true };
  }
  return supabase.auth.signInWithOtp({
    phone,
  });
};

/**
 * Verify Phone OTP Code via Supabase
 */
export const verifyPhoneOtp = async (phone, token) => {
  if (!isSupabaseConfigured) {
    return { data: null, error: null, simulated: true };
  }
  return supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
};

/**
 * Realtime helper to subscribe to database tables
 */
export const subscribeToRealtimeTable = (tableName, onInsert, onUpdate, onDelete) => {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`realtime_${tableName}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: tableName },
      (payload) => onInsert && onInsert(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: tableName },
      (payload) => onUpdate && onUpdate(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: tableName },
      (payload) => onDelete && onDelete(payload.old)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
