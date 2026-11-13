from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timedelta
import uuid
from typing import List, Optional
from app.services.auth_service import get_current_user
from app.database import get_collection

router = APIRouter(prefix="/history", tags=["History & Audit Log"])

def _seed_initial_history(user_id: str, farm_id: str):
    history_col = get_collection("analysis_history")
    count = history_col.count_documents({"user_id": user_id})
    if count == 0:
        base_time = datetime.utcnow()
        sample_records = [
            {
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "farm_id": farm_id,
                "farm_name": "Cauvery Delta Green Valley Farm",
                "analysis_type": "Crop Rotation MCDA",
                "analysis_id": "rot_init_1",
                "created_at": (base_time - timedelta(days=2)).isoformat(),
                "summary": "Generated 3 strategies. Recommended: Soil-Health-Focused (Green Manure - Rice - Black Gram) with 88.5/100 score."
            },
            {
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "farm_id": farm_id,
                "farm_name": "Cauvery Delta Green Valley Farm",
                "analysis_type": "Soil Health Diagnostic",
                "analysis_id": "soil_init_1",
                "created_at": (base_time - timedelta(days=5)).isoformat(),
                "summary": "Soil Health Score: 78.0/100 (Good). Deficiency noted in Available Nitrogen (245 kg/ha). Recommended pulse relay."
            },
            {
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "farm_id": farm_id,
                "farm_name": "Cauvery Delta Green Valley Farm",
                "analysis_type": "NASA Earth Observation Sync",
                "analysis_id": "nasa_init_1",
                "created_at": (base_time - timedelta(days=7)).isoformat(),
                "summary": "Synchronized NASA POWER and SMAP observations. Detected mild dry window suitable for land preparation."
            }
        ]
        history_col.insert_many(sample_records)

@router.get("")
async def get_history(
    farm_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    history_col = get_collection("analysis_history")
    farms_col = get_collection("farms")
    
    user_id = current_user["_id"]
    default_farm = farms_col.find_one({"user_id": user_id})
    f_id = farm_id or (default_farm["_id"] if default_farm else "farm_thanjavur_demo")
    
    _seed_initial_history(user_id, f_id)

    query = {"user_id": user_id}
    if farm_id:
        query["farm_id"] = farm_id

    cursor = history_col.find(query).sort("created_at", -1)
    items = list(cursor)
    # Ensure ID formatting
    for it in items:
        it["id"] = it.get("_id")
    return items

@router.delete("/{history_id}")
async def delete_history_item(
    history_id: str,
    current_user: dict = Depends(get_current_user)
):
    history_col = get_collection("analysis_history")
    res = history_col.delete_one({"_id": history_id, "user_id": current_user["_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"status": "success", "message": "History entry deleted"}

