import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from backend.models.schemas import PaymentIntentRequest, PaymentIntentResponse, PaymentStatus
from backend.services.payment_service import payment_service
from backend.services.auth_service import get_current_user, require_roles
from backend.database import get_database

router = APIRouter(prefix="/payments", tags=["Payment Gateway & Billing"])

class FolioChargeRequest(BaseModel):
    booking_reference: str
    category: str  # dining, laundry, minibar, spa, penalty, miscellaneous
    description: str
    amount: float
    quantity: int = 1

class FolioSettleRequest(BaseModel):
    booking_reference: str
    amount: float
    payment_method: str = "credit_card"  # stripe, razorpay, cash, card
    notes: Optional[str] = None

@router.post("/create-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(req: PaymentIntentRequest):
    """
    Creates a PaymentIntent for the online checkout flow.
    Supports live Stripe/Razorpay or instant test sandbox simulator.
    """
    result = await payment_service.create_payment_intent(
        amount=req.amount,
        currency=req.currency,
        booking_reference=req.booking_reference,
        customer_email=req.customer_email,
        description=req.description
    )
    return PaymentIntentResponse(**result)

@router.post("/add-folio-charge")
async def add_charge_to_folio(
    req: FolioChargeRequest,
    current_user: dict = Depends(require_roles(["admin", "receptionist", "restaurant"]))
):
    """Staff adds an incidental charge (e.g. Laundry, Spa, Extra Bed) to a guest room folio."""
    db = get_database()
    booking = await db.bookings.find_one({"booking_reference": req.booking_reference})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    total_charge = round(req.amount * req.quantity, 2)
    charge_item = {
        "id": f"fol_{uuid.uuid4().hex[:8]}",
        "category": req.category,
        "description": req.description,
        "amount": total_charge,
        "quantity": req.quantity,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    new_total = round(float(booking.get("total_amount", 0)) + total_charge, 2)
    new_balance = round(float(booking.get("balance_due", 0)) + total_charge, 2)

    await db.bookings.update_one(
        {"booking_reference": req.booking_reference},
        {
            "$push": {"folio_items": charge_item},
            "$set": {
                "total_amount": new_total,
                "balance_due": new_balance,
                "payment_status": PaymentStatus.PARTIALLY_PAID if booking.get("amount_paid", 0) > 0 else PaymentStatus.PENDING
            }
        }
    )

    return {
        "success": True,
        "booking_reference": req.booking_reference,
        "charge_added": charge_item,
        "new_balance_due": new_balance
    }

@router.post("/settle-folio")
async def settle_folio(
    req: FolioSettleRequest,
    current_user: dict = Depends(require_roles(["admin", "receptionist"]))
):
    """Record a settlement payment towards a guest's running folio balance."""
    db = get_database()
    booking = await db.bookings.find_one({"booking_reference": req.booking_reference})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    now_iso = datetime.utcnow().isoformat() + "Z"
    payment_rec = {
        "payment_id": f"TXN-FOLIO-{uuid.uuid4().hex[:8].upper()}",
        "amount": req.amount,
        "method": req.payment_method,
        "status": "succeeded",
        "created_at": now_iso,
        "reference_note": req.notes or "Folio balance payment"
    }

    new_amount_paid = round(float(booking.get("amount_paid", 0)) + req.amount, 2)
    new_balance = round(max(0.0, float(booking.get("balance_due", 0)) - req.amount), 2)
    payment_status = PaymentStatus.PAID if new_balance <= 0.01 else PaymentStatus.PARTIALLY_PAID

    await db.bookings.update_one(
        {"booking_reference": req.booking_reference},
        {
            "$push": {"payments": payment_rec},
            "$set": {
                "amount_paid": new_amount_paid,
                "balance_due": new_balance,
                "payment_status": payment_status
            }
        }
    )

    return {
        "success": True,
        "booking_reference": req.booking_reference,
        "payment_recorded": payment_rec,
        "remaining_balance": new_balance,
        "payment_status": payment_status
    }
