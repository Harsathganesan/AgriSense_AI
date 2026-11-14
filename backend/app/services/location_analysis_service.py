import math
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.services.nasa_service import NASAService
from app.services.location_service import LocationService
from app.database import get_collection

# In-memory fast cache for repeated coordinate queries (keyed by rounded lat/lon)
_ANALYSIS_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_MINUTES = 30

class LocationAnalysisService:

    @classmethod
    async def analyze_location(cls, lat: float, lon: float, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates comprehensive location-based agricultural insights comparing real-time
        NASA POWER, GPM IMERG, SMAP, MODIS, and SRTM data for the farmer's exact GPS coordinates.
        """
        cache_key = f"{round(lat, 2):.2f}_{round(lon, 2):.2f}"
        now = datetime.utcnow()

        # Check in-memory cache
        if cache_key in _ANALYSIS_CACHE:
            cached_entry = _ANALYSIS_CACHE[cache_key]
            if (now - cached_entry["cached_at"]).total_seconds() < (CACHE_TTL_MINUTES * 60):
                return cached_entry["data"]

        # 1. Reverse Geocode Location
        geocoded = await LocationService.reverse_geocode(lat, lon)

        # 2. Fetch NASA POWER Meteorological Telemetry (Projected through today)
        power_res = await NASAService.fetch_power_daily(lat, lon)
        daily_records = power_res.get("daily_records", [])
        today_prediction = power_res.get("today_prediction")

        # 3. Fetch NASA Satellite Layer Telemetry (GPM, SMAP, MODIS, SRTM)
        sat_layers = NASAService.get_satellite_layer_metrics(lat, lon)
        gpm = sat_layers.get("gpm_precipitation", {})
        smap = sat_layers.get("smap_soil_moisture", {})
        modis = sat_layers.get("modis_vegetation", {})
        srtm = sat_layers.get("srtm_elevation", {})

        # 4. Compute Meteorological Indicators
        recent_7d = daily_records[-7:] if len(daily_records) >= 7 else daily_records
        recent_30d = daily_records

        current_temp = round(sum(d["temp_mean"] for d in recent_7d) / max(1, len(recent_7d)), 1)
        max_temp_7d = max((d["temp_max"] for d in recent_7d), default=33.0)
        min_temp_7d = min((d["temp_min"] for d in recent_7d), default=22.0)
        avg_rh = round(sum(d["relative_humidity_pct"] for d in recent_7d) / max(1, len(recent_7d)), 1)
        avg_solar = round(sum(d["solar_radiation_mj"] for d in recent_7d) / max(1, len(recent_7d)), 2)

        # 5. Rainfall & Anomaly Analysis
        total_rain_7d = round(sum(d["precipitation_mm"] for d in recent_7d), 1)
        total_rain_30d = round(sum(d["precipitation_mm"] for d in recent_30d), 1)
        gpm_accum_mm = gpm.get("accumulated_30d_mm", total_rain_30d)
        peak_intensity = gpm.get("peak_rain_rate_mm_hr", 12.0)

        # Long-term expected baseline (typical 30d in Tamil Nadu ~ 50mm)
        historical_baseline_mm = 55.0
        rain_anomaly_pct = round(((total_rain_30d - historical_baseline_mm) / historical_baseline_mm) * 100, 1)

        # Consecutive dry days calculation
        consecutive_dry_days = 0
        for d in reversed(daily_records):
            if d.get("precipitation_mm", 0.0) < 2.5:
                consecutive_dry_days += 1
            else:
                break

        # 6. Drought Risk Assessment
        rootzone_moisture_pct = smap.get("volumetric_moisture_pct", 24.0)
        if consecutive_dry_days >= 14 or (rootzone_moisture_pct < 16.0 and total_rain_30d < 15.0):
            drought_risk_level = "Severe"
            drought_score = 78
            drought_title_en = f"Elevated Drought Risk ({consecutive_dry_days} Dry Days)"
            drought_title_ta = f"வறட்சி அபாயம் அதிகம் ({consecutive_dry_days} நாட்களாக மழையில்லை)"
            drought_desc_en = f"Your exact farm location has received minimal rainfall for {consecutive_dry_days} days. SMAP root-zone moisture is at {rootzone_moisture_pct}%. Soil moisture reserves are depleting."
            drought_desc_ta = f"உங்கள் பகுதியில் கடந்த {consecutive_dry_days} நாட்களாக குறிப்பிடத்தக்க மழையில்லை. செயற்கைக்கோள் அளவீட்டின்படி மண் ஈரப்பதம் {rootzone_moisture_pct}% ஆக குறைந்துள்ளது."
            drought_rec_en = "Adopt mulching with crop straw, initiate micro-irrigation in morning hours, and prioritize low-water crops (millets/pulses)."
            drought_rec_ta = "வைக்கோல் கொண்டு நிலப்போர்வை (Mulching) இடவும். குறைந்த நீர் தேவைப்படும் சிறுதானியங்கள் மற்றும் பயறு வகைகளை திட்டமிடவும்."
        elif consecutive_dry_days >= 7 or rootzone_moisture_pct < 20.0:
            drought_risk_level = "Moderate"
            drought_score = 45
            drought_title_en = f"Moderate Moisture Stress ({consecutive_dry_days} Dry Days)"
            drought_title_ta = f"மிதமான ஈரப்பத அழுத்தம் ({consecutive_dry_days} நாட்கள்)"
            drought_desc_en = "Dry conditions observed over the past week. Normal for intercultural operations, but soil moisture should be preserved."
            drought_desc_ta = "கடந்த ஒரு வாரமாக வறண்ட வானிலை நிலவுகிறது. களை எடுத்தல் மற்றும் அறுவடைக்கு ஏற்றது; இருப்பினும் பாசனத்தை கண்காணிக்கவும்."
            drought_rec_en = "Schedule light irrigation before sowing next rotational cycle. Inspect topsoil condition."
            drought_rec_ta = "அடுத்த பயிர் விதைப்பதற்கு முன் மிதமான பாசனம் அளிக்கவும். மேல்மண் ஈரப்பதத்தை கண்காணிக்கவும்."
        else:
            drought_risk_level = "Low"
            drought_score = 15
            drought_title_en = "Low Drought Risk (Adequate Moisture)"
            drought_title_ta = "வறட்சி அபாயம் குறைவு (போதுமான ஈரப்பதம்)"
            drought_desc_en = f"Precipitation patterns and SMAP soil moisture ({rootzone_moisture_pct}%) are favorable for healthy crop growth."
            drought_desc_ta = f"மழைப்பொழிவு மற்றும் மண் ஈரப்பதம் ({rootzone_moisture_pct}%) பயிர் வளர்ச்சிக்கு உகந்ததாக உள்ளது."
            drought_rec_en = "Excellent conditions for field preparation, direct seeding, and nutrient uptake."
            drought_rec_ta = "நிலம் தயாரித்தல், விதைப்பு மற்றும் உரமிடுதலுக்கு மிகவும் சாதகமான சூழல்."

        # 7. Heavy Rainfall & Flood Risk
        max_daily_rain = max((d["precipitation_mm"] for d in daily_records), default=0.0)
        slope_pct = srtm.get("slope_pct", 1.0)

        if max_daily_rain > 65.0 or peak_intensity > 35.0:
            heavy_rain_risk = "High"
            heavy_rain_score = 80
            heavy_rain_title_en = f"Heavy Rainfall Warning ({max_daily_rain} mm/day Peak)"
            heavy_rain_title_ta = f"கனமழை எச்சரிக்கை (அதிகபட்சம் {max_daily_rain} மி.மீ)"
            heavy_rain_desc_en = f"NASA GPM satellites detected intense precipitation spikes reaching {max_daily_rain} mm/day. Low-lying terrain with slope {slope_pct}% may face water stagnation."
            heavy_rain_desc_ta = f"நாசா செயற்கைக்கோள் தரவுப்படி ஒரு நாளில் {max_daily_rain} மி.மீ வரை கனமழை பதிவாகியுள்ளது. தாழ்வான நிலங்களில் நீர் தேங்கும் அபாயம் உள்ளது."
            heavy_rain_rec_en = "Immediately clear drainage outlets and reinforce field bunds to protect standing seedlings."
            heavy_rain_rec_ta = "பண்ணை வடிகால்களை உடனடியாக தூர்வாரி, வரப்புகளை பலப்படுத்தி பயிர்களை பாதுகாக்கவும்."
        elif max_daily_rain > 30.0:
            heavy_rain_risk = "Moderate"
            heavy_rain_score = 42
            heavy_rain_title_en = "Moderate Rain Showers Observed"
            heavy_rain_title_ta = "மிதமான மழை பதிவாகியுள்ளது"
            heavy_rain_desc_en = f"Precipitation peaked at {max_daily_rain} mm. Beneficial for soil recharge without acute flooding hazard."
            heavy_rain_desc_ta = f"அதிகபட்சமாக {max_daily_rain} மி.மீ மழை பெய்துள்ளது. நிலத்தடி நீர் மட்டம் உயர இது உதவும்."
            heavy_rain_rec_en = "Postpone fertilizer broadcast until surface runoff subsides."
            heavy_rain_rec_ta = "மண்ணில் நீர் வடியும் வரை மேல் உரம் இடுவதை தள்ளிப்போடவும்."
        else:
            heavy_rain_risk = "Low"
            heavy_rain_score = 12
            heavy_rain_title_en = "Low Rainfall Hazard"
            heavy_rain_title_ta = "கனமழை ஆபத்து இல்லை"
            heavy_rain_desc_en = "Rainfall intensity remains gentle with no immediate risk of field waterlogging."
            heavy_rain_desc_ta = "நீர் தேங்கும் அபாயம் ஏதுமின்றி வானிலை இயல்பாக உள்ளது."
            heavy_rain_rec_en = "Safe window for all outdoor spraying and agricultural machinery operations."
            heavy_rain_rec_ta = "மருந்து தெளித்தல் மற்றும் இயந்திர பணிகளை தாராளமாக மேற்கொள்ளலாம்."

        # 8. Temperature Trend & Agronomic Suitability
        if max_temp_7d >= 38.0:
            temp_status_en = "Heat Stress Risk"
            temp_status_ta = "அதிக வெப்ப அழுத்தம்"
            temp_desc_en = f"Daytime temperatures reaching {max_temp_7d}°C. High transpirational loss in flowering crops."
            temp_desc_ta = f"வெப்பநிலை {max_temp_7d}°C வரை உயர்ந்துள்ளது. பூக்கும் பருவ பயிர்களில் மகரந்தச் சேர்க்கை பாதிக்கப்படலாம்."
        else:
            temp_status_en = "Optimal Crop Growth Range"
            temp_status_ta = "உகந்த வளர்ச்சி வெப்பநிலை"
            temp_desc_en = f"Average temperature of {current_temp}°C provides balanced thermal time for regional cropping."
            temp_desc_ta = f"சராசரி வெப்பநிலை {current_temp}°C தமிழ்நாடு பயிர்களின் வளர்ச்சிக்கு மிகவும் உகந்தது."

        # 9. Location-Specific Crop Suitability Insights
        # Tailored based on exact GPS coordinates, water availability, and rainfall
        crops_suitability = []
        if rootzone_moisture_pct >= 22.0 or total_rain_30d >= 40.0:
            crops_suitability.append({
                "crop": "Paddy / Rice (நெல்)",
                "suitability_score": 92,
                "status": "Highly Suitable",
                "status_tamil": "மிகவும் ஏற்றது",
                "reason_en": "Adequate root-zone moisture and warm climate favor paddy tillering and panicle initiation.",
                "reason_tamil": "வேர் மண்டல ஈரப்பதம் மற்றும் வெப்பநிலை நெல் பயிர் வளர்ச்சிக்கு மிகவும் சாதகமாக உள்ளது."
            })
            crops_suitability.append({
                "crop": "Black Gram / Urad (உளுந்து)",
                "suitability_score": 88,
                "status": "Optimal Relay Crop",
                "status_tamil": "சிறந்த பயறு வகை",
                "reason_en": "Ideal relay pulse in rice fallows; fixes up to 45 kg N/ha into soil.",
                "reason_tamil": "நெல் தரிசில் விதைக்க ஏற்றது; மண்ணில் தழைச்சத்தை நிலைநிறுத்தும்."
            })
        else:
            crops_suitability.append({
                "crop": "Finger Millet / Ragi (கேழ்வரகு)",
                "suitability_score": 94,
                "status": "Top Climate-Resilient Choice",
                "status_tamil": "வறட்சியைத் தாங்கும் பயிர்",
                "reason_en": "Requires 60% less water than paddy; excellent drought tolerance in dry spells.",
                "reason_tamil": "நெல்லை விட 60% குறைந்த நீரே போதும்; வறண்ட சூழலைத் தாங்கி வளரும்."
            })
            crops_suitability.append({
                "crop": "Groundnut (வேர்க்கடலை)",
                "suitability_score": 86,
                "status": "High Return Oilseed",
                "status_tamil": "அதிக வருவாய் தரும் எண்ணெய்வித்து",
                "reason_en": "Deep taproot extracts residual soil moisture; enriches soil fertility.",
                "reason_tamil": "ஆழமான வேரமைப்பு மண்ணின் ஈரத்தை கிரகிக்கும்; நிலவளத்தை மேம்படுத்தும்."
            })

        crops_suitability.append({
            "crop": "Sesame / Gingelly (எள்)",
            "suitability_score": 84,
            "status": "Low-Input Summer Crop",
            "status_tamil": "குறைந்த செலவு பயிர்",
            "reason_en": "Flourishes in warm temperatures (28-34°C) with minimal irrigation cycles.",
            "reason_tamil": "வெப்பமான தட்பவெப்பத்தில் குறைவான பாசனத்தில் அதிக மகசூல் தரும்."
        })

        # 10. District Agro-Climatic & Soil/Sand Composition Profile
        detected_district = geocoded.get("district", "Pudukkottai")
        detected_state = geocoded.get("state", "Tamil Nadu")
        from app.services.district_service import DistrictService
        agro_data = DistrictService.get_district_agro_profile(detected_district, detected_state)
        
        texture_lower = agro_data.get("soil_texture", "").lower()
        if "sandy" in texture_lower or "sand" in texture_lower:
            sand_pct = 68.0
            silt_pct = 18.0
            clay_pct = 14.0
            sand_class_en = "Coarse Sandy Loam"
            sand_class_ta = "கரடுமுரடான மணற்பாங்கான செம்மண்"
        elif "clay" in texture_lower:
            sand_pct = 22.0
            silt_pct = 28.0
            clay_pct = 50.0
            sand_class_en = "Heavy Alluvial Clay"
            sand_class_ta = "கரிசல் கலந்த வண்டல் களிமண்"
        else:
            sand_pct = 45.0
            silt_pct = 35.0
            clay_pct = 20.0
            sand_class_en = "Medium Porous Loam"
            sand_class_ta = "நடுத்தர வண்டல் மண்"

        soil_and_sand_profile = {
            "primary_soil": agro_data["primary_soil"],
            "primary_soil_tamil": agro_data["primary_soil_tamil"],
            "soil_texture": agro_data["soil_texture"],
            "sand_composition": {
                "sand_pct": sand_pct,
                "silt_pct": silt_pct,
                "clay_pct": clay_pct,
                "classification_en": sand_class_en,
                "classification_ta": sand_class_ta
            },
            "agro_climatic_zone": agro_data["zone_name"],
            "agro_climatic_zone_tamil": agro_data["zone_name_tamil"],
            "annual_rainfall_normal_mm": agro_data["annual_rainfall_normal_mm"],
            "irrigation_type": agro_data["irrigation_type"],
            "baseline_lab_chemistry": agro_data["baseline_lab_soil"],
            "satellite_moisture": {
                "surface_0_5cm_pct": round(smap.get("surface_moisture_m3_m3", 0.24) * 100, 1),
                "rootzone_0_100cm_pct": rootzone_moisture_pct,
                "status": "Adequate" if rootzone_moisture_pct >= 20.0 else "Depleted",
                "status_tamil": "போதுமானது" if rootzone_moisture_pct >= 20.0 else "குறைவு"
            }
        }

        # Compile Full Response
        analysis_data = {
            "coordinates": {
                "latitude": lat,
                "longitude": lon,
                "elevation_meters": srtm.get("elevation_meters", 24.0),
                "slope_pct": slope_pct
            },
            "location_details": {
                "village": geocoded.get("village", "Rural Farm"),
                "taluk": geocoded.get("taluk", "Agricultural Block"),
                "district": geocoded.get("district", "Thanjavur"),
                "state": geocoded.get("state", "Tamil Nadu"),
                "country": geocoded.get("country", "India"),
                "display_name": geocoded.get("display_name", "")
            },
            "today_prediction": today_prediction,
            "nasa_weather_snapshot": {
                "current_temp_c": today_prediction.get("temp_mean", current_temp) if today_prediction else current_temp,
                "max_temp_c": today_prediction.get("temp_max", max_temp_7d) if today_prediction else max_temp_7d,
                "min_temp_c": today_prediction.get("temp_min", min_temp_7d) if today_prediction else min_temp_7d,
                "relative_humidity_pct": today_prediction.get("relative_humidity_pct", avg_rh) if today_prediction else avg_rh,
                "solar_radiation_mj": today_prediction.get("solar_radiation_mj", avg_solar) if today_prediction else avg_solar,
                "temp_status_en": temp_status_en,
                "temp_status_ta": temp_status_ta,
                "temp_desc_en": temp_desc_en,
                "temp_desc_ta": temp_desc_ta,
                "today_prediction": today_prediction
            },
            "nasa_rainfall_snapshot": {
                "recent_7d_mm": total_rain_7d,
                "recent_30d_mm": total_rain_30d,
                "gpm_accumulated_30d_mm": gpm_accum_mm,
                "historical_baseline_30d_mm": historical_baseline_mm,
                "rainfall_anomaly_pct": rain_anomaly_pct,
                "consecutive_dry_days": consecutive_dry_days,
                "peak_rain_rate_mm_hr": peak_intensity
            },
            "soil_moisture_snapshot": {
                "volumetric_moisture_pct": rootzone_moisture_pct,
                "status": "Adequate" if rootzone_moisture_pct >= 20.0 else "Depleted",
                "status_tamil": "போதுமானது" if rootzone_moisture_pct >= 20.0 else "பற்றாக்குறை"
            },
            "drought_risk": {
                "risk_level": drought_risk_level,
                "score": drought_score,
                "title_en": drought_title_en,
                "title_ta": drought_title_ta,
                "description_en": drought_desc_en,
                "description_ta": drought_desc_ta,
                "recommendation_en": drought_rec_en,
                "recommendation_ta": drought_rec_ta
            },
            "heavy_rainfall_risk": {
                "risk_level": heavy_rain_risk,
                "score": heavy_rain_score,
                "title_en": heavy_rain_title_en,
                "title_ta": heavy_rain_title_ta,
                "description_en": heavy_rain_desc_en,
                "description_ta": heavy_rain_desc_ta,
                "recommendation_en": heavy_rain_rec_en,
                "recommendation_ta": heavy_rain_rec_ta
            },
            "crop_suitability_insights": crops_suitability,
            "soil_and_sand_profile": soil_and_sand_profile,
            "agricultural_insights_summary": {
                "summary_en": f"Farm located in {geocoded.get('village', 'your area')}, {geocoded.get('district', 'Tamil Nadu')}. Recent rainfall is {total_rain_30d} mm ({rain_anomaly_pct:+.1f}% vs baseline). Soil moisture is {rootzone_moisture_pct}%. Drought risk is {drought_risk_level}, heavy rainfall risk is {heavy_rain_risk}.",
                "summary_ta": f"உங்கள் பண்ணை {geocoded.get('village', 'பகுதியில்')}, {geocoded.get('district', 'மாவட்டத்தில்')} அமைந்துள்ளது. கடந்த 30 நாள் மழை {total_rain_30d} மி.மீ (வழக்கத்தை விட {rain_anomaly_pct:+.1f}%). மண் ஈரப்பதம் {rootzone_moisture_pct}%. வறட்சி அபாயம்: {drought_risk_level}, கனமழை அபாயம்: {heavy_rain_risk}."
            },
            "data_source_metadata": {
                "power_api": "NASA POWER MERRA-2 (0.5° × 0.5° Resolution)",
                "gpm_api": "NASA GPM IMERG Final Precipitation L3 (0.1° × 0.1° ~10km)",
                "smap_api": "NASA SMAP Radiometer Soil Moisture (9km)",
                "srtm_api": "NASA SRTM v3 Digital Elevation (30m)",
                "last_synced": now.strftime("%Y-%m-%d %H:%M:%S UTC"),
                "is_cached": False
            }
        }

        # Cache in memory
        _ANALYSIS_CACHE[cache_key] = {
            "cached_at": now,
            "data": analysis_data
        }

        # Optionally log analysis history in MongoDB if user_id is provided
        if user_id:
            try:
                hist_col = get_collection("analysis_history")
                hist_col.insert_one({
                    "user_id": user_id,
                    "type": "location_agricultural_analysis",
                    "latitude": lat,
                    "longitude": lon,
                    "district": geocoded.get("district"),
                    "summary_en": analysis_data["agricultural_insights_summary"]["summary_en"],
                    "summary_ta": analysis_data["agricultural_insights_summary"]["summary_ta"],
                    "created_at": now.isoformat()
                })
            except Exception as ex:
                print(f"[LocationAnalysisService] History save note: {ex}")

        return analysis_data

