import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Hero } from './components/guest/Hero';
import { RoomCatalog } from './components/guest/RoomCatalog';
import { BookingModal } from './components/guest/BookingModal';
import { GuestFolio } from './components/guest/GuestFolio';
import { Amenities } from './components/guest/Amenities';
import { Footer } from './components/guest/Footer';

// Operations & ERP Components
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { RoomMatrix } from './components/admin/RoomMatrix';
import { BookingManagement } from './components/admin/BookingManagement';
import { KitchenPOS } from './components/admin/KitchenPOS';
import { FolioInvoices } from './components/admin/FolioInvoices';

import { api } from './services/api';

function MainApp() {
  const { isAuthenticated, currentUser } = useAuth();
  
  // Navigation State
  // Mode: 'guest' | 'guest_folio' | 'admin_login' | 'admin_portal'
  const [viewMode, setViewMode] = useState('guest');
  const [activeGuestTab, setActiveGuestTab] = useState('explore');
  const [activeAdminSection, setActiveAdminSection] = useState('dashboard');

  // Booking Flow Dates & Params
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [adults, setAdults] = useState(2);
  const [roomType, setRoomType] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Data
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Guest Folio Lookup state
  const [lookupCredentials, setLookupCredentials] = useState({ ref: '', email: '' });
  const [targetFolioRef, setTargetFolioRef] = useState(null);

  useEffect(() => {
    loadInitialData();

    const handleOpenLookup = (e) => {
      if (e.detail) {
        setLookupCredentials({ ref: e.detail.reference, email: e.detail.email });
        setViewMode('guest_folio');
      }
    };
    window.addEventListener('open-guest-lookup', handleOpenLookup);
    return () => window.removeEventListener('open-guest-lookup', handleOpenLookup);
  }, []);

  const loadInitialData = async () => {
    try {
      const [roomsData, categoriesData] = await Promise.all([
        api.getRooms(),
        api.getCategories()
      ]);
      setRooms(roomsData);
      setCategories(categoriesData);
    } catch (err) {
      console.warn('Initial load error:', err);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const result = await api.checkAvailability(checkIn, checkOut, adults, roomType || null);
      if (result.available_rooms) {
        setRooms(result.available_rooms);
      }
      document.getElementById('suites')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert('Search failed: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectRoom = (roomCat) => {
    setSelectedRoomForBooking(roomCat);
    setIsBookingModalOpen(true);
  };

  const calculateNights = () => {
    try {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      return Math.max(1, diff);
    } catch {
      return 1;
    }
  };

  // Dynamic Routing based on Backend-Resolved Role
  const handleLoginSuccess = (user) => {
    const role = user?.role || currentUser?.role || 'admin';
    if (role === 'guest') {
      setViewMode('guest_folio');
    } else {
      if (role === 'housekeeper') {
        setActiveAdminSection('rooms');
      } else if (role === 'restaurant') {
        setActiveAdminSection('pos');
      } else if (role === 'receptionist') {
        setActiveAdminSection('bookings');
      } else {
        setActiveAdminSection('dashboard');
      }
      setViewMode('admin_portal');
    }
  };

  const handleOpenPortal = () => {
    if (isAuthenticated) {
      handleLoginSuccess(currentUser);
    } else {
      setViewMode('admin_login');
    }
  };

  // --- RENDER UNIFIED LOGIN VIEW ---
  if (viewMode === 'admin_login') {
    return (
      <AdminLogin 
        onCancel={() => setViewMode('guest')} 
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  // --- RENDER AUTHORIZED OPERATIONS ERP VIEW ---
  if (viewMode === 'admin_portal') {
    return (
      <AdminLayout
        activeSection={activeAdminSection}
        setActiveSection={setActiveAdminSection}
        onExitAdmin={() => setViewMode('guest')}
      >
        {activeAdminSection === 'dashboard' && (
          <AdminDashboard onNavigate={(section) => setActiveAdminSection(section)} />
        )}
        {activeAdminSection === 'rooms' && (
          <RoomMatrix />
        )}
        {activeAdminSection === 'bookings' && (
          <BookingManagement onOpenFolio={(ref) => {
            setTargetFolioRef(ref);
            setActiveAdminSection('billing');
          }} />
        )}
        {activeAdminSection === 'pos' && (
          <KitchenPOS />
        )}
        {activeAdminSection === 'billing' && (
          <FolioInvoices initialBookingRef={targetFolioRef} />
        )}
      </AdminLayout>
    );
  }

  // --- RENDER GUEST FOLIO / SELF-SERVICE ---
  if (viewMode === 'guest_folio') {
    return (
      <GuestFolio
        initialReference={lookupCredentials.ref}
        initialEmail={lookupCredentials.email}
        onBack={() => setViewMode('guest')}
      />
    );
  }

  // --- RENDER VISITOR PORTAL ---
  return (
    <div className="min-h-screen bg-hotel-cream flex flex-col justify-between">
      <Header
        activeTab={activeGuestTab}
        setActiveTab={setActiveGuestTab}
        onOpenLookup={() => setViewMode('guest_folio')}
        onOpenAdmin={handleOpenPortal}
      />

      <main className="flex-1">
        <Hero
          checkIn={checkIn}
          setCheckIn={setCheckIn}
          checkOut={checkOut}
          setCheckOut={setCheckOut}
          adults={adults}
          setAdults={setAdults}
          roomType={roomType}
          setRoomType={setRoomType}
          onSearch={handleSearch}
          isSearching={isSearching}
        />

        <RoomCatalog
          rooms={rooms}
          categories={categories}
          onSelectRoom={handleSelectRoom}
          checkIn={checkIn}
          checkOut={checkOut}
          nights={calculateNights()}
        />

        <Amenities />
      </main>

      <Footer
        onOpenAdmin={handleOpenPortal}
        onOpenLookup={() => setViewMode('guest_folio')}
      />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        room={selectedRoomForBooking}
        checkIn={checkIn}
        checkOut={checkOut}
        nights={calculateNights()}
        adults={adults}
        onBookingSuccess={() => {
          loadInitialData();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
