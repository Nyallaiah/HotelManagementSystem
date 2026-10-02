from datetime import datetime, date
from typing import Dict, Any
from fastapi import APIRouter, Depends
from backend.models.schemas import DashboardStats, RoomStatus, BookingStatus
from backend.services.auth_service import get_current_user, require_roles
from backend.database import get_database, serialize_mongo

router = APIRouter(prefix="/analytics", tags=["ERP Analytics & Reports"])

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_kpis(current_user: dict = Depends(require_roles(["admin", "receptionist"]))):
    """
    Computes key performance indicators for General Managers and Front Desk Supervisors.
    Calculates Occupancy %, ADR (Average Daily Rate), and RevPAR (Revenue Per Available Room).
    """
    db = get_database()
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    # 1. Rooms breakdown
    rooms_cursor = db.rooms.find()
    rooms = await rooms_cursor.to_list(length=500)
    total_rooms = len(rooms) or 1
    
    occupied_count = sum(1 for r in rooms if r.get("status") == RoomStatus.OCCUPIED)
    clean_count = sum(1 for r in rooms if r.get("status") == RoomStatus.VACANT_CLEAN)
    dirty_count = sum(1 for r in rooms if r.get("status") == RoomStatus.VACANT_DIRTY)
    maint_count = sum(1 for r in rooms if r.get("status") == RoomStatus.MAINTENANCE)
    
    occupancy_pct = round((occupied_count / total_rooms) * 100, 1)

    # 2. Bookings breakdown
    bookings_cursor = db.bookings.find()
    all_bookings = await bookings_cursor.to_list(length=1000)

    today_arrivals = sum(1 for b in all_bookings if b.get("check_in") == today_str and b.get("booking_status") == BookingStatus.CONFIRMED)
    today_departures = sum(1 for b in all_bookings if b.get("check_out") == today_str and b.get("booking_status") == BookingStatus.CHECKED_IN)

    # 3. Revenue calculations
    today_rev = 0.0
    month_rev = 0.0
    current_month_prefix = datetime.utcnow().strftime("%Y-%m")

    for b in all_bookings:
        for p in b.get("payments", []):
            p_date = p.get("created_at", "")
            amt = float(p.get("amount", 0))
            if p_date.startswith(today_str):
                today_rev += amt
            if p_date.startswith(current_month_prefix):
                month_rev += amt

    # 4. ADR & RevPAR
    active_room_revenue = sum(
        float(b.get("room_charges", 0)) / max(1, b.get("nights", 1))
        for b in all_bookings
        if b.get("booking_status") == BookingStatus.CHECKED_IN
    )
    adr = round(active_room_revenue / occupied_count, 2) if occupied_count > 0 else 185.00
    revpar = round(active_room_revenue / total_rooms, 2) if total_rooms > 0 else round(adr * (occupancy_pct / 100), 2)

    # 5. Pending Room Service Orders
    orders_cursor = db.orders.find({"status": {"$in": ["received", "preparing"]}})
    pending_orders = await orders_cursor.to_list(length=100)

    # 6. Recent bookings
    recent = sorted(all_bookings, key=lambda x: x.get("created_at", ""), reverse=True)[:5]
    serialized_recent = serialize_mongo(recent)

    return DashboardStats(
        total_rooms=total_rooms,
        occupied_rooms=occupied_count,
        vacant_clean_rooms=clean_count,
        vacant_dirty_rooms=dirty_count,
        maintenance_rooms=maint_count,
        occupancy_rate=occupancy_pct,
        today_arrivals=today_arrivals,
        today_departures=today_departures,
        today_revenue=round(today_rev, 2),
        month_revenue=round(month_rev, 2),
        adr=adr,
        revpar=revpar,
        pending_room_service_orders=len(pending_orders),
        recent_bookings=serialized_recent
    )
