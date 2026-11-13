from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
import uuid
from typing import List
from app.models.farm import FarmCreate, FarmUpdate, FarmResponse
from app.services.auth_service import get_current_user
from app.database import get_collection

router = APIRouter(prefix="/farms", tags=["Farms"])

def _ensure_default_demo_farm(user_id: str):
    farms_col = get_collection("farms")
    existing = farms_col.find_one({"user_id": user_id})
    if not existing:
        demo_farm = {
            "_id": "farm_thanjavur_demo",
            "user_id": user_id,
            "name": "Cauvery Delta Green Valley Farm",
            "district": "Thanjavur",
            "state": "Tamil Nadu",
            "latitude": 10.7870,
            "longitude": 79.1378,
            "area_acres": 4.5,
            "soil_type": "Alluvial Soil",
            "irrigation_type": "Canal & Borewell",
            "current_crops": ["Rice / Paddy"],
            "previous_crops": ["Black Gram / Urad Dal", "Sesame / Gingelly"],
            "is_active": True,
            "boundary_geojson": {
                "type": "Polygon",
                "coordinates": [[
                    [79.1365, 10.7860],
                    [79.1390, 10.7862],
                    [79.1388, 10.7880],
                    [79.1362, 10.7878],
                    [79.1365, 10.7860]
                ]]
            },
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        farms_col.insert_one(demo_farm)

@router.get("", response_model=List[FarmResponse])
async def list_farms(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    _ensure_default_demo_farm(user_id)
    farms_col = get_collection("farms")
    cursor = farms_col.find({"user_id": user_id})
    farms = []
    for f in cursor:
        farms.append({
            "id": f["_id"],
            "user_id": f["user_id"],
            "name": f["name"],
            "district": f.get("district", "Thanjavur"),
            "state": f.get("state", "Tamil Nadu"),
            "latitude": float(f["latitude"]),
            "longitude": float(f["longitude"]),
            "area_acres": float(f["area_acres"]),
            "soil_type": f.get("soil_type", "Alluvial Soil"),
            "irrigation_type": f.get("irrigation_type", "Canal & Borewell"),
            "current_crops": f.get("current_crops", []),
            "previous_crops": f.get("previous_crops", []),
            "boundary_geojson": f.get("boundary_geojson"),
            "is_active": f.get("is_active", True),
            "created_at": f.get("created_at", ""),
            "updated_at": f.get("updated_at", "")
        })
    return farms

@router.post("", response_model=FarmResponse)
async def create_farm(farm_data: FarmCreate, current_user: dict = Depends(get_current_user)):
    farms_col = get_collection("farms")
    farm_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    doc = {
        "_id": farm_id,
        "user_id": current_user["_id"],
        "name": farm_data.name,
        "district": farm_data.district,
        "state": farm_data.state,
        "latitude": farm_data.latitude,
        "longitude": farm_data.longitude,
        "area_acres": farm_data.area_acres,
        "soil_type": farm_data.soil_type,
        "irrigation_type": farm_data.irrigation_type,
        "current_crops": farm_data.current_crops,
        "previous_crops": farm_data.previous_crops,
        "boundary_geojson": farm_data.boundary_geojson,
        "is_active": farm_data.is_active,
        "created_at": now,
        "updated_at": now
    }
    farms_col.insert_one(doc)
    return {
        "id": farm_id,
        "user_id": current_user["_id"],
        **farm_data.dict(),
        "created_at": now,
        "updated_at": now
    }

@router.get("/{farm_id}", response_model=FarmResponse)
async def get_farm(farm_id: str, current_user: dict = Depends(get_current_user)):
    farms_col = get_collection("farms")
    farm = farms_col.find_one({"_id": farm_id})
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return {
        "id": farm["_id"],
        "user_id": farm["user_id"],
        "name": farm["name"],
        "district": farm.get("district", "Thanjavur"),
        "state": farm.get("state", "Tamil Nadu"),
        "latitude": float(farm["latitude"]),
        "longitude": float(farm["longitude"]),
        "area_acres": float(farm["area_acres"]),
        "soil_type": farm.get("soil_type", "Alluvial Soil"),
        "irrigation_type": farm.get("irrigation_type", "Canal & Borewell"),
        "current_crops": farm.get("current_crops", []),
        "previous_crops": farm.get("previous_crops", []),
        "boundary_geojson": farm.get("boundary_geojson"),
        "is_active": farm.get("is_active", True),
        "created_at": farm.get("created_at", ""),
        "updated_at": farm.get("updated_at", "")
    }

@router.put("/{farm_id}", response_model=FarmResponse)
async def update_farm(farm_id: str, updates: FarmUpdate, current_user: dict = Depends(get_current_user)):
    farms_col = get_collection("farms")
    farm = farms_col.find_one({"_id": farm_id, "user_id": current_user["_id"]})
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    upd_dict = {k: v for k, v in updates.dict().items() if v is not None}
    upd_dict["updated_at"] = datetime.utcnow().isoformat()
    farms_col.update_one({"_id": farm_id}, {"$set": upd_dict})
    farm.update(upd_dict)

    return {
        "id": farm["_id"],
        "user_id": farm["user_id"],
        "name": farm["name"],
        "district": farm.get("district", "Thanjavur"),
        "state": farm.get("state", "Tamil Nadu"),
        "latitude": float(farm["latitude"]),
        "longitude": float(farm["longitude"]),
        "area_acres": float(farm["area_acres"]),
        "soil_type": farm.get("soil_type", "Alluvial Soil"),
        "irrigation_type": farm.get("irrigation_type", "Canal & Borewell"),
        "current_crops": farm.get("current_crops", []),
        "previous_crops": farm.get("previous_crops", []),
        "boundary_geojson": farm.get("boundary_geojson"),
        "is_active": farm.get("is_active", True),
        "created_at": farm.get("created_at", ""),
        "updated_at": farm.get("updated_at", "")
    }

@router.delete("/{farm_id}")
async def delete_farm(farm_id: str, current_user: dict = Depends(get_current_user)):
    farms_col = get_collection("farms")
    res = farms_col.delete_one({"_id": farm_id, "user_id": current_user["_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Farm not found or unauthorized")
    return {"status": "success", "message": "Farm removed"}

