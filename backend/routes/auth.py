from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from backend.models.schemas import UserLogin, UserCreate, UserResponse, TokenResponse, UserRole, ClerkSyncRequest, SupabaseSyncRequest
from backend.services.auth_service import hash_password, verify_password, create_access_token, get_current_user, require_roles
from backend.database import get_database

router = APIRouter(prefix="/auth", tags=["Authentication & Staff"])

@router.post("/supabase-sync", response_model=TokenResponse)
async def sync_supabase_user(payload: SupabaseSyncRequest):
    """
    Syncs an authenticated Supabase user session (Google OAuth / Indian Phone SMS OTP / Email)
    with the hotel's database and issues a role-assigned JWT.
    """
    db = get_database()
    email_clean = payload.email.lower().strip() if payload.email else None
    phone_clean = payload.phone_number.strip() if payload.phone_number else None

    if not email_clean and not phone_clean and not payload.supabase_id:
        raise HTTPException(status_code=400, detail="At least one identifier (email, phone, or supabase ID) is required.")

    # Build lookup
    lookup_or = [{"supabase_id": payload.supabase_id}]
    if email_clean:
        lookup_or.append({"email": email_clean})
    if phone_clean:
        lookup_or.append({"phone_number": phone_clean})

    user = await db.users.find_one({"$or": lookup_or})

    if not user:
        if payload.first_name or payload.last_name:
            name = f"{payload.first_name} {payload.last_name}".strip()
        elif email_clean:
            name = email_clean.split("@")[0].capitalize()
        elif phone_clean:
            name = f"Guest {phone_clean[-4:]}"
        else:
            name = "Valued Guest"

        new_role = UserRole.GUEST
        department = "Hotel Guest"

        # Check for admin / staff overrides
        if email_clean:
            if "admin" in email_clean:
                new_role = UserRole.ADMIN
                department = "Executive Management"
            elif "reception" in email_clean or "desk" in email_clean:
                new_role = UserRole.RECEPTIONIST
                department = "Front Desk"
            elif "housekeeping" in email_clean or "clean" in email_clean:
                new_role = UserRole.HOUSEKEEPER
                department = "Housekeeping"
            elif "chef" in email_clean or "dining" in email_clean or "kitchen" in email_clean:
                new_role = UserRole.RESTAURANT
                department = "Food & Beverage"

        user = {
            "name": name,
            "email": email_clean,
            "phone_number": phone_clean,
            "supabase_id": payload.supabase_id,
            "image_url": payload.image_url,
            "auth_strategy": payload.auth_strategy or ("google" if email_clean else "phone_number"),
            "role": new_role,
            "department": department,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        res = await db.users.insert_one(user)
        user["_id"] = res.inserted_id
    else:
        update_fields = {"supabase_id": payload.supabase_id}
        if payload.image_url:
            update_fields["image_url"] = payload.image_url
        if email_clean and not user.get("email"):
            update_fields["email"] = email_clean
        if phone_clean and not user.get("phone_number"):
            update_fields["phone_number"] = phone_clean
        if payload.first_name or payload.last_name:
            update_fields["name"] = f"{payload.first_name} {payload.last_name}".strip()

        await db.users.update_one({"_id": user["_id"]}, {"$set": update_fields})
        user.update(update_fields)

    sub_identifier = user.get("email") or user.get("phone_number") or user.get("supabase_id")
    token = create_access_token(data={"sub": sub_identifier, "role": user.get("role", UserRole.GUEST)})
    user_resp = UserResponse(
        id=str(user.get("_id", "")),
        name=user["name"],
        email=user.get("email"),
        phone_number=user.get("phone_number"),
        role=user.get("role", UserRole.GUEST),
        department=user.get("department", "Hotel Guest"),
        created_at=user.get("created_at")
    )
    return TokenResponse(access_token=token, user=user_resp)

@router.post("/clerk-sync", response_model=TokenResponse)
async def sync_clerk_user(payload: ClerkSyncRequest):
    """
    Syncs an authenticated Clerk user session with the hotel's MongoDB database.
    Supports both Google OAuth (email) and Phone Number (SMS OTP) authentication.
    Dynamically resolves their role from MongoDB data (admin, receptionist, housekeeper, restaurant, guest).
    Issues a corresponding system JWT with their assigned role.
    """
    db = get_database()
    email_clean = payload.email.lower().strip() if payload.email else None
    phone_clean = payload.phone_number.strip() if payload.phone_number else None

    if not email_clean and not phone_clean and not payload.clerk_id:
        raise HTTPException(status_code=400, detail="At least one identifier (email, phone, or clerk ID) is required.")

    # Build query to check if user already exists
    lookup_or = [{"clerk_id": payload.clerk_id}]
    if email_clean:
        lookup_or.append({"email": email_clean})
    if phone_clean:
        lookup_or.append({"phone_number": phone_clean})

    user = await db.users.find_one({"$or": lookup_or})

    if not user:
        if payload.first_name or payload.last_name:
            name = f"{payload.first_name} {payload.last_name}".strip()
        elif email_clean:
            name = email_clean.split("@")[0].capitalize()
        elif phone_clean:
            name = f"Guest {phone_clean[-4:]}"
        else:
            name = "Valued Guest"

        new_role = UserRole.GUEST
        department = "Hotel Guest"

        # Check for admin / staff overrides
        if email_clean:
            if "admin" in email_clean:
                new_role = UserRole.ADMIN
                department = "Executive Management"
            elif "reception" in email_clean or "desk" in email_clean:
                new_role = UserRole.RECEPTIONIST
                department = "Front Desk"
            elif "housekeeping" in email_clean or "clean" in email_clean:
                new_role = UserRole.HOUSEKEEPER
                department = "Housekeeping"
            elif "chef" in email_clean or "dining" in email_clean or "kitchen" in email_clean:
                new_role = UserRole.RESTAURANT
                department = "Food & Beverage"

        user = {
            "name": name,
            "email": email_clean,
            "phone_number": phone_clean,
            "clerk_id": payload.clerk_id,
            "image_url": payload.image_url,
            "auth_strategy": payload.auth_strategy or ("google" if email_clean else "phone_number"),
            "role": new_role,
            "department": department,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        res = await db.users.insert_one(user)
        user["_id"] = res.inserted_id
    else:
        update_fields = {"clerk_id": payload.clerk_id}
        if payload.image_url:
            update_fields["image_url"] = payload.image_url
        if email_clean and not user.get("email"):
            update_fields["email"] = email_clean
        if phone_clean and not user.get("phone_number"):
            update_fields["phone_number"] = phone_clean
        if payload.first_name or payload.last_name:
            update_fields["name"] = f"{payload.first_name} {payload.last_name}".strip()

        await db.users.update_one({"_id": user["_id"]}, {"$set": update_fields})
        user.update(update_fields)

    sub_identifier = user.get("email") or user.get("phone_number") or user.get("clerk_id")
    token = create_access_token(data={"sub": sub_identifier, "role": user.get("role", UserRole.GUEST)})
    user_resp = UserResponse(
        id=str(user.get("_id", "")),
        name=user["name"],
        email=user.get("email"),
        phone_number=user.get("phone_number"),
        role=user.get("role", UserRole.GUEST),
        department=user.get("department", "Hotel Guest"),
        created_at=user.get("created_at")
    )
    return TokenResponse(access_token=token, user=user_resp)

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    db = get_database()
    lookup = {}
    if credentials.email:
        lookup = {"email": credentials.email.lower().strip()}
    elif credentials.phone_number:
        lookup = {"phone_number": credentials.phone_number.strip()}
    else:
        raise HTTPException(status_code=400, detail="Email or phone number is required.")

    user = await db.users.find_one(lookup)
    if not user or not verify_password(credentials.password or "", user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials. Please verify your login details.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    sub_val = user.get("email") or user.get("phone_number") or str(user.get("_id"))
    token = create_access_token(data={"sub": sub_val, "role": user.get("role", "guest")})
    user_resp = UserResponse(
        id=str(user.get("_id", "")),
        name=user["name"],
        email=user.get("email"),
        phone_number=user.get("phone_number"),
        role=user.get("role", UserRole.RECEPTIONIST),
        department=user.get("department", "Front Desk"),
        created_at=user.get("created_at")
    )
    return TokenResponse(access_token=token, user=user_resp)

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.get("_id", "")),
        name=current_user["name"],
        email=current_user.get("email"),
        phone_number=current_user.get("phone_number"),
        role=current_user.get("role", UserRole.RECEPTIONIST),
        department=current_user.get("department", "Front Desk"),
        created_at=current_user.get("created_at")
    )

@router.post("/register", response_model=UserResponse)
async def register_staff(user_data: UserCreate, current_user: dict = Depends(require_roles(["admin"]))):
    db = get_database()
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    new_user = {
        "name": user_data.name,
        "email": user_data.email.lower(),
        "password_hash": hash_password(user_data.password),
        "role": user_data.role,
        "department": user_data.department,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    result = await db.users.insert_one(new_user)
    return UserResponse(
        id=str(result.inserted_id),
        name=new_user["name"],
        email=new_user["email"],
        role=new_user["role"],
        department=new_user["department"],
        created_at=new_user["created_at"]
    )

@router.get("/staff", response_model=List[UserResponse])
async def list_staff(current_user: dict = Depends(require_roles(["admin"]))):
    db = get_database()
    cursor = db.users.find()
    staff_list = await cursor.to_list(length=100)
    return [
        UserResponse(
            id=str(u.get("_id", "")),
            name=u["name"],
            email=u["email"],
            role=u.get("role", UserRole.RECEPTIONIST),
            department=u.get("department", ""),
            created_at=u.get("created_at")
        ) for u in staff_list
    ]
