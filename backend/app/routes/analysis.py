from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, Any, Optional
from app.services.location_analysis_service import LocationAnalysisService
from app.services.location_service import LocationService
from app.services.auth_service import get_current_user_optional

router = APIRouter(prefix="/analysis", tags=["Location-Based Agricultural Analysis"])

@router.get("/location-based")
async def get_location_based_analysis(
    latitude: Optional[float] = Query(None, ge=-90.0, le=90.0),
    longitude: Optional[float] = Query(None, ge=-180.0, le=180.0),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Performs comprehensive location-based agricultural analysis using real NASA POWER and GPM telemetry:
    - Temperature trends & heat stress
    - Historical vs recent rainfall comparison & drought risk
    - Heavy rainfall risk & water availability
    - Crop suitability for the detected GPS location
    - Bilingual farmer-friendly insights (English & Tamil)
    """
    user_id = current_user.get("_id") if current_user else None

    # If coordinates not passed in query, try to get farmer's saved location
    if latitude is None or longitude is None:
        if user_id:
            loc = LocationService.get_farmer_location(user_id)
            if loc:
                latitude = float(loc["latitude"])
                longitude = float(loc["longitude"])

    # Fallback to default Pudukkottai coordinates if still not set
    if latitude is None or longitude is None:
        latitude = 10.3833
        longitude = 78.8000

    return await LocationAnalysisService.analyze_location(latitude, longitude, user_id=user_id)

