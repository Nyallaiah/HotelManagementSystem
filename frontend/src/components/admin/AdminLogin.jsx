import React, { useState } from 'react';
import { Building2, Lock, Mail, Phone, ShieldCheck, AlertCircle, Sparkles, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin = ({ onCancel, onLoginSuccess }) => {
  const { login, loginWithGoogle, sendPhoneOtp, verifyPhoneOtp, syncSimulatedUser, isSupabaseConfigured } = useAuth();
  
  // Sign in Mode: 'main' (Google & Phone selection) | 'phone_otp' | 'credentials'
  const [authMode, setAuthMode] = useState('main'); 
  
  // Indian Phone OTP state
  const [phoneNumber, setPhoneNumber] = useState('+91 ');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Email / Password state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Supabase Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogle();
      if (user && onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  // Indian Phone SMS OTP flow
  const handleSendOtp = async () => {
    const rawNumber = phoneNumber.replace(/\s+/g, '');
    if (!rawNumber || rawNumber.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number (+91).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPhoneOtp(rawNumber);
      const testCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(testCode);
      setOtpCode(testCode); // auto-fill in demo/dev mode for convenience
      setOtpSent(true);
    } catch (err) {
      setError(err.message || 'Failed to dispatch SMS OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the 6-digit OTP received on your mobile.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rawNumber = phoneNumber.replace(/\s+/g, '');
      const user = await verifyPhoneOtp(rawNumber, otpCode);
      if (onLoginSuccess && user) onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Email / Password Form Submit
  const handlePasswordSubmit = async (e) => {
    e?.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your email/phone and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await login(identifier, password);
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick staff demo switchers
  const handleQuickDemoStaff = async (email, password) => {
    setIdentifier(email);
    setPassword(password);
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hotel-navy-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white relative">
      
      {/* Background Palace Ambience */}
      <div className="absolute inset-0 opacity-25 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80"
          alt="Grand Azure Palace Background"
          className="w-full h-full object-cover filter brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-hotel-navy-950 via-hotel-navy-950/85 to-transparent"></div>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-hotel-gold-400 to-hotel-gold-600 flex items-center justify-center mx-auto shadow-xl shadow-hotel-gold-500/25 mb-4 border border-hotel-gold-300/40">
          <Building2 className="w-8 h-8 text-hotel-navy-950" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-white tracking-tight">
          Grand Azure Palace & Resort
        </h2>
        <p className="mt-1.5 text-xs text-slate-300 font-light tracking-wide">
          Udaipur, Rajasthan • Hotel ERP & Guest Concierge
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-hotel-navy-900/95 backdrop-blur-md py-8 px-6 sm:px-10 rounded-2xl shadow-2xl border border-hotel-navy-700">
          
          {error && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* MAIN AUTH SELECTION */}
          {authMode === 'main' && (
            <div className="space-y-3.5">
              
              {/* Google OAuth Button via Supabase */}
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs tracking-wider rounded-xl transition shadow-md flex items-center justify-center space-x-3 border border-slate-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{loading ? 'Connecting with Google...' : 'Continue with Google'}</span>
              </button>

              {/* Indian Phone Number Button */}
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setAuthMode('phone_otp');
                  setError(null);
                }}
                className="w-full py-3 px-4 bg-hotel-navy-800 hover:bg-hotel-navy-700 text-white font-semibold text-xs tracking-wider rounded-xl transition shadow-md flex items-center justify-center space-x-3 border border-hotel-navy-600"
              >
                <Phone className="w-4 h-4 text-hotel-gold-400" />
                <span>Continue with Mobile (India +91)</span>
              </button>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-hotel-navy-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-hotel-navy-900 text-slate-400 text-[11px]">or staff credentials</span>
                </div>
              </div>

              {/* Password option */}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('credentials');
                  setError(null);
                }}
                className="w-full py-2.5 px-4 bg-hotel-navy-950/60 hover:bg-hotel-navy-950 text-slate-300 font-medium text-xs rounded-xl transition border border-hotel-navy-800 flex items-center justify-center space-x-2"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Sign in with Staff Password</span>
              </button>
            </div>
          )}

          {/* PHONE SMS OTP FLOW */}
          {authMode === 'phone_otp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Indian Mobile Number (+91)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-hotel-navy-950 border border-hotel-navy-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-hotel-gold-500 focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  disabled={loading || !phoneNumber}
                  onClick={handleSendOtp}
                  className="w-full py-3 bg-gradient-to-r from-hotel-gold-500 to-hotel-gold-600 hover:brightness-110 text-hotel-navy-950 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg flex items-center justify-center space-x-2"
                >
                  <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                </button>
              ) : (
                <div className="space-y-3 pt-1">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      OTP sent to {phoneNumber}
                    </span>
                    <span className="font-mono font-bold bg-emerald-950 px-2 py-0.5 rounded text-emerald-200">
                      {generatedOtp}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Enter 6-Digit OTP
                    </label>
                    <input
                      type="text"
                      maxLength="6"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="6-digit OTP"
                      className="w-full text-center tracking-[0.5em] py-2.5 bg-hotel-navy-950 border border-hotel-navy-700 rounded-xl text-lg font-mono text-white placeholder-slate-600 focus:ring-2 focus:ring-hotel-gold-500 focus:outline-none transition"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleVerifyOtp}
                    className="w-full py-3 bg-gradient-to-r from-hotel-gold-500 to-hotel-gold-600 hover:brightness-110 text-hotel-navy-950 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg flex items-center justify-center space-x-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-hotel-navy-950" />
                    <span>{loading ? 'Verifying...' : 'Verify OTP & Continue'}</span>
                  </button>
                </div>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('main');
                    setOtpSent(false);
                  }}
                  className="text-xs text-slate-400 hover:text-white transition"
                >
                  ← Back to Sign-in Options
                </button>
              </div>
            </div>
          )}

          {/* CREDENTIALS LOGIN FLOW */}
          {authMode === 'credentials' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email or Mobile
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@grandazure.com or phone"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-hotel-navy-950 border border-hotel-navy-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-hotel-gold-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-hotel-navy-950 border border-hotel-navy-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-hotel-gold-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-hotel-gold-500 to-hotel-gold-600 hover:brightness-110 text-hotel-navy-950 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4 text-hotel-navy-950" />
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('main')}
                  className="text-xs text-slate-400 hover:text-white transition"
                >
                  ← Back to Google & Mobile Options
                </button>
              </div>
            </form>
          )}

          {/* Instant Staff Test Switchers (1-Click Login) */}
          <div className="mt-6 pt-4 border-t border-hotel-navy-800">
            <span className="block text-[10px] text-hotel-gold-400 uppercase tracking-widest text-center mb-2.5 font-bold">
              ★ Quick 1-Click Demo Portals ★
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoStaff('admin@grandazure.com', 'Admin@123')}
                className="p-2 rounded-lg bg-hotel-navy-950 hover:bg-hotel-navy-800 border border-hotel-navy-700 text-left transition flex items-center justify-between"
              >
                <div>
                  <span className="text-white font-medium block truncate">General Manager</span>
                  <span className="text-[10px] text-hotel-gold-400">Executive Admin</span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </button>
              
              <button
                type="button"
                onClick={() => handleQuickDemoStaff('reception@grandazure.com', 'Frontdesk@123')}
                className="p-2 rounded-lg bg-hotel-navy-950 hover:bg-hotel-navy-800 border border-hotel-navy-700 text-left transition flex items-center justify-between"
              >
                <div>
                  <span className="text-white font-medium block truncate">Front Desk</span>
                  <span className="text-[10px] text-hotel-gold-400">Check-in & Keys</span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoStaff('housekeeping@grandazure.com', 'Clean@123')}
                className="p-2 rounded-lg bg-hotel-navy-950 hover:bg-hotel-navy-800 border border-hotel-navy-700 text-left transition flex items-center justify-between"
              >
                <div>
                  <span className="text-white font-medium block truncate">Housekeeping</span>
                  <span className="text-[10px] text-hotel-gold-400">Room Matrix</span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoStaff('dining@grandazure.com', 'Chef@123')}
                className="p-2 rounded-lg bg-hotel-navy-950 hover:bg-hotel-navy-800 border border-hotel-navy-700 text-left transition flex items-center justify-between"
              >
                <div>
                  <span className="text-white font-medium block truncate">Executive Chef</span>
                  <span className="text-[10px] text-hotel-gold-400">Kitchen KOT POS</span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-hotel-navy-800 text-center">
            <button
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              ← Return to Palace Experience
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
