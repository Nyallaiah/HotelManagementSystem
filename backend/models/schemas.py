from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# --- User & Auth Schemas ---
class UserRole:
    ADMIN = "admin"
    RECEPTIONIST = "receptionist"
    HOUSEKEEPER = "housekeeper"
    RESTAURANT = "restaurant"
    GUEST = "guest"

class ClerkSyncRequest(BaseModel):
    clerk_id: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    image_url: Optional[str] = None
    auth_strategy: Optional[str] = "google"

class SupabaseSyncRequest(BaseModel):
    supabase_id: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    image_url: Optional[str] = None
    auth_strategy: Optional[str] = "google"

class UserLogin(BaseModel):
    email: Optional[str] = None
    phone_number: Optional[str] = None
    password: Optional[str] = None

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = UserRole.RECEPTIONIST
    department: Optional[str] = "Front Desk"

class UserResponse(BaseModel):
    id: Optional[str] = None
    name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    role: str
    department: Optional[str] = None
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Room Schemas ---
class RoomStatus:
    VACANT_CLEAN = "vacant_clean"
    VACANT_DIRTY = "vacant_dirty"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    MAINTENANCE = "maintenance"

class RoomCategory:
    STANDARD = "Standard Queen"
    DELUXE = "Deluxe King"
    EXECUTIVE = "Executive Ocean Suite"
    PRESIDENTIAL = "Presidential Penthouse"

class RoomBase(BaseModel):
    room_number: str
    type: str = RoomCategory.DELUXE
    floor: int = 1
    base_price_per_night: float
    capacity: int = 2
    bed_type: str = "1 King Bed"
    size_sqft: int = 450
    amenities: List[str] = Field(default_factory=list)
    images: List[str] = Field(default_factory=list)
    description: Optional[str] = ""
    status: str = RoomStatus.VACANT_CLEAN
    last_cleaned_at: Optional[str] = None
    assigned_housekeeper: Optional[str] = None
    notes: Optional[str] = None

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    type: Optional[str] = None
    floor: Optional[int] = None
    base_price_per_night: Optional[float] = None
    capacity: Optional[int] = None
    bed_type: Optional[str] = None
    size_sqft: Optional[int] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    description: Optional[str] = None
    status: Optional[str] = None
    assigned_housekeeper: Optional[str] = None
    notes: Optional[str] = None

class RoomResponse(RoomBase):
    id: Optional[str] = None


# --- Booking & Guest Schemas ---
class BookingStatus:
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    CANCELLED = "cancelled"

class PaymentStatus:
    PENDING = "pending"
    PAID = "paid"
    PARTIALLY_PAID = "partially_paid"
    REFUNDED = "refunded"

class GuestInfo(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    id_type: Optional[str] = "Passport / National ID"
    id_number: Optional[str] = ""
    special_requests: Optional[str] = ""

class BookingCreate(BaseModel):
    guest: GuestInfo
    room_type: str
    room_number: Optional[str] = None  # Optional, can be auto-assigned or picked
    check_in: str  # YYYY-MM-DD
    check_out: str  # YYYY-MM-DD
    adults: int = 1
    children: int = 0
    payment_method: str = "credit_card"  # "stripe" | "razorpay" | "mock" | "pay_at_desk"
    card_token: Optional[str] = None

class FolioItem(BaseModel):
    id: str
    category: str  # room_charge, dining, laundry, service_fee, tax, extra
    description: str
    amount: float
    quantity: int = 1
    created_at: str

class PaymentRecord(BaseModel):
    payment_id: str
    amount: float
    method: str
    status: str
    created_at: str
    reference_note: Optional[str] = None

class BookingResponse(BaseModel):
    id: Optional[str] = None
    booking_reference: str
    guest: GuestInfo
    room_number: str
    room_type: str
    check_in: str
    check_out: str
    nights: int
    adults: int
    children: int
    room_rate_per_night: float
    room_charges: float
    tax_amount: float
    service_fee: float
    total_amount: float
    amount_paid: float
    balance_due: float
    booking_status: str
    payment_status: str
    folio_items: List[FolioItem] = Field(default_factory=list)
    payments: List[PaymentRecord] = Field(default_factory=list)
    created_at: str
    checked_in_at: Optional[str] = None
    checked_out_at: Optional[str] = None


# --- POS / In-Room Dining Schemas ---
class MenuItem(BaseModel):
    id: Optional[str] = None
    name: str
    category: str  # Breakfast, Gourmet Mains, Salads & Soups, Artisan Desserts, Beverages, Amenities
    description: str
    price: float
    image: Optional[str] = None
    is_vegetarian: bool = False
    is_available: bool = True
    prep_time_minutes: int = 20

class OrderItem(BaseModel):
    item_id: str
    name: str
    price: float
    quantity: int

class OrderCreate(BaseModel):
    booking_reference: str
    room_number: str
    guest_name: str
    items: List[OrderItem]
    charge_to_room: bool = True
    notes: Optional[str] = None

class OrderResponse(BaseModel):
    id: Optional[str] = None
    order_id: str
    booking_reference: str
    room_number: str
    guest_name: str
    items: List[OrderItem]
    subtotal: float
    tax: float
    total: float
    charge_to_room: bool
    status: str  # received, preparing, dispatched, delivered, cancelled
    created_at: str
    notes: Optional[str] = None


# --- Payment Intent & Checkout Schemas ---
class PaymentIntentRequest(BaseModel):
    amount: float
    currency: str = "usd"
    booking_reference: Optional[str] = None
    customer_email: Optional[str] = None
    description: Optional[str] = None

class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_id: str
    amount: float
    currency: str
    provider: str
    status: str


# --- Analytics Schemas ---
class DashboardStats(BaseModel):
    total_rooms: int
    occupied_rooms: int
    vacant_clean_rooms: int
    vacant_dirty_rooms: int
    maintenance_rooms: int
    occupancy_rate: float
    today_arrivals: int
    today_departures: int
    today_revenue: float
    month_revenue: float
    adr: float  # Average Daily Rate
    revpar: float  # Revenue Per Available Room
    pending_room_service_orders: int
    recent_bookings: List[BookingResponse] = Field(default_factory=list)
