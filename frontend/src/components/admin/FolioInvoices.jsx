import React, { useState, useEffect } from 'react';
import { 
  Receipt, Plus, DollarSign, Printer, Search, CheckCircle2, 
  X, AlertCircle, ArrowRight, Building2, CreditCard, Smartphone, QrCode 
} from 'lucide-react';
import { api } from '../../services/api';

export const FolioInvoices = ({ initialBookingRef = null }) => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState(null);

  // Add Charge Modal
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [chargeData, setChargeData] = useState({
    category: 'laundry',
    description: '',
    amount: '',
    quantity: 1
  });
  const [chargeSubmitting, setChargeSubmitting] = useState(false);

  // Settle Payment Modal
  const [showSettle, setShowSettle] = useState(false);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState('upi');
  const [settleSubmitting, setSettleSubmitting] = useState(false);

  // Printable Invoice Modal
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await api.getBookings();
      setBookings(data);
      if (initialBookingRef) {
        const found = data.find(b => b.booking_reference === initialBookingRef);
        if (found) setSelectedBooking(found);
      } else if (data.length > 0 && !selectedBooking) {
        setSelectedBooking(data[0]);
      }
    } catch (err) {
      console.error('Failed to load folios:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshSelectedBooking = async (ref) => {
    try {
      const data = await api.getBookings();
      setBookings(data);
      const found = data.find(b => b.booking_reference === ref);
      if (found) setSelectedBooking(found);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCharge = async (e) => {
    e.preventDefault();
    if (!chargeData.description || !chargeData.amount) return;

    setChargeSubmitting(true);
    try {
      await api.addFolioCharge({
        booking_reference: selectedBooking.booking_reference,
        category: chargeData.category,
        description: chargeData.description,
        amount: parseFloat(chargeData.amount),
        quantity: parseInt(chargeData.quantity) || 1
      });

      setMessage(`Incidental charge added to Room #${selectedBooking.room_number} folio.`);
      setShowAddCharge(false);
      setChargeData({ category: 'laundry', description: '', amount: '', quantity: 1 });
      setTimeout(() => setMessage(null), 4000);
      await refreshSelectedBooking(selectedBooking.booking_reference);
    } catch (err) {
      alert('Failed to add charge: ' + err.message);
    } finally {
      setChargeSubmitting(false);
    }
  };

  const handleSettlePayment = async (e) => {
    e.preventDefault();
    if (!settleAmount || parseFloat(settleAmount) <= 0) return;

    setSettleSubmitting(true);
    try {
      await api.settleFolio({
        booking_reference: selectedBooking.booking_reference,
        amount: parseFloat(settleAmount),
        payment_method: settleMethod,
        notes: `Front Desk settlement via ${settleMethod.toUpperCase()}`
      });

      setMessage(`Payment of ₹${parseFloat(settleAmount).toLocaleString('en-IN')} recorded successfully.`);
      setShowSettle(false);
      setTimeout(() => setMessage(null), 4000);
      await refreshSelectedBooking(selectedBooking.booking_reference);
    } catch (err) {
      alert('Settlement failed: ' + err.message);
    } finally {
      setSettleSubmitting(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.booking_reference?.toLowerCase().includes(term) ||
      b.room_number?.includes(term) ||
      b.guest?.first_name?.toLowerCase().includes(term) ||
      b.guest?.last_name?.toLowerCase().includes(term) ||
      b.guest?.phone?.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">Billing, Folios & Indian GST Invoices</h1>
          <p className="text-xs text-slate-500">
            Real-time room ledgers, incidentals posting, Indian GST invoicing, and UPI payment settlements.
          </p>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Roster vs Selected Folio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Reservations Roster */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col h-[650px]">
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search room, reference, or guest..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 w-full focus:outline-none focus:ring-1 focus:ring-hotel-gold-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
            {filteredBookings.map((b) => {
              const isSelected = selectedBooking?.booking_reference === b.booking_reference;
              return (
                <div
                  key={b.booking_reference}
                  onClick={() => setSelectedBooking(b)}
                  className={`p-3 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? 'bg-hotel-navy-950 text-white shadow-sm'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs">{b.booking_reference}</span>
                    <span className="text-xs font-semibold">Room #{b.room_number}</span>
                  </div>
                  <div className={`text-xs font-medium mt-1 ${isSelected ? 'text-slate-200' : 'text-slate-900'}`}>
                    {b.guest.first_name} {b.guest.last_name}
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-2">
                    <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                      Total: ₹{Number(b.total_amount || 0).toLocaleString('en-IN')}
                    </span>
                    <span className={`font-bold ${
                      b.balance_due > 0 
                        ? (isSelected ? 'text-amber-300' : 'text-rose-600') 
                        : (isSelected ? 'text-emerald-300' : 'text-emerald-600')
                    }`}>
                      Due: ₹{Number(b.balance_due || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Folio Details */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          {selectedBooking ? (
            <div>
              {/* Folio Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                      {selectedBooking.booking_reference}
                    </span>
                    <span className="text-xs font-semibold text-hotel-gold-700">
                      Room #{selectedBooking.room_number} ({selectedBooking.room_type})
                    </span>
                  </div>
                  <h2 className="text-xl font-serif font-bold text-slate-900 mt-1">
                    {selectedBooking.guest.first_name} {selectedBooking.guest.last_name}
                  </h2>
                  <div className="text-xs text-slate-500">
                    Stay: {selectedBooking.check_in} to {selectedBooking.check_out} ({selectedBooking.nights} Nights)
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowAddCharge(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Charge</span>
                  </button>

                  <button
                    onClick={() => {
                      setSettleAmount(selectedBooking.balance_due?.toFixed(2));
                      setShowSettle(true);
                    }}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Settle (UPI/Card)</span>
                  </button>

                  <button
                    onClick={() => setShowPrintModal(true)}
                    className="px-3 py-2 bg-hotel-navy-950 hover:bg-hotel-navy-800 text-hotel-gold-400 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print GST Tax Invoice</span>
                  </button>
                </div>
              </div>

              {/* Folio Items Table */}
              <div className="my-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Itemized Charges & Taxes
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Date / Time</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-4 text-center">Qty</th>
                        <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedBooking.folio_items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 text-slate-500 font-mono">
                            {item.created_at?.slice(0, 10)}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-800">
                            {item.description}
                          </td>
                          <td className="py-2.5 px-4 text-center text-slate-600">
                            {item.quantity || 1}
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                            ₹{Number(item.amount || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments History */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Recorded Payments & Receipts
                </h3>
                {selectedBooking.payments?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No payments recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedBooking.payments?.map((p, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-emerald-900">{p.payment_id}</span>
                          <span className="text-slate-500 text-[11px] block">{p.reference_note || 'Payment'} • Method: {p.method?.toUpperCase()}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-800 text-sm">₹{Number(p.amount || 0).toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-emerald-600 block uppercase font-semibold">{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary Balance Block */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-[11px] text-slate-500 block uppercase">Total Incurred (incl. GST)</span>
                  <span className="text-lg font-bold text-slate-900">₹{Number(selectedBooking.total_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block uppercase">Total Paid</span>
                  <span className="text-lg font-bold text-emerald-700">₹{Number(selectedBooking.amount_paid || 0).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block uppercase">Outstanding Balance</span>
                  <span className={`text-lg font-bold ${selectedBooking.balance_due > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    ₹{Number(selectedBooking.balance_due || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
              Select a reservation from the roster to inspect folio.
            </div>
          )}
        </div>

      </div>

      {/* Add Charge Modal */}
      {showAddCharge && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddCharge} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif font-bold text-base text-slate-900">
                Post Incidental Room Charge
              </h3>
              <button type="button" onClick={() => setShowAddCharge(false)} className="text-slate-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Category
                </label>
                <select
                  value={chargeData.category}
                  onChange={(e) => setChargeData({ ...chargeData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="dining">Royal Dining / In-Room Dining</option>
                  <option value="spa">Ayurvedic Spa Treatment</option>
                  <option value="laundry">Express Laundry & Dry Cleaning</option>
                  <option value="cabana">Private Lake Cabana Rental</option>
                  <option value="airport_cab">Airport Luxury Cab Transfer</option>
                  <option value="minibar">Minibar & Premium Beverages</option>
                  <option value="miscellaneous">Miscellaneous / Service Charge</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Charge Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abhyanga Ayurvedic Massage 60min"
                  value={chargeData.description}
                  onChange={(e) => setChargeData({ ...chargeData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1500.00"
                    value={chargeData.amount}
                    onChange={(e) => setChargeData({ ...chargeData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={chargeData.quantity}
                    onChange={(e) => setChargeData({ ...chargeData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCharge(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={chargeSubmitting}
                className="px-4 py-2 bg-hotel-navy-950 hover:bg-hotel-navy-800 text-hotel-gold-400 text-xs font-bold uppercase tracking-wider rounded-lg transition"
              >
                {chargeSubmitting ? 'Posting...' : 'Post Charge to Room'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Settle Payment Modal */}
      {showSettle && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSettlePayment} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif font-bold text-base text-slate-900">
                Record Payment Settlement
              </h3>
              <button type="button" onClick={() => setShowSettle(false)} className="text-slate-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <span>Current Balance Due:</span>
                <span className="font-bold text-base text-rose-600">₹{Number(selectedBooking?.balance_due || 0).toLocaleString('en-IN')}</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Settlement Amount (₹ INR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Payment Mode
                </label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="upi">UPI / QR (Google Pay, PhonePe, Paytm)</option>
                  <option value="credit_card">Front Desk EDC Card Terminal (RuPay/Visa/Mastercard)</option>
                  <option value="cash">Cash Tendered (INR)</option>
                  <option value="netbanking">Net Banking / NEFT / RTGS</option>
                  <option value="razorpay">Razorpay Online Link</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettle(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={settleSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition"
              >
                {settleSubmitting ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Indian GST Tax Invoice Modal */}
      {showPrintModal && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl relative" id="printable-invoice">
            
            <div className="no-print flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Official Hotel Folio & Indian GST Tax Invoice (SAC 996311)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-hotel-navy-950 text-hotel-gold-400 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
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
                    GST-INV-{selectedBooking.booking_reference}
                  </span>
                  <span className="text-xs text-slate-500 block">Date: {new Date().toLocaleDateString('en-IN')}</span>
                  <span className={`text-xs font-semibold block mt-1 ${selectedBooking.balance_due <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    Status: {selectedBooking.balance_due <= 0 ? 'PAID IN FULL' : 'PARTIALLY SETTLED'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 my-6 text-xs text-slate-700">
                <div>
                  <div className="text-slate-400 uppercase text-[10px] font-bold">Billed To (Guest)</div>
                  <div className="font-bold text-sm text-slate-900 mt-0.5">{selectedBooking.guest.first_name} {selectedBooking.guest.last_name}</div>
                  <div>Email: {selectedBooking.guest.email}</div>
                  <div>Mobile: {selectedBooking.guest.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 uppercase text-[10px] font-bold">Stay Details</div>
                  <div className="font-bold text-sm text-slate-900 mt-0.5">Room #{selectedBooking.room_number} ({selectedBooking.room_type})</div>
                  <div>Check-In: {selectedBooking.check_in}</div>
                  <div>Check-Out: {selectedBooking.check_out} ({selectedBooking.nights} Nights)</div>
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
                  {selectedBooking.folio_items?.map((item, idx) => (
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
                  For inquiries, contact reservations@grandazurepalace.in
                </div>
                <div className="text-right space-y-1 min-w-[200px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Room Charges:</span>
                    <span>₹{Number(selectedBooking.room_charges || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (6%):</span>
                    <span>₹{Number(selectedBooking.tax_amount / 2 || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (6%):</span>
                    <span>₹{Number(selectedBooking.tax_amount / 2 || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Resort Fee (5%):</span>
                    <span>₹{Number(selectedBooking.service_fee || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-300">
                    <span>Grand Total:</span>
                    <span>₹{Number(selectedBooking.total_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Total Paid:</span>
                    <span>₹{Number(selectedBooking.amount_paid || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-600 pt-1 border-t border-slate-200">
                    <span>Balance Due:</span>
                    <span>₹{Number(selectedBooking.balance_due || 0).toLocaleString('en-IN')}</span>
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
