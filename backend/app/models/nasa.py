from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class NASADataRequest(BaseModel):
    latitude: float
    longitude: float
    start_date: Optional[str] = None  # YYYYMMDD
    end_date: Optional[str] = None    # YYYYMMDD

class EnvironmentalAlert(BaseModel):
    id: str
    severity: str  # "warning", "info", "danger", "success"
    title: str
    title_tamil: str
    message: str
    message_tamil: str
    metric: str
    value: float
    unit: str
    recommendation: str

class NASASummaryResponse(BaseModel):
    latitude: float
    longitude: float
    elevation_meters: float
    slope_pct: float
    period_start: str
    period_end: str
    source_metadata: Dict[str, Any]
    current_metrics: Dict[str, Any]
    daily_history: List[Dict[str, Any]]
    monthly_climatology: List[Dict[str, Any]]
    alerts: List[EnvironmentalAlert]
    anomaly_analysis: Dict[str, Any]
    dry_spell_analysis: Dict[str, Any]

