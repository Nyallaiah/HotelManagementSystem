import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import asyncio
import pytest
import httpx
from datetime import datetime, timedelta, timezone

BASE_URL = "http://127.0.0.1:8000/api"

@pytest.mark.asyncio
async def test_full_system_flow():
    print("\n--- RUNNING HOSPITALITY ERP SYSTEM VERIFICATION ---")
    
    # Use httpx AsyncClient
    # Note: If server is not running on 8000 right now, we can test via FastAPI TestClient directly!
    from fastapi.testclient import TestClient
    from backend.main import app
    from backend.database import db_manager
    
    await db_manager.connect()
    
    with TestClient(app) as client:
        # 1. Health check
        res = client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        data = res.json()
        print(f"[PASS] Health Check: {data['status']}, Database: {data['database']}, Rooms: {data['active_rooms']}")

        # 2. Staff Authentication & Dynamic Backend-Driven Roles
        res = client.post("/api/auth/login", json={
            "email": "admin@grandazure.com",
            "password": "Admin@123"
        })
        assert res.status_code == 200, f"Admin login failed: {res.text}"
        auth_data = res.json()
        assert auth_data["user"]["role"] == "admin"
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"[PASS] Unified Login: Dynamically resolved role '{auth_data['user']['role']}' from database for {auth_data['user']['email']}")

        # 2b. Clerk User Synchronization & Role Resolution
        clerk_sync_admin = client.post("/api/auth/clerk-sync", json={
            "clerk_id": "user_2test_admin_clerk_9482",
            "email": "admin@grandazure.com",
            "first_name": "Alexander",
            "last_name": "Vance"
        })
        assert clerk_sync_admin.status_code == 200
        assert clerk_sync_admin.json()["user"]["role"] == "admin"
        print(f"[PASS] Clerk Sync: Dynamically resolved role '{clerk_sync_admin.json()['user']['role']}' for admin@grandazure.com")

        clerk_sync_housekeeper = client.post("/api/auth/clerk-sync", json={
            "clerk_id": "user_2test_clean_clerk_1928",
            "email": "housekeeping@grandazure.com",
            "first_name": "Maria",
            "last_name": "Santos"
        })
        assert clerk_sync_housekeeper.status_code == 200
        assert clerk_sync_housekeeper.json()["user"]["role"] == "housekeeper"
        print(f"[PASS] Clerk Sync: Dynamically resolved role '{clerk_sync_housekeeper.json()['user']['role']}' for housekeeping@grandazure.com")

        clerk_sync_guest = client.post("/api/auth/clerk-sync", json={
            "clerk_id": "user_2test_guest_clerk_7841",
            "email": "new.guest.traveler@gmail.com",
            "first_name": "David",
            "last_name": "Miller"
        })
        assert clerk_sync_guest.status_code == 200
        assert clerk_sync_guest.json()["user"]["role"] == "guest"
        print(f"[PASS] Clerk Sync: Auto-provisioned new user with role '{clerk_sync_guest.json()['user']['role']}' for {clerk_sync_guest.json()['user']['email']}")

        # 3. Check Room Categories & Floor Grid
        res = client.get("/api/rooms/categories")
        assert res.status_code == 200
        cats = res.json()
        print(f"[PASS] Room Categories retrieved: {len(cats)} categories found")

        res = client.get("/api/rooms/matrix/floor-grid")
        assert res.status_code == 200
        floors = res.json()
        assert len(floors) >= 4
        print(f"[PASS] Room Matrix: {len(floors)} floors loaded successfully")

        # 4. Check Room Availability
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        checkout_str = (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d")
        res = client.get(f"/api/bookings/check-availability?check_in={today_str}&check_out={checkout_str}&adults=2")
        assert res.status_code == 200
        avail = res.json()
        print(f"[PASS] Availability check: {avail['total_available']} rooms vacant for 2 nights")

        # 5. Create Booking & Process Payment
        booking_payload = {
            "guest": {
                "first_name": "Alexander",
                "last_name": "Hamilton",
                "email": "a.hamilton@treasury.gov",
                "phone": "+1 555 178 9102",
                "special_requests": "Ocean view, high floor"
            },
            "room_type": "Deluxe King",
            "check_in": today_str,
            "check_out": checkout_str,
            "adults": 2,
            "children": 0,
            "payment_method": "credit_card",
            "card_token": "tok_visa_4242"
        }
        res = client.post("/api/bookings", json=booking_payload)
        assert res.status_code == 200, f"Booking creation failed: {res.text}"
        new_booking = res.json()
        ref = new_booking["booking_reference"]
        room_num = new_booking["room_number"]
        print(f"[PASS] Booking Created: {ref} for Room #{room_num}, Total: ${new_booking['total_amount']}, Status: {new_booking['booking_status']}")

        # 6. Guest Self-Service Lookup
        res = client.get(f"/api/bookings/lookup?reference={ref}&email=a.hamilton@treasury.gov")
        assert res.status_code == 200
        lookup_data = res.json()
        assert lookup_data["booking_reference"] == ref
        print(f"[PASS] Guest Self-Service Lookup verified for {ref}")

        # 7. Order In-Room Dining & Charge to Room Folio
        order_payload = {
            "booking_reference": ref,
            "room_number": room_num,
            "guest_name": "Alexander Hamilton",
            "items": [
                {"item_id": "1", "name": "Prime Wagyu Tenderloin 8oz", "price": 68.0, "quantity": 1},
                {"item_id": "2", "name": "Azure Handcrafted Espresso Martini", "price": 21.0, "quantity": 2}
            ],
            "charge_to_room": True,
            "notes": "Deliver at 8:00 PM"
        }
        res = client.post("/api/pos/orders", json=order_payload)
        assert res.status_code == 200
        order_data = res.json()
        print(f"[PASS] Kitchen Order Placed: {order_data['order_id']}, Subtotal: ${order_data['subtotal']}, Charged to Room: {order_data['charge_to_room']}")

        # Verify Folio was charged
        res = client.get(f"/api/bookings/lookup?reference={ref}&email=a.hamilton@treasury.gov")
        updated_booking = res.json()
        assert updated_booking["balance_due"] > 0
        print(f"[PASS] Folio auto-updated: New Balance Due is ${updated_booking['balance_due']}")

        # 8. Front Desk Check-in
        res = client.post(f"/api/bookings/{ref}/check-in?id_number=US-PASS-884920", headers=headers)
        assert res.status_code == 200
        print(f"[PASS] Front Desk Check-in executed: Room #{room_num} is now OCCUPIED")

        # 9. Kitchen Status Transition
        res = client.patch(f"/api/pos/orders/{order_data['order_id']}/status?status=delivered", headers=headers)
        assert res.status_code == 200
        print(f"[PASS] Kitchen POS Ticket transitioned to DELIVERED")

        # 10. Front Desk Check-out and Housekeeping alert
        res = client.post(f"/api/bookings/{ref}/check-out?settle_balance=true", headers=headers)
        assert res.status_code == 200
        co_data = res.json()
        print(f"[PASS] Front Desk Check-out complete: Room status flipped to {co_data['room_status_now']} for Housekeeping!")

        # 11. Housekeeper cleans room
        res = client.patch(f"/api/rooms/{room_num}/status?status=vacant_clean", headers=headers)
        assert res.status_code == 200
        print(f"[PASS] Housekeeping cleaned Room #{room_num} and reset to VACANT CLEAN")

        # 12. Dashboard Analytics & KPIs
        res = client.get("/api/analytics/dashboard", headers=headers)
        assert res.status_code == 200
        dash = res.json()
        print(f"[PASS] Executive Dashboard KPIs: Occupancy: {dash['occupancy_rate']}%, RevPAR: ${dash['revpar']}, ADR: ${dash['adr']}")

        # 13. Official Tax Invoice
        res = client.get(f"/api/bookings/{ref}/invoice")
        assert res.status_code == 200
        inv = res.json()
        print(f"[PASS] Official Tax Invoice generated: {inv['invoice_number']} for {inv['hotel']['name']}")

        # 14. Clerk Google OAuth Sync & Guest Role Resolution
        google_sync = client.post("/api/auth/clerk-sync", json={
            "clerk_id": "user_clerk_google_9921",
            "email": "clerk.guest@gmail.com",
            "first_name": "Sophia",
            "last_name": "Vance",
            "auth_strategy": "google"
        })
        assert google_sync.status_code == 200
        google_guest = google_sync.json()
        assert google_guest["user"]["role"] == "guest"
        assert google_guest["user"]["email"] == "clerk.guest@gmail.com"
        guest_google_token = google_guest["access_token"]
        print(f"[PASS] Clerk Google OAuth: Synced guest Sophia Vance with role '{google_guest['user']['role']}'")

        # 15. Clerk Phone Number (SMS OTP) Sync & Guest Role Resolution
        phone_sync = client.post("/api/auth/clerk-sync", json={
            "clerk_id": "user_clerk_phone_7732",
            "phone_number": "+15553921049",
            "first_name": "Liam",
            "last_name": "Carter",
            "auth_strategy": "phone_number"
        })
        assert phone_sync.status_code == 200
        phone_guest = phone_sync.json()
        assert phone_guest["user"]["role"] == "guest"
        assert phone_guest["user"]["phone_number"] == "+15553921049"
        guest_phone_token = phone_guest["access_token"]
        print(f"[PASS] Clerk Phone SMS: Synced guest Liam Carter with role '{phone_guest['user']['role']}' and phone +15553921049")

        # 16. Authenticated Guest /my-bookings & Phone-based Lookup
        # Create a booking with phone number
        phone_booking = client.post("/api/bookings", json={
            "guest": {
                "first_name": "Liam",
                "last_name": "Carter",
                "email": "liam.carter@example.com",
                "phone": "+15553921049"
            },
            "room_type": "Deluxe Ocean Suite",
            "check_in": (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d"),
            "check_out": (datetime.now(timezone.utc) + timedelta(days=5)).strftime("%Y-%m-%d"),
            "adults": 2,
            "children": 0,
            "payment_method": "credit_card"
        })
        assert phone_booking.status_code == 200
        phone_b_ref = phone_booking.json()["booking_reference"]

        # Test /my-bookings with phone guest token
        my_bookings_res = client.get("/api/bookings/my-bookings", headers={"Authorization": f"Bearer {guest_phone_token}"})
        assert my_bookings_res.status_code == 200
        my_b_data = my_bookings_res.json()
        assert my_b_data["total"] >= 1
        print(f"[PASS] Authenticated Guest /my-bookings retrieved {my_b_data['total']} booking(s) automatically for phone guest Liam")

        # Test /lookup with Phone Number
        phone_lookup = client.get(f"/api/bookings/lookup?reference={phone_b_ref}&phone=+15553921049")
        assert phone_lookup.status_code == 200
        assert phone_lookup.json()["booking_reference"] == phone_b_ref
        print(f"[PASS] Guest Lookup via Phone Number succeeded for reference {phone_b_ref}")

    print("\n--- ALL 16 TEST PHASES PASSED WITH 100% SUCCESS ---")

if __name__ == "__main__":
    asyncio.run(test_full_system_flow())
