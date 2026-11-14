from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
from pydantic import BaseModel, Field
from app.services.district_service import DistrictService
from app.services.auth_service import get_current_user, get_current_user_optional
from app.database import get_collection

router = APIRouter(prefix="/district", tags=["District-Wise NASA Agricultural Intelligence"])

class DistrictSoilRecordCreate(BaseModel):
    district: str
    state: str = "Tamil Nadu"
    country: str = "India"
    test_date: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    ph: float = Field(..., ge=3.0, le=11.0)
    nitrogen_kg_ha: float = Field(..., ge=10.0, le=1000.0)
    phosphorus_kg_ha: float = Field(..., ge=1.0, le=200.0)
    potassium_kg_ha: float = Field(..., ge=10.0, le=1000.0)
    organic_carbon_pct: float = Field(..., ge=0.01, le=5.0)
    electrical_conductivity: Optional[float] = 0.45
    soil_type: Optional[str] = None
    lab_name: Optional[str] = "District Soil Testing Laboratory"
    notes: Optional[str] = None

class WhatIfDistrictRequest(BaseModel):
    district: str
    state: str = "Tamil Nadu"
    country: str = "India"
    water_deficit_pct: float = Field(0.0, ge=0.0, le=100.0)
    temperature_increase_c: float = Field(0.0, ge=-5.0, le=10.0)
    ph_shift: float = Field(0.0, ge=-2.0, le=2.0)

def _resolve_district(district: Optional[str], current_user: Optional[dict]) -> tuple[str, str, str]:
    if district and district.strip():
        return district.strip(), "Tamil Nadu", "India"
    if current_user:
        reg_loc = current_user.get("registered_location") or {}
        d = reg_loc.get("district") or current_user.get("district") or "Thanjavur"
        s = reg_loc.get("state") or current_user.get("state") or "Tamil Nadu"
        c = reg_loc.get("country") or current_user.get("country") or "India"
        return d, s, c
    return "Thanjavur", "Tamil Nadu", "India"

@router.get("/profile")
async def get_district_profile(
    district: Optional[str] = Query(None),
    state: str = Query("Tamil Nadu"),
    country: str = Query("India"),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Returns the real GeoJSON boundary polygon, centroid, bounding box, recommended zoom,
    and agro-ecological zone details for the requested or authenticated district.
    """
    dist, st, ct = _resolve_district(district, current_user)
    if state and state != "Tamil Nadu":
        st = state
    if country and country != "India":
        ct = country
    return await DistrictService.get_district_profile_and_boundary(dist, st, ct)

@router.get("/environment")
async def get_district_environment(
    district: Optional[str] = Query(None),
    state: str = Query("Tamil Nadu"),
    country: str = Query("India"),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Retrieves full NASA Earth observation telemetry calibrated for the selected district:
    - NASA POWER (Temperature, Solar Radiation, Relative Humidity, Daily Trends)
    - NASA GPM IMERG (Precipitation accumulation & intensity)
    - NASA SMAP (Soil moisture % at surface 0-5cm and root-zone 0-100cm)
    - NASA MODIS (NDVI vegetation index & vigor)
    - NASA SRTM (Elevation, slope, and terrain classification)
    - Climatological normals and operational farmer risk alerts
    """
    dist, st, ct = _resolve_district(district, current_user)
    if state and state != "Tamil Nadu":
        st = state
    if country and country != "India":
        ct = country
    return await DistrictService.get_district_environmental_telemetry(dist, st, ct)

@router.get("/soil-health")
async def get_district_soil_health(
    district: Optional[str] = Query(None),
    state: str = Query("Tamil Nadu"),
    country: str = Query("India"),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Returns dual-layer soil intelligence for the selected district:
    1. Satellite Environmental Indicators (SMAP root-zone moisture, soil temp, rainfall erosion risk, plant available water)
    2. Laboratory Certified Soil Chemistry (pH, N, P, K, Organic Carbon, Electrical Conductivity)
    Clearly demarcating satellite physical estimates from laboratory chemical assays.
    """
    dist, st, ct = _resolve_district(district, current_user)
    if state and state != "Tamil Nadu":
        st = state
    if country and country != "India":
        ct = country
    user_id = current_user.get("_id") if current_user else None
    return await DistrictService.get_district_soil_health(dist, st, ct, user_id=user_id)

@router.post("/soil-health/record")
async def save_district_soil_record(
    record: DistrictSoilRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Saves a farmer's laboratory soil test card for the specified district.
    Updates the district's soil health profile in real time.
    """
    soil_col = get_collection("soil_records")
    rec_id = f"soil_{uuid.uuid4().hex[:10]}"
    doc = {
        "_id": rec_id,
        "user_id": current_user["_id"],
        "district": record.district,
        "state": record.state,
        "country": record.country,
        "test_date": record.test_date,
        "ph": record.ph,
        "nitrogen_kg_ha": record.nitrogen_kg_ha,
        "phosphorus_kg_ha": record.phosphorus_kg_ha,
        "potassium_kg_ha": record.potassium_kg_ha,
        "organic_carbon_pct": record.organic_carbon_pct,
        "electrical_conductivity": record.electrical_conductivity or 0.45,
        "soil_type": record.soil_type or "District Soil",
        "lab_name": record.lab_name,
        "notes": record.notes or "",
        "created_at": datetime.utcnow().isoformat()
    }
    soil_col.insert_one(doc)

    return {
        "message": "District soil test record recorded successfully",
        "record_id": rec_id,
        "record": doc
    }

@router.get("/crops")
async def get_district_crops(
    district: Optional[str] = Query(None),
    state: str = Query("Tamil Nadu"),
    country: str = Query("India"),
    category: Optional[str] = Query("All"),
    search: Optional[str] = Query(None),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Ranks and scores all crops against the selected district's climate and soil parameters.
    Yields district-specific suitability scores, growing conditions, rainfall requirements, and planting advice.
    """
    dist, st, ct = _resolve_district(district, current_user)
    if state and state != "Tamil Nadu":
        st = state
    if country and country != "India":
        ct = country
    return await DistrictService.get_district_crop_suitability(
        district=dist, 
        state=st, 
        country=ct, 
        category=category, 
        search=search
    )

@router.get("/rotation")
async def get_district_rotation(
    district: Optional[str] = Query(None),
    state: str = Query("Tamil Nadu"),
    country: str = Query("India"),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Generates 3 crop rotation strategies tailored to the selected district's rainfall and soil type:
    1. Existing Traditional Rotation of that district
    2. Soil-Health-Focused Sequence (Green manure & pulse relay)
    3. Water-Efficient & Resilient Sequence (Millet, oilseed, and drought-hardy pulses)
    Includes side-by-side comparison matrix, water savings %, and soil carbon benefits.
    """
    dist, st, ct = _resolve_district(district, current_user)
    if state and state != "Tamil Nadu":
        st = state
    if country and country != "India":
        ct = country
    return await DistrictService.get_district_rotation_recommendations(dist, st, ct)

@router.post("/rotation/what-if")
async def run_district_what_if(
    request: WhatIfDistrictRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Runs climate stress simulations (e.g. -20% rainfall deficit or +2°C heatwave)
    specifically for the selected district.
    """
    return await DistrictService.run_district_what_if_simulation(
        district=request.district,
        state=request.state,
        country=request.country,
        water_deficit_pct=request.water_deficit_pct,
        temp_increase_c=request.temperature_increase_c,
        ph_shift=request.ph_shift
    )

