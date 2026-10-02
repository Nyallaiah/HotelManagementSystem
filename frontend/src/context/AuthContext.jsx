import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  supabase, 
  isSupabaseConfigured, 
  signInWithGoogle as supabaseGoogleSignIn,
  signInWithEmail as supabaseEmailSignIn,
  signUpWithEmail as supabaseEmailSignUp,
  signInWithPhoneOtp as supabasePhoneSignIn,
  verifyPhoneOtp as supabaseVerifyPhone
} from '../services/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseSession, setSupabaseSession] = useState(null);

  useEffect(() => {
    // 1. Initial Session Check from localStorage
    const initAuth = async () => {
      const token = localStorage.getItem('hotel_erp_token');
      if (token) {
        try {
          const user = await api.getMe();
          setCurrentUser(user);
        } catch (err) {
          console.warn('Session expired or invalid:', err);
          api.logout();
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();

    // 2. Supabase Auth State Change Listener (Realtime OAuth callback & session refresh)
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSupabaseSession(session);
        if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          try {
            const syncedUser = await api.syncSupabaseUser(session.user);
            setCurrentUser(syncedUser.user);
          } catch (err) {
            console.error('Failed to sync Supabase user with backend:', err);
          }
        } else if (event === 'SIGNED_OUT') {
          api.logout();
          setCurrentUser(null);
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, []);

  // Google OAuth Sign-In via Supabase
  const loginWithGoogle = async () => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseGoogleSignIn();
      if (error) throw error;
      return data;
    } else {
      // Local development simulation
      const res = await api.syncSupabaseUser({
        id: `sb_sim_${Date.now()}`,
        email: 'rajesh.sharma@gmail.com',
        user_metadata: {
          full_name: 'Rajesh Sharma',
          name: 'Rajesh Sharma',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        },
        app_metadata: { provider: 'google' }
      });
      setCurrentUser(res.user);
      return res.user;
    }
  };

  // Indian Phone OTP Authentication
  const sendPhoneOtp = async (phoneNumber) => {
    return supabasePhoneSignIn(phoneNumber);
  };

  const verifyPhoneOtp = async (phoneNumber, token) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseVerifyPhone(phoneNumber, token);
      if (error) throw error;
      if (data?.user) {
        const res = await api.syncSupabaseUser(data.user);
        setCurrentUser(res.user);
        return res.user;
      }
    } else {
      // Simulated phone login
      const cleanPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91 ${phoneNumber}`;
      const res = await api.syncSupabaseUser({
        id: `sb_phone_${Date.now()}`,
        phone: cleanPhone,
        user_metadata: {
          full_name: `Guest (${cleanPhone.slice(-4)})`,
        },
        app_metadata: { provider: 'phone_number' }
      });
      setCurrentUser(res.user);
      return res.user;
    }
  };

  // Email / Password Login
  const login = async (emailOrPhone, password) => {
    const res = await api.login(emailOrPhone, password);
    setCurrentUser(res.user);
    return res.user;
  };

  // Direct Simulated User Switcher (For local testing)
  const syncSimulatedUser = async ({ email, phone_number, name, role }) => {
    const res = await api.syncSupabaseUser({
      id: `sb_user_${Date.now()}`,
      email: email || null,
      phone: phone_number || null,
      user_metadata: {
        full_name: name || 'Valued Guest',
      },
      app_metadata: { provider: email ? 'google' : 'phone_number', role_hint: role }
    });
    setCurrentUser(res.user);
    return res.user;
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    api.logout();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      role: currentUser?.role || null,
      login,
      loginWithGoogle,
      sendPhoneOtp,
      verifyPhoneOtp,
      syncSimulatedUser,
      syncClerk: syncSimulatedUser, // alias
      logout,
      loading,
      isAuthenticated: !!currentUser,
      isSupabaseConfigured,
      supabaseSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
