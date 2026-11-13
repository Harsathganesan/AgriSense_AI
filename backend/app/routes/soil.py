from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
import uuid
from typing import List, Optional
from app.models.soil import SoilRecordCreate, SoilRecordResponse
from app.services.soil_service import SoilService
from app.services.auth_service import get_current_user
from app.database import get_collection

router = APIRouter(prefix="/soil", tags=["Soil Health"])

def _default_soil_record(farm_id: str, user_id: str):
    eval_res = SoilService.evaluate_soil_health(
        ph=6.8,
        nitrogen_kg_ha=245.0,
        phosphorus_kg_ha=16.5,
        potassium_kg_ha=210.0,
        organic_carbon_pct=0.58,
        soil_moisture_pct=24.5
    )
    return {
        "_id": f"soil_init_{farm_id}",
        "farm_id": farm_id,
        "user_id": user_id,
        "test_date": "2026-02-15",
        "ph": 6.8,
        "nitrogen_kg_ha": 245.0,
        "phosphorus_kg_ha": 16.5,
        "potassium_kg_ha": 210.0,
        "organic_carbon_pct": 0.58,
        "soil_moisture_pct": 24.5,
        "electrical_conductivity": 0.42,
        "soil_type": "Alluvial Soil",
        "lab_name": "TNAU District Soil Testing Center, Thanjavur",
        "notes": "Baseline seasonal soil sample taken post-monsoon.",
        "created_at": datetime.utcnow().isoformat(),
        "health_score": eval_res["composite_health_score"],
        "status_summary": eval_res
    }

@router.get("/records", response_model=List[SoilRecordResponse])
async def list_soil_records(
    farm_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    soil_col = get_collection("soil_records")
    records = list(soil_col.find({"farm_id": farm_id}))
    if not records:
        # Create default record for quick testability
        default_rec = _default_soil_record(farm_id, current_user["_id"])
        soil_col.insert_one(default_rec)
        records = [default_rec]

    results = []
    for r in records:
        results.append({
            "id": r["_id"],
            "farm_id": r["farm_id"],
            "user_id": r.get("user_id", current_user["_id"]),
            "test_date": r["test_date"],
            "ph": float(r["ph"]),
            "nitrogen_kg_ha": float(r["nitrogen_kg_ha"]),
            "phosphorus_kg_ha": float(r["phosphorus_kg_ha"]),
            "potassium_kg_ha": float(r["potassium_kg_ha"]),
            "organic_carbon_pct": float(r["organic_carbon_pct"]),
            "soil_moisture_pct": float(r.get("soil_moisture_pct", 24.0)),
            "electrical_conductivity": float(r.get("electrical_conductivity", 0.45)),
            "soil_type": r.get("soil_type", "Alluvial Soil"),
            "lab_name": r.get("lab_name"),
            "notes": r.get("notes"),
            "created_at": r.get("created_at", ""),
            "health_score": float(r.get("health_score", 75.0)),
            "status_summary": r.get("status_summary", {})
        })
    return results

@router.get("/latest", response_model=SoilRecordResponse)
async def get_latest_soil_record(
    farm_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    soil_col = get_collection("soil_records")
    rec = soil_col.find_one({"farm_id": farm_id})
    if not rec:
        rec = _default_soil_record(farm_id, current_user["_id"])
        soil_col.insert_one(rec)
    return {
        "id": rec["_id"],
        "farm_id": rec["farm_id"],
        "user_id": rec.get("user_id", current_user["_id"]),
        "test_date": rec["test_date"],
        "ph": float(rec["ph"]),
        "nitrogen_kg_ha": float(rec["nitrogen_kg_ha"]),
        "phosphorus_kg_ha": float(rec["phosphorus_kg_ha"]),
        "potassium_kg_ha": float(rec["potassium_kg_ha"]),
        "organic_carbon_pct": float(rec["organic_carbon_pct"]),
        "soil_moisture_pct": float(rec.get("soil_moisture_pct", 24.0)),
        "electrical_conductivity": float(rec.get("electrical_conductivity", 0.45)),
        "soil_type": rec.get("soil_type", "Alluvial Soil"),
        "lab_name": rec.get("lab_name"),
        "notes": rec.get("notes"),
        "created_at": rec.get("created_at", ""),
        "health_score": float(rec.get("health_score", 75.0)),
        "status_summary": rec.get("status_summary", {})
    }

@router.post("/records", response_model=SoilRecordResponse)
async def create_soil_record(
    record_data: SoilRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    soil_col = get_collection("soil_records")
    eval_res = SoilService.evaluate_soil_health(
        ph=record_data.ph,
        nitrogen_kg_ha=record_data.nitrogen_kg_ha,
        phosphorus_kg_ha=record_data.phosphorus_kg_ha,
        potassium_kg_ha=record_data.potassium_kg_ha,
        organic_carbon_pct=record_data.organic_carbon_pct,
        soil_moisture_pct=record_data.soil_moisture_pct or 24.0,
        electrical_conductivity=record_data.electrical_conductivity or 0.45
    )

    rec_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    doc = {
        "_id": rec_id,
        "farm_id": record_data.farm_id,
        "user_id": current_user["_id"],
        "test_date": record_data.test_date,
        "ph": record_data.ph,
        "nitrogen_kg_ha": record_data.nitrogen_kg_ha,
        "phosphorus_kg_ha": record_data.phosphorus_kg_ha,
        "potassium_kg_ha": record_data.potassium_kg_ha,
        "organic_carbon_pct": record_data.organic_carbon_pct,
        "soil_moisture_pct": record_data.soil_moisture_pct or 24.0,
        "electrical_conductivity": record_data.electrical_conductivity or 0.45,
        "soil_type": record_data.soil_type,
        "lab_name": record_data.lab_name,
        "notes": record_data.notes,
        "created_at": now,
        "health_score": eval_res["composite_health_score"],
        "status_summary": eval_res
    }
    soil_col.insert_one(doc)

    return {
        "id": rec_id,
        "user_id": current_user["_id"],
        **record_data.dict(),
        "created_at": now,
        "health_score": eval_res["composite_health_score"],
        "status_summary": eval_res
    }

@router.post("/analyze")
async def analyze_soil_parameters(params: dict):
    """
    Direct calculator endpoint for testing arbitrary soil parameters without saving.
    """
    ph = float(params.get("ph", 7.0))
    n = float(params.get("nitrogen_kg_ha", 250.0))
    p = float(params.get("phosphorus_kg_ha", 16.0))
    k = float(params.get("potassium_kg_ha", 200.0))
    oc = float(params.get("organic_carbon_pct", 0.60))
    moisture = float(params.get("soil_moisture_pct", 24.0))

    return SoilService.evaluate_soil_health(
        ph=ph,
        nitrogen_kg_ha=n,
        phosphorus_kg_ha=p,
        potassium_kg_ha=k,
        organic_carbon_pct=oc,
        soil_moisture_pct=moisture
    )
