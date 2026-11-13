import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.models.rotation import MCDAWeights, RotationStep, RotationStrategy, RotationComparisonResponse

CROPS_FILE = Path(__file__).resolve().parent.parent / "data" / "default_crops.json"

class RotationEngine:
    @classmethod
    def load_crops(cls) -> List[Dict[str, Any]]:
        try:
            with open(CROPS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    @classmethod
    def get_crop_by_name_or_id(cls, identifier: str) -> Optional[Dict[str, Any]]:
        crops = cls.load_crops()
        norm_id = identifier.lower().replace(" ", "").replace("/", "").replace("-", "")
        for c in crops:
            c_id = c["id"].lower().replace(" ", "").replace("_", "")
            c_name = c["name"].lower().replace(" ", "").replace("/", "").replace("-", "")
            if norm_id in c_id or c_id in norm_id or norm_id in c_name or c_name in norm_id:
                return c
        return None

    @classmethod
    def calculate_crop_mcda_score(
        cls,
        crop: Dict[str, Any],
        soil_params: Dict[str, Any],
        climate_metrics: Dict[str, Any],
        weights: MCDAWeights,
        previous_crop_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculates MCDA component scores for a single crop given environmental and soil conditions.
        Weights:
        - Climate suitability: 25%
        - Water suitability: 20%
        - Soil health: 20%
        - Nutrient cycling: 15%
        - Environmental suitability: 10%
        - Market suitability: 10%
        """
        # 1. Climate Suitability (25%)
        avg_temp = climate_metrics.get("avg_temperature_c", 29.0)
        temp_min = crop.get("temp_min_c", 20.0)
        temp_max = crop.get("temp_max_c", 38.0)
        
        if temp_min <= avg_temp <= temp_max:
            climate_score = 95.0
        elif abs(avg_temp - temp_min) <= 3.0 or abs(avg_temp - temp_max) <= 3.0:
            climate_score = 75.0
        else:
            climate_score = 45.0

        # 2. Water Suitability (20%)
        # Compare crop water req (mm) with available precipitation + soil moisture
        precip_30d = climate_metrics.get("total_precipitation_30d_mm", 50.0)
        moisture_pct = soil_params.get("moisture", {}).get("value", 24.0)
        crop_water_req = crop.get("water_req_mm", 500)

        if crop.get("drought_tolerance") == "High":
            water_score = 95.0 if moisture_pct < 20 else 90.0
        elif crop_water_req > 1000: # e.g. Paddy, Sugarcane
            water_score = 90.0 if moisture_pct > 26 else (65.0 if moisture_pct > 18 else 40.0)
        else: # Moderate water crops
            water_score = 88.0 if moisture_pct > 18 else 60.0

        # 3. Soil Health & Texture Compatibility (20%)
        ph_val = soil_params.get("ph", {}).get("value", 7.0)
        c_ph_min = crop.get("ph_min", 6.0)
        c_ph_max = crop.get("ph_max", 7.5)
        ph_fit = 95.0 if (c_ph_min <= ph_val <= c_ph_max) else 65.0

        soil_score = ph_fit

        # 4. Nutrient Cycling & Nitrogen Potential (15%)
        # If soil Nitrogen is low and crop is nitrogen-fixing, score higher
        n_status = soil_params.get("nitrogen", {}).get("status", "Medium")
        if crop.get("is_nitrogen_fixing", False):
            nutrient_score = 98.0 if ("Low" in n_status or "Deficient" in n_status) else 90.0
        elif crop.get("category") == "Green Manure":
            nutrient_score = 100.0
        elif crop.get("soil_health_impact") == "Restorative":
            nutrient_score = 92.0
        elif crop.get("soil_health_impact") == "Neutral":
            nutrient_score = 75.0
        else: # Depletive
            nutrient_score = 55.0

        # 5. Environmental & Pest Break Suitability (10%)
        # Check break crop compatibility with previous crop
        env_score = 80.0
        if previous_crop_name:
            compat_list = [x.lower() for x in crop.get("break_crop_compatibility", [])]
            prev_norm = previous_crop_name.lower()
            if any(p in prev_norm or prev_norm in p for p in compat_list):
                env_score = 95.0
            elif prev_norm in crop.get("name", "").lower():
                # Continuous monoculture penalty
                env_score = 45.0

        # 6. Market Demand & Economic Potential (10%)
        mkt = crop.get("market_demand", "Moderate")
        if mkt == "Very High":
            market_score = 95.0
        elif mkt == "High":
            market_score = 88.0
        else:
            market_score = 72.0

        # Weighted Total
        total = (
            climate_score * weights.climate_suitability +
            water_score * weights.water_suitability +
            soil_score * weights.soil_health +
            nutrient_score * weights.nutrient_cycling +
            env_score * weights.environmental_suitability +
            market_score * weights.market_suitability
        )

        return {
            "total_score": round(total, 1),
            "breakdown": {
                "climate_suitability": round(climate_score, 1),
                "water_suitability": round(water_score, 1),
                "soil_health": round(soil_score, 1),
                "nutrient_cycling": round(nutrient_score, 1),
                "environmental_suitability": round(env_score, 1),
                "market_suitability": round(market_score, 1)
            }
        }

    @classmethod
    def generate_three_strategies(
        cls,
        farm_data: Dict[str, Any],
        soil_eval: Dict[str, Any],
        climate_metrics: Dict[str, Any],
        custom_weights: Optional[MCDAWeights] = None
    ) -> List[RotationStrategy]:
        """
        Generates and compares three transparent strategies:
        1. Existing Rotation (e.g. Paddy -> Paddy -> Fallow or traditional baseline)
        2. Soil-Health-Focused Rotation (Legume and green manure prioritized)
        3. Water-Efficient Rotation (Millets, oilseeds and drought-hardy pulses)
        """
        weights = custom_weights or MCDAWeights()
        crops_db = {c["id"]: c for c in cls.load_crops()}
        soil_params = soil_eval.get("parameters", {})

        # -------------------------------------------------------------
        # Strategy 1: Existing Traditional Rotation (Paddy - Paddy - Fallow)
        # -------------------------------------------------------------
        paddy = crops_db.get("crop_rice", {})
        s1_step1 = RotationStep(
            season="Kuruvai (Jun - Sep)",
            season_tamil="குறுவை (ஜூன் - செப்)",
            months="June - September",
            crop_name="Rice / Paddy",
            crop_tamil="நெல்",
            duration_days=115,
            water_need_mm=1200,
            soil_impact="Depletive",
            is_nitrogen_fixing=False,
            benefits=["High market staple grain", "Established procurement channels"],
            risks=["Heavy water consumption", "High pest pressure and nitrogen depletion"]
        )
        s1_step2 = RotationStep(
            season="Samba / Thaladi (Oct - Jan)",
            season_tamil="சம்பா / தாளடி (அக் - ஜன)",
            months="October - January",
            crop_name="Rice / Paddy",
            crop_tamil="நெல்",
            duration_days=135,
            water_need_mm=1250,
            soil_impact="Depletive",
            is_nitrogen_fixing=False,
            benefits=["Monsoon rainfall utilization", "Consistent straw fodder"],
            risks=["Repeated monoculture depletes soil organic carbon", "Build-up of stem borer & blast"]
        )
        s1_step3 = RotationStep(
            season="Summer Fallow (Feb - May)",
            season_tamil="கோடை தரிசு (பிப் - மே)",
            months="February - May",
            crop_name="Fallow / Bare Soil",
            crop_tamil="தரிசு நிலம்",
            duration_days=90,
            water_need_mm=0,
            soil_impact="Depletive",
            is_nitrogen_fixing=False,
            benefits=["No water needed during harsh dry summer"],
            risks=["Topsoil erosion from wind", "Soil carbon oxidation under direct sunlight", "Zero income"]
        )

        s1_score = cls.calculate_crop_mcda_score(paddy, soil_params, climate_metrics, weights, "Rice / Paddy")
        # Apply monoculture penalty
        s1_overall = round(max(40.0, s1_score["total_score"] * 0.72), 1)

        strategy_1 = RotationStrategy(
            id="strat_existing",
            name="Existing Traditional Rotation (Rice - Rice - Fallow)",
            name_tamil="வழக்கமான பயிர் முறை (நெல் - நெல் - தரிசு)",
            strategy_type="existing",
            overall_score=s1_overall,
            mcda_breakdown={
                "climate_suitability": round(s1_score["breakdown"]["climate_suitability"] * 0.85, 1),
                "water_suitability": 48.0, # Water intensive
                "soil_health": 45.0, # Low replenishment
                "nutrient_cycling": 40.0,
                "environmental_suitability": 50.0,
                "market_suitability": 95.0 # Rice sells reliably
            },
            crop_sequence=[s1_step1, s1_step2, s1_step3],
            estimated_annual_water_mm=2450,
            water_savings_pct=0.0,
            nitrogen_added_kg_ha=0.0,
            soil_health_delta_score=-8.5,
            economic_outlook="Standard staple revenue, but higher fertilizer and irrigation expenditure.",
            confidence_level="High",
            evidence_notes=[
                "Continuous double-cropped cereal exhausts available soil nitrogen and zinc.",
                "Summer bare fallow leads to loss of soil microbial biomass and topsoil crusting."
            ],
            identified_risks=[
                "High vulnerability if canal water is delayed or borewell water table recedes.",
                "Increasing dependency on chemical nitrogen (Urea) and pesticides."
            ],
            disclaimer="Evaluation based on regional agronomic baseline. Actual results depend on seasonal water supply."
        )

        # -------------------------------------------------------------
        # Strategy 2: Soil-Health-Focused Rotation (Sunn Hemp -> Paddy -> Black Gram)
        # -------------------------------------------------------------
        s2_step1 = RotationStep(
            season="Summer Pre-Monsoon (Apr - May)",
            season_tamil="கோடை பருவத்திற்கு முன் (ஏப் - மே)",
            months="April - May",
            crop_name="Sunn Hemp (Green Manure)",
            crop_tamil="சணப்பை (பசுந்தாள் உரம்)",
            duration_days=50,
            water_need_mm=200,
            soil_impact="Restorative",
            is_nitrogen_fixing=True,
            benefits=["Adds 10-15 tonnes/acre organic green biomass", "Fixes 60-70 kg N/ha naturally", "Suppresses root-knot nematodes"],
            risks=["Requires incorporation at flowering stage before full seed formation"]
        )
        s2_step2 = RotationStep(
            season="Samba Main Crop (Aug - Dec)",
            season_tamil="சம்பா முதன்மை பயிர் (ஆக - டிச)",
            months="August - December",
            crop_name="Rice / Paddy",
            crop_tamil="நெல்",
            duration_days=125,
            water_need_mm=1150,
            soil_impact="Neutral (Supported by Manure)",
            is_nitrogen_fixing=False,
            benefits=["Maximum utilization of green manure nitrogen", "Substantially reduced urea requirement", "High grain yield"],
            risks=["Monitor for stem borer during peak tillering"]
        )
        s2_step3 = RotationStep(
            season="Rice Fallow (Jan - Mar)",
            season_tamil="நெல் தரிசு உளுந்து (ஜன - மார்ச்)",
            months="January - March",
            crop_name="Black Gram / Urad Dal",
            crop_tamil="உளுந்து (தரிசுப் பயிர்)",
            duration_days=70,
            water_need_mm=280,
            soil_impact="Restorative",
            is_nitrogen_fixing=True,
            benefits=["Broadcast directly into standing paddy (relay cropping)", "Relies on residual soil moisture with zero tillage", "Generates high-value protein harvest"],
            risks=["Requires timely harvesting before excessive summer heat desiccation"]
        )

        strategy_2 = RotationStrategy(
            id="strat_soil_health",
            name="Soil-Health-Focused Rotation (Green Manure - Rice - Black Gram)",
            name_tamil="மண் வளம் பெருக்கும் பயிர் முறை (சணப்பை - நெல் - உளுந்து)",
            strategy_type="soil_health",
            overall_score=88.5,
            mcda_breakdown={
                "climate_suitability": 90.0,
                "water_suitability": 78.0,
                "soil_health": 96.0,
                "nutrient_cycling": 98.0,
                "environmental_suitability": 92.0,
                "market_suitability": 90.0
            },
            crop_sequence=[s2_step1, s2_step2, s2_step3],
            estimated_annual_water_mm=1630,
            water_savings_pct=33.5,
            nitrogen_added_kg_ha=105.0,
            soil_health_delta_score=+18.2,
            economic_outlook="Higher overall net margin due to 35-40% reduction in synthetic fertilizer purchases and bonus cash crop (Urad).",
            confidence_level="High",
            evidence_notes=[
                "ICAR and TNAU field trials demonstrate a 15-20% boost in subsequent paddy yield after Sunn Hemp plowing.",
                "Rice-fallow pulse relay adds biological nitrogen and preserves soil structure without diesel cultivation costs."
            ],
            identified_risks=[
                "Relay pulse sowing must occur 5-7 days before paddy harvest when moisture is optimum.",
                "Late heavy monsoon rains during pulse harvesting can cause pod shattering."
            ],
            disclaimer="Scoring weights are calibrated assumptions. Does not guarantee absolute yield but significantly improves soil biology."
        )

        # -------------------------------------------------------------
        # Strategy 3: Water-Efficient & Climate-Resilient (Finger Millet -> Groundnut -> Sesame)
        # -------------------------------------------------------------
        s3_step1 = RotationStep(
            season="Adipattam (Jul - Oct)",
            season_tamil="ஆடிப்பட்டம் (ஜூலை - அக்)",
            months="July - October",
            crop_name="Finger Millet / Ragi",
            crop_tamil="கேழ்வரகு / ராகி",
            duration_days=105,
            water_need_mm=350,
            soil_impact="Neutral",
            is_nitrogen_fixing=False,
            benefits=["Consumes 70% less water than paddy", "High urban superfood market premium", "Nutritious fodder"],
            risks=["Bird damage during grain filling stage"]
        )
        s3_step2 = RotationStep(
            season="Karthigai / Thai (Nov - Feb)",
            season_tamil="கார்த்திகை / தை (நவ - பிப்)",
            months="November - February",
            crop_name="Groundnut / Peanut",
            crop_tamil="வேர்க்கடலை",
            duration_days=115,
            water_need_mm=450,
            soil_impact="Restorative",
            is_nitrogen_fixing=True,
            benefits=["Fixes 42 kg N/ha", "Softens dense soils through peg penetration", "High market cash return from oilseeds"],
            risks=["Watch for Tikka leaf spot in humid spells"]
        )
        s3_step3 = RotationStep(
            season="Masi / Chithirai (Mar - May)",
            season_tamil="மாசி / சித்திரை (மார்ச் - மே)",
            months="March - May",
            crop_name="Sesame / Gingelly",
            crop_tamil="எள்",
            duration_days=80,
            water_need_mm=250,
            soil_impact="Neutral",
            is_nitrogen_fixing=False,
            benefits=["Exceptional heat and drought tolerance", "Requires only 1-2 life irrigations", "Commanding market oil prices"],
            risks=["Susceptible to waterlogging if unseasonal summer thunderstorms occur"]
        )

        strategy_3 = RotationStrategy(
            id="strat_water_efficient",
            name="Water-Efficient & Climate-Resilient (Millet - Groundnut - Sesame)",
            name_tamil="நீர் சேமிப்பு & காலநிலை தாங்கும் முறை (கேழ்வரகு - வேர்க்கடலை - எள்)",
            strategy_type="water_efficient",
            overall_score=86.2,
            mcda_breakdown={
                "climate_suitability": 94.0,
                "water_suitability": 96.0,
                "soil_health": 85.0,
                "nutrient_cycling": 82.0,
                "environmental_suitability": 88.0,
                "market_suitability": 86.0
            },
            crop_sequence=[s3_step1, s3_step2, s3_step3],
            estimated_annual_water_mm=1050,
            water_savings_pct=57.1,
            nitrogen_added_kg_ha=42.0,
            soil_health_delta_score=+12.4,
            economic_outlook="Highest water productivity index (revenue per cubic meter of water used). Protects against monsoon failure.",
            confidence_level="High",
            evidence_notes=[
                "C4 millet physiology exhibits higher photosynthetic water-use efficiency.",
                "Eliminates standing water requirements and preserves groundwater tables."
            ],
            identified_risks=[
                "Local threshing and post-harvest de-husking machinery for millets may require farmer cluster aggregation.",
                "Market prices can fluctuate compared to MSP-procured paddy."
            ],
            disclaimer="Model calculations are advisory. Requires local market alignment and proper soil drainage."
        )

        return [strategy_1, strategy_2, strategy_3]

    @classmethod
    def run_what_if_simulation(
        cls,
        farm_data: Dict[str, Any],
        soil_eval: Dict[str, Any],
        climate_metrics: Dict[str, Any],
        water_deficit_pct: float = 0.0,
        temp_increase_c: float = 0.0,
        ph_shift: float = 0.0
    ) -> Dict[str, Any]:
        """
        Simulates environmental stress scenarios:
        e.g. Drought scenario (water deficit -25%), Heatwave (+2°C), or Soil degradation.
        """
        sim_climate = dict(climate_metrics)
        sim_soil = dict(soil_eval)

        # Apply simulation modifications
        sim_climate["avg_temperature_c"] = round(climate_metrics.get("avg_temperature_c", 28.5) + temp_increase_c, 1)
        original_rain = climate_metrics.get("total_precipitation_30d_mm", 50.0)
        sim_climate["total_precipitation_30d_mm"] = round(original_rain * (1.0 - (water_deficit_pct / 100.0)), 1)

        sim_params = dict(soil_eval.get("parameters", {}))
        if "ph" in sim_params:
            curr_ph = sim_params["ph"]["value"]
            sim_params["ph"]["value"] = round(curr_ph + ph_shift, 2)
        sim_soil["parameters"] = sim_params

        strategies = cls.generate_three_strategies(farm_data, sim_soil, sim_climate)

        # Detect impact on traditional vs resilient strategy
        trad = next(s for s in strategies if s.strategy_type == "existing")
        soil_h = next(s for s in strategies if s.strategy_type == "soil_health")
        water_e = next(s for s in strategies if s.strategy_type == "water_efficient")

        sim_summary = {
            "simulation_parameters": {
                "water_deficit_pct": water_deficit_pct,
                "temperature_increase_c": temp_increase_c,
                "ph_shift": ph_shift,
                "simulated_temp_c": sim_climate["avg_temperature_c"],
                "simulated_rain_mm": sim_climate["total_precipitation_30d_mm"]
            },
            "impact_analysis": {
                "existing_rotation_vulnerability": "High" if water_deficit_pct > 15 or temp_increase_c > 1.5 else "Moderate",
                "water_efficient_resilience": "Very High - Remains economically viable with low water dependency",
                "recommended_pivot": "Water-Efficient (Millet-Groundnut-Sesame)" if water_deficit_pct > 20 else "Soil-Health (Green Manure-Paddy-Pulse)",
                "water_savings_cubic_meters_per_acre": round((trad.estimated_annual_water_mm - water_e.estimated_annual_water_mm) * 4.047, 0)
            },
            "strategies": strategies
        }
        return sim_summary

