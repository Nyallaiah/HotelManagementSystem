const API_BASE = '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('hotel_erp_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('hotel_erp_token', token);
    } else {
      localStorage.removeItem('hotel_erp_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = { ...this.getHeaders(), ...(options.headers || {}) };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.detail || data?.message || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
      throw err;
    }
  }

  // --- Supabase Auth Sync ---
  async syncSupabaseUser(supabaseUser) {
    const email = supabaseUser.email || supabaseUser.user_metadata?.email || null;
    const phone = supabaseUser.phone || supabaseUser.user_metadata?.phone || null;
    const fullName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '';
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const res = await this.request('/auth/supabase-sync', {
      method: 'POST',
      body: JSON.stringify({
        supabase_id: supabaseUser.id,
        email: email,
        phone_number: phone,
        first_name: firstName,
        last_name: lastName,
        image_url: supabaseUser.user_metadata?.avatar_url || null,
        auth_strategy: supabaseUser.app_metadata?.provider || (phone && !email ? 'phone_number' : 'google')
      })
    });
    if (res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  // Backward compatibility alias for legacy clerk sync
  async syncClerkUser(user) {
    return this.syncSupabaseUser(user);
  }

  async login(emailOrPhone, password) {
    const payload = {};
    if (emailOrPhone.includes('@')) {
      payload.email = emailOrPhone;
    } else {
      payload.phone_number = emailOrPhone;
    }
    payload.password = password;

    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  logout() {
    this.setToken(null);
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async getStaff() {
    return this.request('/auth/staff');
  }

  // --- Rooms & PMS ---
  async getRooms(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/rooms${query ? `?${query}` : ''}`);
  }

  async getCategories() {
    return this.request('/rooms/categories');
  }

  async getFloorGrid() {
    return this.request('/rooms/matrix/floor-grid');
  }

  async getRoom(roomNumber) {
    return this.request(`/rooms/${roomNumber}`);
  }

  async updateRoomStatus(roomNumber, status, notes = null) {
    const query = new URLSearchParams({ status });
    if (notes) query.append('notes', notes);
    return this.request(`/rooms/${roomNumber}/status?${query.toString()}`, {
      method: 'PATCH',
    });
  }

  // --- Bookings & Front Desk ---
  async checkAvailability(checkIn, checkOut, adults = 1, roomType = null) {
    const query = new URLSearchParams({
      check_in: checkIn,
      check_out: checkOut,
      adults: adults.toString(),
    });
    if (roomType) query.append('room_type', roomType);
    return this.request(`/bookings/check-availability?${query.toString()}`);
  }

  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getMyBookings() {
    return this.request('/bookings/my-bookings');
  }

  async lookupBooking(reference, contact) {
    const query = new URLSearchParams({ reference });
    if (contact && contact.includes('@')) {
      query.append('email', contact);
    } else if (contact) {
      query.append('phone', contact);
    }
    return this.request(`/bookings/lookup?${query.toString()}`);
  }

  async getBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/bookings${query ? `?${query}` : ''}`);
  }

  async checkInGuest(reference, idNumber = null) {
    const query = idNumber ? `?id_number=${encodeURIComponent(idNumber)}` : '';
    return this.request(`/bookings/${reference}/check-in${query}`, {
      method: 'POST',
    });
  }

  async checkOutGuest(reference, settleBalance = true) {
    return this.request(`/bookings/${reference}/check-out?settle_balance=${settleBalance}`, {
      method: 'POST',
    });
  }

  async getInvoice(reference) {
    return this.request(`/bookings/${reference}/invoice`);
  }

  // --- Payments ---
  async createPaymentIntent(payload) {
    return this.request('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async addFolioCharge(payload) {
    return this.request('/payments/add-folio-charge', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async settleFolio(payload) {
    return this.request('/payments/settle-folio', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- POS / In-Room Dining ---
  async getMenu(category = null) {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request(`/pos/menu${query}`);
  }

  async createOrder(orderData) {
    return this.request('/pos/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(status = null) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request(`/pos/orders${query}`);
  }

  async updateOrderStatus(orderId, status) {
    return this.request(`/pos/orders/${orderId}/status?status=${encodeURIComponent(status)}`, {
      method: 'PATCH',
    });
  }

  // --- Analytics ---
  async getDashboardStats() {
    return this.request('/analytics/dashboard');
  }

  async getHealth() {
    return this.request('/health');
  }
}

export const api = new ApiService();
