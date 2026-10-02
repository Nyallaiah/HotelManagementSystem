import React, { useState, useEffect } from 'react';
import { 
  KeyRound, Search, Utensils, Receipt, Wifi, Clock, Plus, Minus, 
  ShoppingBag, CheckCircle, Printer, ArrowLeft, Building2, Sparkles, AlertCircle, Calendar, 
  User, CheckCircle2, ChevronRight, LogIn, BedDouble, ShieldCheck 
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const GuestFolio = ({ initialReference = '', initialEmail = '', onBack, onOpenBooking }) => {
  const { currentUser, isAuthenticated, loginWithGoogle } = useAuth();
  
  // Tab state: 'active_stay' | 'all_bookings' | 'dining'
  const [activeTab, setActiveTab] = useState('active_stay');

  // Manual lookup state (for unauthenticated guests)
  const [reference, setReference] = useState(initialReference);
  const [contact, setContact] = useState(initialEmail || currentUser?.email || currentUser?.phone_number || '');
  
  // Bookings state
  const [booking, setBooking] = useState(null);
  const [allUserBookings, setAllUserBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dining Menu & Cart
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState({});
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Invoice modal toggle
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState(null);

  // Auto-fetch bookings on login without requiring manual reference ID!
  useEffect(() => {
    if (initialReference && initialEmail) {
      handleLookup(initialReference, initialEmail);
    } else if (isAuthenticated) {
      loadMyBookings();
    }
  }, [initialReference, initialEmail, isAuthenticated]);

  const loadMyBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMyBookings();
      if (res.bookings && res.bookings.length > 0) {
        setAllUserBookings(res.bookings);
        // Default to active stay if available, or most recent booking
        const active = res.active_booking || res.bookings[0];
        setBooking(active);
        setSelectedInvoiceBooking(active);
      } else {
        setBooking(null);
        setAllUserBookings([]);
      }
    } catch (err) {
      console.warn('Could not auto-fetch my bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load dining menu once reservation is active
  useEffect(() => {
    if (booking) {
      loadMenu();
    }
  }, [booking]);

  const loadMenu = async () => {
    try {
      const items = await api.getMenu();
      setMenuItems(items);
    } catch (err) {
      console.warn('Failed to load menu:', err);
    }
  };

  const handleLookup = async (lookupRef = reference, lookupContact = contact) => {
    if (!lookupRef) {
      setError('Please provide your booking reference ID.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.lookupBooking(lookupRef, lookupContact);
      setBooking(data);
      setSelectedInvoiceBooking(data);
    } catch (err) {
      setError(err.message || 'No reservation found matching this reference.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev[item.name];
      return {
        ...prev,
        [item.name]: {
          item_id: item.id || item.name,
          name: item.name,
          price: item.price,
          quantity: (existing?.quantity || 0) + 1
        }
      };
    });
  };

  const removeFromCart = (itemName) => {
    setCart(prev => {
      const existing = prev[itemName];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[itemName];
        return copy;
      }
      return {
        ...prev,
        [itemName]: { ...existing, quantity: existing.quantity - 1 }
      };
    });
  };

  const cartItemsList = Object.values(cart);
  const cartSubtotal = cartItemsList.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const cartTax = Math.round(cartSubtotal * 0.05 * 100) / 100; // 5% GST on F&B
  const cartTotal = Math.round((cartSubtotal + cartTax) * 100) / 100;

  const handlePlaceDiningOrder = async () => {
    if (cartItemsList.length === 0 || !booking) return;
    setOrderSubmitting(true);
    try {
      const payload = {
        booking_reference: booking.booking_reference,
        room_number: booking.room_number,
        guest_name: `${booking.guest.first_name} ${booking.guest.last_name}`,
        items: cartItemsList,
        charge_to_room: true,
        notes: 'Guest placed order via Self-Service Portal'
      };

      const orderResp = await api.createOrder(payload);
      setOrderSuccess(`Order ${orderResp.order_id} placed! Kitchen is preparing your dishes.`);
      setCart({});

      // Refresh booking to reflect new folio balance
      const updatedBooking = await api.lookupBooking(booking.booking_reference, booking.guest.email);
      setBooking(updatedBooking);
      setSelectedInvoiceBooking(updatedBooking);

      setTimeout(() => setOrderSuccess(null), 6000);
    } catch (err) {
      setError('Failed to place dining order: ' + err.message);
    } finally {
      setOrderSubmitting(false);
    }
  };

  const categories = ['All', 'Breakfast', 'Gourmet Mains', 'Artisan Desserts', 'Beverages'];
  const filteredMenu = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter(m => m.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="min-h-screen bg-hotel-cream py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center text-xs font-semibold text-hotel-navy-950 hover:text-hotel-gold-700 bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm transition self-start"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Palace Portal
          </button>

          <div className="flex items-center space-x-3">
            {isAuthenticated && (
              <div className="flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-slate-600 font-medium">Logged in:</span>
                <strong className="text-hotel-navy-950">{currentUser?.name || currentUser?.email}</strong>
              </div>
            )}
            <span className="text-xs font-serif font-bold text-hotel-navy-950 uppercase tracking-widest hidden sm:inline">
              Guest Portal
            </span>
          </div>
        </div>

        {/* UNAUTHENTICATED GUEST SCREEN */}
        {!isAuthenticated && !booking ? (
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 border border-slate-200/80 text-center">
            <div className="w-14 h-14 bg-hotel-gold-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-hotel-gold-600">
              <KeyRound className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-serif font-bold text-hotel-navy-950 mb-1">
              Guest Portal & My Stays
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Sign in with your Google account or mobile number to automatically view your reservations, room keys, and in-room dining without entering a reference ID.
            </p>

            {/* Instant Login with Google */}
            <button
              onClick={() => loginWithGoogle()}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs tracking-wider rounded-xl transition shadow-md flex items-center justify-center space-x-3 border border-slate-200 mb-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign In with Google</span>
            </button>

            {/* Divider */}
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-400 text-[11px]">or lookup with booking reference</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleLookup(); }} className="space-y-3 text-left">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Booking Reference ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GAP-78214"
                  value={reference}
                  onChange={(e) => setReference(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:ring-2 focus:ring-hotel-gold-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email or Mobile Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="rajesh.sharma@gmail.com"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-hotel-gold-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-hotel-navy-950 hover:bg-hotel-navy-800 text-hotel-gold-400 font-semibold text-xs uppercase tracking-wider rounded-lg transition shadow-md flex items-center justify-center space-x-2"
              >
                <Search className="w-3.5 h-3.5 text-hotel-gold-400" />
                <span>{loading ? 'Searching...' : 'Find My Reservation'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED GUEST DASHBOARD (Industry-standard Customer Portal) */
          <div className="space-y-6">
            
            {/* Guest Header Hero Banner */}
            <div className="bg-hotel-navy-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-hotel-navy-800 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center space-x-2 bg-hotel-gold-500/20 text-hotel-gold-300 px-3 py-1 rounded-full text-xs font-medium border border-hotel-gold-500/30 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-hotel-gold-400" />
                    <span>Royal Heritage Guest Privileges</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                    Namaste, {booking?.guest?.first_name || currentUser?.name || 'Valued Guest'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    {booking 
                      ? `${booking.room_type} • Suite #${booking.room_number} • Ref: ${booking.booking_reference}`
                      : 'You currently have no active stay in progress.'}
                  </p>
                </div>

                {/* Quick Widgets */}
                {booking && (
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="bg-hotel-navy-900/80 border border-hotel-navy-700 p-3 rounded-xl min-w-[120px]">
                      <span className="text-slate-400 block text-[10px] uppercase">Stay Dates</span>
                      <span className="font-semibold text-white">{booking.check_in}</span>
                      <span className="text-slate-400 block text-[10px]">to {booking.check_out} ({booking.nights}N)</span>
                    </div>

                    <div className="bg-hotel-navy-900/80 border border-hotel-navy-700 p-3 rounded-xl min-w-[120px]">
                      <span className="text-slate-400 block text-[10px] uppercase">Palace WiFi</span>
                      <span className="font-mono font-bold text-hotel-gold-400 flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5" /> PALACE-LUX
                      </span>
                      <span className="text-slate-400 block text-[10px]">SSID: GrandAzure-5G</span>
                    </div>

                    <div className="bg-hotel-navy-900/80 border border-hotel-navy-700 p-3 rounded-xl min-w-[120px]">
                      <span className="text-slate-400 block text-[10px] uppercase">Folio Balance</span>
                      <span className={`text-base font-serif font-bold ${booking.balance_due > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        ₹{Number(booking.balance_due || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-slate-400 block text-[10px]">Paid: ₹{Number(booking.amount_paid || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Tabs (Industry Portal Structure: Active Stay / My Reservations / In-Room Dining) */}
            <div className="flex border-b border-slate-200 text-xs font-semibold space-x-6">
              <button
                onClick={() => setActiveTab('active_stay')}
                className={`py-3 border-b-2 transition flex items-center gap-2 ${
                  activeTab === 'active_stay'
                    ? 'border-hotel-navy-950 text-hotel-navy-950'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Active Stay & Folio</span>
              </button>

              <button
                onClick={() => setActiveTab('all_bookings')}
                className={`py-3 border-b-2 transition flex items-center gap-2 ${
                  activeTab === 'all_bookings'
                    ? 'border-hotel-navy-950 text-hotel-navy-950'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>All Reservations ({allUserBookings.length})</span>
              </button>

              {booking && (
                <button
                  onClick={() => setActiveTab('dining')}
                  className={`py-3 border-b-2 transition flex items-center gap-2 ${
                    activeTab === 'dining'
                      ? 'border-hotel-navy-950 text-hotel-navy-950'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  <span>In-Room Dining Menu</span>
                </button>
              )}
            </div>

            {orderSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{orderSuccess}</span>
              </div>
            )}

            {/* TAB 1: ACTIVE STAY & FOLIO */}
            {activeTab === 'active_stay' && (
              booking ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Suite details & In-Room Dining shortcuts */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-hotel-gold-700">Currently Occupied</span>
                          <h3 className="text-xl font-serif font-bold text-slate-900 mt-0.5">{booking.room_type}</h3>
                          <p className="text-xs text-slate-500">Suite #{booking.room_number} • Ref: {booking.booking_reference}</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full uppercase">
                          {booking.booking_status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6 text-xs text-slate-600">
                        <div className="bg-slate-50 p-3 rounded-xl">
                          <span className="text-[10px] text-slate-400 block uppercase">Check-In</span>
                          <strong className="text-slate-900">{booking.check_in}</strong>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl">
                          <span className="text-[10px] text-slate-400 block uppercase">Check-Out</span>
                          <strong className="text-slate-900">{booking.check_out}</strong>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl">
                          <span className="text-[10px] text-slate-400 block uppercase">Guests</span>
                          <strong className="text-slate-900">{booking.adults} Adults</strong>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl">
                          <span className="text-[10px] text-slate-400 block uppercase">Rate / Night</span>
                          <strong className="text-slate-900">₹{Number(booking.room_rate_per_night || 5999).toLocaleString('en-IN')}</strong>
                        </div>
                      </div>

                      {/* In-Room Dining CTA */}
                      <div className="p-4 rounded-xl bg-gradient-to-r from-hotel-navy-950 to-hotel-navy-900 text-white flex items-center justify-between">
                        <div>
                          <h4 className="font-serif font-bold text-sm text-hotel-gold-300 flex items-center gap-1.5">
                            <Utensils className="w-4 h-4" /> Order Fresh In-Room Dining
                          </h4>
                          <p className="text-[11px] text-slate-300">Royal Rajasthani Thalis, Biryani & Beverages billed to your suite.</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('dining')}
                          className="px-4 py-2 bg-hotel-gold-500 hover:bg-hotel-gold-400 text-hotel-navy-950 font-bold text-xs rounded-lg transition"
                        >
                          View Menu →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Running Folio & Invoice */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <h3 className="text-base font-serif font-bold text-hotel-navy-950 flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-hotel-gold-600" />
                          Live Room Folio
                        </h3>
                        <button
                          onClick={() => {
                            setSelectedInvoiceBooking(booking);
                            setShowInvoice(true);
                          }}
                          className="text-[11px] text-hotel-gold-700 hover:text-hotel-gold-800 font-semibold flex items-center gap-1 underline"
                        >
                          <Printer className="w-3 h-3" />
                          GST Invoice
                        </button>
                      </div>

                      {/* Folio Items List */}
                      <div className="divide-y divide-slate-100 my-4 text-xs">
                        {booking.folio_items?.length === 0 ? (
                          <p className="text-slate-400 py-3 text-center">No extra charges posted yet.</p>
                        ) : (
                          booking.folio_items?.map((item, idx) => (
                            <div key={idx} className="py-2.5 flex items-center justify-between">
                              <div>
                                <span className="font-medium text-slate-800 block">{item.description}</span>
                                <span className="text-[10px] text-slate-400 capitalize">{item.category}</span>
                              </div>
                              <span className="font-semibold text-slate-900">₹{Number(item.amount || 0).toLocaleString('en-IN')}</span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Totals */}
                      <div className="pt-4 border-t-2 border-slate-200 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Room Charges:</span>
                          <span>₹{Number(booking.room_charges || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>GST (12%):</span>
                          <span>₹{Number(booking.tax_amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Resort Fee (5%):</span>
                          <span>₹{Number(booking.service_fee || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                          <span>Total Amount:</span>
                          <span>₹{Number(booking.total_amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Amount Settled:</span>
                          <span>₹{Number(booking.amount_paid || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-hotel-navy-950 pt-2 border-t border-slate-200">
                          <span>Balance Due:</span>
                          <span className={booking.balance_due > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                            ₹{Number(booking.balance_due || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* No Active Stay State */
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-hotel-gold-500/10 flex items-center justify-center text-hotel-gold-600 mx-auto">
                    <BedDouble className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">No In-House Stay Active</h3>
                  <p className="text-xs text-slate-500">You do not have a checked-in suite today. View your past reservations or reserve a new heritage suite.</p>
                  <button
                    onClick={onBack}
                    className="px-5 py-2.5 bg-hotel-navy-950 text-hotel-gold-400 text-xs font-bold rounded-xl transition shadow"
                  >
                    Browse Available Suites →
                  </button>
                </div>
              )
            )}

            {/* TAB 2: ALL RESERVATIONS HISTORY */}
            {activeTab === 'all_bookings' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-serif font-bold text-base text-slate-900">Your Reservation History</h3>
                  <span className="text-xs text-slate-400">Total: {allUserBookings.length} bookings</span>
                </div>

                {allUserBookings.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No reservations linked to your account.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {allUserBookings.map((b) => (
                      <div key={b.booking_reference} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-hotel-navy-950">
                              {b.booking_reference}
                            </span>
                            <span className="font-bold text-sm text-slate-900">{b.room_type}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              b.booking_status === 'checked_in' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {b.booking_status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                            <span>Room #{b.room_number}</span>
                            <span>•</span>
                            <span>{b.check_in} to {b.check_out} ({b.nights}N)</span>
                            <span>•</span>
                            <span>₹{Number(b.total_amount || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setBooking(b);
                              setActiveTab('active_stay');
                            }}
                            className="px-3.5 py-1.5 bg-hotel-navy-950 text-hotel-gold-400 rounded-lg text-xs font-semibold shadow-xs"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInvoiceBooking(b);
                              setShowInvoice(true);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" /> Invoice
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: IN-ROOM DINING MENU */}
            {activeTab === 'dining' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-hotel-navy-950 flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-hotel-gold-600" />
                        Royal In-Room Dining
                      </h3>
                      <p className="text-xs text-slate-500">
                        Prepared fresh and delivered directly to Suite #{booking?.room_number}.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            selectedCategory === cat
                              ? 'bg-hotel-navy-950 text-hotel-gold-400'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Menu Dishes Grid */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredMenu.map((item) => {
                      const inCartQty = cart[item.name]?.quantity || 0;
                      return (
                        <div
                          key={item.name}
                          className="border border-slate-200 rounded-xl p-3 flex gap-3 hover:border-slate-300 transition bg-slate-50/50"
                        >
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80'}
                            alt={item.name}
                            className="w-20 h-20 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between">
                                <h4 className="text-xs font-bold text-hotel-navy-950 line-clamp-1">{item.name}</h4>
                                <span className="text-xs font-bold text-hotel-gold-700 ml-1">₹{item.price}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{item.description}</p>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {item.prep_time_minutes} min
                              </span>

                              {inCartQty === 0 ? (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="px-2.5 py-1 bg-hotel-navy-950 hover:bg-hotel-navy-800 text-hotel-gold-400 rounded-md text-[11px] font-semibold transition"
                                >
                                  + Add
                                </button>
                              ) : (
                                <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-md px-1.5 py-0.5">
                                  <button onClick={() => removeFromCart(item.name)} className="p-0.5 text-slate-500 hover:text-black">
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-xs font-bold px-1">{inCartQty}</span>
                                  <button onClick={() => addToCart(item)} className="p-0.5 text-slate-500 hover:text-black">
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cart Tray */}
                {cartItemsList.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-hotel-gold-400 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="text-xs font-bold uppercase tracking-wider text-hotel-navy-950 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-hotel-gold-600" />
                        <span>Selected Dishes ({cartItemsList.length})</span>
                      </span>
                      <span className="text-xs text-slate-500">Deliver to Suite #{booking?.room_number}</span>
                    </div>

                    <div className="divide-y divide-slate-100 my-3 text-xs">
                      {cartItemsList.map((i) => (
                        <div key={i.name} className="py-2 flex items-center justify-between">
                          <span>{i.quantity}x {i.name}</span>
                          <span className="font-semibold text-slate-800">₹{(i.price * i.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-xs flex justify-between font-bold text-hotel-navy-950 mb-4">
                      <span>Total (incl. 5% F&B GST):</span>
                      <span className="text-base text-hotel-gold-700">₹{cartTotal.toLocaleString('en-IN')}</span>
                    </div>

                    <button
                      onClick={handlePlaceDiningOrder}
                      disabled={orderSubmitting}
                      className="w-full py-2.5 bg-hotel-navy-950 hover:bg-hotel-navy-800 text-hotel-gold-400 rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>{orderSubmitting ? 'Sending Order to Kitchen...' : `Charge ₹${cartTotal.toLocaleString('en-IN')} to Suite Folio`}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Official Indian GST Tax Invoice Modal */}
      {showInvoice && selectedInvoiceBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl relative" id="guest-printable-invoice">
            
            <div className="no-print flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Official Indian GST Tax Invoice (SAC 996311)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-hotel-navy-950 text-hotel-gold-400 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
                <button
                  onClick={() => setShowInvoice(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-start pb-6 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-hotel-navy-950">GRAND AZURE PALACE & RESORT</h2>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Heritage Palace & Coastal Luxury</p>
                  <p className="text-xs text-slate-500 mt-2">Lake Palace Road, Udaipur, Rajasthan 313001, India</p>
                  <p className="text-xs text-slate-500">GSTIN: 08AAACG1234F1Z5 • SAC: 996311 • State: Rajasthan (08)</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-mono font-bold text-hotel-navy-950 block">
                    GST-INV-{selectedInvoiceBooking.booking_reference}
                  </span>
                  <span className="text-xs text-slate-500 block">Date: {new Date().toLocaleDateString('en-IN')}</span>
                  <span className={`text-xs font-semibold block mt-1 ${selectedInvoiceBooking.balance_due <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    Status: {selectedInvoiceBooking.balance_due <= 0 ? 'PAID IN FULL' : 'PARTIALLY SETTLED'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 my-6 text-xs text-slate-700">
                <div>
                  <div className="text-slate-400 uppercase text-[10px] font-bold">Billed To (Guest)</div>
                  <div className="font-bold text-sm text-slate-900 mt-0.5">{selectedInvoiceBooking.guest.first_name} {selectedInvoiceBooking.guest.last_name}</div>
                  <div>Email: {selectedInvoiceBooking.guest.email}</div>
                  <div>Mobile: {selectedInvoiceBooking.guest.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 uppercase text-[10px] font-bold">Stay Details</div>
                  <div className="font-bold text-sm text-slate-900 mt-0.5">Suite #{selectedInvoiceBooking.room_number} ({selectedInvoiceBooking.room_type})</div>
                  <div>Check-In: {selectedInvoiceBooking.check_in}</div>
                  <div>Check-Out: {selectedInvoiceBooking.check_out} ({selectedInvoiceBooking.nights} Nights)</div>
                </div>
              </div>

              <table className="w-full text-xs text-left mb-6">
                <thead>
                  <tr className="border-b-2 border-slate-800 text-slate-600">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-center">Category</th>
                    <th className="py-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoiceBooking.folio_items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 text-slate-800 font-medium">{item.description}</td>
                      <td className="py-2.5 text-center text-slate-500 capitalize">{item.category}</td>
                      <td className="py-2.5 text-right font-semibold text-slate-900">₹{Number(item.amount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t-2 border-slate-800 pt-4 flex justify-between items-start text-xs">
                <div className="text-slate-500 text-[11px]">
                  Thank you for visiting Grand Azure Palace, Udaipur.<br />
                  For billing queries, contact reservations@grandazurepalace.in
                </div>
                <div className="text-right space-y-1 min-w-[200px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{Number(selectedInvoiceBooking.room_charges || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (6%):</span>
                    <span>₹{Number(selectedInvoiceBooking.tax_amount / 2 || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (6%):</span>
                    <span>₹{Number(selectedInvoiceBooking.tax_amount / 2 || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Resort Fee (5%):</span>
                    <span>₹{Number(selectedInvoiceBooking.service_fee || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-300">
                    <span>Grand Total:</span>
                    <span>₹{Number(selectedInvoiceBooking.total_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Total Paid:</span>
                    <span>₹{Number(selectedInvoiceBooking.amount_paid || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
