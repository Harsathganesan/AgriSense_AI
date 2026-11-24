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
    country = user_data.country or "India"
    state = user_data.state or "Tamil Nadu"
    district = user_data.district or "Thanjavur"
    reg_loc = user_data.registered_location or {
        "country": country,
        "state": state,
        "district": district
    }

    user_doc = {
        "_id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "hashed_password": hashed_pwd,
        "language": user_data.language,
        "phone": user_data.phone,
        "country": country,
        "state": state,
        "district": district,
        "registered_location": reg_loc,
        "current_gps_location": None,
        "priorities": {
            "soil_regeneration": 0.35,
            "water_conservation": 0.35,
            "market_profitability": 0.30,
            "risk_tolerance": "medium"
        },
        # pyrefly: ignore[deprecated]
        "created_at": datetime.utcnow().isoformat()
    }
    users_col.insert_one(user_doc)

    # Coordinates lookup dictionary for Tamil Nadu & regional districts
    dist_coords = {
        "thanjavur": (10.7870, 79.1378),
        "tiruvarur": (10.7719, 79.6358),
        "nagapattinam": (10.7656, 79.8424),
        "mayiladuthurai": (11.1075, 79.6523),
        "tiruchirappalli": (10.7905, 78.7047),
        "pudukkottai": (10.3833, 78.8001),
        "madurai": (9.9252, 78.1198),
        "dindigul": (10.3673, 77.9803),
        "theni": (10.0104, 77.4768),
        "ramanathapuram": (9.3639, 78.8395),
        "sivaganga": (9.8433, 78.4809),
        "virudhunagar": (9.5872, 77.9514),
        "tirunelveli": (8.7139, 77.7567),
        "tenkasi": (8.9594, 77.3150),
        "thoothukudi": (8.7642, 78.1348),
        "kanyakumari": (8.0883, 77.5385),
        "salem": (11.6643, 78.1460),
        "namakkal": (11.2189, 78.1674),
        "dharmapuri": (12.1211, 78.1582),
        "krishnagiri": (12.5186, 78.2137),
        "erode": (11.3410, 77.7172),
        "tiruppur": (11.1085, 77.3411),
        "coimbatore": (11.0168, 76.9558),
        "nilgiris": (11.4102, 76.6950),
        "cuddalore": (11.7480, 79.7714),
        "villupuram": (11.9401, 79.4861),
        "kallakurichi": (11.7384, 78.9639),
        "vellore": (12.9165, 79.1325),
        "ranipet": (12.9224, 79.3327),
        "tirupathur": (12.4925, 78.5678),
        "tiruvannamalai": (12.2253, 79.0747),
        "kanchipuram": (12.8342, 79.7036),
        "chengalpattu": (12.6841, 79.9836),
        "tiruvallur": (13.1432, 79.9083),
        "chennai": (13.0827, 80.2707),
        "ariyalur": (11.1401, 79.0786),
        "perambalur": (11.2342, 78.8820),
        "karur": (10.9601, 78.0766),
    }
    coords = dist_coords.get(district.lower().strip(), (10.7870, 79.1378))

    # Auto-provision user's default farm matching their registered district
    farms_col = get_collection("farms")
    # pyrefly: ignore[deprecated]
    now_iso = datetime.utcnow().isoformat()
    farm_doc = {
        "_id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": f"{user_data.name}'s Farm",
        "district": district,
        "state": state,
        "latitude": coords[0],
        "longitude": coords[1],
        "area_acres": 2.0,
        "soil_type": "Alluvial Soil",
        "irrigation_type": "Canal & Borewell",
        "current_crops": [],
        "previous_crops": [],
        "boundary_geojson": None,
        "is_active": True,
        "created_at": now_iso,
        "updated_at": now_iso
    }
    farms_col.insert_one(farm_doc)

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
            "country": user_doc["country"],
            "state": user_doc["state"],
            "district": user_doc["district"],
            "registered_location": user_doc["registered_location"],
            "current_gps_location": user_doc.get("current_gps_location"),
            "priorities": user_doc["priorities"],
            "created_at": user_doc["created_at"]
        }
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    users_col = get_collection("users")
    clean_email = credentials.email.strip().lower()
    # Try exact match, then lowercase match
    user = users_col.find_one({"email": clean_email})
    if not user:
        user = users_col.find_one({"email": credentials.email.strip()})

    if not user or not AuthService.verify_password(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = AuthService.create_access_token({"sub": str(user["_id"]), "email": user["email"]})
    country = user.get("country", "India")
    state = user.get("state", "Tamil Nadu")
    district = user.get("district", "Thanjavur")
    reg_loc = user.get("registered_location") or {
        "country": country,
        "state": state,
        "district": district
    }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name", "Farmer"),
            "email": user["email"],
            "language": user.get("language", "en"),
            "phone": user.get("phone"),
            "country": country,
            "state": state,
            "district": district,
            "registered_location": reg_loc,
            "current_gps_location": user.get("current_gps_location"),
            "priorities": user.get("priorities", {}),
            "created_at": str(user.get("created_at")) if user.get("created_at") else None
        }
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    country = current_user.get("country", "India")
    state = current_user.get("state", "Tamil Nadu")
    district = current_user.get("district", "Thanjavur")
    reg_loc = current_user.get("registered_location") or {
        "country": country,
        "state": state,
        "district": district
    }

    return {
        "id": str(current_user["_id"]),
        "name": current_user.get("name", "Farmer"),
        "email": current_user.get("email", ""),
        "language": current_user.get("language", "en"),
        "phone": current_user.get("phone"),
        "country": country,
        "state": state,
        "district": district,
        "registered_location": reg_loc,
        "current_gps_location": current_user.get("current_gps_location"),
        "priorities": current_user.get("priorities", {}),
        "created_at": str(current_user.get("created_at")) if current_user.get("created_at") else None
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
    if updates.country is not None:
        set_fields["country"] = updates.country
    if updates.state is not None:
        set_fields["state"] = updates.state
    if updates.district is not None:
        set_fields["district"] = updates.district
    if updates.registered_location is not None:
        # pyrefly: ignore[unsupported-operation]
        set_fields["registered_location"] = updates.registered_location
    elif updates.country is not None or updates.state is not None or updates.district is not None:
        c = updates.country or current_user.get("country", "India")
        s = updates.state or current_user.get("state", "Tamil Nadu")
        d = updates.district or current_user.get("district", "Thanjavur")
        # pyrefly: ignore[unsupported-operation]
        set_fields["registered_location"] = {"country": c, "state": s, "district": d}
    if updates.current_gps_location is not None:
        # pyrefly: ignore[unsupported-operation]
        set_fields["current_gps_location"] = updates.current_gps_location
    if updates.priorities is not None:
        # pyrefly: ignore[deprecated, unsupported-operation]
        set_fields["priorities"] = updates.priorities.dict()

    if set_fields:
        users_col.update_one({"_id": current_user["_id"]}, {"$set": set_fields})
        current_user.update(set_fields)

    country = current_user.get("country", "India")
    state = current_user.get("state", "Tamil Nadu")
    district = current_user.get("district", "Thanjavur")
    reg_loc = current_user.get("registered_location") or {
        "country": country,
        "state": state,
        "district": district
    }

    return {
        "id": current_user["_id"],
        "name": current_user.get("name", "Farmer"),
        "email": current_user.get("email", ""),
        "language": current_user.get("language", "en"),
        "phone": current_user.get("phone"),
        "country": country,
        "state": state,
        "district": district,
        "registered_location": reg_loc,
        "current_gps_location": current_user.get("current_gps_location"),
        "priorities": current_user.get("priorities", {}),
        "created_at": current_user.get("created_at")
    }

