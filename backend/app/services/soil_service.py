from typing import Dict, Any, List

class SoilService:
    @staticmethod
    def evaluate_soil_health(
        ph: float,
        nitrogen_kg_ha: float,
        phosphorus_kg_ha: float,
        potassium_kg_ha: float,
        organic_carbon_pct: float,
        soil_moisture_pct: float = 24.0,
        electrical_conductivity: float = 0.45
    ) -> Dict[str, Any]:
        """
        Evaluates soil test parameters according to Indian Council of Agricultural Research (ICAR)
        and Tamil Nadu Agricultural University (TNAU) soil testing standards.
        """
        # 1. pH evaluation (Optimal 6.5 - 7.5)
        if ph < 5.5:
            ph_status = "Strongly Acidic"
            ph_status_ta = "அதிக அமிலத்தன்மை"
            ph_score = 45.0
            ph_advice = "Apply agricultural lime (calcium carbonate) or dolomite to raise soil pH."
        elif ph < 6.5:
            ph_status = "Moderately Acidic"
            ph_status_ta = "மிதமான அமிலத்தன்மை"
            ph_score = 75.0
            ph_advice = "Slightly acidic; apply organic manure and wood ash."
        elif ph <= 7.5:
            ph_status = "Neutral / Optimal"
            ph_status_ta = "நடுநிலையானது / சிறந்தது"
            ph_score = 100.0
            ph_advice = "Ideal pH range for nutrient bioavailability and root development."
        elif ph <= 8.5:
            ph_status = "Moderately Alkaline"
            ph_status_ta = "மிதமான காரத்தன்மை"
            ph_score = 70.0
            ph_advice = "Apply gypsum (calcium sulphate) and incorporate organic green manure."
        else:
            ph_status = "Strongly Alkaline / Saline"
            ph_status_ta = "அதிக காரத்தன்மை / உவர் மண்"
            ph_score = 40.0
            ph_advice = "Gypsum application and thorough leaching with good drainage required."

        # 2. Nitrogen (N) (kg/ha): Low < 280, Medium 280 - 560, High > 560
        if nitrogen_kg_ha < 200:
            n_status = "Very Low"
            n_status_ta = "மிகக் குறைவு"
            n_score = 40.0
        elif nitrogen_kg_ha < 280:
            n_status = "Low"
            n_status_ta = "குறைவு"
            n_score = 60.0
        elif nitrogen_kg_ha <= 560:
            n_status = "Medium / Optimal"
            n_status_ta = "மிதமானது / உகந்தது"
            n_score = 95.0
        else:
            n_status = "High"
            n_status_ta = "அதிகம்"
            n_score = 80.0

        # 3. Phosphorus (P) (kg/ha): Low < 11, Medium 11 - 22, High > 22
        if phosphorus_kg_ha < 11:
            p_status = "Low"
            p_status_ta = "குறைவு"
            p_score = 55.0
        elif phosphorus_kg_ha <= 22:
            p_status = "Medium / Optimal"
            p_status_ta = "மிதமானது / உகந்தது"
            p_score = 95.0
        else:
            p_status = "High"
            p_status_ta = "அதிகம்"
            p_score = 85.0

        # 4. Potassium (K) (kg/ha): Low < 118, Medium 118 - 280, High > 280
        if potassium_kg_ha < 118:
            k_status = "Low"
            k_status_ta = "குறைவு"
            k_score = 55.0
        elif potassium_kg_ha <= 280:
            k_status = "Medium / Optimal"
            k_status_ta = "மிதமானது / உகந்தது"
            k_score = 95.0
        else:
            k_status = "High"
            k_status_ta = "அதிகம்"
            k_score = 90.0

        # 5. Organic Carbon (%) (Low < 0.50%, Medium 0.50 - 0.75%, High > 0.75%)
        if organic_carbon_pct < 0.35:
            oc_status = "Severely Depleted"
            oc_status_ta = "மிகவும் குறைவு"
            oc_score = 30.0
        elif organic_carbon_pct < 0.50:
            oc_status = "Low"
            oc_status_ta = "குறைவு"
            oc_score = 60.0
        elif organic_carbon_pct <= 0.75:
            oc_status = "Medium / Good"
            oc_status_ta = "நடுத்தரம் / நன்று"
            oc_score = 88.0
        else:
            oc_status = "High / Rich"
            oc_status_ta = "செழுமையானது"
            oc_score = 100.0

        # Composite Health Score (Weighted: OC 30%, pH 20%, N 20%, P 15%, K 15%)
        composite_score = round(
            (oc_score * 0.30) +
            (ph_score * 0.20) +
            (n_score * 0.20) +
            (p_score * 0.15) +
            (k_score * 0.15),
            1
        )

        # Agronomic Guidance
        guidelines = []
        guidelines_ta = []

        if organic_carbon_pct < 0.50:
            guidelines.append("Soil Organic Carbon is deficient (<0.5%). Integrate Sesbania or Sunn Hemp as green manure before main cereal crop.")
            guidelines_ta.append("மண்ணின் கரிமச்சத்து குறைவாக உள்ளது. நெல் சாகுபடிக்கு முன் சணப்பை அல்லது தக்கைப்பூண்டு பயிரிட்டு மடக்கி உழவும்.")

        if nitrogen_kg_ha < 280:
            guidelines.append("Available Nitrogen is below threshold. Mandatory inclusion of black gram, green gram, or groundnut in the rotation to fix biological nitrogen.")
            guidelines_ta.append("தழைச்சத்து பற்றாக்குறையாக உள்ளது. உளுந்து, பச்சைப்பயறு அல்லது வேர்க்கடலை பயிரிடுவதன் மூலம் இயற்கையாக தழைச்சத்தை கூட்டலாம்.")

        if phosphorus_kg_ha < 11:
            guidelines.append("Apply rock phosphate or DAP in basal dose; inoculate seeds with Phosphobacteria to solubilize bound phosphorus.")
            guidelines_ta.append("மணிச்சத்து குறைவாக உள்ளதால் பாஸ்போபாக்டீரியா உயிர் உரத்தை விதையுடன் கலந்து விதைக்கவும்.")

        if len(guidelines) == 0:
            guidelines.append("Soil parameters are well-balanced. Maintain organic matter with residue mulch and balanced crop rotations.")
            guidelines_ta.append("மண் வளம் மிகச் சிறப்பாக உள்ளது. பயிர் கழிவு மூடாக்கு மற்றும் சுழற்சி முறை மூலம் இதனை தொடர்ந்து பராமரிக்கவும்.")

        return {
            "composite_health_score": composite_score,
            "grade": "Excellent" if composite_score >= 85 else ("Good" if composite_score >= 70 else ("Fair" if composite_score >= 50 else "Critical")),
            "grade_tamil": "மிகச் சிறந்தது" if composite_score >= 85 else ("நன்று" if composite_score >= 70 else ("மிதமானது" if composite_score >= 50 else "கவனம் தேவை")),
            "parameters": {
                "ph": {
                    "value": ph,
                    "status": ph_status,
                    "status_tamil": ph_status_ta,
                    "score": ph_score,
                    "optimal_range": "6.5 - 7.5",
                    "unit": "",
                    "advice": ph_advice
                },
                "nitrogen": {
                    "value": nitrogen_kg_ha,
                    "status": n_status,
                    "status_tamil": n_status_ta,
                    "score": n_score,
                    "optimal_range": "280 - 560",
                    "unit": "kg/ha"
                },
                "phosphorus": {
                    "value": phosphorus_kg_ha,
                    "status": p_status,
                    "status_tamil": p_status_ta,
                    "score": p_score,
                    "optimal_range": "11 - 22",
                    "unit": "kg/ha"
                },
                "potassium": {
                    "value": potassium_kg_ha,
                    "status": k_status,
                    "status_tamil": k_status_ta,
                    "score": k_score,
                    "optimal_range": "118 - 280",
                    "unit": "kg/ha"
                },
                "organic_carbon": {
                    "value": organic_carbon_pct,
                    "status": oc_status,
                    "status_tamil": oc_status_ta,
                    "score": oc_score,
                    "optimal_range": "> 0.75%",
                    "unit": "%"
                },
                "moisture": {
                    "value": soil_moisture_pct,
                    "unit": "%",
                    "status": "Adequate" if soil_moisture_pct > 20 else "Low"
                }
            },
            "recommendations": guidelines,
            "recommendations_tamil": guidelines_ta
        }

