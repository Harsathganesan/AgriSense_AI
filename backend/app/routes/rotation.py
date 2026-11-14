from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
import uuid
from typing import Optional, Dict, Any
from app.models.rotation import (
    RotationAnalysisRequest, RotationComparisonResponse, WhatIfRequest, MCDAWeights
)
from app.services.rotation_engine import RotationEngine
from app.services.nasa_service import NASAService
from app.services.soil_service import SoilService
from app.services.auth_service import get_current_user
from app.database import get_collection

router = APIRouter(prefix="/rotation", tags=["Crop Rotation Intelligence"])

@router.post("/generate", response_model=RotationComparisonResponse)
async def generate_crop_rotation(
    request: RotationAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    farms_col = get_collection("farms")
    soil_col = get_collection("soil_records")
    rotation_col = get_collection("rotation_analyses")
    history_col = get_collection("analysis_history")

    farm = farms_col.find_one({"_id": request.farm_id})
    if not farm:
        # Check if default farm can be used
        farm = farms_col.find_one({"user_id": current_user["_id"]})
        if not farm:
            district = current_user.get("district") or "Thanjavur"
            farm = {
                "_id": request.farm_id or "default_farm",
                "name": f"{district} Agriculture Zone",
                "user_id": current_user["_id"],
                "district": district,
                "state": current_user.get("state", "Tamil Nadu"),
                "latitude": 10.7870,
                "longitude": 79.1378
            }

    lat = float(farm.get("latitude", 10.7870))
    lon = float(farm.get("longitude", 79.1378))

    # 1. Fetch live or calibrated NASA telemetry
    nasa_power = await NASAService.fetch_power_daily(lat, lon)
    sat_layers = NASAService.get_satellite_layer_metrics(lat, lon)
    climate_analysis = NASAService.analyze_climate_anomalies_and_alerts(
        nasa_power.get("daily_records", []),
        sat_layers.get("smap_soil_moisture", {}),
        lat
    )

    # 2. Fetch or evaluate Soil Data
    soil_rec = soil_col.find_one({"farm_id": farm["_id"]})
    if soil_rec:
        soil_eval = soil_rec.get("status_summary") or SoilService.evaluate_soil_health(
            ph=float(soil_rec.get("ph", 6.8)),
            nitrogen_kg_ha=float(soil_rec.get("nitrogen_kg_ha", 240.0)),
            phosphorus_kg_ha=float(soil_rec.get("phosphorus_kg_ha", 16.0)),
            potassium_kg_ha=float(soil_rec.get("potassium_kg_ha", 200.0)),
            organic_carbon_pct=float(soil_rec.get("organic_carbon_pct", 0.58)),
            soil_moisture_pct=float(soil_rec.get("soil_moisture_pct", 24.0))
        )
    else:
        soil_eval = SoilService.evaluate_soil_health(
            ph=6.8, nitrogen_kg_ha=240.0, phosphorus_kg_ha=16.0,
            potassium_kg_ha=200.0, organic_carbon_pct=0.58, soil_moisture_pct=24.0
        )

    # 3. Generate 3 MCDA Strategies
    weights = request.custom_weights or MCDAWeights()
    strategies = RotationEngine.generate_three_strategies(farm, soil_eval, climate_analysis, weights)

    # 4. Determine Recommended Strategy
    # Select highest overall score (usually Soil Health or Water Efficient depending on drought)
    recommended = max(strategies, key=lambda s: s.overall_score)

    # 5. Build Side-by-Side Comparison Matrix
    comparison_matrix = [
        {
            "metric": "Overall MCDA Suitability Score",
            "metric_tamil": "பொருத்தப்பாடு ஒட்டுமொத்த மதிப்பீடு",
            "unit": "/100",
            "existing": f"{strategies[0].overall_score}/100",
            "soil_health": f"{strategies[1].overall_score}/100",
            "water_efficient": f"{strategies[2].overall_score}/100"
        },
        {
            "metric": "Annual Irrigation Water Footprint",
            "metric_tamil": "ஆண்டு பாசன நீர் தேவை",
            "unit": "mm/year",
            "existing": f"{strategies[0].estimated_annual_water_mm} mm",
            "soil_health": f"{strategies[1].estimated_annual_water_mm} mm (-{strategies[1].water_savings_pct}%)",
            "water_efficient": f"{strategies[2].estimated_annual_water_mm} mm (-{strategies[2].water_savings_pct}%)"
        },
        {
            "metric": "Biological Nitrogen Added to Soil",
            "metric_tamil": "மண்ணில் சேர்க்கப்படும் இயற்கை தழைச்சத்து",
            "unit": "kg/ha",
            "existing": f"+{strategies[0].nitrogen_added_kg_ha} kg/ha",
            "soil_health": f"+{strategies[1].nitrogen_added_kg_ha} kg/ha",
            "water_efficient": f"+{strategies[2].nitrogen_added_kg_ha} kg/ha"
        },
        {
            "metric": "Soil Health Score Delta Impact",
            "metric_tamil": "மண் வளம் மேம்பாட்டு விகிதம்",
            "unit": "Points",
            "existing": f"{strategies[0].soil_health_delta_score:+.1f} pts (Degrading)",
            "soil_health": f"{strategies[1].soil_health_delta_score:+.1f} pts (Rejuvenating)",
            "water_efficient": f"{strategies[2].soil_health_delta_score:+.1f} pts (Moderate Build)"
        },
        {
            "metric": "Climate & Drought Risk Resilience",
            "metric_tamil": "காலநிலை & வறட்சி தாங்கும் திறன்",
            "unit": "Rating",
            "existing": "Low (Water-dependent)",
            "soil_health": "High (Balanced)",
            "water_efficient": "Very High (Drought-hardy)"
        }
    ]

    analysis_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    advisory_en = (
        f"For {farm.get('name')}, strategy '{recommended.name}' is scientifically recommended. "
        f"Integrating leguminous pulses and green manures fixes atmospheric nitrogen, elevates soil organic carbon, "
        f"and decreases fertilizer costs by an estimated 35%. Scoring weights reflect initial agronomic assumptions."
    )
    advisory_ta = (
        f"உங்கள் பண்ணை {farm.get('name')}-க்கு '{recommended.name_tamil}' மிகவும் உகந்தது. "
        f"உளுந்து மற்றும் சணப்பை போன்ற பயறு வகைகளை சுழற்சியில் சேர்ப்பதால் யூரியா செலவு 35% குறையும் மற்றும் மண் வளம் கூடும்."
    )

    response_data = {
        "id": analysis_id,
        "farm_id": farm["_id"],
        "farm_name": farm.get("name", "Farm"),
        "created_at": now,
        "weights_used": weights,
        "environmental_context": {
            "latitude": lat,
            "longitude": lon,
            "avg_temp_c": climate_analysis.get("avg_temperature_c"),
            "precipitation_30d_mm": climate_analysis.get("total_precipitation_30d_mm"),
            "soil_health_score": soil_eval.get("composite_health_score"),
            "smap_moisture_pct": sat_layers.get("smap_soil_moisture", {}).get("volumetric_moisture_pct")
        },
        "strategies": strategies,
        "recommended_strategy_id": recommended.id,
        "comparison_matrix": comparison_matrix,
        "agronomic_advisory": advisory_en,
        "agronomic_advisory_tamil": advisory_ta
    }

    # Store analysis record safely serialized for MongoDB
    db_doc = {
        "_id": analysis_id,
        "farm_id": farm["_id"],
        "farm_name": farm.get("name", "Farm"),
        "created_at": now,
        "weights_used": weights.dict() if hasattr(weights, "dict") else weights,
        "environmental_context": response_data["environmental_context"],
        "strategies": [s.dict() if hasattr(s, "dict") else s for s in strategies],
        "recommended_strategy_id": recommended.id,
        "comparison_matrix": comparison_matrix,
        "agronomic_advisory": advisory_en,
        "agronomic_advisory_tamil": advisory_ta
    }
    rotation_col.insert_one(db_doc)
    # Log to analysis history
    history_col.insert_one({
        "_id": str(uuid.uuid4()),
        "user_id": current_user["_id"],
        "farm_id": farm["_id"],
        "farm_name": farm.get("name"),
        "analysis_type": "Crop Rotation MCDA",
        "analysis_id": analysis_id,
        "created_at": now,
        "summary": f"Generated 3 strategies. Recommended: {recommended.name} (Score: {recommended.overall_score})"
    })

    return response_data

@router.post("/what-if")
async def run_what_if_scenario(
    request: WhatIfRequest,
    current_user: dict = Depends(get_current_user)
):
    farms_col = get_collection("farms")
    soil_col = get_collection("soil_records")

    farm = farms_col.find_one({"_id": request.farm_id})
    if not farm:
        farm = farms_col.find_one({"user_id": current_user["_id"]})
        if not farm:
            district = current_user.get("district") or "Thanjavur"
            farm = {
                "_id": request.farm_id or "default_farm",
                "name": f"{district} Agriculture Zone",
                "user_id": current_user["_id"],
                "district": district,
                "state": current_user.get("state", "Tamil Nadu"),
                "latitude": 10.7870,
                "longitude": 79.1378
            }

    lat = float(farm.get("latitude", 10.7870))
    lon = float(farm.get("longitude", 79.1378))

    nasa_power = await NASAService.fetch_power_daily(lat, lon)
    sat_layers = NASAService.get_satellite_layer_metrics(lat, lon)
    climate_analysis = NASAService.analyze_climate_anomalies_and_alerts(
        nasa_power.get("daily_records", []),
        sat_layers.get("smap_soil_moisture", {}),
        lat
    )

    soil_rec = soil_col.find_one({"farm_id": farm["_id"]})
    if soil_rec:
        soil_eval = soil_rec.get("status_summary") or SoilService.evaluate_soil_health(
            ph=float(soil_rec.get("ph", 6.8)),
            nitrogen_kg_ha=float(soil_rec.get("nitrogen_kg_ha", 240.0)),
            phosphorus_kg_ha=float(soil_rec.get("phosphorus_kg_ha", 16.0)),
            potassium_kg_ha=float(soil_rec.get("potassium_kg_ha", 200.0)),
            organic_carbon_pct=float(soil_rec.get("organic_carbon_pct", 0.58)),
            soil_moisture_pct=float(soil_rec.get("soil_moisture_pct", 24.0))
        )
    else:
        soil_eval = SoilService.evaluate_soil_health(
            ph=6.8, nitrogen_kg_ha=240.0, phosphorus_kg_ha=16.0,
            potassium_kg_ha=200.0, organic_carbon_pct=0.58, soil_moisture_pct=24.0
        )

    return RotationEngine.run_what_if_simulation(
        farm,
        soil_eval,
        climate_analysis,
        water_deficit_pct=request.water_deficit_pct or 0.0,
        temp_increase_c=request.temperature_increase_c or 0.0,
        ph_shift=request.soil_ph_shift or 0.0
    )

@router.get("/latest")
async def get_latest_rotation(
    farm_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    target_farm_id = farm_id or "default_farm"
    rotation_col = get_collection("rotation_analyses")
    cursor = rotation_col.find({"farm_id": target_farm_id})
    items = list(cursor)
    if items:
        # Return most recent
        res = items[-1]
        if "_id" in res and "id" not in res:
            res["id"] = str(res["_id"])
        return res
    # If none yet, trigger generation
    req = RotationAnalysisRequest(farm_id=target_farm_id)
    return await generate_crop_rotation(req, current_user)

