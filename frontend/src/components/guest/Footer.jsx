import React from 'react';
import { Building2, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';

export const Footer = ({ onOpenAdmin, onOpenLookup }) => {
  return (
    <footer className="bg-hotel-navy-950 text-white border-t border-hotel-navy-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-hotel-navy-900 text-xs text-slate-400">
          
          {/* Col 1: Brand */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-hotel-gold-500 flex items-center justify-center text-hotel-navy-950">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-serif tracking-widest text-lg font-bold text-white">
                GRAND AZURE
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              A royal heritage sanctuary offering unrivaled Indian hospitality, bespoke lakeview suites, and gastronomic dining on Lake Pichola, Udaipur.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-hotel-gold-500/10 text-hotel-gold-400 border border-hotel-gold-500/20 rounded-md text-[10px] font-semibold uppercase">
                <ShieldCheck className="w-3 h-3" /> GST Registered • PCI-DSS & 256-Bit SSL
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="font-serif font-bold text-sm text-white mb-4 uppercase tracking-wider">
              Guest Services
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={onOpenLookup} className="hover:text-hotel-gold-400 transition">
                  Self Check-In & Room Key
                </button>
              </li>
              <li>
                <button onClick={onOpenLookup} className="hover:text-hotel-gold-400 transition">
                  In-Room Dining Order
                </button>
              </li>
              <li>
                <button onClick={onOpenLookup} className="hover:text-hotel-gold-400 transition">
                  Download Official GST Tax Invoice
                </button>
              </li>
              <li>
                <a href="#amenities" className="hover:text-hotel-gold-400 transition">
                  Ayurvedic Spa & Pool Reservation
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Management ERP Links */}
          <div>
            <h4 className="font-serif font-bold text-sm text-white mb-4 uppercase tracking-wider">
              Hotel Operations
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={onOpenAdmin} className="hover:text-hotel-gold-400 transition">
                  Front Desk PMS Login
                </button>
              </li>
              <li>
                <button onClick={onOpenAdmin} className="hover:text-hotel-gold-400 transition">
                  Housekeeping Matrix Board
                </button>
              </li>
              <li>
                <button onClick={onOpenAdmin} className="hover:text-hotel-gold-400 transition">
                  Kitchen POS Display (KOT)
                </button>
              </li>
              <li>
                <button onClick={onOpenAdmin} className="hover:text-hotel-gold-400 transition">
                  General Manager Analytics
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Location */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm text-white mb-4 uppercase tracking-wider">
              Palace Concierge
            </h4>
            <div className="flex items-start space-x-2.5">
              <MapPin className="w-4 h-4 text-hotel-gold-400 shrink-0 mt-0.5" />
              <span>Lake Palace Road, Udaipur, Rajasthan 313001, India</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <Phone className="w-4 h-4 text-hotel-gold-400 shrink-0" />
              <span>+91 294 242 8800</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <Mail className="w-4 h-4 text-hotel-gold-400 shrink-0" />
              <span>reservations@grandazurepalace.in</span>
            </div>
            <div className="text-[10px] text-slate-500 pt-1">
              GSTIN: 08AAACG1234F1Z5 • SAC: 996311
            </div>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>© 2026 Grand Azure Palace & Resort. All Rights Reserved.</p>
          <div className="flex items-center space-x-1">
            <span>Powered by Supabase Realtime, FastAPI & React (India PMS Edition)</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
