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
    Returns an empty array [] if no farms exist for the user.
    """
    user_id = str(current_user.get("_id", ""))
    farms_col = get_collection("farms")
    cursor = farms_col.find({"user_id": user_id})
    farms = [_serialize_farm(doc) for doc in cursor]
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
