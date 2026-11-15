"""
AgriSense AI - Curated Agricultural Plant Disease Knowledge Base
Phase 4: Verified Agronomic Diagnosis & Advisory System

Curated in accordance with Indian Council of Agricultural Research (ICAR) 
and Tamil Nadu Agricultural University (TNAU) Agritech Portal standards.
Bilingual support: English (EN) and Tamil (TA).
"""

from typing import Dict, Any, Optional, List

PLANT_DISEASE_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    "Pepper__bell___Bacterial_spot": {
        "raw_class": "Pepper__bell___Bacterial_spot",
        "crop_en": "Bell Pepper (Capsicum)",
        "crop_ta": "குடைமிளகாய்",
        "disease_name_en": "Bacterial Spot",
        "disease_name_ta": "பாக்டீரியா இலைப்புள்ளி நோய்",
        "causal_agent": "Xanthomonas campestris pv. vesicatoria",
        "pathogen_type": "Bacterial",
        "is_healthy": False,
        "severity": "High",
        "symptoms_en": [
            "Small, water-soaked, dark brown to black circular lesions on leaves.",
            "Spots become irregular with necrotic brown centers and yellow halos.",
            "Severe infections trigger premature leaf drop (defoliation), exposing fruit to sunscald.",
            "Rough, raised brown warty spots appear on fruit surface."
        ],
        "symptoms_ta": [
            "இலைகளில் சிறிய, நீர் ஊறிய, அடர் பழுப்பு அல்லது கருப்பு வட்ட வடிவ புள்ளிகள் தோன்றும்.",
            "புள்ளிகள் முதிர்ந்து நடுவில் பழுப்பு நிறமாகவும் சுற்றி மஞ்சள் வளையமாகவும் மாறும்.",
            "கடுமையான பாதிப்பில் இலைகள் உதிர்ந்து பழங்கள் வெயில் தாக்கத்திற்கு உள்ளாகும்.",
            "மிளகாய் காய்களின் மீது சொரசொரப்பான, மேடான பழுப்பு புள்ளிகள் உண்டாகும்."
        ],
        "causes_en": [
            "Bacterial pathogen survives on infected crop residues and seed coats.",
            "Dispersed via splashing rain, overhead irrigation, and contaminated tools.",
            "Warm temperatures (24°C–30°C) paired with high relative humidity (>85%)."
        ],
        "causes_ta": [
            "பயிர் எச்சங்கள் மற்றும் விதைகளில் பாக்டீரியா தங்கி பரவுகிறது.",
            "மழை நீர் தெறிப்பு, தெளிப்பு நீர் பாசனம் மற்றும் கருவிகள் மூலம் எளிதில் பரவுகிறது.",
            "வெப்பநிலை (24°C-30°C) மற்றும் அதிக காற்று ஈரப்பதம் (>85%) இருக்கும்போது விரைவாக தாக்கும்."
        ],
        "organic_controls_en": [
            "Foliar spray of Pseudomonas fluorescens @ 5 g/litre or 10 ml/litre at 15-day intervals.",
            "Spray 5% Neem Seed Kernel Extract (NSKE) or 3% Neem oil with mild soap sticker.",
            "Seed treatment with Trichoderma viride @ 4 g/kg seed before sowing."
        ],
        "organic_controls_ta": [
            "சூடோமோனாஸ் ஃப்ளூரசன்ஸ் (Pseudomonas fluorescens) லிட்டருக்கு 5 கிராம் அல்லது 10 மிலி கலந்து 15 நாட்கள் இடைவெளியில் தெளிக்கவும்.",
            "5% வேப்பங்கொட்டை சாறு (NSKE) அல்லது 3% வேப்பெண்ணெய் தெளிக்கவும்.",
            "விதைக்கும் முன் டிரைக்கோடெர்மா விரிடி கொண்டு கிலோவுக்கு 4 கிராம் வீதம் விதை நேர்த்தி செய்யவும்."
        ],
        "chemical_controls_en": [
            "Spray Copper Oxychloride (COC 50% WP) @ 2.5 g/litre mixed with Streptocycline @ 1 g/10 litres water.",
            "Alternative: Kasugamycin 3% SL @ 2.0 ml/litre during early vegetative stage."
        ],
        "chemical_controls_ta": [
            "காப்பர் ஆக்சிகுளோரைடு (COC 50% WP) லிட்டருக்கு 2.5 கிராம் + ஸ்ட்ரெப்டோமைசின் சல்பேட் 1 கிராம் / 10 லிட்டர் நீரில் கலந்து தெளிக்கவும்.",
            "காசுகாமைசின் (Kasugamycin 3% SL) லிட்டருக்கு 2 மிலி வீதம் பயிரின் ஆரம்ப நிலையில் தெளிக்கவும்."
        ],
        "preventive_measures_en": [
            "Use certified disease-free seeds and hot-water treat seeds (50°C for 25 minutes).",
            "Avoid overhead sprinkler irrigation; switch to root drip irrigation.",
            "Practice 2 to 3 years crop rotation with non-solanaceous crops (e.g., maize, pulses).",
            "Destroy and bury infected plant debris after harvest."
        ],
        "preventive_measures_ta": [
            "சான்றளிக்கப்பட்ட நோய் தாக்காத விதைகளை பயன்படுத்தவும், வெந்நீர் விதை நேர்த்தி (50°C வெப்பத்தில் 25 நிமிடம்) செய்யவும்.",
            "தெளிப்பு நீர் பாசனத்தை தவிர்த்து சொட்டு நீர் பாசன முறையை பின்பற்றவும்.",
            "தக்காளி, கத்தரி அல்லாத பயிர்களுடன் (மக்காச்சோளம், பயறு வகைகள்) 2-3 ஆண்டுகள் பயிர் சுழற்சி செய்யவும்.",
            "பாதிக்கப்பட்ட பயிர் எச்சங்களை வயலிலிருந்து அகற்றி எரிக்கவும்."
        ],
        "nasa_risk_indicators": {
            "temp_range_c": [24, 32],
            "humidity_min_pct": 80,
            "smap_moisture_elevated": True,
            "risk_summary_en": "High atmospheric humidity and frequent rainfall create optimal conditions for bacterial proliferation.",
            "risk_summary_ta": "அதிக ஈரப்பதம் மற்றும் தொடர் மழை பாக்டீரியா நோய் பரவலுக்கு உகந்த சூழலை உருவாக்குகிறது."
        }
    },

    "Pepper__bell___healthy": {
        "raw_class": "Pepper__bell___healthy",
        "crop_en": "Bell Pepper (Capsicum)",
        "crop_ta": "குடைமிளகாய்",
        "disease_name_en": "Healthy Crop",
        "disease_name_ta": "ஆரோக்கியமான பயிர்",
        "causal_agent": "None",
        "pathogen_type": "None",
        "is_healthy": True,
        "severity": "None",
        "symptoms_en": [
            "Vibrant green leaves with uniform coloration and robust turgor.",
            "No necrotic lesions, wilting, curling, or chlorotic halos observed.",
            "Strong vegetative vigor with healthy flowering/fruiting nodes."
        ],
        "symptoms_ta": [
            "சீரான அடர் பச்சை நிறத்துடன் ஆரோக்கியமான தாள்கள் மற்றும் இலைகள்.",
            "புள்ளிகள், இலை சுருக்கம், கருகல் அல்லது வாடல் அறிகுறிகள் இல்லை.",
            "வீரியமான வளர்ச்சி மற்றும் ஆரோக்கியமான பூக்கும் திறன்."
        ],
        "causes_en": ["Optimal agronomic conditions and balanced nutrient management."],
        "causes_ta": ["சரியான சத்து மேலாண்மை மற்றும் நல்ல பாசன பராமரிப்பு."],
        "organic_controls_en": [
            "Maintain prophylactic biocontrol by applying Panchagavya (3% spray) every 20 days.",
            "Apply vermicompost and neem cake at root zones during weeding."
        ],
        "organic_controls_ta": [
            "20 நாட்களுக்கு ஒருமுறை 3% பஞ்சகாவ்யா தெளித்து பயிர் நோய் எதிர்ப்பு சக்தியை தக்கவைக்கவும்.",
            "மண்புழு உரம் மற்றும் வேப்பம் புண்ணாக்கு வேர்ப்பகுதியில் இடவும்."
        ],
        "chemical_controls_en": ["No chemical treatment required. Maintain balanced NPK fertigation."],
        "chemical_controls_ta": ["ரசாயன மருந்துகள் தேவையில்லை. சீரான ஊட்டச்சத்து பராமரிப்பு போதுமானது."],
        "preventive_measures_en": [
            "Continue periodic scouting every 4-5 days.",
            "Ensure adequate soil drainage to prevent water stagnation."
        ],
        "preventive_measures_ta": [
            "4-5 நாட்களுக்கு ஒருமுறை வயலை கண்காணித்து வரவும்.",
            "பாசன நீர் தேங்காமல் வடிகால் வசதியை சீராக வைக்கவும்."
        ],
        "nasa_risk_indicators": {
            "temp_range_c": [20, 30],
            "humidity_min_pct": 50,
            "risk_summary_en": "Conditions are conducive to normal vegetative growth.",
            "risk_summary_ta": "தற்போதைய வானிலை பயிர் வளர்ச்சிக்கு மிகவும் உகந்தது."
        }
    },

    "Potato___Early_blight": {
        "raw_class": "Potato___Early_blight",
        "crop_en": "Potato",
        "crop_ta": "உருளைக்கிழங்கு",
        "disease_name_en": "Early Blight",
        "disease_name_ta": "ஆரம்பகால கருகல் நோய்",
        "causal_agent": "Alternaria solani",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "severity": "Moderate",
        "symptoms_en": [
            "Concentric rings ('target-board' or bullseye appearance) on older, lower foliage.",
            "Dark brown to black angular spots bounded by leaf veins.",
            "Foliage gradually turns yellow, withers, and dries up like paper."
        ],
        "symptoms_ta": [
            "கீழ் இலைகளில் வட்ட வளையங்களுடன் கூடிய 'இலக்கு பலகை' போன்ற பழுப்பு புள்ளிகள் தோன்றும்.",
            "இலை நரம்புகளுக்கு இடையே அடர் பழுப்பு நிற கோணப் புள்ளிகள் வளரும்.",
            "பாதிக்கப்பட்ட இலைகள் மஞ்சள் நிறமாக மாறி காய்ந்து உதிரும்."
        ],
        "causes_en": [
            "Soil-borne fungal conidia overwintering in solanaceous plant debris.",
            "Stress caused by nitrogen deficiency or heavy tuber bulking.",
            "Alternating dry and wet weather periods with temperatures around 24°C–29°C."
        ],
        "causes_ta": [
            "மண்ணில் தங்கியிருக்கும் பூஞ்சை வித்துக்கள் மற்றும் முந்தைய பயிர் எச்சங்கள்.",
            "தழைச்சத்து பற்றாக்குறை அல்லது கிழங்கு ஊறும் பருவத்தில் ஏற்படும் பயிர் அழுத்தம்.",
            "ஈரப்பதம் மற்றும் வறண்ட வானிலை மாறி மாறி நிலவுதல்."
        ],
        "organic_controls_en": [
            "Foliar spray of Trichoderma harzianum @ 5 g/litre of water.",
            "Apply fermented cow urine (10%) mixed with garlic-chilli extract.",
            "Soil drenching with Bacillus subtilis bioformulations."
        ],
        "organic_controls_ta": [
            "டிரைக்கோடெர்மா ஹார்சியானம் (Trichoderma harzianum) லிட்டருக்கு 5 கிராம் நீரில் கலந்து தெளிக்கவும்.",
            "10% கோமியம் + பூண்டு-பச்சை மிளகாய் கரைசல் தெளிக்கவும்.",
            "பேசில்லஸ் சப்டிலிஸ் (Bacillus subtilis) கொண்டு வேர் நனைத்தல் செய்யவும்."
        ],
        "chemical_controls_en": [
            "Mancozeb 75% WP @ 2.5 g/litre or Chlorothalonil 75% WP @ 2 g/litre on first symptom appearance.",
            "For active infestations: Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/litre."
        ],
        "chemical_controls_ta": [
            "மேன்கோசெப் (Mancozeb 75% WP) லிட்டருக்கு 2.5 கிராம் அல்லது குளோரோதலோனில் லிட்டருக்கு 2 கிராம் தெளிக்கவும்.",
            "நோய் தீவிரம் அடைந்தால் அசோக்சிஸ்ட்ரோபின் + டைபெனோகோனசோல் லிட்டருக்கு 1 மிலி தெளிக்கவும்."
        ],
        "preventive_measures_en": [
            "Use certified disease-resistant seed tubers.",
            "Maintain balanced nitrogen and potassium fertilization; do not starve plants.",
            "Practice 3-year crop rotation without solanaceous hosts."
        ],
        "preventive_measures_ta": [
            "சான்றளிக்கப்பட்ட நோய் எதிர்ப்பு விதைத் தும்புகளை நடவு செய்யவும்.",
            "சீரான தழை மற்றும் சாம்பல் சத்து உரமிடுதலை உறுதி செய்யவும்.",
            "தக்காளி, கத்தரி அல்லாத பிற பயிர்களுடன் 3 ஆண்டுகள் பயிர் சுழற்சி மேற்கொள்ளவும்."
        ],
        "nasa_risk_indicators": {
            "temp_range_c": [22, 30],
            "humidity_min_pct": 75,
            "risk_summary_en": "Warm daylight temperatures followed by dew create high spore germination potential.",
            "risk_summary_ta": "பகல் நேர வெப்பமும் இரவு பனிப்பொழிவும் பூஞ்சை வித்துக்கள் பரவ உகந்தது."
        }
    },

    "Potato___healthy": {
        "raw_class": "Potato___healthy",
        "crop_en": "Potato",
        "crop_ta": "உருளைக்கிழங்கு",
        "disease_name_en": "Healthy Crop",
        "disease_name_ta": "ஆரோக்கியமான பயிர்",
        "causal_agent": "None",
        "pathogen_type": "None",
        "is_healthy": True,
        "severity": "None",
        "symptoms_en": [
            "Lush green foliage with uniform spread across ridges.",
            "Stems are firm, erect with zero lesion formation.",
            "No chlorosis or blight symptoms visible."
        ],
        "symptoms_ta": [
            "செழிப்பான பச்சை நிற இலைகள் மற்றும் சமச்சீரான கிளைகளின் வளர்ச்சி.",
            "திடமான தண்டுகள், எந்தவித கருப்பு அல்லது பழுப்பு புள்ளிகள் இன்றி காணப்படும்.",
            "இலை மஞ்சள் அல்லது கருகல் அறிகுறிகள் எதுவும் இல்லை."
        ],
        "causes_en": ["Optimal soil moisture and good management practices."],
        "causes_ta": ["முறையான பாசனம் மற்றும் நல்ல ஊட்டச்சத்து பராமரிப்பு."],
        "organic_controls_en": ["Apply biofertilizers (Azospirillum & Phosphobacteria) during earthing-up."],
        "organic_controls_ta": ["மண் அணைக்கும் போது அசோஸ்பைரில்லம் மற்றும் பாஸ்போபாக்டீரியா இடவும்."],
        "chemical_controls_en": ["No chemical treatment required."],
        "chemical_controls_ta": ["ரசாயன மருந்துகள் தேவையில்லை."],
        "preventive_measures_en": ["Proper hilling up to protect developing tubers from tuber moth and sunlight."],
        "preventive_measures_ta": ["கிழங்குகள் வெயிலில் படாதவாறு நல்ல முறையில் மண் அணைக்கவும்."],
        "nasa_risk_indicators": {
            "temp_range_c": [15, 25],
            "humidity_min_pct": 50,
            "risk_summary_en": "Favorable environmental conditions for tuberization.",
            "risk_summary_ta": "கிழங்கு திரட்சிக்கு உகந்த சீரான வானிலை நிலவுகிறது."
        }
    },

    "Potato___Late_blight": {
        "raw_class": "Potato___Late_blight",
        "crop_en": "Potato",
        "crop_ta": "உருளைக்கிழங்கு",
        "disease_name_en": "Late Blight",
        "disease_name_ta": "பின்பருவ கருகல் நோய் (கொடிய கருகல்)",
        "causal_agent": "Phytophthora infestans",
        "pathogen_type": "Oomycete / Water Mold",
        "is_healthy": False,
        "severity": "Critical",
        "symptoms_en": [
            "Water-soaked dark lesions rapidly appearing at leaf tips and margins.",
            "A delicate white downy/cottony mold visible on the underside of leaves during humid mornings.",
            "Entire foliage turns brown, collapses, and emits a distinctive foul rotting odor.",
            "Tubers develop dry, firm, reddish-brown granular rot beneath the skin."
        ],
        "symptoms_ta": [
            "இலைகளின் விளிம்புகள் மற்றும் நுனிகளில் நீர் ஊறிய கருமை நிற புள்ளிகள் தோன்றும்.",
            "அதிகாலை ஈரப்பதம் இருக்கும்போது இலைகளின் அடிப்பகுதியில் வெள்ளை நிற பஞ்சு போன்ற பூஞ்சை படலம் தென்படும்.",
            "முழு பயிரும் மிக விரைவாக கருகி அழுகி துர்நாற்றம் வீசும்.",
            "உருளைக்கிழங்கின் தோலுக்கு அடியில் செம்பழுப்பு நிற அழுகல் ஏற்படும்."
        ],
        "causes_en": [
            "Phytophthora infestans water mold spreading at explosive rates via airborne sporangia.",
            "Cool, cloudy, wet weather with temperatures between 12°C and 20°C and RH >90%.",
            "Infected seed tubers used during planting."
        ],
        "causes_ta": [
            "காற்றில் மிக வேகமாக பரவும் ஃபைட்டோப்த்தோரா இன்ஃபெஸ்டான்ஸ் பூஞ்சை வித்துக்கள்.",
            "குளிர்ந்த, மேகமூட்டமான, அதிக ஈரப்பதம் (>90%) கொண்ட வானிலை (12°C-20°C).",
            "நோயுற்ற விதைத் தும்புகளை நடவு செய்தல்."
        ],
        "organic_controls_en": [
            "Prophylactic foliar spray of Bordeaux mixture (1%) before disease onset.",
            "Spray copper hydroxide formulations @ 2 g/litre.",
            "Remove and incinerate blighted haulms immediately to protect tubers."
        ],
        "organic_controls_ta": [
            "நோய் தொடங்கும் முன் 1% போர்டோ கலவை தெளித்து பயிரை பாதுகாக்கவும்.",
            "காப்பர் ஹைட்ராக்சைடு லிட்டருக்கு 2 கிராம் வீதம் தெளிக்கவும்.",
            "பாதிக்கப்பட்ட பயிர் பாகங்களை உடனே வெட்டி அழித்து கிழங்கிற்கு பரவாமல் தடுக்கவும்."
        ],
        "chemical_controls_en": [
            "Systemic action: Metalaxyl 8% + Mancozeb 64% WP (Ridomil MZ) @ 2.5 g/litre of water.",
            "Alternative for resistant strains: Cymoxanil 8% + Mancozeb 64% WP @ 2.5 g/litre or Dimethomorph 50% WP @ 1 g/litre."
        ],
        "chemical_controls_ta": [
            "மெட்டலாக்சில் + மேன்கோசெப் (Ridomil MZ) லிட்டருக்கு 2.5 கிராம் வீதம் தண்ணீரில் கலந்து தெளிக்கவும்.",
            "சைமாக்ஸனில் + மேன்கோசெப் (2.5 கிராம்/லிட்டர்) அல்லது டைமித்தோமார்ப் (1 கிராம்/லிட்டர்) தெளிக்கவும்."
        ],
        "preventive_measures_en": [
            "Always source certified late blight-free seed tubers.",
            "Kill potato vines (haulm cutting) 10-14 days before harvesting tubers.",
            "Ensure high ridges so spores cannot wash down into tubers."
        ],
        "preventive_measures_ta": [
            "நோய் தாக்காத சான்றளிக்கப்பட்ட விதைத் தும்புகளை மட்டுமே பயன்படுத்தவும்.",
            "அறுவடைக்கு 10-14 நாட்களுக்கு முன் செடியின் மேற்பகுதியை வெட்டி அகற்றவும்.",
            "பூஞ்சை வித்துக்கள் கிழங்கில் இறங்காதவாறு நல்ல முறையில் மண் அணைக்கவும்."
        ],
        "nasa_risk_indicators": {
            "temp_range_c": [12, 22],
            "humidity_min_pct": 90,
            "smap_moisture_elevated": True,
            "risk_summary_en": "CRITICAL RISK: High humidity and cool overcast conditions trigger explosive spore reproduction.",
            "risk_summary_ta": "அபாயகரமான சூழல்: அதிக ஈரப்பதம் மற்றும் குளிர்ந்த வானிலை இந்நோய் மிக வேகமாக பரவ வழிவகுக்கும்."
        }
    },

    "Tomato_Bacterial_spot": {
        "raw_class": "Tomato_Bacterial_spot",
        "crop_en": "Tomato",
        "crop_ta": "தக்காளி",
        "disease_name_en": "Bacterial Spot",
        "disease_name_ta": "பாக்டீரியா இலைப்புள்ளி நோய்",
        "causal_agent": "Xanthomonas perforans / vesicatoria",
        "pathogen_type": "Bacterial",
        "is_healthy": False,
        "severity": "High",
        "symptoms_en": [
            "Small, greasy, water-soaked spots on leaves that turn dark brown to black.",
            "Centers of older spots may tear out, giving a 'shot-hole' appearance.",
            "Brown scab-like spots with sunken halos on green and ripe tomato fruits."
        ],
        "symptoms_ta": [
            "இலைகளில் சிறிய, எண்ணெய் போன்ற நீர் ஊறிய கருமை நிற புள்ளிகள் உருவாகும்.",
            "பழைய புள்ளிகளின் மையப்பகுதி உதிர்ந்து ஓட்டை விழுந்தது போல் காட்சியளிக்கும்.",
            "தக்காளி காய்கள் மற்றும் பழங்கள் மீது சொரசொரப்பான பழுப்பு நிற புள்ளிகள் தோன்றும்."
        ],
        "causes_en": [
            "Seed-borne and volunteer tomato weed hosts.",
            "Spread by rain splash, handling wet plants, and overhead watering.",
            "Warm temperatures (25°C–30°C) with persistent leaf wetness."
        ],
        "causes_ta": [
            "விதைகள் மற்றும் பண்ணை களைகள் மூலம் தங்கி வாழும் பாக்டீரியா.",
            "மழை நீர் தெளிப்பு மற்றும் ஈரமாக இருக்கும்போது பயிர்களை கையாளுதல்.",
            "வெப்பமான சூழலும் (25°C-30°C) இலைகளில் நீண்ட நேரம் நீர் தங்குவதும் காரணம்."
        ],
        "organic_controls_en": [
            "Spray Pseudomonas fluorescens @ 10 g/litre at 10-day intervals.",
            "Foliar application of copper-based organic formulations or fermented buttermilk spray (5%)."
        ],
        "organic_controls_ta": [
            "சூடோமோனாஸ் ஃப்ளூரசன்ஸ் லிட்டருக்கு 10 கிராம் கலந்து 10 நாட்கள் இடைவெளியில் தெளிக்கவும்.",
            "புளித்த மோர் கரைசல் (5%) அல்லது இயற்கை செம்பு தெளிப்பான் பயன்படுத்தவும்."
        ],
        "chemical_controls_en": [
            "Copper Oxychloride 50% WP @ 2.5 g/litre + Streptocycline @ 1 g/10 litres water.",
            "Bacterimycin @ 2 g/10 litres water as alternate treatment."
        ],
        "chemical_controls_ta": [
            "காப்பர் ஆக்சிகுளோரைடு லிட்டருக்கு 2.5 கிராம் + ஸ்ட்ரெப்டோமைசின் 1 கிராம்/10 லிட்டர் நீரில் கலந்து தெளிக்கவும்.",
            "பாக்டீரியமைசின் 2 கிராம்/10 லிட்டர் தெளிக்கலாம்."
        ],
        "preventive_measures_en": [
            "Hot water soak seeds at 50°C for 25 minutes before seedling nursery.",
            "Stake plants and mulch soil to prevent soil splashing onto bottom leaves.",
            "Avoid field operations while foliage is wet."
        ],
        "preventive_measures_ta": [
            "நாற்றங்கால் அமைக்கும் முன் விதைகளை 50°C வெந்நீரில் 25 நிமிடம் ஊறவைத்து விதை நேர்த்தி செய்யவும்.",
            "செடிகளை குச்சிகள் கொண்டு கட்டி மண் தெறிக்காதவாறு நிலப்போர்வை (mulch) இடவும்.",
            "இலைகள் ஈரமாக இருக்கும்போது களப்பணிகள் செய்வதை தவிர்க்கவும்."
        ],
        "nasa_risk_indicators": {
            "temp_range_c": [24, 32],
            "humidity_min_pct": 80,
            "risk_summary_en": "Persistent rainfall and humid wind elevate bacterial infection cycles.",
            "risk_summary_ta": "தொடர் மழை மற்றும் ஈரப்பதக் காற்று பாக்டீரியா பரவலை துரிதப்படுத்தும்."
        }
    },

    "Tomato_Early_blight": {
        "raw_class": "Tomato_Early_blight",
        "crop_en": "Tomato",
        "crop_ta": "தக்காளி",
        "disease_name_en": "Early Blight",
        "disease_name_ta": "ஆரம்பகால கருகல் நோய்",
        "causal_agent": "Alternaria solani",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "severity": "Moderate",
        "symptoms_en": [
            "Brown spots with prominent concentric rings resembling a target board on older leaves.",
            "Extensive yellowing surrounds each lesion.",
            "Dark, sunken, leathery lesions near the stem end of fruits."
        ],
        "symptoms_ta": [
            "கீழ் இலைகளில் வட்ட வட்ட வளையங்களுடன் கூடிய பழுப்பு நிற புள்ளிகள் தோன்றும்.",
            "புள்ளிகளைச் சுற்றி இலை மஞ்சள் நிறமாக மாறும்.",
            "பழங்களின் காம்புப் பகுதியில் கருமை நிற தடித்த பள்ளமான புண்கள் உண்டாகும்."
        ],
        "causes_en": [
            "Fungal spores surviving on diseased solanaceous plant debris.",
            "Frequent heavy dew, frequent rain, and temperatures between 24°C and 30°C."
        ],
        "causes_ta": [
            "மண்ணிலுள்ள பயிர் எச்சங்களில் பூஞ்சை தங்கி இருப்பது.",
            "அடிக்கடி பெய்யும் மழை, பனி மற்றும் 24°C-30°C வெப்ப நிலை."
        ],
        "organic_controls_en": [
            "Foliar spray of Trichoderma viride @ 5 g/litre.",
            "Neem oil spray (3 ml/litre) with natural soap emulsifier."
        ],
        "organic_controls_ta": [
            "டிரைக்கோடெர்மா விரிடி லிட்டருக்கு 5 கிராம் நீரில் கலந்து தெளிக்கவும்.",
            "வேப்பெண்ணெய் லிட்டருக்கு 3 மிலி வீதம் காதி சோப்புடன் கலந்து தெளிக்கவும்."
        ],
        "chemical_controls_en": [
            "Mancozeb 75% WP @ 2 g/litre or Propineb 70% WP @ 2 g/litre.",
            "Tebuconazole 25.9% EC @ 1 ml/litre during heavy disease pressure."
        ],
        "chemical_controls_ta": [
            "மேன்கோசெப் 75% WP (Mancozeb) லிட்டருக்கு 2 கிராம் அல்லது புரோபினெப் 2 கிராம் தெளிக்கவும்.",
            "பாதிப்பு அதிகமாக இருப்பின் டெபுகோனசோல் (Tebuconazole) லிட்டருக்கு 1 மிலி தெளிக்கவும்."
        ],
        "preventive_measures_en": [
            "Prune bottom suckers and foliage touching the ground.",
            "Drip irrigation to keep foliage dry.",
            "Rotate crops with non-solanaceous species."
        ],
        "preventive_measures_ta": [
            "மண்ணைத் தொடும் அடி இலைகளை கவாத்து செய்து அகற்றவும்.",
            "இலைகள் நனையாமல் சொட்டு நீர் பாசனம் பயன்படுத்தவும்.",
            "பயிர் சுழற்சி முறையை தவறாமல் பின்பற்றவும்."
        ],
        "nasa_risk_indicators": {
            "temp_range_c": [22, 30],
            "humidity_min_pct": 75,
            "risk_summary_en": "Elevated leaf wetness triggers germination of Alternaria spores.",
            "risk_summary_ta": "இலைகளில் ஈரப்பதம் நீடிக்கும்போது இந்நோய் பூஞ்சை வித்துக்கள் எளிதில் முளைக்கும்."
        }
    },

    "Tomato_healthy": {
        "raw_class": "Tomato_healthy",
        "crop_en": "Tomato",
        "crop_ta": "தக்காளி",
        "disease_name_en": "Healthy Crop",
        "disease_name_ta": "ஆரோக்கியமான பயிர்",
        "causal_agent": "None",
        "pathogen_type": "None",
        "is_healthy": True,
        "severity": "None",
        "symptoms_en": [
            "Deep green, well-expanded leaves without spots, curling, or chlorosis.",
            "Healthy floral clusters and uniform fruit set.",
            "Stout main stems with vigorous active terminal shoot growth."
        ],
        "symptoms_ta": [
            "எந்தவித புள்ளிகளும் சுருக்கங்களும் இல்லாத அடர் பச்சை நிற ஆரோக்கியமான இலைகள்.",
            "ஆரோக்கியமான பூங்கொத்துகள் மற்றும் சீரான பிஞ்சு பிடித்தல்.",
            "திடமான தண்டு மற்றும் வீரியமான குருத்து வளர்ச்சி."
        ],
        "causes_en": ["Optimal agronomic conditions and balanced fertility management."],
        "causes_ta": ["சரியான சத்து மற்றும் நீர் மேலாண்மை."],
        "organic_controls_en": ["Apply 3% Panchagavya spray every 15-20 days for sustained plant immunity."],
        "organic_controls_ta": ["15-20 நாட்களுக்கு ஒருமுறை 3% பஞ்சகாவ்யா தெளித்து நோய் எதிர்ப்பு சக்தியை காக்கவும்."],
        "chemical_controls_en": ["No chemical treatment required."],
        "chemical_controls_ta": ["ரசாயன மருந்துகள் தேவையில்லை."],
        "preventive_measures_en": ["Continue scheduled scouting and maintain trellis support."],
        "preventive_measures_ta": ["தொடர்ந்து பயிரை கவனித்து தாங்கு குச்சிகள் அமைத்து பராமரிக்கவும்."],
        "nasa_risk_indicators": {
            "temp_range_c": [20, 30],
            "humidity_min_pct": 50,
            "risk_summary_en": "Current environmental indices indicate good plant growth environment.",
            "risk_summary_ta": "தற்போதைய வானிலை பயிர் உற்பத்திக்கு மிகவும் சாதகமானது."
        }
    },

    "Tomato_Late_blight": {
        "raw_class": "Tomato_Late_blight",
        "crop_en": "Tomato",
        "crop_ta": "தக்காளி",
        "disease_name_en": "Late Blight",
        "disease_name_ta": "பின்பருவ கருகல் நோய் (கொடிய கருகல்)",
        "causal_agent": "Phytophthora infestans",
        "pathogen_type": "Oomycete",
        "is_healthy": False,
        "severity": "Critical",
        "symptoms_en": [
            "Irregular, water-soaked oily lesions on leaves that rapidly turn purplish-brown.",
            "White frost-like fungal downy growth on leaf undersides in high humidity.",
            "Large, greasy, firm brown lesions on green fruits leading to total fruit rot."
        ],
        "symptoms_ta": [
            "இலைகளில் நீர் ஊறிய ஒழுங்கற்ற புள்ளிகள் தோன்றி விரைவாக ஊதா-பழுப்பு நிறமாக மாறும்.",
            "அதிகாலை வேளையில் இலைகளின் அடிப்பகுதியில் வெள்ளை நிற பஞ்சு போன்ற பூஞ்சை படரும்.",
            "பச்சை தக்காளிகள் மீது எண்ணெய் பசை போன்ற பழுப்பு நிற பெரிய புள்ளிகள் தோன்றி காய் அழுகும்."
        ],
        "causes_en": [
            "Infection from nearby infected potato or tomato fields via windborne sporangia.",
            "Cool temperatures (15°C–22°C) combined with prolonged high relative humidity (>90%)."
        ],
        "causes_ta": [
            "அருகிலுள்ள உருளைக்கிழங்கு அல்லது தக்காளி வயல்களில் இருந்து காற்றில் பரவும் பூஞ்சை வித்துக்கள்.",
            "குளிர்ந்த சீதோஷ்ணமும் (15°C-22°C) மிக அதிக காற்று ஈரப்பதமும் (>90%)."
        ],
        "organic_controls_en": [
            "Spray Bordeaux mixture (1%) as a preventive protectant.",
            "Copper hydroxide (2 g/litre) before prolonged wet spells."
        ],
        "organic_controls_ta": [
            "முன்னெச்சரிக்கையாக 1% போர்டோ கலவை தெளிக்கவும்.",
            "மழைக்காலம் தொடங்கும் முன் காப்பர் ஹைட்ராக்சைடு லிட்டருக்கு 2 கிராம் தெளிக்கவும்."
        ],
        "chemical_controls_en": [
            "Dimethomorph 50% WP @ 1 g/litre + Mancozeb @ 2 g/litre.",
            "Metalaxyl-M 4% + Mancozeb 64% WP @ 2.5 g/litre immediately upon detection."
        ],
        "chemical_controls_ta": [
            "டைமெத்தோமார்ப் லிட்டருக்கு 1 கிராம் + மேன்கோசெப் 2 கிராம் கலந்து தெளிக்கவும்.",
            "மெட்டலாக்சில்-எம் + மேன்கோசெப் லிட்டருக்கு 2.5 கிராம் வீதம் உடனடியாக தெளிக்கவும்."
        ],
        "preventive_measures_en": [
            "Avoid planting tomatoes immediately adjacent to potato fields.",
            "Ensure wide plant spacing for excellent canopy airflow."
        ],
        "preventive_measures_ta": [
            "உருளைக்கிழங்கு பயிரிடப்பட்ட நிலத்தின் அருகே தக்காளி பயிரிடுவதை தவிர்க்கவும்.",
            "செடிகளுக்கு இடையே போதுமான இடைவெளி விட்டு காற்றோட்டத்தை அதிகரிக்கவும்."
        ],
        "nasa_risk_indicators": {
            "temp_range_c": [14, 22],
            "humidity_min_pct": 88,
            "smap_moisture_elevated": True,
            "risk_summary_en": "EXTREME RISK: Cool overcast conditions with high SMAP moisture accelerate late blight spread.",
            "risk_summary_ta": "அதிதீவிர அபாயம்: குளிர்ந்த வானிலையும் அதிக ஈரப்பதமும் இந்நோயை மிக வேகமாக பரவச் செய்யும்."
        }
    },

    "Tomato_Leaf_Mold": {
        "raw_class": "Tomato_Leaf_Mold",
        "crop_en": "Tomato",
        "crop_ta": "தக்காளி",
        "disease_name_en": "Leaf Mold",
        "disease_name_ta": "இலை பூஞ்சை நோய்",
        "causal_agent": "Passalora fulva (Cladosporium fulvum)",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "severity": "Moderate",
        "symptoms_en": [
            "Pale greenish-yellow chlorotic spots with diffuse margins on upper leaf surfaces.",
            "Olive-green to velvety brown mold growth directly underneath the spots on the lower leaf surface.",
            "Infected leaves curl, wither, and drop prematurely."
        ],
        "symptoms_ta": [
            "இலைகளின் மேல் பகுதியில் வெளிறிய மஞ்சள்-பச்சை நிற புள்ளிகள் தோன்றும்.",
            "அதே புள்ளிகளுக்கு நேர் கீழே, இலைகளின் அடிப்பகுதியில் வெல்வெட் போன்ற ஆலிவ்-பச்சை அல்லது பழுப்பு பூஞ்சை படரும்.",
            "இலைகள் சுருண்டு, காய்ந்து முன்கூட்டியே உதிர்ந்துவிடும்."
        ],
        "causes_en": [
            "Favored by poor air circulation, dense canopies, and high relative humidity (>85%).",
            "Temperatures between 21°C and 24°C."
        ],
        "causes_ta": [
            "காற்றோட்டம் இல்லாத அடர்த்தியான பயிர் வளர்ச்சி மற்றும் அதிக ஈரப்பதம் (>85%).",
            "21°C முதல் 24°C வரையிலான மிதமான வெப்பநிலை."
        ],
        "organic_controls_en": [
            "Foliar spray of baking soda (sodium bicarbonate @ 5 g/litre) with horticultural oil.",
            "Apply Bacillus amyloliquefaciens biofungicide."
        ],
        "organic_controls_ta": [
            "சமையல் சோடா லிட்டருக்கு 5 கிராம் + எண்ணெய் கரைசல் தெளிக்கவும்.",
            "பேசில்லஸ் உயிரி பூஞ்சாணக்கொல்லி தெளிக்கவும்."
        ],
        "chemical_controls_en": [
            "Difenoconazole 25% EC @ 0.5 to 1 ml/litre.",
            "Chlorothalonil 75% WP @ 2 g/litre."
        ],
        "chemical_controls_ta": [
            "டைபெனோகோனசோல் (Difenoconazole) லிட்டருக்கு 0.5 முதல் 1 மிலி தெளிக்கவும்.",
            "குளோரோதலோனில் லிட்டருக்கு 2 கிராம் தெளிக்கவும்."
        ],
        "preventive_measures_en": [
            "Prune suckers and stake plants to maximize canopy airflow.",
            "Ventilate polyhouses and greenhouses continuously."
        ],
        "preventive_measures_ta": [
            "செடிகளை கவாத்து செய்து காற்றோட்டத்தை அதிகரிக்கவும்.",
            "பசுமைக்குடில்களில் காற்றோட்டத்தை தொடர்ந்து சீராக வைக்கவும்."
        ],
        "nasa_risk_indicators": {
            "temp_range_c": [20, 26],
            "humidity_min_pct": 85,
            "risk_summary_en": "High localized humidity and dense canopy foster leaf mold development.",
            "risk_summary_ta": "அதிக ஈரப்பதம் மற்றும் பயிரின் அடர்த்தி இலை பூஞ்சை வளர சாதகமாகிறது."
        }
    },

    "Tomato_Septoria_leaf_spot": {
        "raw_class": "Tomato_Septoria_leaf_spot",
        "crop_en": "Tomato",
        "crop_ta": "தக்காளி",
        "disease_name_en": "Septoria Leaf Spot",
        "disease_name_ta": "செப்டோரியா இலைப்புள்ளி நோய்",
        "causal_agent": "Septoria lycopersici",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "severity": "High",
        "symptoms_en": [
            "Numerous small, circular spots (1.5–3 mm) with gray or tan centers and dark brown margins.",
            "Tiny black specks (pycnidia fruiting bodies) clearly visible inside the center of spots.",
            "Disease moves rapidly upward from bottom leaves, causing extensive defoliation."
        ],
        "symptoms_ta": [
            "இலைகளில் சிறிய வட்ட வடிவ புள்ளிகள் (சாம்பல் அல்லது வெளிறிய பழுப்பு நடுப்பகுதி, கருமை விளிம்பு).",
            "புள்ளிகளின் மையத்தில் சிறிய கருப்பு புள்ளிகள் (பூஞ்சை வித்துப்பைகள்) தென்படும்.",
            "அடி இலைகளில் இருந்து மேல்நோக்கி மிக வேகமாக பரவி அனைத்து இலைகளையும் உதிர்க்கும்."
        ],
        "causes_en": [
            "Overwinters on infected nightshade weeds and tomato plant debris.",
            "Rain splash and sprinkler droplets spread spores from soil to lower leaves."
        ],
        "causes_ta": [
            "மண்ணிலுள்ள பயிர் கழிவுகள் மற்றும் களைகளில் பூஞ்சை உயிர் வாழ்கிறது.",
            "மழை நீர் தெறிப்பதன் மூலம் மண்ணிலிருந்து கீழ் இலைகளுக்கு பரவுகிறது."
        ],
        "organic_controls_en": [
            "Copper soap (copper octanoate) foliar spray @ 2.5 ml/litre.",
            "Pseudomonas fluorescens @ 5 g/litre every 14 days."
        ],
        "organic_controls_ta": [
            "செம்பு சோப்புக் கரைசல் லிட்டருக்கு 2.5 மிலி தெளிக்கவும்.",
            "சூடோமோனாஸ் ஃப்ளூரசன்ஸ் லிட்டருக்கு 5 கிராம் வீதம் 14 நாட்களுக்கு ஒருமுறை தெளிக்கவும்."
        ],
        "chemical_controls_en": [
            "Chlorothalonil 75% WP @ 2 g/litre or Mancozeb 75% WP @ 2.5 g/litre.",
            "Carbendazim 12% + Mancozeb 63% WP (Saaf) @ 2 g/litre."
        ],
        "chemical_controls_ta": [
            "குளோரோதலோனில் (2 கிராம்/லிட்டர்) அல்லது மேன்கோசெப் (2.5 கிராம்/லிட்டர்) தெளிக்கவும்.",
            "கார்பென்டாசிம் + மேன்கோசெப் (Saaf) லிட்டருக்கு 2 கிராம் நீரில் கலந்து தெளிக்கவும்."
        ],
        "preventive_measures_en": [
            "Mulch heavily under plants to create a physical barrier against soil splashing.",
            "Do not work in the field when vines are wet."
        ],
        "preventive_measures_ta": [
            "மண் தெறிக்காமல் இருக்க செடிகளைச் சுற்றி வைக்கோல் அல்லது பிளாஸ்டிக் நிலப்போர்வை இடவும்.",
            "செடிகள் ஈரமாக உள்ளபோது இலைகளை தொடுவதை தவிர்க்கவும்."
        ],
        "nasa_risk_indicators": {
            "temp_range_c": [20, 28],
            "humidity_min_pct": 80,
            "risk_summary_en": "Wet weather combined with soil splashing creates high infection pressure.",
            "risk_summary_ta": "மழை மற்றும் மண் தெறிப்பு செப்டோரியா நோய் பரவ காரணிகளாகின்றன."
        }
    },

    "Tomato_Spider_mites_Two_spotted_spider_mite": {
        "raw_class": "Tomato_Spider_mites_Two_spotted_spider_mite",
        "crop_en": "Tomato",
        "crop_ta": "தக்காளி",
        "disease_name_en": "Two-Spotted Spider Mite Infestation",
        "disease_name_ta": "இருபுள்ளி செம்பேன் தாக்குதல்",
        "causal_agent": "Tetranychus urticae",
        "pathogen_type": "Pest / Arachnid",
        "is_healthy": False,
        "severity": "Moderate to High",
        "symptoms_en": [
            "Yellow stippling or bronzing on upper leaf surfaces caused by sap feeding.",
            "Fine, silky webbing spanning leaf undersides, growing tips, and fruit clusters.",
            "Leaves turn completely dry, brown, and brittle, severely stunting fruit growth."
        ],
        "symptoms_ta": [
            "இலைகளின் மேல் பகுதியில் மஞ்சள் நிற புள்ளிகள் மற்றும் வெண்கல நிற திட்டுக்கள் தோன்றும்.",
            "இலைகளின் அடியிலும் நுனிப்பகுதியிலும் மெல்லிய சிலந்தி வலை போன்ற நூல் வலைகள் காணப்படும்.",
            "இலைகள் காய்ந்து கருகி, செடியின் வளர்ச்சி மற்றும் காய் பிடிப்பது முற்றிலும் தடைபடும்."
        ],
        "causes_en": [
            "Hot, dry, and dusty weather conditions.",
            "Overuse of broad-spectrum synthetic pyrethroids that eliminate natural predatory mites."
        ],
        "causes_ta": [
            "வெப்பமான, வறண்ட மற்றும் தூசு நிறைந்த வானிலை சூழல்.",
            "நன்மை செய்யும் பூச்சிகளை அழிக்கும் வீரியமிக்க பூச்சிக்கொல்லிகளை தவறாக பயன்படுத்துதல்."
        ],
        "organic_controls_en": [
            "Spray Neem oil 10,000 ppm (3 ml/litre) targeting leaf undersides.",
            "Release predatory mites (Phytoseiulus persimilis) for biological control.",
            "Spray Beauveria bassiana bio-insecticide @ 5 g/litre."
        ],
        "organic_controls_ta": [
            "வேப்பெண்ணெய் (Neem oil 10,000 ppm) லிட்டருக்கு 3 மிலி கலந்து இலைகளின் அடிப்பகுதியில் படுமாறு தெளிக்கவும்.",
            "இயற்கை வேட்டையாடும் சிலந்திகளை (Phytoseiulus) வயலில் விடவும்.",
            "பவேரியா பேசியானா (Beauveria bassiana) லிட்டருக்கு 5 கிராம் தெளிக்கவும்."
        ],
        "chemical_controls_en": [
            "Propargite 57% EC @ 2 ml/litre or Spiromesifen 22.9% SC @ 1 ml/litre.",
            "Abamectin 1.9% EC @ 0.5 ml/litre for severe resistance outbreaks."
        ],
        "chemical_controls_ta": [
            "புரோபார்கைட் (Propargite) லிட்டருக்கு 2 மிலி அல்லது ஸ்பைரோமெசிஃபென் லிட்டருக்கு 1 மிலி தெளிக்கவும்.",
            "தாக்குதல் மிக அதிகமாக இருப்பின் அபாமெக்டின் (Abamectin) லிட்டருக்கு 0.5 மிலி தெளிக்கவும்."
        ],
        "preventive_measures_en": [
            "Keep farm borders and paths damp to minimize dust accumulation.",
            "Maintain adequate soil hydration via regular drip irrigation."
        ],
        "preventive_measures_ta": [
            "வயல் வரப்புகளில் தூசு எழாமல் ஈரப்பதத்தை பராமரிக்கவும்.",
            "வழக்கமான சொட்டு நீர் பாசனம் மூலம் மண்ணின் ஈரப்பதத்தை சமநிலையில் வைக்கவும்."
        ],
        "nasa_risk_indicators": {
            "temp_range_c": [28, 38],
            "humidity_max_pct": 55,
            "risk_summary_en": "High temperatures and dry air (low humidity) drastically accelerate mite reproduction.",
            "risk_summary_ta": "அதிக வெப்பமும் குறைந்த ஈரப்பதமும் செம்பேன் பெருக்கத்தை பன்மடங்கு விரைவுபடுத்துகிறது."
        }
    },

    "Tomato__Target_Spot": {
        "raw_class": "Tomato__Target_Spot",
        "crop_en": "Tomato",
        "crop_ta": "தக்காளி",
        "disease_name_en": "Target Spot",
        "disease_name_ta": "இலக்கு புள்ளி நோய்",
        "causal_agent": "Corynespora cassiicola",
        "pathogen_type": "Fungal",
        "is_healthy": False,
        "severity": "Moderate",
        "symptoms_en": [
            "Pinpoint brown lesions with light brown centers and dark margins.",
            "Lesions enlarge to show concentric target-like rings on leaves, stems, and fruits.",
            "Sunken circular lesions with dark brown margins on fruits."
        ],
        "symptoms_ta": [
            "இலைகளில் சிறிய பழுப்பு புள்ளிகள் தோன்றி பின்னர் பெரிதாகும்.",
            "இலைகள், தண்டுகள் மற்றும் பழங்களில் வட்ட இலக்கு போன்ற வளையங்கள் தோன்றும்.",
            "பழங்களில் பள்ளமான வட்ட வடிவ பழுப்பு நிற தழும்புகள் உண்டாகும்."
        ],
        "causes_en": [
            "Fungus survives in crop residues and wide alternate weed hosts.",
            "Warm, humid conditions with extended leaf wetness."
        ],
        "causes_ta": [
            "பயிர் எச்சங்கள் மற்றும் களைகளில் பூஞ்சை உயிர் வாழ்தல்.",
            "வெப்பமான மற்றும் ஈரப்பதமான சூழலில் நீண்ட நேரம் இலைகள் நனைந்திருத்தல்."
        ],
        "organic_controls_en": [
            "Spray Trichoderma viride @ 5 g/litre mixed with bio-enhancers.",
            "Foliar spray of 5% cow urine + Asafoetida (perungayam) solution."
        ],
        "organic_controls_ta": [
            "டிரைக்கோடெர்மா விரிடி லிட்டருக்கு 5 கிராம் நீரில் கலந்து தெளிக்கவும்.",
            "5% கோமியம் + பெருங்காயக் கரைசல் தெளிக்கவும்."
        ],
        "chemical_controls_en": [
            "Azoxystrobin 23% SC @ 1 ml/litre or Pyraclostrobin 20% WG @ 1 g/litre.",
            "Mancozeb 75% WP @ 2.5 g/litre as protective spray."
        ],
        "chemical_controls_ta": [
            "அசோக்சிஸ்ட்ரோபின் லிட்டருக்கு 1 மிலி அல்லது பைராக்ளோஸ்ட்ரோபின் 1 கிராம் தெளிக்கவும்.",
            "மேன்கோசெப் 75% WP லிட்டருக்கு 2.5 கிராம் பாதுகாப்பு தெளிப்பாக தெளிக்கவும்."
        ],
        "preventive_measures_en": [
            "Ensure wide spacing and remove all old infected debris after harvest.",
            "Avoid overhead irrigation."
        ],
        "preventive_measures_ta": [
            "பயிர்களுக்கு இடையே சரியான இடைவெளி விட்டு, அறுவடைக்கு பின் எச்சங்களை அழிக்கவும்.",
            "தெளிப்பு நீர் பாசனத்தை முற்றிலும் தவிர்க்கவும்."
        ],
        "nasa_risk_indicators": {
            "temp_range_c": [24, 32],
            "humidity_min_pct": 80,
            "risk_summary_en": "Moderate to high temperatures with sustained humidity promote target spot.",
            "risk_summary_ta": "அதிக வெப்பமும் தொடர் ஈரப்பதமும் இந்நோய் வளர்ச்சிக்கு சாதகமாகிறது."
        }
    },

    "Tomato__Tomato_mosaic_virus": {
        "raw_class": "Tomato__Tomato_mosaic_virus",
        "crop_en": "Tomato",
        "crop_ta": "தக்காளி",
        "disease_name_en": "Tomato Mosaic Virus (ToMV)",
        "disease_name_ta": "தக்காளி மொசைக் வைரஸ் நோய்",
        "causal_agent": "Tomato mosaic tobamovirus (ToMV)",
        "pathogen_type": "Viral",
        "is_healthy": False,
        "severity": "High",
        "symptoms_en": [
            "Mottling of leaves with alternating light and dark green mosaic patterns.",
            "Leaf distortion, blistering, and stringy 'fern-like' leaves.",
            "Severe stunting of young plants and internal brown browning of fruit walls."
        ],
        "symptoms_ta": [
            "இலைகளில் வெளிறிய மற்றும் அடர் பச்சை நிறத்தில் பல வண்ண சித்திர (மொசைக்) திட்டுகள் தோன்றும்.",
            "இலைகள் சுருங்கி, திரிந்து, மெல்லிய நாடா அல்லது ஃபர்ன் இலை போல மாறும்.",
            "செடிகளின் வளர்ச்சி குன்றி, பழங்களின் உட்புறத்தில் பழுப்பு நிற கோடுகள் உண்டாகும்."
        ],
        "causes_en": [
            "Mechanically transmitted via worker hands, pruning shears, and contaminated tools.",
            "Extremely stable virus that survives indefinitely on dry plant debris and seed surfaces."
        ],
        "causes_ta": [
            "வேலையாட்களின் கைகள், கவாத்து கத்தரிக்கோல் மற்றும் உபகரணங்கள் மூலம் எளிதில் பரவும்.",
            "பயிர் எச்சங்கள் மற்றும் விதைகளின் மேற்பரப்பில் பல ஆண்டுகள் அழியாமல் வாழும் வைரஸ்."
        ],
        "organic_controls_en": [
            "No chemical cure exists for viral diseases; infected plants must be rogued out and burned.",
            "Spray skimmed milk or cow milk solution (100 ml/litre) before pruning to neutralize virus transmission on tools.",
            "Dip tools in 20% non-fat dry milk or 10% trisodium phosphate (TSP) solution."
        ],
        "organic_controls_ta": [
            "வைரஸ் நோய்களுக்கு நேரடி மருந்து கிடையாது; பாதிக்கப்பட்ட செடிகளை உடனே பிடுங்கி எரிக்க வேண்டும்.",
            "கவாத்து செய்வதற்கு முன் 10% பசும்பால் கரைசல் தெளித்து வைரஸ் கருவிகள் வழி பரவுவதை தடுக்கவும்.",
            "வேலை கருவிகளை 10% சோடியம் பாஸ்பேட் கரைசலில் கழுவவும்."
        ],
        "chemical_controls_en": [
            "No antiviral pesticide exists. Do NOT spray fungicides as they have zero effect.",
            "Control potential vector insects (aphids, thrips) using Imidacloprid 17.8% SL @ 0.5 ml/litre."
        ],
        "chemical_controls_ta": [
            "வைரஸை கொல்ல ரசாயன மருந்துகள் இல்லை. பூஞ்சாண மருந்துகளை தெளிக்க வேண்டாம்.",
            "சாறு உறிஞ்சும் பூச்சிகளை கட்டுப்படுத்த இமிடாக்ளோபிரிட் லிட்டருக்கு 0.5 மிலி தெளிக்கவும்."
        ],
        "preventive_measures_en": [
            "Wash hands thoroughly with soap after handling tobacco products or infected plants.",
            "Use certified disease-free, heat-treated seeds.",
            "Immediately rogue (pull out and burn) infected plants."
        ],
        "preventive_measures_ta": [
            "புகையிலை பொருட்கள் பயன்படுத்திய பின் கைகளை சோப்பு போட்டு நன்கு கழுவவும்.",
            "சான்றளிக்கப்பட்ட விதை நேர்த்தி செய்யப்பட்ட விதைகளை மட்டுமே பயிரிடவும்.",
            "பாதிக்கப்பட்ட செடிகளை கண்டவுடன் வேரோடு பிடுங்கி தீ வைத்து அழிக்கவும்."
        ],
        "nasa_risk_indicators": {
            "temp_range_c": [22, 32],
            "humidity_min_pct": 40,
            "risk_summary_en": "Mechanical transmission risk peaks during active farm weeding and pruning seasons.",
            "risk_summary_ta": "பண்ணை வேலைகள் மற்றும் கவாத்து செய்யும் காலங்களில் மனிதர்கள் மூலமாக பரவும் அபாயம் அதிகம்."
        }
    },

    "Tomato__Tomato_YellowLeaf__Curl_Virus": {
        "raw_class": "Tomato__Tomato_YellowLeaf__Curl_Virus",
        "crop_en": "Tomato",
        "crop_ta": "தக்காளி",
        "disease_name_en": "Tomato Yellow Leaf Curl Virus (TYLCV)",
        "disease_name_ta": "தக்காளி இலை சுருட்டை வைரஸ் நோய்",
        "causal_agent": "Tomato yellow leaf curl begomovirus (TYLCV)",
        "pathogen_type": "Viral (Whitefly Vectored)",
        "is_healthy": False,
        "severity": "Critical",
        "symptoms_en": [
            "Severe upward cupping and curling of leaf margins into boat/cup shapes.",
            "Interveinal yellowing (chlorosis) with leaves remaining unusually small.",
            "Stunted, bushy plant architecture with complete cessation of fruit production if infected early."
        ],
        "symptoms_ta": [
            "இலைகளின் விளிம்புகள் மேல்நோக்கி கிண்ணம் அல்லது படகு போல் சுருண்டு காணப்படும்.",
            "இலை நரம்புகளுக்கு இடையே மஞ்சள் நிறமாதல், இலைகள் மிகச் சிறியதாக சுருங்குதல்.",
            "செடி புதர் போல் வளர்ச்சி குன்றி, பூக்கள் உதிர்ந்து காய் பிடிக்காமல் போகும்."
        ],
        "causes_en": [
            "Transmitted exclusively by the silverleaf whitefly (Bemisia tabaci).",
            "Continuous overlapping solanaceous crops in adjacent fields without host-free periods."
        ],
        "causes_ta": [
            "வெள்ளை ஈக்கள் (Bemisia tabaci) கடிப்பதன் மூலம் மட்டுமே பயிர்களுக்கு பரப்பப்படுகிறது.",
            "தொடர்ந்து தக்காளி மற்றும் கத்தரி பயிரிடுவதால் வெள்ளை ஈக்கள் எண்ணிக்கை பெருகுவது காரணம்."
        ],
        "organic_controls_en": [
            "Install bright Yellow Sticky Traps @ 15 to 20 traps/acre to trap adult whiteflies.",
            "Spray 5% Neem Seed Kernel Extract (NSKE) or Fish Amino Acid @ 5 ml/litre.",
            "Grow 3 border rows of tall barrier crops like Maize, Sorghum, or Pearl millet."
        ],
        "organic_controls_ta": [
            "வெள்ளை ஈக்களை கவர்ந்து அழிக்க ஏக்கருக்கு 15 முதல் 20 மஞ்சள் வண்ண ஒட்டும் பொறிகளை வைக்கவும்.",
            "5% வேப்பங்கொட்டை சாறு அல்லது மீன் அமிலம் லிட்டருக்கு 5 மிலி தெளிக்கவும்.",
            "வயலைச் சுற்றி மக்காச்சோளம், சோளம் அல்லது கம்பு ஆகியவற்றை 3 வரிசை எல்லைப் பயிராக வளர்க்கவும்."
        ],
        "chemical_controls_en": [
            "To control the vector whitefly: Diafenthiuron 50% WP @ 1.25 g/litre or Cyantraniliprole 10.26% OD @ 1.8 ml/litre.",
            "Alternate with Acetamiprid 20% SP @ 0.3 g/litre or Spiromesifen 22.9% SC @ 1 ml/litre."
        ],
        "chemical_controls_ta": [
            "வெள்ளை ஈக்களை கட்டுப்படுத்த: டயாபென்தியூரான் லிட்டருக்கு 1.25 கிராம் அல்லது சயான்ட்ரானிலிப்ரோல் 1.8 மிலி தெளிக்கவும்.",
            "அசிடமிப்ரிட் 20% SP லிட்டருக்கு 0.3 கிராம் அல்லது ஸ்பைரோமெசிஃபென் 1 மிலி தெளிக்கலாம்."
        ],
        "preventive_measures_en": [
            "Cover nursery beds with 40-mesh insect-proof nylon nets to prevent whitefly contact.",
            "Rogue out and destroy infected seedlings before transplanting into main field.",
            "Mulch with silver/reflective plastic film to repel whiteflies."
        ],
        "preventive_measures_ta": [
            "நாற்றங்கால்களை 40-மெஷ் நைலான் வலை கொண்டு மூடி வெள்ளை ஈக்கள் நுழையாமல் பாதுகாக்கவும்.",
            "நோய் தாக்கிய நாற்றுகளை நடும் முன்னரே கண்டறிந்து பிடுங்கி எரிக்கவும்.",
            "வெள்ளி நிற நிலப்போர்வை அமைத்து வெள்ளை ஈக்களை விரட்டவும்."
        ],
        "nasa_risk_indicators": {
            "temp_range_c": [28, 38],
            "humidity_max_pct": 65,
            "risk_summary_en": "Warm temperatures without rain dramatically spike whitefly populations and vector pressure.",
            "risk_summary_ta": "மழையற்ற வறண்ட அதிக வெப்பம் வெள்ளை ஈக்களின் எண்ணிக்கையை அதிகரித்து நோய் பரவலை கூட்டுகிறது."
        }
    }
}

def get_disease_info(raw_class: str) -> Optional[Dict[str, Any]]:
    """Retrieve verified advisory for a given class name."""
    return PLANT_DISEASE_KNOWLEDGE_BASE.get(raw_class)

def get_all_supported_classes() -> List[str]:
    """Return sorted list of all supported diagnostic classes."""
    return sorted(list(PLANT_DISEASE_KNOWLEDGE_BASE.keys()))
