from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class CropBase(BaseModel):
    name: str
    tamil_name: str
    botanical_name: Optional[str] = None
    category: str  # Cereal, Pulse, Oilseed, Millet, Commercial, Cash Crop
    growing_seasons: List[str]  # Kuruvai (Jun-Sep), Samba (Aug-Jan), Thaladi (Sep-Feb), Navarai/Summer (Dec-May)
    duration_days_min: int
    duration_days_max: int
    duration_days_avg: int
    water_req_mm: int  # mm of water needed over growing season
    drought_tolerance: str  # High, Moderate, Low
    suitable_soils: List[str]
    temp_min_c: float
    temp_max_c: float
    ph_min: float
    ph_max: float
    is_nitrogen_fixing: bool
    nitrogen_fixation_kg_ha: float = 0.0
    nutrient_benefits: str
    soil_health_impact: str  # Restorative, Depletive, Neutral
    market_demand: str  # Very High, High, Moderate, Emerging
    avg_yield_kg_acre: str
    pests_diseases_susceptibility: List[str] = Field(default_factory=list)
    break_crop_compatibility: List[str] = Field(default_factory=list)  # Crops it follows well
    image_url: Optional[str] = None
    description: Optional[str] = None
    description_tamil: Optional[str] = None

class CropCreate(CropBase):
    pass

class CropResponse(CropBase):
    id: str

