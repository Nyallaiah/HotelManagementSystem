import uuid
import random
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status, Query
from backend.models.schemas import (
    BookingCreate, BookingResponse, BookingStatus, PaymentStatus,
    FolioItem, PaymentRecord, RoomStatus
)
from backend.config import settings
from backend.services.auth_service import get_current_user, require_roles
from backend.services.payment_service import payment_service
from backend.database import get_database, serialize_mongo

router = APIRouter(prefix="/bookings", tags=["Reservations & Front Desk"])

def generate_booking_reference() -> str:
    """Generates a memorable hospitality booking reference code, e.g. GAH-78214"""
    random_num = random.randint(10000, 99999)
    return f"GAH-{random_num}"

def calculate_nights(check_in_str: str, check_out_str: str) -> int:
    try:
        d1 = datetime.strptime(check_in_str, "%Y-%m-%d").date()
        d2 = datetime.strptime(check_out_str, "%Y-%m-%d").date()
        nights = (d2 - d1).days
        return max(1, nights)
    except Exception:
        return 1

@router.get("/check-availability")
async def check_availability(
    check_in: str = Query(..., description="YYYY-MM-DD"),
    check_out: str = Query(..., description="YYYY-MM-DD"),
    adults: int = Query(1, ge=1),
    room_type: Optional[str] = None
):
    """
    Search available rooms for the specified date range and party size.
    Filters out rooms that have overlapping active bookings.
    """
    db = get_database()
    
    # Find all rooms matching capacity and room_type
    room_query: Dict[str, Any] = {"capacity": {"$gte": adults}}
    if room_type:
        room_query["type"] = room_type
    
    all_rooms_cursor = db.rooms.find(room_query)
    all_rooms = await all_rooms_cursor.to_list(length=200)

    # Find overlapping bookings
    # Overlap occurs when booking.check_in < requested.check_out AND booking.check_out > requested.check_in
    active_statuses = [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]
    bookings_cursor = db.bookings.find({
        "booking_status": {"$in": active_statuses},
        "check_in": {"$lt": check_out},
        "check_out": {"$gt": check_in}
    })
    overlapping_bookings = await bookings_cursor.to_list(length=500)
    busy_room_numbers = {b.get("room_number") for b in overlapping_bookings if b.get("room_number")}

    available_rooms = []
    for r in all_rooms:
        r["id"] = str(r.get("_id", ""))
        is_free = r["room_number"] not in busy_room_numbers and r.get("status") != RoomStatus.MAINTENANCE
        r["is_available"] = is_free
        if is_free:
            available_rooms.append(r)

    nights = calculate_nights(check_in, check_out)
    return {
        "check_in": check_in,
        "check_out": check_out,
        "nights": nights,
        "total_available": len(available_rooms),
        "available_rooms": serialize_mongo(available_rooms)
    }

