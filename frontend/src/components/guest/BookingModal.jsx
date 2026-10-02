import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Users, ShieldCheck, CreditCard, Lock, 
  CheckCircle2, Printer, ArrowRight, Sparkles, Building, Info, QrCode, Smartphone 
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const BookingModal = ({ 
  isOpen, 
  onClose, 
  room, 
  checkIn, 
  checkOut, 
  nights, 
  adults, 
  onBookingSuccess 
}) => {
  if (!isOpen || !room) return null;

  const { currentUser } = useAuth();
  const [step, setStep] = useState(1); // 1: Guest info & Payment, 2: Confirmation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Guest details form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+91 ',
    specialRequests: '',
    paymentMethod: 'upi', // upi | razorpay_card | netbanking | pay_at_desk
    upiId: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: ''
  });

  useEffect(() => {
    if (currentUser) {
      const parts = (currentUser.name || '').trim().split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || parts[0] || '',
        lastName: prev.lastName || parts.slice(1).join(' ') || '',
        email: prev.email || currentUser.email || '',
        phone: prev.phone || currentUser.phone_number || '+91 ',
        cardName: prev.cardName || currentUser.name || ''
      }));
    }
  }, [currentUser, isOpen]);

  // Calculate pricing in INR (₹)
  const ratePerNight = Number(room.base_price || room.base_price_per_night || 5999);
  const roomCharges = Math.round(ratePerNight * nights * 100) / 100;
  // 12% GST (6% CGST + 6% SGST)
  const cgstAmount = Math.round(roomCharges * 0.06 * 100) / 100;
  const sgstAmount = Math.round(roomCharges * 0.06 * 100) / 100;
  const taxAmount = Math.round((cgstAmount + sgstAmount) * 100) / 100;
  const serviceFee = Math.round(roomCharges * 0.05 * 100) / 100;
  const totalAmount = Math.round((roomCharges + taxAmount + serviceFee) * 100) / 100;

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const fillTestIndianGuest = () => {
    setFormData(prev => ({
      ...prev,
      firstName: prev.firstName || 'Rajesh',
      lastName: prev.lastName || 'Sharma',
      email: prev.email || 'rajesh.sharma@gmail.com',
      phone: prev.phone === '+91 ' ? '+91 98765 43210' : prev.phone,
      paymentMethod: 'upi',
      upiId: 'rajesh@okhdfcbank',
      cardNumber: '4591 •••• •••• 9928',
      cardExpiry: '08/29',
      cardCvc: '492',
      cardName: prev.cardName || 'Rajesh Sharma'
    }));
  };

  const handleConfirmReservation = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError('Please complete all required guest contact fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        guest: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          id_type: 'Aadhaar / Passport',
          id_number: 'XXXX-XXXX-4912',
          special_requests: formData.specialRequests
        },
        room_type: room.name || room.type,
        check_in: checkIn,
        check_out: checkOut,
        adults: adults,
        children: 0,
        payment_method: formData.paymentMethod,
        card_token: `tok_upi_${Math.random().toString(36).substr(2, 9)}`
      };

      const result = await api.createBooking(payload);
      setConfirmedBooking(result);
      setStep(2);
      if (onBookingSuccess) onBookingSuccess(result);
    } catch (err) {
      setError(err.message || 'Reservation booking failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-hotel-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal Bar */}
        <div className="bg-hotel-navy-950 px-6 py-4 flex items-center justify-between text-white border-b border-hotel-navy-800">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-hotel-gold-400" />
            <span className="font-serif font-bold text-lg text-hotel-gold-300">
              {step === 1 ? 'Reserve Your Palace Suite' : 'Reservation Confirmed!'}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleConfirmReservation} className="p-6">
            
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Room Brief & Price Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-hotel-gold-700 uppercase block">Selected Suite</span>
                <h4 className="text-base font-serif font-bold text-hotel-navy-950">{room.name || room.type}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {checkIn} to {checkOut}</span>
                  <span>•</span>
                  <span>{nights} {nights === 1 ? 'night' : 'nights'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {adults} Guests</span>
                </div>
              </div>

              {/* Price Breakdown in INR */}
              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4 min-w-[170px]">
                <div className="text-xs text-slate-500">Total (incl. 12% GST)</div>
                <div className="text-xl font-serif font-bold text-hotel-navy-950">₹{totalAmount.toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-slate-400">Rate: ₹{ratePerNight.toLocaleString('en-IN')}/night</div>
                <div className="text-[9px] text-emerald-700 font-medium">CGST (6%) + SGST (6%)</div>
              </div>
            </div>

            {/* Guest Contact Details */}
            <div className="mb-6">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
                <span>Primary Guest Details</span>
                <button
                  type="button"
                  onClick={fillTestIndianGuest}
                  className="text-[11px] text-hotel-gold-700 hover:text-hotel-gold-800 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-hotel-gold-600" />
                  <span>Auto-fill Sample</span>
                </button>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="e.g. Rajesh"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-hotel-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="e.g. Sharma"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-hotel-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="rajesh.sharma@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-hotel-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Mobile Number (India +91) *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-hotel-gold-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector (UPI / Cards / Desk) */}
            <div className="mb-6 bg-slate-50/80 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-hotel-gold-600" />
                  <span>Indian Payment Modes (INR ₹)</span>
                </span>
                <span className="text-[10px] text-slate-400">Instant Online Verification</span>
              </div>

              {/* Payment Method Tabs */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <label className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer flex flex-col items-center justify-center text-center transition ${
                  formData.paymentMethod === 'upi'
                    ? 'bg-hotel-navy-950 text-hotel-gold-400 border-hotel-navy-950 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={formData.paymentMethod === 'upi'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <Smartphone className="w-4 h-4 mb-1 text-hotel-gold-500" />
                  <span>UPI / GPay / QR</span>
                </label>

                <label className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer flex flex-col items-center justify-center text-center transition ${
                  formData.paymentMethod === 'razorpay_card'
                    ? 'bg-hotel-navy-950 text-hotel-gold-400 border-hotel-navy-950 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay_card"
                    checked={formData.paymentMethod === 'razorpay_card'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <CreditCard className="w-4 h-4 mb-1 text-hotel-gold-500" />
                  <span>Debit / Credit Card</span>
                </label>

                <label className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer flex flex-col items-center justify-center text-center transition ${
                  formData.paymentMethod === 'pay_at_desk'
                    ? 'bg-hotel-navy-950 text-hotel-gold-400 border-hotel-navy-950 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="pay_at_desk"
                    checked={formData.paymentMethod === 'pay_at_desk'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <Building className="w-4 h-4 mb-1 text-hotel-gold-500" />
                  <span>Pay at Front Desk</span>
                </label>
              </div>

              {formData.paymentMethod === 'upi' && (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-700">Enter UPI VPA ID or Phone Number</label>
                  <input
                    type="text"
                    name="upiId"
                    value={formData.upiId || 'rajesh@okhdfcbank'}
                    onChange={handleInputChange}
                    placeholder="username@okaxis / 9876543210@paytm"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-hotel-gold-500"
                  />
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Supports Google Pay, PhonePe, Paytm, BHIM & all Indian UPI apps.
                  </p>
                </div>
              )}

              {formData.paymentMethod === 'razorpay_card' && (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      placeholder="4591 •••• •••• 9928"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Expiry</label>
                      <input
                        type="text"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 mb-0.5">CVV</label>
                      <input
                        type="password"
                        maxLength="4"
                        name="cardCvc"
                        value={formData.cardCvc}
                        onChange={handleInputChange}
                        placeholder="•••"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.paymentMethod === 'pay_at_desk' && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs">
                  Your reservation will be held securely. Settle full balance via Cash, UPI, or Card upon check-in at the Palace Front Desk.
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-hotel-gold-500 to-hotel-gold-600 hover:brightness-110 text-hotel-navy-950 font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center space-x-2"
              >
                <Lock className="w-4 h-4 text-hotel-navy-950" />
                <span>{loading ? 'Confirming Reservation...' : `Confirm & Pay ₹${totalAmount.toLocaleString('en-IN')}`}</span>
              </button>
            </div>

          </form>
        ) : (
          /* CONFIRMATION SCREEN */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Booking Confirmed</span>
              <h3 className="text-2xl font-serif font-bold text-hotel-navy-950 mt-1">
                Padharo Mhare Desh! We look forward to welcoming you.
              </h3>
              <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
                A confirmation SMS & Email has been dispatched to <strong>{confirmedBooking?.guest?.email}</strong>.
              </p>
            </div>

            {/* Reservation Receipt Card */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-semibold">
                <span className="text-slate-500">Booking Reference:</span>
                <span className="font-mono font-bold text-hotel-gold-700 text-sm">
                  {confirmedBooking?.booking_reference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Suite:</span>
                <span className="font-medium text-slate-800">{confirmedBooking?.room_type} (Room #{confirmedBooking?.room_number})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dates:</span>
                <span className="font-medium text-slate-800">{confirmedBooking?.check_in} to {confirmedBooking?.check_out} ({confirmedBooking?.nights} Nights)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm">
                <span>Total Amount Paid:</span>
                <span className="text-emerald-700">₹{confirmedBooking?.total_amount?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent('open-guest-lookup', {
                    detail: {
                      reference: confirmedBooking?.booking_reference,
                      email: confirmedBooking?.guest?.email
                    }
                  }));
                }}
                className="px-5 py-2.5 rounded-lg bg-hotel-navy-950 text-hotel-gold-400 font-semibold text-xs transition hover:bg-hotel-navy-800 shadow"
              >
                Access Guest Concierge & In-Room Dining
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
