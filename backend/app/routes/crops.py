from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.models.crop import CropResponse
from app.services.rotation_engine import RotationEngine

router = APIRouter(prefix="/crops", tags=["Crop Database"])

@router.get("", response_model=List[CropResponse])
async def list_crops(
    search: Optional[str] = None,
    category: Optional[str] = None,
    season: Optional[str] = None,
    soil: Optional[str] = None,
    nitrogen_fixing_only: Optional[bool] = False,
    max_water_mm: Optional[int] = None
):
    crops = RotationEngine.load_crops()
    filtered = []
    for c in crops:
        if search:
            q = search.lower()
            name_match = (
                q in c["name"].lower() or 
                q in c["tamil_name"].lower() or 
                q in c.get("botanical_name", "").lower()
            )
            if not name_match:
                continue

        if category and category.lower() != "all":
            if c.get("category", "").lower() != category.lower():
                continue

        if season and season.lower() != "all":
            seasons = [s.lower() for s in c.get("growing_seasons", [])]
            if not any(season.lower() in s for s in seasons):
                continue

        if soil and soil.lower() != "all":
            soils = [s.lower() for s in c.get("suitable_soils", [])]
            if not any(soil.lower() in s for s in soils):
                continue

        if nitrogen_fixing_only and not c.get("is_nitrogen_fixing", False):
            continue

        if max_water_mm and c.get("water_req_mm", 0) > max_water_mm:
            continue

        filtered.append(c)

    return filtered

@router.get("/tamil-nadu/featured", response_model=List[CropResponse])
async def get_tamil_nadu_featured_crops():
    crops = RotationEngine.load_crops()
    # Prioritize Tamil Nadu staples
    featured_ids = [
        "crop_rice", "crop_black_gram", "crop_green_gram", 
        "crop_groundnut", "crop_sesame", "crop_maize", 
        "crop_pearl_millet", "crop_finger_millet", "crop_sunn_hemp"
    ]
    return [c for c in crops if c["id"] in featured_ids]

@router.get("/{crop_id}", response_model=CropResponse)
async def get_crop(crop_id: str):
    crops = RotationEngine.load_crops()
    for c in crops:
        if c["id"] == crop_id or c["name"].lower().replace(" ", "-") == crop_id.lower():
            return c
    raise HTTPException(status_code=404, detail="Crop not found in database")

