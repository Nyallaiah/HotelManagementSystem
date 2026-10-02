import React from 'react';
import { Calendar, Users, BedDouble, Search, Award, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Hero = ({
  checkIn,
  setCheckIn,
  checkOut,
  setCheckOut,
  adults,
  setAdults,
  roomType,
  setRoomType,
  onSearch,
  isSearching
}) => {
  const { isAuthenticated, currentUser } = useAuth();

  return (
    <div className="relative bg-hotel-navy-950 text-white overflow-hidden pb-16 pt-12">
      {/* Decorative backdrop luxury gradient & glow */}
      <div className="absolute inset-0 z-0 opacity-35">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80"
          alt="Grand Azure Palace Udaipur"
          className="w-full h-full object-cover object-center filter brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-hotel-navy-950 via-hotel-navy-950/75 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Luxury Tagline */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          {isAuthenticated ? (
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-semibold tracking-wider uppercase mb-5 backdrop-blur-sm shadow-sm">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Namaste, {currentUser?.name?.split(' ')[0] || 'Valued Guest'} • Priority Royal Privileges Active</span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-hotel-gold-500/10 border border-hotel-gold-400/30 text-hotel-gold-300 text-xs font-semibold tracking-wider uppercase mb-5 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-hotel-gold-400" />
              <span>Awarded India's Leading Heritage Palace Resort 2026</span>
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
            Royal Heritage Meets <span className="italic font-normal bg-gradient-to-r from-hotel-gold-300 via-amber-200 to-hotel-gold-500 bg-clip-text text-transparent">Lakeview Serenity</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 font-light">
            Indulge in 24 Lake Pichola facing heritage suites, authentic Royal Rajasthani dining, 
            and bespoke concierge services tailored to perfection.
          </p>
        </div>

        {/* Real-Time Booking & Availability Bar */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-2xl border border-white/20 text-slate-900 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
            
            {/* Check-In */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-hotel-navy-800" /> Check-in Date
              </label>
              <input
                type="date"
                value={checkIn}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-hotel-gold-500"
              />
            </div>

            {/* Check-Out */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-hotel-navy-800" /> Check-out Date
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || new Date().toISOString().split('T')[0]}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-hotel-gold-500"
              />
            </div>

            {/* Guests */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-hotel-navy-800" /> Guests
              </label>
              <select
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-hotel-gold-500"
              >
                <option value={1}>1 Guest</option>
                <option value={2}>2 Guests</option>
                <option value={3}>3 Guests</option>
                <option value={4}>4 Guests</option>
              </select>
            </div>

            {/* Suite Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <BedDouble className="w-3.5 h-3.5 text-hotel-navy-800" /> Room Class
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-hotel-gold-500"
              >
                <option value="">All Palace Classes</option>
                <option value="Standard Queen">Standard Queen (from ₹3,999)</option>
                <option value="Deluxe King">Deluxe King (from ₹5,999)</option>
                <option value="Executive Ocean Suite">Executive Suite (from ₹9,999)</option>
                <option value="Presidential Penthouse">Presidential Villa (from ₹24,999)</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="sm:col-span-2 lg:col-span-1 pt-1 sm:pt-0">
              <label className="hidden lg:block text-xs font-semibold uppercase tracking-wider text-transparent mb-1">
                Action
              </label>
              <button
                onClick={onSearch}
                disabled={isSearching}
                className="w-full h-11 bg-hotel-navy-950 hover:bg-hotel-navy-800 text-hotel-gold-400 font-semibold rounded-lg px-4 flex items-center justify-center space-x-2 transition shadow-lg hover:shadow-xl border border-hotel-gold-500/30"
              >
                <Search className="w-4 h-4 text-hotel-gold-400" />
                <span>{isSearching ? 'Searching...' : 'Check Tariffs'}</span>
              </button>
            </div>

          </div>

          {/* Quick Perks Strip */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4" /> Best Direct Tariff Guarantee
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-hotel-gold-600" /> Complimentary High-Speed Fiber WiFi & Valet
            </span>
            <span className="text-slate-500">
              *Instant UPI & Card verification with Indian GST Invoice
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