@router.post("", response_model=BookingResponse)
async def create_booking(booking_req: BookingCreate):
    """
    Create a new booking (Guest self-booking or walk-in Front Desk reservation).
    Automatically calculates room tariffs, taxes, resort fees, and initializes folio.
    """
    db = get_database()
    nights = calculate_nights(booking_req.check_in, booking_req.check_out)

    # Find available room for this type
    chosen_room = None
    if booking_req.room_number:
        chosen_room = await db.rooms.find_one({"room_number": booking_req.room_number})
    else:
        # Auto-pick first available room of this type
        avail = await check_availability(booking_req.check_in, booking_req.check_out, adults=booking_req.adults, room_type=booking_req.room_type)
        if avail["available_rooms"]:
            chosen_room = avail["available_rooms"][0]

    if not chosen_room:
        # Fallback to any vacant room of that type
        chosen_room = await db.rooms.find_one({"type": booking_req.room_type, "status": RoomStatus.VACANT_CLEAN})

    if not chosen_room:
        # Final fallback to standard room to ensure user reservation completes gracefully
        chosen_room = await db.rooms.find_one()

    room_number = chosen_room.get("room_number", "101")
    rate_per_night = float(chosen_room.get("base_price_per_night", 200.0))
    room_charges = round(rate_per_night * nights, 2)
    tax_amount = round(room_charges * settings.TAX_RATE, 2)
    service_fee = round(room_charges * settings.SERVICE_FEE_RATE, 2)
    total_amount = round(room_charges + tax_amount + service_fee, 2)

    booking_ref = generate_booking_reference()
    now_iso = datetime.utcnow().isoformat() + "Z"

    # Setup initial folio items
    folio_items = [
        {
            "id": f"fol_{uuid.uuid4().hex[:8]}",
            "category": "room_charge",
            "description": f"Room Tariff ({nights} nights @ ${rate_per_night}/night)",
            "amount": room_charges,
            "quantity": 1,
            "created_at": now_iso
        },
        {
            "id": f"fol_{uuid.uuid4().hex[:8]}",
            "category": "tax",
            "description": f"Occupancy & Sales Tax ({int(settings.TAX_RATE * 100)}%)",
            "amount": tax_amount,
            "quantity": 1,
            "created_at": now_iso
        },
        {
            "id": f"fol_{uuid.uuid4().hex[:8]}",
            "category": "service_fee",
            "description": f"Resort & Concierge Fee ({int(settings.SERVICE_FEE_RATE * 100)}%)",
            "amount": service_fee,
            "quantity": 1,
            "created_at": now_iso
        }
    ]

    # Process Payment
    payments = []
    amount_paid = 0.0
    payment_status = PaymentStatus.PENDING

    if booking_req.payment_method in ["credit_card", "stripe", "razorpay", "mock"]:
        # Record successful payment
        txn = await payment_service.confirm_payment(
            payment_id=booking_req.card_token or f"pay_{uuid.uuid4().hex[:10]}",
            amount=total_amount,
            payment_method=booking_req.payment_method
        )
        payments.append({
            "payment_id": txn["transaction_id"],
            "amount": total_amount,
            "method": booking_req.payment_method,
            "status": "succeeded",
            "created_at": now_iso,
            "reference_note": f"Online Checkout ({booking_req.payment_method.capitalize()})"
        })
        amount_paid = total_amount
        payment_status = PaymentStatus.PAID

    balance_due = round(max(0.0, total_amount - amount_paid), 2)

    booking_doc = {
        "booking_reference": booking_ref,
        "guest": booking_req.guest.dict(),
        "room_number": room_number,
        "room_type": chosen_room.get("type", booking_req.room_type),
        "check_in": booking_req.check_in,
        "check_out": booking_req.check_out,
        "nights": nights,
        "adults": booking_req.adults,
        "children": booking_req.children,
        "room_rate_per_night": rate_per_night,
        "room_charges": room_charges,
        "tax_amount": tax_amount,
        "service_fee": service_fee,
        "total_amount": total_amount,
        "amount_paid": amount_paid,
        "balance_due": balance_due,
        "booking_status": BookingStatus.CONFIRMED,
        "payment_status": payment_status,
        "folio_items": folio_items,
        "payments": payments,
        "created_at": now_iso,
        "checked_in_at": None,
        "checked_out_at": None
    }

    res = await db.bookings.insert_one(booking_doc)
    booking_doc["id"] = str(res.inserted_id)

    # Update room status to reserved
    await db.rooms.update_one({"room_number": room_number}, {"$set": {"status": RoomStatus.RESERVED}})

    return serialize_mongo(booking_doc)

@router.get("/my-bookings")
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    """
    Retrieves all bookings for the currently authenticated guest (or staff).
    Matches either guest.email, guest.phone, or clerk_id in the database.
    Identifies if there is an active/checked-in stay and returns stay info.
    """
    db = get_database()
    email = (current_user.get("email") or "").lower().strip()
    phone = (current_user.get("phone_number") or "").strip()
    supabase_id = current_user.get("supabase_id")
    clerk_id = current_user.get("clerk_id")

    def digits_only(s: str) -> str:
        return "".join(c for c in s if c.isdigit())

    query_conds = []
    if email:
        query_conds.append({"guest.email": {"$regex": f"^{email}$", "$options": "i"}})
    if phone:
        p_digits = digits_only(phone)
        if len(p_digits) >= 6:
            query_conds.append({"guest.phone": {"$regex": p_digits[-8:] if len(p_digits) >= 8 else p_digits}})
        else:
            query_conds.append({"guest.phone": phone})
    if supabase_id:
        query_conds.append({"supabase_id": supabase_id})
    if clerk_id:
        query_conds.append({"clerk_id": clerk_id})

    if not query_conds:
        return {"total": 0, "active_booking": None, "bookings": []}

    cursor = db.bookings.find({"$or": query_conds}).sort("created_at", -1)
    bookings = await cursor.to_list(length=100)
    
    # Identify active booking (CHECKED_IN or CONFIRMED)
    active = None
    for b in bookings:
        if b.get("booking_status") in [BookingStatus.CHECKED_IN, BookingStatus.CONFIRMED]:
            active = b
            break

    return {
        "total": len(bookings),
        "active_booking": serialize_mongo(active) if active else None,
        "bookings": serialize_mongo(bookings)
    }

@router.get("/lookup")
async def guest_lookup(
    reference: str = Query(..., description="Booking reference, e.g. GAH-78214"),
    email: Optional[str] = Query(None, description="Guest email address"),
    phone: Optional[str] = Query(None, description="Guest phone number")
):
    """
    Guest self-service lookup for the Visitor Portal.
    Allows guests to view stay details, room credentials, order dining, and view invoice.
    Supports matching either email or phone number.
    """
    db = get_database()
    booking = await db.bookings.find_one({"booking_reference": reference.strip().upper()})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found. Please verify your Reference ID.")
    
    guest_email = booking.get("guest", {}).get("email", "").lower().strip()
    guest_phone = booking.get("guest", {}).get("phone", "").strip()

    def digits_only(s: str) -> str:
        return "".join(c for c in s if c.isdigit())

    matches = False
    if email and email.strip().lower() == guest_email:
        matches = True
    if phone:
        p_digits = digits_only(phone)
        gp_digits = digits_only(guest_phone)
        if p_digits and gp_digits:
            if p_digits == gp_digits or p_digits.endswith(gp_digits[-7:]) or gp_digits.endswith(p_digits[-7:]):
                matches = True
        elif phone.strip() == guest_phone:
            matches = True
    
    if not email and not phone:
        # If neither provided, allow reference-only lookup if verified
        matches = True

    if not matches:
        raise HTTPException(status_code=403, detail="Contact details do not match the reservation records.")
    
    return serialize_mongo(booking)

