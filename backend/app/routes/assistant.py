from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.services.gemini_service import gemini_assistant
from app.services.auth_service import get_current_user
from app.services.nasa_service import NASAService
from app.services.soil_service import SoilService
from app.services.rotation_engine import RotationEngine
from app.database import get_collection

router = APIRouter(prefix="/assistant", tags=["AI Farm Assistant"])

class AssistantMessage(BaseModel):
    message: str
    farm_id: Optional[str] = None
    language: Optional[str] = "en"  # "en" or "ta"

@router.post("/chat")
async def chat_with_assistant(
    chat_req: AssistantMessage,
    current_user: dict = Depends(get_current_user)
):
    farms_col = get_collection("farms")
    soil_col = get_collection("soil_records")
    rotation_col = get_collection("rotation_analyses")

    farm_context = None
    soil_context = None
    nasa_context = None
    rotation_context = None

    # Load context if farm_id provided, or user's active farm
    farm_id = chat_req.farm_id
    if not farm_id:
        user_farm = farms_col.find_one({"user_id": current_user["_id"]})
        if user_farm:
            farm_id = user_farm["_id"]

    if farm_id:
        farm_context = farms_col.find_one({"_id": farm_id})
        if farm_context:
            lat = float(farm_context.get("latitude", 10.7870))
            lon = float(farm_context.get("longitude", 79.1378))
            
            # NASA data context
            power = await NASAService.fetch_power_daily(lat, lon)
            sat = NASAService.get_satellite_layer_metrics(lat, lon)
            smap = sat.get("smap_soil_moisture", {})
            modis = sat.get("modis_vegetation", {})
            srtm = sat.get("srtm_elevation", {})
            climate = NASAService.analyze_climate_anomalies_and_alerts(power.get("daily_records", []), smap, lat)

            nasa_context = {
                "current_metrics": {
                    "avg_temp_c": climate.get("avg_temperature_c"),
                    "precipitation_30d_mm": climate.get("total_precipitation_30d_mm"),
                    "smap_moisture_pct": smap.get("volumetric_moisture_pct"),
                    "ndvi": modis.get("ndvi_current"),
                    "elevation_m": srtm.get("elevation_meters")
                }
            }

            # Soil context
            soil_rec = soil_col.find_one({"farm_id": farm_id})
            if soil_rec and "status_summary" in soil_rec:
                soil_context = soil_rec["status_summary"]
            else:
                soil_context = SoilService.evaluate_soil_health(
                    ph=6.8, nitrogen_kg_ha=240.0, phosphorus_kg_ha=16.0,
                    potassium_kg_ha=200.0, organic_carbon_pct=0.58
                )

            # Rotation context
            rot_rec = rotation_col.find_one({"farm_id": farm_id})
            if rot_rec and "strategies" in rot_rec:
                rotation_context = rot_rec
            else:
                strats = RotationEngine.generate_three_strategies(farm_context, soil_context, climate)
                rotation_context = {"strategies": [s.dict() for s in strats]}

    lang = chat_req.language or current_user.get("language", "en")
    
    response = await gemini_assistant.generate_response(
        user_message=chat_req.message,
        farm_context=farm_context,
        soil_context=soil_context,
        nasa_context=nasa_context,
        rotation_context=rotation_context,
        language=lang
    )

    return response

@router.get("/prompts")
async def get_suggested_prompts(language: str = "en"):
    if language == "ta":
        return [
            {"id": "p1", "text": "என் பண்ணைக்கு சிறந்த பயிர் சுழற்சி முறையை விளக்குங்கள்."},
            {"id": "p2", "text": "மண்ணின் கரிமச்சத்து (Organic Carbon) குறைவதை எப்படி தடுப்பது?"},
            {"id": "p3", "text": "நாசா செயற்கைக்கோள் மழைப்பொழிவு தரவு என் பண்ணைக்கு என்ன சொல்கிறது?"},
            {"id": "p4", "text": "குறைந்த தண்ணீரில் அதிக லாபம் தரும் மாற்றுப் பயிர் என்ன?"},
            {"id": "p5", "text": "உளுந்து விதைப்புக்கு முன் மண் ஈரப்பதம் எவ்வளவு இருக்க வேண்டும்?"}
        ]
    return [
        {"id": "p1", "text": "Explain why the soil-health rotation was recommended for my farm."},
        {"id": "p2", "text": "How does the NASA SMAP soil moisture reading affect my sowing schedule?"},
        {"id": "p3", "text": "What are the benefits of black gram relay cropping after paddy?"},
        {"id": "p4", "text": "How can I improve my soil organic carbon from 0.58% to over 0.75%?"},
        {"id": "p5", "text": "Compare the water savings of millets versus conventional double-crop rice."}
    ]
