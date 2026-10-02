import React from 'react';
import { Building2, KeyRound, UserCheck, CalendarCheck, Utensils, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ activeTab, setActiveTab, onOpenLookup, onOpenAdmin }) => {
  const { isAuthenticated, currentUser, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-hotel-navy-950/95 backdrop-blur-md border-b border-hotel-navy-800 text-white transition-all shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('explore')}
          >
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-hotel-gold-400 to-hotel-gold-600 flex items-center justify-center shadow-md shadow-hotel-gold-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6 text-hotel-navy-950" />
            </div>
            <div>
              <span className="font-serif tracking-widest text-lg sm:text-xl font-bold bg-gradient-to-r from-hotel-gold-300 via-hotel-gold-400 to-amber-200 bg-clip-text text-transparent block">
                GRAND AZURE
              </span>
              <span className="text-[10px] tracking-[0.25em] text-slate-400 uppercase block font-medium">
                Palace & Resort • Udaipur
              </span>
            </div>
          </div>

          {/* Navigation items */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <button
              onClick={() => setActiveTab('explore')}
              className={`transition-colors py-1 border-b-2 ${
                activeTab === 'explore'
                  ? 'border-hotel-gold-500 text-hotel-gold-400'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              Suites & Villas
            </button>
            <button
              onClick={() => setActiveTab('amenities')}
              className={`transition-colors py-1 border-b-2 ${
                activeTab === 'amenities'
                  ? 'border-hotel-gold-500 text-hotel-gold-400'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              Palace Amenities
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('amenities');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-slate-300 hover:text-white transition-colors py-1"
            >
              Royal Dining
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenLookup}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-hotel-navy-800 text-hotel-gold-300 hover:bg-hotel-navy-700 border border-hotel-navy-700 transition"
              title="Lookup active reservation & order in-room dining"
            >
              <KeyRound className="w-3.5 h-3.5 text-hotel-gold-400" />
              <span>My Reservation</span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenAdmin}
                  className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-hotel-gold-500 hover:bg-hotel-gold-400 text-hotel-navy-950 shadow-sm transition"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{currentUser?.name?.split(' ')[0] || 'My Account'}</span>
                </button>
                <button
                  onClick={() => logout()}
                  className="px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-hotel-navy-800 rounded-lg transition"
                  title="Sign out of account"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdmin}
                className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-hotel-gold-500 to-hotel-gold-600 text-hotel-navy-950 hover:brightness-110 shadow-sm transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Staff & Guest Login</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
