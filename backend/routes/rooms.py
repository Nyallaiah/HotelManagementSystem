from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status, Query
from backend.models.schemas import RoomCreate, RoomUpdate, RoomResponse, RoomStatus, RoomCategory
from backend.services.auth_service import get_current_user, require_roles
from backend.database import get_database, serialize_mongo

router = APIRouter(prefix="/rooms", tags=["Rooms & Housekeeping PMS"])

@router.get("", response_model=List[RoomResponse])
async def list_rooms(
    status: Optional[str] = None,
    floor: Optional[int] = None,
    type: Optional[str] = None,
    max_price: Optional[float] = None
):
    """Retrieve list of rooms with optional filters."""
    db = get_database()
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    if floor is not None:
        query["floor"] = floor
    if type:
        query["type"] = type
    if max_price:
        query["base_price_per_night"] = {"$lte": max_price}
        
    cursor = db.rooms.find(query).sort("room_number", 1)
    rooms = await cursor.to_list(length=200)
    return serialize_mongo(rooms)

@router.get("/categories")
async def get_room_categories():
    """Summary of unique room types, base pricing, capacities, and hero images."""
    db = get_database()
    cursor = db.rooms.find()
    rooms = await cursor.to_list(length=200)
    
    categories: Dict[str, Dict[str, Any]] = {}
    for r in rooms:
        cat_name = r.get("type", RoomCategory.DELUXE)
        if cat_name not in categories:
            categories[cat_name] = {
                "name": cat_name,
                "base_price": r.get("base_price_per_night", 199.0),
                "capacity": r.get("capacity", 2),
                "bed_type": r.get("bed_type", "1 King Bed"),
                "size_sqft": r.get("size_sqft", 450),
                "amenities": r.get("amenities", []),
                "images": r.get("images", []),
                "description": r.get("description", ""),
                "total_units": 0,
                "available_units": 0
            }
        categories[cat_name]["total_units"] += 1
        if r.get("status") in [RoomStatus.VACANT_CLEAN]:
            categories[cat_name]["available_units"] += 1

    return list(categories.values())

@router.get("/matrix/floor-grid")
async def get_floor_grid():
    """Visual matrix representation grouped by floor for Front Desk and Housekeeping."""
    db = get_database()
    cursor = db.rooms.find().sort("room_number", 1)
    rooms = await cursor.to_list(length=200)
    
    floors: Dict[int, List[Dict[str, Any]]] = {}
    for r in serialize_mongo(rooms):
        floor = r.get("floor", 1)
        if floor not in floors:
            floors[floor] = []
        floors[floor].append(r)
        
    formatted = []
    for flr_num in sorted(floors.keys()):
        formatted.append({
            "floor": flr_num,
            "floor_label": f"Floor {flr_num}",
            "rooms": floors[flr_num]
        })
    return formatted

@router.get("/{room_number}", response_model=RoomResponse)
async def get_room(room_number: str):
    db = get_database()
    room = await db.rooms.find_one({"room_number": room_number})
    if not room:
        raise HTTPException(status_code=404, detail=f"Room {room_number} not found")
    return serialize_mongo(room)

@router.post("", response_model=RoomResponse)
async def create_room(room_data: RoomCreate, current_user: dict = Depends(require_roles(["admin"]))):
    db = get_database()
    existing = await db.rooms.find_one({"room_number": room_data.room_number})
    if existing:
        raise HTTPException(status_code=400, detail=f"Room {room_data.room_number} already exists")
    
    doc = room_data.dict()
    res = await db.rooms.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return serialize_mongo(doc)

@router.put("/{room_number}", response_model=RoomResponse)
async def update_room(
    room_number: str,
    room_data: RoomUpdate,
    current_user: dict = Depends(require_roles(["admin", "receptionist"]))
):
    db = get_database()
    updates = {k: v for k, v in room_data.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided to update")
    
    res = await db.rooms.update_one({"room_number": room_number}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Room {room_number} not found")
    
    room = await db.rooms.find_one({"room_number": room_number})
    return serialize_mongo(room)

@router.patch("/{room_number}/status")
async def update_room_status(
    room_number: str,
    status: str = Query(..., description="Target status: vacant_clean, vacant_dirty, occupied, reserved, maintenance"),
    notes: Optional[str] = None,
    current_user: dict = Depends(require_roles(["admin", "receptionist", "housekeeper"]))
):
    """Rapid housekeeping and receptionist status toggle."""
    valid_statuses = [
        RoomStatus.VACANT_CLEAN,
        RoomStatus.VACANT_DIRTY,
        RoomStatus.OCCUPIED,
        RoomStatus.RESERVED,
        RoomStatus.MAINTENANCE
    ]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {valid_statuses}")
    
    db = get_database()
    update_data: Dict[str, Any] = {"status": status}
    if status == RoomStatus.VACANT_CLEAN:
        update_data["last_cleaned_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        update_data["assigned_housekeeper"] = current_user.get("name")
    if notes is not None:
        update_data["notes"] = notes

    res = await db.rooms.update_one({"room_number": room_number}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Room {room_number} not found")
        
    return {
        "success": True,
        "room_number": room_number,
        "status": status,
        "updated_by": current_user.get("name"),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
