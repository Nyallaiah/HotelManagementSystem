import React, { useState, useEffect } from 'react';
import { 
  Users, Search, UserCheck, LogOut, Receipt, Plus, 
  Calendar, CheckCircle2, AlertCircle, RefreshCw, X 
} from 'lucide-react';
import { api } from '../../services/api';

export const BookingManagement = ({ onOpenFolio }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionSuccess, setActionSuccess] = useState(null);

  // Check-In Modal state
  const [checkInModalBooking, setCheckInModalBooking] = useState(null);
  const [guestIdDoc, setGuestIdDoc] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);

  // Check-Out Modal state
  const [checkOutModalBooking, setCheckOutModalBooking] = useState(null);
  const [settleBalance, setSettleBalance] = useState(true);
  const [checkOutLoading, setCheckOutLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const data = await api.getBookings(params);
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const executeCheckIn = async () => {
    if (!checkInModalBooking) return;
    setCheckInLoading(true);
    try {
      await api.checkInGuest(checkInModalBooking.booking_reference, guestIdDoc);
      setActionSuccess(`Guest ${checkInModalBooking.guest.first_name} checked into Room #${checkInModalBooking.room_number}. Keycard activated!`);
      setCheckInModalBooking(null);
      setGuestIdDoc('');
      setTimeout(() => setActionSuccess(null), 5000);
      await fetchBookings();
    } catch (err) {
      alert('Check-in failed: ' + err.message);
    } finally {
      setCheckInLoading(false);
    }
  };

  const executeCheckOut = async () => {
    if (!checkOutModalBooking) return;
    setCheckOutLoading(true);
    try {
      await api.checkOutGuest(checkOutModalBooking.booking_reference, settleBalance);
      setActionSuccess(`Room #${checkOutModalBooking.room_number} checked out. Room status transitioned to VACANT DIRTY for housekeeping.`);
      setCheckOutModalBooking(null);
      setTimeout(() => setActionSuccess(null), 5000);
      await fetchBookings();
    } catch (err) {
      alert('Check-out failed: ' + err.message);
    } finally {
      setCheckOutLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">Front Desk Roster & Guest Check-In</h1>
          <p className="text-xs text-slate-500">Manage arrivals, issue room keys, settle folios, and process departures.</p>
        </div>

        <button
          onClick={fetchBookings}
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition shadow-sm self-start sm:self-auto"
          title="Refresh List"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { id: 'all', label: 'All Reservations' },
            { id: 'confirmed', label: 'Arriving / Confirmed' },
            { id: 'checked_in', label: 'In-House (Checked In)' },
            { id: 'checked_out', label: 'Departed (Checked Out)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                statusFilter === tab.id
                  ? 'bg-hotel-navy-950 text-hotel-gold-400'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ref, guest, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-hotel-gold-500 w-56"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-hotel-navy-950 hover:bg-hotel-navy-800 text-hotel-gold-400 rounded-lg text-xs font-semibold"
          >
            Search
          </button>
        </form>

      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Ref #</th>
                <th className="py-3.5 px-4">Guest Details</th>
                <th className="py-3.5 px-4">Room & Type</th>
                <th className="py-3.5 px-4">Stay Interval</th>
                <th className="py-3.5 px-4 text-right">Folio & Balance</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Front Desk Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No reservations found matching current criteria.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.booking_reference} className="hover:bg-slate-50/80 transition">
                    
                    <td className="py-3.5 px-4 font-mono font-bold text-hotel-navy-950">
                      {b.booking_reference}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{b.guest.first_name} {b.guest.last_name}</div>
                      <div className="text-[11px] text-slate-500">{b.guest.phone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">Room #{b.room_number}</span>
                      <span className="block text-[11px] text-slate-500">{b.room_type}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{b.check_in} → {b.check_out}</div>
                      <div className="text-[10px] text-slate-400">{b.nights} Nights • {b.adults} Guests</div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-slate-900">₹{Number(b.total_amount || 0).toLocaleString('en-IN')}</div>
                      <div className={`text-[10px] font-semibold ${b.balance_due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        Due: ₹{Number(b.balance_due || 0).toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.booking_status === 'checked_in'
                          ? 'bg-rose-100 text-rose-800'
                          : b.booking_status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {b.booking_status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {b.booking_status === 'confirmed' && (
                        <button
                          onClick={() => {
                            setCheckInModalBooking(b);
                            setGuestIdDoc(b.guest.id_number || '');
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-[11px] transition shadow-xs"
                        >
                          Check In
                        </button>
                      )}

                      {b.booking_status === 'checked_in' && (
                        <button
                          onClick={() => setCheckOutModalBooking(b)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-[11px] transition shadow-xs"
                        >
                          Check Out
                        </button>
                      )}

                      <button
                        onClick={() => onOpenFolio && onOpenFolio(b.booking_reference)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition"
                        title="View Folio / Invoice"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check-In Modal Dialog */}
      {checkInModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif font-bold text-base text-slate-900">
                Confirm Guest Check-In
              </h3>
              <button onClick={() => setCheckInModalBooking(null)} className="text-slate-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800 text-sm">
                {checkInModalBooking.guest.first_name} {checkInModalBooking.guest.last_name}
              </div>
              <div className="text-slate-600">Assigned Suite: <strong>Room #{checkInModalBooking.room_number}</strong> ({checkInModalBooking.room_type})</div>
              <div className="text-slate-600">Stay Duration: {checkInModalBooking.check_in} to {checkInModalBooking.check_out} ({checkInModalBooking.nights}N)</div>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Guest Identification Proof / Passport #
              </label>
              <input
                type="text"
                placeholder="e.g. PASS-9481028"
                value={guestIdDoc}
                onChange={(e) => setGuestIdDoc(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-hotel-gold-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setCheckInModalBooking(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={executeCheckIn}
                disabled={checkInLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition"
              >
                {checkInLoading ? 'Issuing Key...' : 'Activate Keycard & Check In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check-Out Modal Dialog */}
      {checkOutModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif font-bold text-base text-slate-900">
                Confirm Guest Check-Out
              </h3>
              <button onClick={() => setCheckOutModalBooking(null)} className="text-slate-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-800 text-sm">
                Room #{checkOutModalBooking.room_number} • {checkOutModalBooking.guest.first_name} {checkOutModalBooking.guest.last_name}
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span>Total Charges:</span>
                <span className="font-semibold">${checkOutModalBooking.total_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Total Settled:</span>
                <span className="font-semibold">-${checkOutModalBooking.amount_paid?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm border-t border-slate-300 pt-1">
                <span>Outstanding Folio Balance:</span>
                <span className={checkOutModalBooking.balance_due > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                  ${checkOutModalBooking.balance_due?.toFixed(2)}
                </span>
              </div>
            </div>

            {checkOutModalBooking.balance_due > 0 && (
              <label className="flex items-center space-x-2 text-xs text-slate-700 mb-4 bg-amber-50 p-2.5 rounded-lg border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settleBalance}
                  onChange={(e) => setSettleBalance(e.target.checked)}
                  className="rounded text-hotel-navy-950 focus:ring-hotel-gold-500"
                />
                <span>Settle remaining <strong>${checkOutModalBooking.balance_due?.toFixed(2)}</strong> balance at Front Desk now</span>
              </label>
            )}

            <p className="text-[11px] text-slate-500 mb-4">
              Upon check-out, Room #{checkOutModalBooking.room_number} will automatically transition to <strong>VACANT DIRTY</strong> on the Housekeeping board.
            </p>

            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setCheckOutModalBooking(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={executeCheckOut}
                disabled={checkOutLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition"
              >
                {checkOutLoading ? 'Processing...' : 'Complete Check-Out'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
