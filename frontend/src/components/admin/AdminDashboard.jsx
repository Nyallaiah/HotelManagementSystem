import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, BedDouble, DollarSign, TrendingUp, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Utensils, RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api';

export const AdminDashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-hotel-gold-600" />
        <span>Loading Executive Operations Command Center...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">Operations Command Center</h1>
          <p className="text-xs text-slate-500">Real-time room rack status, Indian INR revenue intelligence, and arrivals.</p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Occupancy Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Occupancy Rate</span>
            <div className="w-8 h-8 rounded-lg bg-hotel-gold-500/10 flex items-center justify-center text-hotel-gold-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-serif font-bold text-slate-900">{stats?.occupancy_rate}%</span>
            <span className="text-xs text-slate-500">({stats?.occupied_rooms} / {stats?.total_rooms} suites)</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-hotel-gold-500 h-1.5 rounded-full" 
              style={{ width: `${Math.min(100, stats?.occupancy_rate || 0)}%` }}
            ></div>
          </div>
        </div>

        {/* Today's Revenue in ₹ INR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Today's Revenue (INR)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
              ₹
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-serif font-bold text-slate-900">₹{Number(stats?.today_revenue || 0).toLocaleString('en-IN')}</span>
            <span className="text-xs text-emerald-600 font-medium flex items-center"><ArrowUpRight className="w-3 h-3" /> Live</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Monthly Rev: <strong className="text-slate-700">₹{Number(stats?.month_revenue || 0).toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* ADR & RevPAR (Hospitality Metrics in ₹) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">ADR / RevPAR</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Avg Daily Rate</span>
              <span className="text-2xl font-serif font-bold text-slate-900">₹{Number(stats?.adr || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">RevPAR</span>
              <span className="text-2xl font-serif font-bold text-slate-900">₹{Number(stats?.revpar || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">Industry Standard Profitability</div>
        </div>

        {/* Front Desk Flow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Today's Traffic</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase">Arrivals</span>
              <span className="text-xl font-bold text-emerald-700">{stats?.today_arrivals}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase">Departures</span>
              <span className="text-xl font-bold text-rose-700">{stats?.today_departures}</span>
            </div>
          </div>
          <div className="mt-2 text-center text-xs text-slate-500">
            Pending KOT: <strong className="text-amber-600">{stats?.pending_room_service_orders} orders</strong>
          </div>
        </div>

      </div>

      {/* Room Status Housekeeping Strip */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-hotel-gold-600" />
            <span>Room Rack Status Distribution</span>
          </h2>
          <button
            onClick={() => onNavigate('rooms')}
            className="text-xs text-hotel-gold-700 hover:text-hotel-gold-800 font-semibold flex items-center gap-1"
          >
            <span>Open Housekeeping Matrix</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col">
            <span className="text-emerald-800 font-medium">Vacant Clean</span>
            <span className="text-2xl font-bold text-emerald-900 mt-1">{stats?.vacant_clean_rooms}</span>
            <span className="text-[10px] text-emerald-600 mt-0.5">Ready for Check-in</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-col">
            <span className="text-amber-800 font-medium">Vacant Dirty</span>
            <span className="text-2xl font-bold text-amber-900 mt-1">{stats?.vacant_dirty_rooms}</span>
            <span className="text-[10px] text-amber-600 mt-0.5">Needs Cleaning</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex flex-col">
            <span className="text-rose-800 font-medium">Occupied</span>
            <span className="text-2xl font-bold text-rose-900 mt-1">{stats?.occupied_rooms}</span>
            <span className="text-[10px] text-rose-600 mt-0.5">Active Guests In-House</span>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col">
            <span className="text-indigo-800 font-medium">Reserved</span>
            <span className="text-2xl font-bold text-indigo-900 mt-1">
              {stats?.total_rooms - (stats?.vacant_clean_rooms + stats?.vacant_dirty_rooms + stats?.occupied_rooms + stats?.maintenance_rooms)}
            </span>
            <span className="text-[10px] text-indigo-600 mt-0.5">Upcoming Arrival</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 flex flex-col col-span-2 sm:col-span-1">
            <span className="text-slate-800 font-medium">Out of Order</span>
            <span className="text-2xl font-bold text-slate-900 mt-1">{stats?.maintenance_rooms}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Maintenance / Repair</span>
          </div>
        </div>
      </div>

      {/* Recent Reservations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-serif font-bold text-slate-900">Recent Guest Reservations</h2>
            <p className="text-xs text-slate-500">Live booking feed from visitor checkout & front desk.</p>
          </div>
          <button
            onClick={() => onNavigate('bookings')}
            className="text-xs font-semibold text-hotel-navy-950 hover:text-hotel-gold-700 transition"
          >
            View All Reservations →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Guest Name</th>
                <th className="py-3 px-4">Suite / Room</th>
                <th className="py-3 px-4">Stay Dates</th>
                <th className="py-3 px-4 text-right">Total Folio (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recent_bookings?.map((b) => (
                <tr key={b.booking_reference} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-hotel-navy-950">
                    {b.booking_reference}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{b.guest.first_name} {b.guest.last_name}</div>
                    <div className="text-[11px] text-slate-400">{b.guest.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800">Suite #{b.room_number}</span>
                    <span className="block text-[11px] text-slate-500">{b.room_type}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {b.check_in} → {b.check_out} ({b.nights}N)
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    ₹{Number(b.total_amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      b.booking_status === 'checked_in'
                        ? 'bg-rose-100 text-rose-800'
                        : b.booking_status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {b.booking_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
