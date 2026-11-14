from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class LocationSaveRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    accuracy_meters: Optional[float] = None
    village: Optional[str] = None
    taluk: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = "Tamil Nadu"
    country: Optional[str] = "India"
    postcode: Optional[str] = None
    display_name: Optional[str] = None
    source: str = "gps_browser"  # "gps_browser" or "manual"
    farm_id: Optional[str] = None

class LocationResponse(BaseModel):
    id: str
    user_id: str
    latitude: float
    longitude: float
    accuracy_meters: Optional[float] = None
    village: Optional[str] = None
    taluk: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    postcode: Optional[str] = None
    display_name: Optional[str] = None
    source: str
    updated_at: str

class ReverseGeocodeResponse(BaseModel):
    latitude: float
    longitude: float
    village: Optional[str] = None
    taluk: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    postcode: Optional[str] = None
    display_name: Optional[str] = None

