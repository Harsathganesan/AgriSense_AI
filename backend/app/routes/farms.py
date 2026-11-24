from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
import uuid
from typing import List, Dict, Any, Optional
from app.models.farm import FarmCreate, FarmUpdate, FarmResponse
from app.services.auth_service import get_current_user
from app.database import get_collection

router = APIRouter(prefix="/farms", tags=["Farms"])

def _serialize_farm(f: Dict[str, Any]) -> Dict[str, Any]:
    """Safely format and serialize MongoDB farm document into valid FarmResponse schema."""
    raw_id = f.get("_id") or f.get("id") or str(uuid.uuid4())
    farm_id = str(raw_id)

    created = f.get("created_at")
    if isinstance(created, datetime):
        created_str = created.isoformat()
    elif created:
        created_str = str(created)
    else:
        # pyrefly: ignore[deprecated]
        created_str = datetime.utcnow().isoformat()

    updated = f.get("updated_at")
    if isinstance(updated, datetime):
        updated_str = updated.isoformat()
    elif updated:
        updated_str = str(updated)
    else:
        updated_str = created_str

    try:
        lat = float(f.get("latitude", 0.0))
    except (TypeError, ValueError):
        lat = 0.0

    try:
        lon = float(f.get("longitude", 0.0))
    except (TypeError, ValueError):
        lon = 0.0

    try:
        area = float(f.get("area_acres", 1.0))
    except (TypeError, ValueError):
        area = 1.0

    return {
        "id": farm_id,
        "user_id": str(f.get("user_id", "")),
        "name": str(f.get("name", "Farm")),
        "district": str(f.get("district", "Thanjavur")),
        "state": str(f.get("state", "Tamil Nadu")),
        "latitude": lat,
        "longitude": lon,
        "area_acres": area,
        "soil_type": str(f.get("soil_type", "Alluvial Soil")),
        "irrigation_type": str(f.get("irrigation_type", "Canal & Borewell")),
        "current_crops": list(f.get("current_crops") or []),
        "previous_crops": list(f.get("previous_crops") or []),
        "boundary_geojson": f.get("boundary_geojson") if isinstance(f.get("boundary_geojson"), dict) else None,
        "is_active": bool(f.get("is_active", True)),
        "created_at": created_str,
        "updated_at": updated_str
    }

@router.get("", response_model=List[FarmResponse])
async def list_farms(current_user: dict = Depends(get_current_user)):
    """
    List all farms belonging strictly to the authenticated user.
    If no farm exists for this user, automatically create a default farm
    matching their registered district and location.
    """
    user_id = str(current_user.get("_id", ""))
    farms_col = get_collection("farms")
    cursor = farms_col.find({"user_id": user_id})
    farms = [_serialize_farm(doc) for doc in cursor]
    if not farms:
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
        district = current_user.get("district") or current_user.get("registered_location", {}).get("district") or "Thanjavur"
        state = current_user.get("state") or current_user.get("registered_location", {}).get("state") or "Tamil Nadu"
        coords = dist_coords.get(district.lower().strip(), (10.7870, 79.1378))
        now_iso = datetime.utcnow().isoformat()
        farm_doc = {
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": f"{current_user.get('name', 'Farmer')}'s Farm",
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
        farms = [_serialize_farm(farm_doc)]
    return farms

@router.post("", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
async def create_farm(farm_data: FarmCreate, current_user: dict = Depends(get_current_user)):
    """Create a new farm for the authenticated user."""
    farms_col = get_collection("farms")
    farm_id = str(uuid.uuid4())
    # pyrefly: ignore[deprecated]
    now = datetime.utcnow().isoformat()
    doc = {
        "_id": farm_id,
        "user_id": str(current_user["_id"]),
        "name": farm_data.name,
        "district": farm_data.district,
        "state": farm_data.state,
        "latitude": float(farm_data.latitude),
        "longitude": float(farm_data.longitude),
        "area_acres": float(farm_data.area_acres),
        "soil_type": farm_data.soil_type,
        "irrigation_type": farm_data.irrigation_type,
        "current_crops": list(farm_data.current_crops or []),
        "previous_crops": list(farm_data.previous_crops or []),
        "boundary_geojson": farm_data.boundary_geojson,
        "is_active": farm_data.is_active,
        "created_at": now,
        "updated_at": now
    }
    farms_col.insert_one(doc)
    return _serialize_farm(doc)

@router.get("/{farm_id}", response_model=FarmResponse)
async def get_farm(farm_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve details of a specific farm owned by the user."""
    farms_col = get_collection("farms")
    user_id = str(current_user["_id"])
    farm = farms_col.find_one({"_id": farm_id, "user_id": user_id})
    if not farm:
        # Also check string comparison if user_id stored as ObjectId or int
        farm = farms_col.find_one({"_id": farm_id})
        if not farm or str(farm.get("user_id")) != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    return _serialize_farm(farm)

@router.put("/{farm_id}", response_model=FarmResponse)
async def update_farm(farm_id: str, updates: FarmUpdate, current_user: dict = Depends(get_current_user)):
    """Update an existing farm owned by the user."""
    farms_col = get_collection("farms")
    user_id = str(current_user["_id"])
    farm = farms_col.find_one({"_id": farm_id, "user_id": user_id})
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")

    upd_dict = {k: v for k, v in updates.model_dump(exclude_unset=True).items() if v is not None}
    # pyrefly: ignore[deprecated]
    upd_dict["updated_at"] = datetime.utcnow().isoformat()
    farms_col.update_one({"_id": farm_id}, {"$set": upd_dict})
    farm.update(upd_dict)
    return _serialize_farm(farm)

@router.delete("/{farm_id}")
async def delete_farm(farm_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a farm record owned by the user."""
    farms_col = get_collection("farms")
    user_id = str(current_user["_id"])
    res = farms_col.delete_one({"_id": farm_id, "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found or unauthorized")
    return {"status": "success", "message": "Farm removed successfully"}
