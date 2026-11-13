from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class MCDAWeights(BaseModel):
    climate_suitability: float = 0.25
    water_suitability: float = 0.20
    soil_health: float = 0.20
    nutrient_cycling: float = 0.15
    environmental_suitability: float = 0.10
    market_suitability: float = 0.10

class RotationStep(BaseModel):
    season: str
    season_tamil: str
    months: str
    crop_name: str
    crop_tamil: str
    duration_days: int
    water_need_mm: int
    soil_impact: str
    is_nitrogen_fixing: bool
    benefits: List[str]
    risks: List[str]

class RotationStrategy(BaseModel):
    id: str
    name: str
    name_tamil: str
    strategy_type: str  # "existing", "soil_health", "water_efficient"
    overall_score: float  # 0 to 100
    mcda_breakdown: Dict[str, float]
    crop_sequence: List[RotationStep]
    estimated_annual_water_mm: int
    water_savings_pct: float
    nitrogen_added_kg_ha: float
    soil_health_delta_score: float
    economic_outlook: str
    confidence_level: str  # "High", "Medium", "Moderate"
    evidence_notes: List[str]
    identified_risks: List[str]
    disclaimer: str

class RotationAnalysisRequest(BaseModel):
    farm_id: str
    custom_weights: Optional[MCDAWeights] = None
    target_year: Optional[int] = 2026
    farmer_priorities: Optional[Dict[str, Any]] = None

class WhatIfRequest(BaseModel):
    farm_id: str
    water_deficit_pct: Optional[float] = 0.0  # e.g. -20% rainfall
    temperature_increase_c: Optional[float] = 0.0  # e.g. +1.5 C heat wave
    soil_ph_shift: Optional[float] = 0.0
    include_cash_crop_only: Optional[bool] = False
    custom_crops: Optional[List[str]] = None

class RotationComparisonResponse(BaseModel):
    id: str
    farm_id: str
    farm_name: str
    created_at: str
    weights_used: MCDAWeights
    environmental_context: Dict[str, Any]
    strategies: List[RotationStrategy]
    recommended_strategy_id: str
    comparison_matrix: List[Dict[str, Any]]
    agronomic_advisory: str
    agronomic_advisory_tamil: str

