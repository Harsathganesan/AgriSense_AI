from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, Any, Optional
from datetime import datetime
from app.models.location import LocationSaveRequest, LocationResponse, ReverseGeocodeResponse
from app.services.location_service import LocationService
from app.services.district_geojson_service import DistrictGeoJSONService
from app.services.auth_service import get_current_user
from app.database import get_collection

router = APIRouter(prefix="/location", tags=["Farmer Location"])

@router.get("/district-boundary")
async def get_district_boundary(
    district: str = Query(..., min_length=2),
    state: str = Query("Tamil Nadu"),
    country: str = Query("India")
):
    """
    Returns real GeoJSON boundary polygon, bounding box, recommended center & zoom for the district.
    """
    return await DistrictGeoJSONService.get_district_boundary(district, state, country)

@router.post("/gps")
async def record_gps_location(
    data: LocationSaveRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Records the farmer's current GPS location separately from their registered location.
    Does NOT overwrite the registered district.
    """
    user_id = current_user["_id"]
    users_col = get_collection("users")

    # Reverse geocode if missing administrative fields
    village = data.village
    taluk = data.taluk
    district = data.district
    state = data.state or "Tamil Nadu"
    country = data.country or "India"

    if not village or not district:
        geocoded = await LocationService.reverse_geocode(data.latitude, data.longitude)
        village = village or geocoded.get("village")
        taluk = taluk or geocoded.get("taluk")
        district = district or geocoded.get("district")
        state = state or geocoded.get("state")

    gps_doc = {
        "latitude": round(float(data.latitude), 6),
        "longitude": round(float(data.longitude), 6),
        "accuracy_meters": round(float(data.accuracy_meters), 1) if data.accuracy_meters is not None else 12.0,
        "village": village,
        "taluk": taluk,
        "district": district,
        "state": state,
        "country": country,
        "postcode": data.postcode or "",
        "display_name": data.display_name or f"{village}, {taluk}, {district}",
        "source": "gps_browser",
        "updated_at": datetime.utcnow().isoformat()
    }

    users_col.update_one(
        {"_id": user_id},
        {"$set": {"current_gps_location": gps_doc}}
    )

    # Also log to farmer_locations collection for telemetry history
    loc_col = get_collection("farmer_locations")
    gps_doc_copy = dict(gps_doc)
    gps_doc_copy["user_id"] = user_id
    loc_col.update_one({"user_id": user_id}, {"$set": gps_doc_copy}, upsert=True)

    return {
        "message": "GPS location recorded successfully",
        "current_gps_location": gps_doc,
        "registered_location": current_user.get("registered_location") or {
            "country": current_user.get("country", "India"),
            "state": current_user.get("state", "Tamil Nadu"),
            "district": current_user.get("district", "Thanjavur")
        }
    }

@router.get("/status")
async def get_location_status(
    current_user: dict = Depends(get_current_user)
):
    """
    Returns both the user's registered location (Country, State, District)
    and their detected current GPS location separately.
    """
    country = current_user.get("country", "India")
    state = current_user.get("state", "Tamil Nadu")
    district = current_user.get("district", "Thanjavur")
    registered_loc = current_user.get("registered_location") or {
        "country": country,
        "state": state,
        "district": district
    }

    gps_loc = current_user.get("current_gps_location")
    if not gps_loc:
        # Check farmer_locations collection
        loc_col = get_collection("farmer_locations")
        found = loc_col.find_one({"user_id": current_user["_id"]})
        if found:
            gps_loc = {
                "latitude": float(found.get("latitude", 10.7870)),
                "longitude": float(found.get("longitude", 79.1378)),
                "accuracy_meters": float(found.get("accuracy_meters", 15.0)),
                "village": found.get("village", "Farm Area"),
                "taluk": found.get("taluk", "Agricultural Block"),
                "district": found.get("district", district),
                "state": found.get("state", state),
                "country": found.get("country", country),
                "display_name": found.get("display_name", ""),
                "source": found.get("source", "gps_browser"),
                "updated_at": found.get("updated_at", datetime.utcnow().isoformat())
            }

    return {
        "registered_location": registered_loc,
        "current_gps_location": gps_loc
    }

@router.post("/save")
async def save_location(
    data: LocationSaveRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Saves the farmer's GPS coordinates, accuracy, and geocoded location details.
    """
    user_id = current_user["_id"]
    saved = await LocationService.save_farmer_location(user_id, data)
    return saved

@router.get("/current")
async def get_current_location(
    current_user: dict = Depends(get_current_user)
):
    """
    Returns the latest recorded GPS location and administrative metadata for the authenticated farmer.
    """
    user_id = current_user["_id"]
    loc = LocationService.get_farmer_location(user_id)
    if not loc:
        raise HTTPException(status_code=404, detail="No location recorded for farmer yet.")
    return loc

@router.get("/reverse-geocode")
async def reverse_geocode_coordinates(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0)
):
    """
    Reverse geocodes latitude/longitude into Village, Taluk, District, State, and Country.
    """
    return await LocationService.reverse_geocode(latitude, longitude)
