from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.services.gemini_service import gemini_assistant
from app.services.auth_service import get_current_user_optional
from app.services.district_service import DistrictService
from app.services.nasa_service import NASAService
from app.database import get_collection

router = APIRouter(prefix="/assistant", tags=["AI Farm Assistant"])

class AssistantMessage(BaseModel):
    message: str
    farm_id: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = "Tamil Nadu"
    country: Optional[str] = "India"
    language: Optional[str] = "en"  # "en" or "ta"
    history: Optional[List[Dict[str, Any]]] = None

@router.post("/chat")
async def chat_with_assistant(
    chat_req: AssistantMessage,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    farms_col = get_collection("farms")

    # Determine target district
    target_district = chat_req.district
    if not target_district and chat_req.farm_id:
        # Check if farm_id is actually a district name
        if not chat_req.farm_id.isalnum() or len(chat_req.farm_id) < 20:
            target_district = chat_req.farm_id
    if not target_district and current_user:
        target_district = (
            current_user.get("registered_location", {}).get("district")
            or current_user.get("district")
        )
    if not target_district:
        target_district = "Pudukkottai"

    # Load agro profile and TNAU baseline for this district
    agro = DistrictService.get_district_agro_profile(target_district)
    lab = agro.get("baseline_lab_soil", {})

    farm_context = {
        "name": f"{target_district} Agricultural Land",
        "district": target_district,
        "state": chat_req.state or "Tamil Nadu",
        "area_acres": 5.0,
        "soil_type": agro.get("primary_soil", "Red Sandy Loam"),
        "soil_type_tamil": agro.get("primary_soil_tamil", "செம்மண் மற்றும் சரளை மண்"),
        "soil_texture": agro.get("soil_texture", "Coarse to medium sandy loam"),
        "irrigation_type": agro.get("irrigation_type", "Tanks, Open Wells & Borewells"),
        "current_crops": agro.get("cropping_pattern", "Groundnut-Millets-Pulses"),
        "zone_name": agro.get("zone_name"),
        "zone_name_tamil": agro.get("zone_name_tamil"),
        "annual_rainfall_normal_mm": agro.get("annual_rainfall_normal_mm", 820.0)
    }

    # If user has a registered custom farm document in DB, enrich with that
    if chat_req.farm_id and chat_req.farm_id != target_district:
        try:
            custom_farm = farms_col.find_one({"_id": chat_req.farm_id})
            if custom_farm:
                farm_context.update({
                    "name": custom_farm.get("name", farm_context["name"]),
                    "area_acres": custom_farm.get("area_acres", 5.0),
                    "latitude": custom_farm.get("latitude"),
                    "longitude": custom_farm.get("longitude")
                })
        except Exception:
            pass

    soil_context = {
        "composite_health_score": 79.2,
        "parameters": {
            "ph": {"value": lab.get("ph", 6.4)},
            "nitrogen": {"value": lab.get("nitrogen_kg_ha", 185.0)},
            "phosphorus": {"value": lab.get("phosphorus_kg_ha", 12.0)},
            "potassium": {"value": lab.get("potassium_kg_ha", 175.0)},
            "organic_carbon": {"value": lab.get("organic_carbon_pct", 0.38)},
            "electrical_conductivity": {"value": lab.get("electrical_conductivity", 0.28)}
        },
        "lab_name": lab.get("lab_name", f"TNAU Certified Soil Testing Center, {target_district}")
    }

    nasa_context = {
        "current_metrics": {
            "avg_temp_c": 27.5,
            "precipitation_30d_mm": 58.0,
            "normal_annual_rainfall_mm": agro.get("annual_rainfall_normal_mm", 820.0),
            "smap_moisture_pct": 24.2,
            "ndvi": 0.54,
            "elevation_m": 115.0
        }
    }

    # Fast local rotation strategies based on district agro profile
    cropping = agro.get("cropping_pattern", "Groundnut-Millets-Pulses")
    rotation_context = {
        "strategies": [
            {"name": f"Traditional {cropping}", "overall_score": 68},
            {"name": f"Regenerative Soil-Health Pulse Sequence", "overall_score": 93},
            {"name": f"Drought-Resilient Water-Efficient Rotation", "overall_score": 89}
        ]
    }

    lang = chat_req.language or "en"
    if current_user and not chat_req.language:
        lang = current_user.get("language", "en")

    response = await gemini_assistant.generate_response(
        user_message=chat_req.message,
        farm_context=farm_context,
        soil_context=soil_context,
        nasa_context=nasa_context,
        rotation_context=rotation_context,
        language=lang,
        history=chat_req.history
    )

    return response

@router.get("/prompts")
async def get_suggested_prompts(
    language: str = "en",
    district: Optional[str] = "Pudukkottai"
):
    dist = district or "Pudukkottai"
    if language == "ta":
        return [
            {"id": "p1", "text": "என் நிலத்தின் மண் வளத்தை எப்படி மேம்படுத்துவது?"},
            {"id": "p2", "text": f"{dist} மாவட்டத்திற்கு ஏற்ற சிறந்த பயிர் எது?"},
            {"id": "p3", "text": "பயிர் சுழற்சி முறை எவ்வாறு செயல்படுகிறது?"},
            {"id": "p4", "text": "பயிர் நோய்களை எவ்வாறு கண்டறிவது?"},
            {"id": "p5", "text": "என் பயிருக்கு எவ்வளவு தண்ணீர் தேவைப்படும்?"}
        ]
    return [
        {"id": "p1", "text": "How can I improve my soil health?"},
        {"id": "p2", "text": f"Which crop is suitable for {dist} district?"},
        {"id": "p3", "text": "How does crop rotation work?"},
        {"id": "p4", "text": "How can I identify plant diseases?"},
        {"id": "p5", "text": "How much water does my crop need?"}
    ]