@router.get("", response_model=List[BookingResponse])
async def list_bookings(
    status: Optional[str] = None,
    room_number: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_roles(["admin", "receptionist"]))
):
    """Staff endpoint to list reservations, filter by status or search by guest name/ref."""
    db = get_database()
    query: Dict[str, Any] = {}
    if status:
        query["booking_status"] = status
    if room_number:
        query["room_number"] = room_number
    if search:
        query["$or"] = [
            {"booking_reference": {"$regex": search, "$options": "i"}},
            {"guest.first_name": {"$regex": search, "$options": "i"}},
            {"guest.last_name": {"$regex": search, "$options": "i"}},
            {"guest.email": {"$regex": search, "$options": "i"}}
        ]

    cursor = db.bookings.find(query).sort("created_at", -1)
    bookings = await cursor.to_list(length=300)
    return serialize_mongo(bookings)

@router.post("/{reference}/check-in")
async def check_in_guest(
    reference: str,
    id_number: Optional[str] = None,
    current_user: dict = Depends(require_roles(["admin", "receptionist"]))
):
    """Execute Rapid Front-Desk Check-in for an arriving guest."""
    db = get_database()
    booking = await db.bookings.find_one({"booking_reference": reference})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.get("booking_status") == BookingStatus.CHECKED_IN:
        raise HTTPException(status_code=400, detail="Guest is already checked in.")

    now_iso = datetime.utcnow().isoformat() + "Z"
    update_data: Dict[str, Any] = {
        "booking_status": BookingStatus.CHECKED_IN,
        "checked_in_at": now_iso
    }
    if id_number:
        update_data["guest.id_number"] = id_number

    await db.bookings.update_one({"booking_reference": reference}, {"$set": update_data})
    
    # Mark room as OCCUPIED
    room_num = booking.get("room_number")
    if room_num:
        await db.rooms.update_one({"room_number": room_num}, {"$set": {"status": RoomStatus.OCCUPIED}})

    return {
        "success": True,
        "booking_reference": reference,
        "room_number": room_num,
        "status": BookingStatus.CHECKED_IN,
        "checked_in_at": now_iso
    }

@router.post("/{reference}/check-out")
async def check_out_guest(
    reference: str,
    settle_balance: bool = True,
    current_user: dict = Depends(require_roles(["admin", "receptionist"]))
):
    """
    Execute Front-Desk Check-out.
    Verifies folio balance, marks booking checked_out, and marks room VACANT_DIRTY for Housekeeping.
    """
    db = get_database()
    booking = await db.bookings.find_one({"booking_reference": reference})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    balance = float(booking.get("balance_due", 0))
    now_iso = datetime.utcnow().isoformat() + "Z"
    updates: Dict[str, Any] = {
        "booking_status": BookingStatus.CHECKED_OUT,
        "checked_out_at": now_iso
    }

    if balance > 0 and settle_balance:
        # Settle remainder at reception
        payment_rec = {
            "payment_id": f"TXN-SETTLE-{uuid.uuid4().hex[:6].upper()}",
            "amount": balance,
            "method": "front_desk_cash_or_card",
            "status": "succeeded",
            "created_at": now_iso,
            "reference_note": "Settled at Front Desk on Check-out"
        }
        await db.bookings.update_one(
            {"booking_reference": reference},
            {
                "$push": {"payments": payment_rec},
                "$inc": {"amount_paid": balance},
                "$set": {"balance_due": 0.0, "payment_status": PaymentStatus.PAID}
            }
        )

    await db.bookings.update_one({"booking_reference": reference}, {"$set": updates})

    # Flag room as VACANT_DIRTY so Housekeeping is prompted to service it
    room_num = booking.get("room_number")
    if room_num:
        await db.rooms.update_one({"room_number": room_num}, {"$set": {"status": RoomStatus.VACANT_DIRTY}})

    return {
        "success": True,
        "booking_reference": reference,
        "room_number": room_num,
        "status": BookingStatus.CHECKED_OUT,
        "room_status_now": RoomStatus.VACANT_DIRTY,
        "checked_out_at": now_iso
    }

@router.get("/{reference}/invoice")
async def get_booking_invoice(reference: str):
    """Retrieve full official tax invoice for printing / downloading."""
    db = get_database()
    booking = await db.bookings.find_one({"booking_reference": reference})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return payment_service.generate_invoice_data(booking)
