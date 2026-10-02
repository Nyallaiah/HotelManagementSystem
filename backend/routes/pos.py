import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status, Query
from backend.models.schemas import MenuItem, OrderCreate, OrderResponse, PaymentStatus
from backend.services.auth_service import get_current_user, require_roles
from backend.database import get_database, serialize_mongo

router = APIRouter(prefix="/pos", tags=["Point of Sale & In-Room Dining"])

@router.get("/menu", response_model=List[MenuItem])
async def list_menu(category: Optional[str] = None):
    """Retrieve in-room dining and hotel restaurant menu items."""
    db = get_database()
    query: Dict[str, Any] = {"is_available": True}
    if category:
        query["category"] = category
    cursor = db.menu_items.find(query)
    items = await cursor.to_list(length=100)
    return serialize_mongo(items)

@router.post("/menu", response_model=MenuItem)
async def create_menu_item(
    item: MenuItem,
    current_user: dict = Depends(require_roles(["admin", "restaurant"]))
):
    db = get_database()
    doc = item.dict()
    res = await db.menu_items.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return serialize_mongo(doc)

@router.post("/orders", response_model=OrderResponse)
async def place_order(order_req: OrderCreate):
    """
    Guest or Staff places an In-Room Dining or amenity service order.
    If charge_to_room is enabled, the order total is automatically appended to the room folio.
    """
    db = get_database()
    subtotal = sum(i.price * i.quantity for i in order_req.items)
    tax = round(subtotal * 0.08, 2)  # 8% F&B tax
    total = round(subtotal + tax, 2)

    order_id = f"KOT-{uuid.uuid4().hex[:6].upper()}"
    now_iso = datetime.utcnow().isoformat() + "Z"

    order_doc = {
        "order_id": order_id,
        "booking_reference": order_req.booking_reference,
        "room_number": order_req.room_number,
        "guest_name": order_req.guest_name,
        "items": [i.dict() for i in order_req.items],
        "subtotal": subtotal,
        "tax": tax,
        "total": total,
        "charge_to_room": order_req.charge_to_room,
        "status": "received",
        "created_at": now_iso,
        "notes": order_req.notes
    }

    res = await db.orders.insert_one(order_doc)
    order_doc["id"] = str(res.inserted_id)

    # If charged to room, append folio item to the guest's booking
    if order_req.charge_to_room and order_req.booking_reference:
        booking = await db.bookings.find_one({"booking_reference": order_req.booking_reference})
        if booking:
            items_summary = ", ".join([f"{i.quantity}x {i.name}" for i in order_req.items])
            folio_item = {
                "id": f"fol_pos_{uuid.uuid4().hex[:6]}",
                "category": "dining",
                "description": f"In-Room Dining ({order_id}): {items_summary}",
                "amount": total,
                "quantity": 1,
                "created_at": now_iso
            }
            new_total = round(float(booking.get("total_amount", 0)) + total, 2)
            new_balance = round(float(booking.get("balance_due", 0)) + total, 2)
            await db.bookings.update_one(
                {"booking_reference": order_req.booking_reference},
                {
                    "$push": {"folio_items": folio_item},
                    "$set": {
                        "total_amount": new_total,
                        "balance_due": new_balance,
                        "payment_status": PaymentStatus.PARTIALLY_PAID if booking.get("amount_paid", 0) > 0 else PaymentStatus.PENDING
                    }
                }
            )

    return serialize_mongo(order_doc)

@router.get("/orders", response_model=List[OrderResponse])
async def list_orders(status: Optional[str] = None):
    """Kitchen Order Ticket (KOT) board for chefs and service staff."""
    db = get_database()
    query = {}
    if status:
        query["status"] = status
    cursor = db.orders.find(query).sort("created_at", -1)
    orders = await cursor.to_list(length=100)
    return serialize_mongo(orders)

@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: str = Query(..., description="received, preparing, dispatched, delivered, cancelled"),
    current_user: dict = Depends(require_roles(["admin", "restaurant", "receptionist"]))
):
    valid_statuses = ["received", "preparing", "dispatched", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    db = get_database()
    res = await db.orders.update_one({"order_id": order_id}, {"$set": {"status": status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
        
    return {"success": True, "order_id": order_id, "status": status}
