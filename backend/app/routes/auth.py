from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
import uuid
from app.models.user import UserRegister, UserLogin, UserProfileUpdate, UserResponse, Token
from app.services.auth_service import AuthService, get_current_user
from app.database import get_collection

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
async def register(user_data: UserRegister):
    users_col = get_collection("users")
    if users_col.find_one({"email": user_data.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user_id = str(uuid.uuid4())
    hashed_pwd = AuthService.get_password_hash(user_data.password)
    user_doc = {
        "_id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "hashed_password": hashed_pwd,
        "language": user_data.language,
        "phone": user_data.phone,
        "district": user_data.district,
        "state": user_data.state,
        "priorities": {
            "soil_regeneration": 0.35,
            "water_conservation": 0.35,
            "market_profitability": 0.30,
            "risk_tolerance": "medium"
        },
        "created_at": datetime.utcnow().isoformat()
    }
    users_col.insert_one(user_doc)

    access_token = AuthService.create_access_token({"sub": user_id, "email": user_data.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": user_doc["name"],
            "email": user_doc["email"],
            "language": user_doc["language"],
            "phone": user_doc["phone"],
            "district": user_doc["district"],
            "state": user_doc["state"],
            "priorities": user_doc["priorities"],
            "created_at": user_doc["created_at"]
        }
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    users_col = get_collection("users")
    user = users_col.find_one({"email": credentials.email})
    if not user or not AuthService.verify_password(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = AuthService.create_access_token({"sub": user["_id"], "email": user["email"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["_id"],
            "name": user.get("name", "Farmer"),
            "email": user["email"],
            "language": user.get("language", "en"),
            "phone": user.get("phone"),
            "district": user.get("district"),
            "state": user.get("state"),
            "priorities": user.get("priorities", {}),
            "created_at": user.get("created_at")
        }
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["_id"],
        "name": current_user.get("name", "Farmer"),
        "email": current_user.get("email", ""),
        "language": current_user.get("language", "en"),
        "phone": current_user.get("phone"),
        "district": current_user.get("district"),
        "state": current_user.get("state"),
        "priorities": current_user.get("priorities", {}),
        "created_at": current_user.get("created_at")
    }

@router.put("/profile", response_model=UserResponse)
async def update_profile(updates: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    users_col = get_collection("users")
    set_fields = {}
    if updates.name is not None:
        set_fields["name"] = updates.name
    if updates.language is not None:
        set_fields["language"] = updates.language
    if updates.phone is not None:
        set_fields["phone"] = updates.phone
    if updates.district is not None:
        set_fields["district"] = updates.district
    if updates.state is not None:
        set_fields["state"] = updates.state
    if updates.priorities is not None:
        set_fields["priorities"] = updates.priorities.dict()

    if set_fields:
        users_col.update_one({"_id": current_user["_id"]}, {"$set": set_fields})
        current_user.update(set_fields)

    return {
        "id": current_user["_id"],
        "name": current_user.get("name", "Farmer"),
        "email": current_user.get("email", ""),
        "language": current_user.get("language", "en"),
        "phone": current_user.get("phone"),
        "district": current_user.get("district"),
        "state": current_user.get("state"),
        "priorities": current_user.get("priorities", {}),
        "created_at": current_user.get("created_at")
    }

