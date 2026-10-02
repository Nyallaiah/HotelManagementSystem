import React from 'react';
import { 
  Building2, LayoutDashboard, Grid3X3, Users, UtensilsCrossed, 
  Receipt, LogOut, ArrowLeft, Shield, Bell, CheckCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout = ({ activeSection, setActiveSection, onExitAdmin, children }) => {
  const { currentUser, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard & KPIs', icon: LayoutDashboard, roles: ['admin', 'receptionist'] },
    { id: 'rooms', label: 'Room Matrix & Housekeeping', icon: Grid3X3, roles: ['admin', 'receptionist', 'housekeeper'] },
    { id: 'bookings', label: 'Front Desk & Check-In', icon: Users, roles: ['admin', 'receptionist'] },
    { id: 'pos', label: 'Kitchen & Room Service POS', icon: UtensilsCrossed, roles: ['admin', 'restaurant', 'receptionist'] },
    { id: 'billing', label: 'Folios & Invoicing', icon: Receipt, roles: ['admin', 'receptionist'] },
  ];

  const userRole = currentUser?.role || 'staff';
  const filteredNav = navItems.filter(item => item.roles.includes(userRole) || userRole === 'admin');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-hotel-navy-950 text-white flex flex-col justify-between shrink-0 border-r border-hotel-navy-900">
        <div>
          {/* Brand Badge */}
          <div className="p-6 border-b border-hotel-navy-900 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-hotel-gold-500 flex items-center justify-center text-hotel-navy-950 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-bold text-base text-hotel-gold-400 block tracking-wide">
                GRAND AZURE
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase block">
                Hospitality PMS ERP
              </span>
            </div>
          </div>

          {/* User Profile Capsule */}
          <div className="px-6 py-4 border-b border-hotel-navy-900 bg-hotel-navy-900/50">
            <div className="text-xs font-semibold text-white truncate">{currentUser?.name}</div>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-mono text-hotel-gold-300 uppercase tracking-wider font-semibold">
                {userRole.toUpperCase()}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{currentUser?.department}</div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-hotel-gold-500 text-hotel-navy-950 shadow-md font-bold'
                      : 'text-slate-300 hover:bg-hotel-navy-900 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-hotel-navy-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-hotel-navy-900 space-y-2">
          <button
            onClick={onExitAdmin}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-hotel-navy-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Switch to Guest View</span>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 transition font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main ERP Work Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Live Property Operations
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>System Operational • MongoDB Connected</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 flex-1">
          {children}
        </main>

      </div>

    </div>
  );
};
