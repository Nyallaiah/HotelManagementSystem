import asyncio
from datetime import datetime, timedelta
from backend.database import get_database, db_manager
from backend.services.auth_service import hash_password
from backend.models.schemas import RoomStatus, RoomCategory, BookingStatus, PaymentStatus

async def seed_database():
    await db_manager.connect()
    db = get_database()
    print("Beginning database seeding for Grand Azure Palace & Resort (India)...")

    # 1. Staff Users
    staff_users = [
        {
            "name": "Rajeshwar Rathore (General Manager)",
            "email": "admin@grandazure.com",
            "password_hash": hash_password("Admin@123"),
            "role": "admin",
            "department": "Executive Management",
            "created_at": datetime.utcnow().isoformat() + "Z"
        },
        {
            "name": "Priya Sharma (Head Concierge)",
            "email": "reception@grandazure.com",
            "password_hash": hash_password("Frontdesk@123"),
            "role": "receptionist",
            "department": "Front Desk & Guest Services",
            "created_at": datetime.utcnow().isoformat() + "Z"
        },
        {
            "name": "Sunita Verma (Housekeeping Supervisor)",
            "email": "housekeeping@grandazure.com",
            "password_hash": hash_password("Clean@123"),
            "role": "housekeeper",
            "department": "Housekeeping & Facility Care",
            "created_at": datetime.utcnow().isoformat() + "Z"
        },
        {
            "name": "Chef Ranveer Brar (Executive Chef)",
            "email": "dining@grandazure.com",
            "password_hash": hash_password("Chef@123"),
            "role": "restaurant",
            "department": "Food & Beverage",
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
    ]

    for user in staff_users:
        existing = await db.users.find_one({"email": user["email"]})
        if not existing:
            await db.users.insert_one(user)
            print(f"Created staff account: {user['email']} [{user['role']}]")

    # 2. Rooms Setup (24 rooms across 4 floors in INR ₹)
    room_configs = [
        # Floor 1: Standard Queen
        {
            "numbers": ["101", "102", "103", "104", "105", "106"],
            "floor": 1,
            "type": RoomCategory.STANDARD,
            "price": 3999.0,
            "capacity": 2,
            "bed": "1 Plush Queen Bed",
            "size": 380,
            "amenities": ["High-Speed Wi-Fi", "Smart 55' UHD TV", "Rain Shower", "Tea & Chai Kettle", "In-Room Safe", "Courtyard Garden View"],
            "images": [
                "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"
            ],
            "description": "Sophisticated comfort tailored for modern travelers. Features premium cotton linens, designer teakwood desk, and soothing courtyard garden views."
        },
        # Floor 2: Deluxe King
        {
            "numbers": ["201", "202", "203", "204", "205", "206"],
            "floor": 2,
            "type": RoomCategory.DELUXE,
            "price": 5999.0,
            "capacity": 2,
            "bed": "1 Royal King Bed",
            "size": 480,
            "amenities": ["Private Balcony", "Lake Pichola View", "Espresso Machine", "Italian Marble Bathroom with Tub", "Bose Audio", "Luxury Silk Bathrobes"],
            "images": [
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80"
            ],
            "description": "Spacious sanctuary featuring scenic lake and palace vistas, an Italian marble en-suite bathroom with deep soaking tub, and a private furnished balcony."
        },
        # Floor 3: Executive Ocean Suite
        {
            "numbers": ["301", "302", "303", "304", "305", "306"],
            "floor": 3,
            "type": RoomCategory.EXECUTIVE,
            "price": 9999.0,
            "capacity": 3,
            "bed": "1 Royal King Bed + Diwan Lounge",
            "size": 680,
            "amenities": ["Panoramic Lakefront View", "Separate Royal Living Lounge", "Cocktail Bar Cabinet", "Jacuzzi Whirlpool Tub", "Walk-in Dressing Closet", "VIP Lounge Access"],
            "images": [
                "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80"
            ],
            "description": "Lavish master suite with floor-to-ceiling panoramic glass windows facing Lake Pichola. Includes dedicated dining area and complimentary access to the Palace VIP Lounge."
        },
        # Floor 4: Presidential Penthouse
        {
            "numbers": ["401", "402", "403", "404", "405", "406"],
            "floor": 4,
            "type": RoomCategory.PRESIDENTIAL,
            "price": 24999.0,
            "capacity": 4,
            "bed": "2 Royal California King Beds",
            "size": 1200,
            "amenities": ["Private Rooftop Terrace", "Heated Royal Plunge Pool", "24/7 Dedicated Butler", "Full Chef Kitchen", "Fireplace", "Dyson Styling Suite", "Private Elevator Access"],
            "images": [
                "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80"
            ],
            "description": "The pinnacle of grand Indian royalty. Expansive penthouse featuring an outdoor terrace, private heated plunge pool, dedicated butler team, and breathtaking 360-degree Aravali sunset views."
        }
    ]

    status_cycle = [
        RoomStatus.VACANT_CLEAN,
        RoomStatus.OCCUPIED,
        RoomStatus.VACANT_CLEAN,
        RoomStatus.VACANT_DIRTY,
        RoomStatus.OCCUPIED,
        RoomStatus.RESERVED
    ]

    for config in room_configs:
        for idx, room_num in enumerate(config["numbers"]):
            existing_room = await db.rooms.find_one({"room_number": room_num})
            initial_status = status_cycle[idx % len(status_cycle)]
            if room_num == "104":
                initial_status = RoomStatus.VACANT_DIRTY
            elif room_num == "304":
                initial_status = RoomStatus.MAINTENANCE

            room_doc = {
                "room_number": room_num,
                "type": config["type"],
                "floor": config["floor"],
                "base_price_per_night": config["price"],
                "capacity": config["capacity"],
                "bed_type": config["bed"],
                "size_sqft": config["size"],
                "amenities": config["amenities"],
                "images": config["images"],
                "description": config["description"],
                "status": initial_status,
                "last_cleaned_at": (datetime.utcnow() - timedelta(hours=3)).strftime("%Y-%m-%d %H:%M UTC"),
                "assigned_housekeeper": "Sunita Verma" if initial_status == RoomStatus.VACANT_DIRTY else None,
                "notes": "AC unit serviced" if room_num == "304" else None
            }

            if not existing_room:
                await db.rooms.insert_one(room_doc)
            else:
                await db.rooms.update_one({"room_number": room_num}, {"$set": room_doc})

    print("24 Palace Rooms initialized successfully.")

    # 3. In-Room Dining & POS Menu Items (Indian & Continental in INR)
    menu_items = [
        {
            "name": "Grand Palace Breakfast Thali",
            "category": "Breakfast",
            "description": "Fluffy Puri Bhaji, fresh Idli Sambar, artisanal Poha, seasonal tropical fruit platter, and authentic Masala Chai.",
            "price": 450.00,
            "image": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80",
            "is_vegetarian": True,
            "is_available": True,
            "prep_time_minutes": 15
        },
        {
            "name": "Truffle Akuri & Toasted Malabar Paratha",
            "category": "Breakfast",
            "description": "Parsi-style spiced organic scrambled eggs with black winter truffle shavings and flaky buttered Malabar paratha.",
            "price": 380.00,
            "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
            "is_vegetarian": False,
            "is_available": True,
            "prep_time_minutes": 20
        },
        {
            "name": "Royal Rajasthani Thali (Dal Baati Churma)",
            "category": "Gourmet Mains",
            "description": "Authentic Panchmel Dal with ghee-roasted Baati, Churma, Gatte ki Sabzi, Ker Sangri, and Bajra Roti.",
            "price": 850.00,
            "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
            "is_vegetarian": True,
            "is_available": True,
            "prep_time_minutes": 25
        },
        {
            "name": "Murgh Makhani (Butter Chicken) & Garlic Naan",
            "category": "Gourmet Mains",
            "description": "Clay-oven charbroiled chicken steeped in a velvety tomato, cashew, and fenugreek gravy with hot butter garlic naan.",
            "price": 650.00,
            "image": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
            "is_vegetarian": False,
            "is_available": True,
            "prep_time_minutes": 25
        },
        {
            "name": "Paneer Tikka Lababdar & Truffle Kulcha",
            "category": "Gourmet Mains",
            "description": "Tandoori charred cottage cheese cooked in an onion-tomato reduction with grated paneer and stuffed truffle kulcha.",
            "price": 520.00,
            "image": "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=600&q=80",
            "is_vegetarian": True,
            "is_available": True,
            "prep_time_minutes": 20
        },
        {
            "name": "Dum Gosht Awadhi Biryani",
            "category": "Gourmet Mains",
            "description": "Slow-cooked fragrant long-grain basmati rice with tender spiced mutton, saffron milk, and burani raita.",
            "price": 680.00,
            "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
            "is_vegetarian": False,
            "is_available": True,
            "prep_time_minutes": 30
        },
        {
            "name": "Kesari Rasmalai & Shahi Gulab Jamun",
            "category": "Artisan Desserts",
            "description": "Delicate saffron-infused cottage cheese discs in cardamom clotted milk alongside warm stuffed gulab jamun.",
            "price": 280.00,
            "image": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
            "is_vegetarian": True,
            "is_available": True,
            "prep_time_minutes": 10
        },
        {
            "name": "Artisanal Royal Masala Chai & Pakora Basket",
            "category": "Beverages",
            "description": "Hand-pounded ginger and green cardamom brewed Assam CTC tea served with fresh onion and paneer fritters.",
            "price": 180.00,
            "image": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
            "is_vegetarian": True,
            "is_available": True,
            "prep_time_minutes": 10
        }
    ]

    for item in menu_items:
        existing_item = await db.menu_items.find_one({"name": item["name"]})
        if not existing_item:
            await db.menu_items.insert_one(item)
    print("In-Room Dining Menu seeded.")

    # 4. Realistic Active Bookings (in ₹ INR)
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    tomorrow_str = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")
    in_three_days = (datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%d")
    yesterday_str = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")

    demo_bookings = [
        {
            "booking_reference": "GAP-78214",
            "guest": {
                "first_name": "Rajesh",
                "last_name": "Sharma",
                "email": "rajesh.sharma@gmail.com",
                "phone": "+91 98765 43210",
                "id_type": "Aadhaar Card",
                "id_number": "XXXX-XXXX-4912",
                "special_requests": "Lake view high floor, airport cab pickup"
            },
            "room_number": "202",
            "room_type": RoomCategory.DELUXE,
            "check_in": today_str,
            "check_out": in_three_days,
            "nights": 3,
            "adults": 2,
            "children": 0,
            "room_rate_per_night": 5999.0,
            "room_charges": 17997.0,
            "tax_amount": 2159.64,
            "service_fee": 899.85,
            "total_amount": 21056.49,
            "amount_paid": 21056.49,
            "balance_due": 0.0,
            "booking_status": BookingStatus.CHECKED_IN,
            "payment_status": PaymentStatus.PAID,
            "folio_items": [
                {
                    "id": "fol_101",
                    "category": "room_charge",
                    "description": "Room Tariff (3 nights @ ₹5,999.00/night)",
                    "amount": 17997.0,
                    "quantity": 1,
                    "created_at": datetime.utcnow().isoformat() + "Z"
                },
                {
                    "id": "fol_102",
                    "category": "tax",
                    "description": "GST (12% - 6% CGST + 6% SGST)",
                    "amount": 2159.64,
                    "quantity": 1,
                    "created_at": datetime.utcnow().isoformat() + "Z"
                },
                {
                    "id": "fol_103",
                    "category": "service_fee",
                    "description": "Resort & Heritage Concierge Fee (5%)",
                    "amount": 899.85,
                    "quantity": 1,
                    "created_at": datetime.utcnow().isoformat() + "Z"
                }
            ],
            "payments": [
                {
                    "payment_id": "TXN-UPI-984218",
                    "amount": 21056.49,
                    "method": "upi",
                    "status": "succeeded",
                    "created_at": datetime.utcnow().isoformat() + "Z",
                    "reference_note": "Razorpay UPI Payment"
                }
            ],
            "created_at": (datetime.utcnow() - timedelta(days=2)).isoformat() + "Z",
            "checked_in_at": datetime.utcnow().isoformat() + "Z",
            "checked_out_at": None
        },
        {
            "booking_reference": "GAP-49281",
            "guest": {
                "first_name": "Aarav",
                "last_name": "Mehta",
                "email": "aarav.mehta@techstartup.in",
                "phone": "+91 98201 84920",
                "id_type": "PAN Card",
                "id_number": "ABCDE1234F",
                "special_requests": "Quiet room for video conference calls"
            },
            "room_number": "302",
            "room_type": RoomCategory.EXECUTIVE,
            "check_in": yesterday_str,
            "check_out": tomorrow_str,
            "nights": 2,
            "adults": 1,
            "children": 0,
            "room_rate_per_night": 9999.0,
            "room_charges": 19998.0,
            "tax_amount": 2399.76,
            "service_fee": 999.90,
            "total_amount": 23397.66,
            "amount_paid": 23397.66,
            "balance_due": 0.0,
            "booking_status": BookingStatus.CHECKED_IN,
            "payment_status": PaymentStatus.PAID,
            "folio_items": [
                {
                    "id": "fol_201",
                    "category": "room_charge",
                    "description": "Room Tariff (2 nights @ ₹9,999.00/night)",
                    "amount": 19998.0,
                    "quantity": 1,
                    "created_at": yesterday_str
                }
            ],
            "payments": [
                {
                    "payment_id": "TXN-RAZORPAY-89102",
                    "amount": 23397.66,
                    "method": "netbanking",
                    "status": "succeeded",
                    "created_at": yesterday_str,
                    "reference_note": "HDFC NetBanking Prepaid"
                }
            ],
            "created_at": yesterday_str,
            "checked_in_at": yesterday_str,
            "checked_out_at": None
        }
    ]

    for b in demo_bookings:
        existing_b = await db.bookings.find_one({"booking_reference": b["booking_reference"]})
        if not existing_b:
            await db.bookings.insert_one(b)

    print("Active Bookings seeded.")
    print("Database seeding completed for Grand Azure Palace & Resort.")

if __name__ == "__main__":
    asyncio.run(seed_database())
