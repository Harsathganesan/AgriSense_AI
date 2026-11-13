from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class SoilRecordCreate(BaseModel):
    farm_id: str
    test_date: str
    ph: float = Field(..., ge=3.0, le=11.0)
    nitrogen_kg_ha: float = Field(..., ge=0.0)
    phosphorus_kg_ha: float = Field(..., ge=0.0)
    potassium_kg_ha: float = Field(..., ge=0.0)
    organic_carbon_pct: float = Field(..., ge=0.0, le=10.0)
    soil_moisture_pct: Optional[float] = Field(None, ge=0.0, le=100.0)
    electrical_conductivity: Optional[float] = Field(None, ge=0.0)
    soil_type: Optional[str] = "Alluvial Soil"
    lab_name: Optional[str] = "District Soil Testing Laboratory"
    notes: Optional[str] = None

class SoilRecordResponse(SoilRecordCreate):
    id: str
    user_id: str
    created_at: str
    health_score: float
    status_summary: Dict[str, Any]
