from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class FarmBase(BaseModel):
    name: str = Field(..., min_length=2)
    district: str = "Thanjavur"
    state: str = "Tamil Nadu"
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    area_acres: float = Field(..., gt=0)
    soil_type: str = "Alluvial Soil"  # Alluvial, Black Soil, Red Soil, Sandy Loam, Clay Loam
    irrigation_type: str = "Canal & Borewell"  # Canal, Borewell, Drip, Rainfed, Sprinkler
    current_crops: List[str] = Field(default_factory=list)
    previous_crops: List[str] = Field(default_factory=list)
    boundary_geojson: Optional[Dict[str, Any]] = None
    is_active: bool = True

class FarmCreate(FarmBase):
    pass

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area_acres: Optional[float] = None
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None
    current_crops: Optional[List[str]] = None
    previous_crops: Optional[List[str]] = None
    boundary_geojson: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class FarmResponse(FarmBase):
    id: str
    user_id: str
    created_at: str
    updated_at: str

