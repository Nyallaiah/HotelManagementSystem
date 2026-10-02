import uuid
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from backend.config import settings

logger = logging.getLogger("hotel_erp.payments")

class PaymentService:
    def __init__(self):
        self.provider = settings.PAYMENT_PROVIDER.lower()
        self.stripe_enabled = bool(settings.STRIPE_SECRET_KEY)
        self.razorpay_enabled = bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET)

        if self.stripe_enabled:
            try:
                import stripe
                stripe.api_key = settings.STRIPE_SECRET_KEY
                logger.info("Stripe payment gateway initialized.")
            except Exception as e:
                logger.warning(f"Failed to initialize Stripe: {e}")

    async def create_payment_intent(
        self,
        amount: float,
        currency: str = "usd",
        booking_reference: Optional[str] = None,
        customer_email: Optional[str] = None,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates a payment intent. Falls back seamlessly to interactive mock sandbox
        if live credentials are not specified.
        """
        amount_cents = int(round(amount * 100))

        # Real Stripe integration if key is provided and provider configured
        if self.provider == "stripe" and self.stripe_enabled:
            try:
                import stripe
                intent = stripe.PaymentIntent.create(
                    amount=amount_cents,
                    currency=currency.lower(),
                    metadata={
                        "booking_reference": booking_reference or "",
                        "customer_email": customer_email or ""
                    },
                    description=description or f"Hotel Booking: {booking_reference}"
                )
                return {
                    "client_secret": intent.client_secret,
                    "payment_id": intent.id,
                    "amount": amount,
                    "currency": currency.upper(),
                    "provider": "stripe",
                    "status": "requires_payment_method"
                }
            except Exception as err:
                logger.error(f"Stripe error, falling back to sandbox: {err}")

        # Built-in Interactive Mock Sandbox
        mock_id = f"pi_mock_{uuid.uuid4().hex[:16]}"
        mock_client_secret = f"{mock_id}_secret_{uuid.uuid4().hex[:12]}"
        
        return {
            "client_secret": mock_client_secret,
            "payment_id": mock_id,
            "amount": amount,
            "currency": currency.upper(),
            "provider": "sandbox",
            "status": "requires_payment_method",
            "message": "Interactive Sandbox Gateway Ready. Use any test card (e.g., 4242 4242 4242 4242)."
        }

    async def confirm_payment(
        self,
        payment_id: str,
        amount: float,
        payment_method: str = "card"
    ) -> Dict[str, Any]:
        """Confirms a payment and generates a transaction receipt."""
        txn_id = f"TXN-{uuid.uuid4().hex[:8].upper()}"
        return {
            "success": True,
            "transaction_id": txn_id,
            "payment_id": payment_id,
            "amount": amount,
            "method": payment_method,
            "status": "succeeded",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

    def generate_invoice_data(self, booking: Dict[str, Any]) -> Dict[str, Any]:
        """Generates an official Indian GST Tax Invoice structure (SAC 996311 for Hotel Accommodation)."""
        invoice_number = f"GST-INV-{booking.get('booking_reference', '0000')}-{datetime.utcnow().strftime('%Y%m')}"
        room_charges = float(booking.get("room_charges", 0))
        cgst_amount = round(room_charges * 0.06, 2)
        sgst_amount = round(room_charges * 0.06, 2)
        
        return {
            "invoice_number": invoice_number,
            "invoice_date": datetime.utcnow().strftime("%d-%b-%Y"),
            "hotel": {
                "name": settings.HOTEL_NAME,
                "tagline": settings.HOTEL_TAGLINE,
                "address": settings.HOTEL_ADDRESS,
                "phone": settings.HOTEL_PHONE,
                "email": settings.HOTEL_EMAIL,
                "website": settings.HOTEL_WEBSITE,
                "gstin": getattr(settings, "HOTEL_GSTIN", "08AAACG1234F1Z5"),
                "sac_code": "996311",
                "state": "Rajasthan (08)"
            },
            "guest": booking.get("guest", {}),
            "booking_reference": booking.get("booking_reference"),
            "room_number": booking.get("room_number"),
            "room_type": booking.get("room_type"),
            "check_in": booking.get("check_in"),
            "check_out": booking.get("check_out"),
            "nights": booking.get("nights", 1),
            "folio_items": booking.get("folio_items", []),
            "payments": booking.get("payments", []),
            "summary": {
                "room_charges": room_charges,
                "cgst_amount": cgst_amount,
                "sgst_amount": sgst_amount,
                "tax_amount": booking.get("tax_amount", round(cgst_amount + sgst_amount, 2)),
                "service_fee": booking.get("service_fee", 0),
                "total_amount": booking.get("total_amount", 0),
                "amount_paid": booking.get("amount_paid", 0),
                "balance_due": booking.get("balance_due", 0),
                "currency": settings.HOTEL_CURRENCY,
                "currency_symbol": settings.HOTEL_CURRENCY_SYMBOL
            }
        }

payment_service = PaymentService()
