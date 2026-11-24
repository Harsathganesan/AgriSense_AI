import json
import os

treatments_data = {
    "Apple___Apple_scab": {
        "crop": "Apple",
        "condition": "Apple scab",
        "is_healthy": False,
        "symptoms": "Olive-green to dark brown velvety spots on upper leaf surfaces and scabby lesions on fruits.",
        "cause": "Venturia inaequalis (Ascomycete fungus) flourishing in cool, wet spring weather.",
        "organic_treatment": "Apply liquid copper fungicide or sulfur spray before bud burst; prune infected twigs; apply neem oil emulsion weekly.",
        "chemical_treatment": "Captan, Mancozeb, or Difenoconazole spray following local agricultural advisory schedules.",
        "prevention": "Rake and destroy fallen leaves in autumn; prune canopy to promote rapid drying; plant scab-resistant cultivars like Honeycrisp or Enterprise."
    },
    "Apple___Black_rot": {
        "crop": "Apple",
        "condition": "Black rot",
        "is_healthy": False,
        "symptoms": "Purple flecks expanding into frog-eye leaf spots with brown centers; dark sunken cankers on limbs; mummified black fruit.",
        "cause": "Botryosphaeria obtusa fungus infecting through pruning wounds and mechanical injuries.",
        "organic_treatment": "Prune out dead wood and cankered branches at least 15 cm below infection; apply Bordeaux mixture during dormant season.",
        "chemical_treatment": "Thiophanate-methyl, Captan, or Pyraclostrobin during early growth phases.",
        "prevention": "Remove mummified fruit from the tree and floor; sanitize pruning shears with 70% isopropyl alcohol between cuts."
    },
    "Apple___Cedar_apple_rust": {
        "crop": "Apple",
        "condition": "Cedar apple rust",
        "is_healthy": False,
        "symptoms": "Bright yellow-orange or reddish spots on upper leaf surfaces; tube-like aecia structures beneath leaves.",
        "cause": "Gymnosporangium juniperi-virginianae (heteroecious fungus needing Juniper and Apple hosts).",
        "organic_treatment": "Sulfur sprays applied when cedar galls release orange gelatinous horns in early spring.",
        "chemical_treatment": "Myclobutanil or Propiconazole applied from pink bud stage through petal fall.",
        "prevention": "Remove nearby eastern red cedar / juniper trees within a 500-meter radius if feasible; plant rust-resistant apple varieties."
    },
    "Apple___Healthy": {
        "crop": "Apple",
        "condition": "Healthy",
        "is_healthy": True,
        "symptoms": "Vibrant, green foliage with intact margins, uniform texture, and no chlorotic or necrotic lesions.",
        "cause": "Optimal plant health and balanced nutrition.",
        "organic_treatment": "Maintain balanced organic matter, vermicompost, and regular foliar bio-fertilizer applications.",
        "chemical_treatment": "None needed. Do not apply unnecessary pesticides to preserve beneficial pollinators and soil microbes.",
        "prevention": "Conduct annual balanced pruning, maintain drip irrigation, and monitor weekly for early insect or fungal signs."
    },
    "Cherry___Healthy": {
        "crop": "Cherry",
        "condition": "Healthy",
        "is_healthy": True,
        "symptoms": "Glossy green leaves free of spots, discoloration, or curling.",
        "cause": "Optimal plant health and balanced soil condition.",
        "organic_treatment": "Regular seaweed extract spray and balanced compost application around drip line.",
        "chemical_treatment": "None needed.",
        "prevention": "Maintain proper tree spacing for air flow; monitor soil moisture to prevent drought or waterlogging stress."
    },
    "Cherry___Powdery_mildew": {
        "crop": "Cherry",
        "condition": "Powdery mildew",
        "is_healthy": False,
        "symptoms": "White to grayish powdery fungal growth on leaves, new shoots, and young fruit; leaf curling and distortion.",
        "cause": "Podosphaera clandestina fungus thriving in warm, dry weather with high ambient humidity.",
        "organic_treatment": "Potassium bicarbonate spray (3g/L) or diluted milk solution (1:9 with water); horticultural oils or sulfur dusting.",
        "chemical_treatment": "Myclobutanil, Fenbuconazole, or Quinoxyfen applied at shuck fall and repeat if conditions remain favorable.",
        "prevention": "Avoid excessive nitrogen fertilization which creates succulent susceptible growth; ensure sunlight penetration through annual pruning."
    },
    "Corn___Cercospora_leaf_spot": {
        "crop": "Corn",
        "condition": "Cercospora leaf spot (Gray leaf spot)",
        "is_healthy": False,
        "symptoms": "Rectangular, brown to gray necrotic lesions bounded strictly by leaf veins, coalescing into extensive blights.",
        "cause": "Cercospora zeae-maydis fungus thriving in high humidity, warm temps, and dense crop canopy.",
        "organic_treatment": "Foliar bio-control sprays with Trichoderma harzianum or Bacillus subtilis; copper oxychloride applications.",
        "chemical_treatment": "Azoxystrobin + Propiconazole or Pyraclostrobin applied at VT (tasseling) stage.",
        "prevention": "Practice 2-year crop rotation with non-host crops (soybean, cowpea); till crop residue to accelerate decomposition."
    },
    "Corn___Common_rust": {
        "crop": "Corn",
        "condition": "Common rust",
        "is_healthy": False,
        "symptoms": "Golden-brown to cinnamon-brown powdery pustules on both upper and lower leaf surfaces.",
        "cause": "Puccinia sorghi fungus spread via wind-blown airborne urediniospores.",
        "organic_treatment": "Neem cake soil amendment; foliar bio-fungicides such as Bacillus amyloliquefaciens.",
        "chemical_treatment": "Triazole or strobilurin fungicides (e.g., Pyraclostrobin, Tebuconazole) if disease reaches upper leaves prior to milk stage.",
        "prevention": "Plant rust-resistant corn hybrids; plant early in the season to escape peak spore dispersal."
    },
    "Corn___Healthy": {
        "crop": "Corn",
        "condition": "Healthy",
        "is_healthy": True,
        "symptoms": "Deep green, upright leaf blades free of pustules, striping, or lesion patches.",
        "cause": "Adequate nitrogen, phosphorus, and moisture balance.",
        "organic_treatment": "Side-dress with well-decomposed farmyard manure or vermicompost during knee-high stage.",
        "chemical_treatment": "None needed.",
        "prevention": "Maintain balanced N-P-K fertilization and keep fields free of broadleaf weeds."
    },
    "Corn___Northern_leaf_blight": {
        "crop": "Corn",
        "condition": "Northern leaf blight",
        "is_healthy": False,
        "symptoms": "Large, cigar-shaped, elliptical grayish-green or tan lesions (2 to 15 cm long) with dark spore clusters during damp weather.",
        "cause": "Exserohilum turcicum fungus favored by moderate temperatures (18-27°C) and extended leaf wetness.",
        "organic_treatment": "Apply copper hydroxide or bio-fungicide formulations containing Pseudomonas fluorescens.",
        "chemical_treatment": "Foliar fungicides such as Mancozeb, Azoxystrobin, or Trifloxystrobin.",
        "prevention": "Rotate out of corn for 1-2 seasons; bury infected debris; choose hybrids with Ht-gene resistance."
    },
    "Grape___Black_rot": {
        "crop": "Grape",
        "condition": "Black rot",
        "is_healthy": False,
        "symptoms": "Circular reddish-brown leaf spots with black border; fruit shrivels into hard, black, wrinkled mummies.",
        "cause": "Guignardia bidwellii fungus overwintering in cane lesions and shriveled fruit on vines.",
        "organic_treatment": "Copper-based fungicides or sulfur formulations applied before rainfall events.",
        "chemical_treatment": "Myclobutanil, Kresoxim-methyl, or Mancozeb from early shoot growth through veraison.",
        "prevention": "Prune out mummified clusters and infected canes during dormancy; maintain an open trellis canopy for rapid airflow."
    },
    "Grape___Esca_black_measles": {
        "crop": "Grape",
        "condition": "Esca (Black measles)",
        "is_healthy": False,
        "symptoms": "Interveinal tiger-stripe discoloration (yellow/red chlorosis with brown necrotic centers); small dark speckles on berry skin.",
        "cause": "Complex wood-rotting fungal pathogen team (Phaeomoniella chlamydospora, Phaeoacremonium aleophilum, Fomitiporia mediterranea).",
        "organic_treatment": "Seal all major pruning cuts immediately with wound paint or biological pastes containing Trichoderma spp.",
        "chemical_treatment": "No curative chemical exists once heartwood is invaded; prophylactic wound protection with pyraclostrobin or thiophanate-methyl.",
        "prevention": "Prune only in dry weather; delay pruning until late winter when wound healing is rapid; remove and burn severely declining vines."
    },
    "Grape___Healthy": {
        "crop": "Grape",
        "condition": "Healthy",
        "is_healthy": True,
        "symptoms": "Vigorous, dark-green vine leaves with clean vein networks and no spotting or curling.",
        "cause": "Well-balanced vine nutrition, suitable pruning, and healthy root system.",
        "organic_treatment": "Foliar seaweed / panchagavya spray; compost mulching around base.",
        "chemical_treatment": "None needed.",
        "prevention": "Proper shoot positioning and canopy suckering to maintain solar exposure."
    },
    "Grape___Leaf_blight": {
        "crop": "Grape",
        "condition": "Leaf blight (Isariopsis leaf spot)",
        "is_healthy": False,
        "symptoms": "Irregular dark brown necrotic patches on leaves, often leading to premature leaf shedding and reduced vine vigor.",
        "cause": "Pseudocercospora vitis (Isariopsis clavispora) fungal infection.",
        "organic_treatment": "Bordeaux mixture (1%) or copper oxychloride foliar spray.",
        "chemical_treatment": "Carbendazim, Mancozeb, or Difenoconazole applied at early symptom emergence.",
        "prevention": "Collect and compost or bury fallen infected leaves; avoid overhead irrigation that wets the grape canopy."
    },
    "Peach___Bacterial_spot": {
        "crop": "Peach",
        "condition": "Bacterial spot",
        "is_healthy": False,
        "symptoms": "Angular purple-black spots that drop out creating a 'shot-hole' appearance; deep pitting and gumming on fruit.",
        "cause": "Xanthomonas arboricola pv. pruni bacteria entering through natural stomata and wind-blown sand wounds.",
        "organic_treatment": "Copper sprays applied during dormancy and low-dose fixed copper at leaf emergence (monitor to prevent phytotoxicity).",
        "chemical_treatment": "Oxytetracycline or dodine sprays during early cover sprays where registered.",
        "prevention": "Plant resistant cultivars; plant windbreaks on sandy soils to reduce wind abrasion; avoid excessive nitrogen."
    },
    "Peach___Healthy": {
        "crop": "Peach",
        "condition": "Healthy",
        "is_healthy": True,
        "symptoms": "Clean, elongated lanceolate leaves of uniform green hue, free of gumming or shot-holes.",
        "cause": "Optimal tree vigor and effective pest monitoring.",
        "organic_treatment": "Organic compost application and balanced micronutrient spray (zinc, boron) as needed.",
        "chemical_treatment": "None needed.",
        "prevention": "Ensure good soil drainage; prune center for open vase sunlight architecture."
    },
    "Pepper_bell___Bacterial_spot": {
        "crop": "Pepper bell",
        "condition": "Bacterial spot",
        "is_healthy": False,
        "symptoms": "Water-soaked, circular-to-irregular lesions that turn brown with yellow halos; severe defoliation and blistered fruit.",
        "cause": "Xanthomonas euvesicatoria bacteria transmitted via infected seed and water splash.",
        "organic_treatment": "Copper octanoate / copper hydroxide mixed with Bacillus subtilis; seed hot-water treatment (50°C for 25 mins).",
        "chemical_treatment": "Copper + Mancozeb tank mix; acibenzolar-S-methyl for plant systemic defense activation.",
        "prevention": "Use certified disease-free seeds; utilize drip irrigation; avoid working in the field while plants are wet."
    },
    "Pepper_bell___Healthy": {
        "crop": "Pepper bell",
        "condition": "Healthy",
        "is_healthy": True,
        "symptoms": "Smooth, bright emerald-green foliage with firm veins, upright stems, and no spotting or curling.",
        "cause": "Balanced N-P-K nutrition, proper soil pH (6.0 - 6.8), and stable watering.",
        "organic_treatment": "Foliar humic acid and fish emulsion spray; maintain rich organic mulch.",
        "chemical_treatment": "None needed.",
        "prevention": "Maintain consistent drip irrigation schedule; stake plants to avoid fruit-soil contact."
    },
    "Potato___Early_blight": {
        "crop": "Potato",
        "condition": "Early blight",
        "is_healthy": False,
        "symptoms": "Dark brown, concentric ring lesions ('target-board' or bullseye appearance) on older lower leaves.",
        "cause": "Alternaria solani fungus attacking stressed or aging potato plants.",
        "organic_treatment": "Copper fungicides, bio-fungicides with Trichoderma harzianum; foliar neem seed kernel extract (5%).",
        "chemical_treatment": "Chlorothalonil, Mancozeb, Azoxystrobin, or Difenoconazole at the first sign of concentric spots.",
        "prevention": "Ensure balanced nitrogen and potassium fertilization; practice 3-year crop rotation; avoid overhead sprinkler irrigation."
    },
    "Potato___Healthy": {
        "crop": "Potato",
        "condition": "Healthy",
        "is_healthy": True,
        "symptoms": "Robust, compound green leaves without yellowing edges, dark concentric spots, or decay.",
        "cause": "Well-aerated loose soil, balanced hilling, and healthy certified seed tubers.",
        "organic_treatment": "Regular application of vermicompost and bio-fertilizers (Azotobacter, PSB).",
        "chemical_treatment": "None needed.",
        "prevention": "Hill up soil around stems to protect daughter tubers from greening and spores; maintain soil moisture stability."
    },
    "Potato___Late_blight": {
        "crop": "Potato",
        "condition": "Late blight",
        "is_healthy": False,
        "symptoms": "Large, irregular water-soaked dark lesions with pale margins; white cottony fungal growth on leaf undersides in high humidity; tuber rot.",
        "cause": "Phytophthora infestans (Oomycete water mold) — responsible for historical Irish potato famine, very destructive in cool, wet weather.",
        "organic_treatment": "Copper sulfate or copper hydroxide sprays applied preventatively before rain; promptly destroy infected haulms.",
        "chemical_treatment": "Metalaxyl + Mancozeb, Cymoxanil, or Dimethomorph applied strictly before lesion expansion.",
        "prevention": "Plant certified disease-free seed tubers; eliminate volunteer potato plants; ensure good row ventilation."
    },
    "Strawberry___Healthy": {
        "crop": "Strawberry",
        "condition": "Healthy",
        "is_healthy": True,
        "symptoms": "Vibrant trifoliate green leaves with serrated margins, free of scorch marks or purple spots.",
        "cause": "Optimal soil moisture, good mulch bedding, and balanced potassium.",
        "organic_treatment": "Straw mulching to protect leaves and fruit; foliar potassium silicate.",
        "chemical_treatment": "None needed.",
        "prevention": "Keep plants elevated on raised beds with drip irrigation beneath black mulch."
    },
    "Strawberry___Leaf_scorch": {
        "crop": "Strawberry",
        "condition": "Leaf scorch",
        "is_healthy": False,
        "symptoms": "Numerous small, irregular purple to dark brown spots without white centers; outer edges turn brown and scorch upward.",
        "cause": "Diplocarpon earlianum fungus spread via splashing raindrops.",
        "organic_treatment": "Copper-based fungicides; remove and burn severely scorched old leaves after harvest.",
        "chemical_treatment": "Captan, Thiophanate-methyl, or Pyraclostrobin.",
        "prevention": "Renovate strawberry beds after harvest; avoid overhead irrigation; use resistant cultivars."
    },
    "Tomato___Bacterial_spot": {
        "crop": "Tomato",
        "condition": "Bacterial spot",
        "is_healthy": False,
        "symptoms": "Small, dark, greasy, water-soaked spots with yellow halos on leaves; raised scabby spots on fruit.",
        "cause": "Xanthomonas spp. bacteria favored by warm, rainy, humid conditions and splashing water.",
        "organic_treatment": "Foliar copper octanoate combined with Bacillus subtilis; hot-water seed treatment.",
        "chemical_treatment": "Copper hydroxide mixed with Mancozeb spray.",
        "prevention": "Use drip irrigation instead of overhead watering; rotate away from solanaceous crops for 2 years; sterilize stakes and cages."
    },
    "Tomato___Early_blight": {
        "crop": "Tomato",
        "condition": "Early blight",
        "is_healthy": False,
        "symptoms": "Concentric dark brown rings ('target spots') on lower leaves, progressing upwards; yellowing foliage and stem collar rot.",
        "cause": "Alternaria linariae (Alternaria solani) fungus.",
        "organic_treatment": "Copper soap or sulfur sprays; foliar Trichoderma bio-control; strip lowest leaves 30 cm off the ground.",
        "chemical_treatment": "Chlorothalonil, Mancozeb, or Azoxystrobin applied every 7-10 days under humid conditions.",
        "prevention": "Mulch heavily with straw to prevent soil splashing onto bottom leaves; stake plants; practice 3-year crop rotation."
    },
    "Tomato___Healthy": {
        "crop": "Tomato",
        "condition": "Healthy",
        "is_healthy": True,
        "symptoms": "Robust, deep-green pinnate foliage with sturdy stems and no spots, curling, or chlorosis.",
        "cause": "Optimal solar radiation, regulated drip watering, and balanced calcium/magnesium.",
        "organic_treatment": "Foliar panchagavya or seaweed spray; maintain bone meal and compost around root zone.",
        "chemical_treatment": "None needed.",
        "prevention": "Prune suckers for airflow; maintain consistent watering to prevent blossom end rot."
    },
    "Tomato___Late_blight": {
        "crop": "Tomato",
        "condition": "Late blight",
        "is_healthy": False,
        "symptoms": "Greasy, water-soaked gray-green patches on leaves turning dark brown; white fuzzy mold on leaf undersides in damp weather; firm brown fruit rot.",
        "cause": "Phytophthora infestans (destructive oomycete) flourishing in cool, damp, foggy conditions.",
        "organic_treatment": "Preventative copper fungicide application; immediately bag and dispose of infected plants off-site (do not compost).",
        "chemical_treatment": "Cymoxanil, Dimethomorph, Metalaxyl-M + Mancozeb, or Fluopicolide.",
        "prevention": "Ensure exceptional air circulation; water at base only; do not plant tomatoes adjacent to potato fields."
    },
    "Tomato___Leaf_mold": {
        "crop": "Tomato",
        "condition": "Leaf mold",
        "is_healthy": False,
        "symptoms": "Pale greenish-yellow patches on upper leaf surfaces matching olive-green velvety fungal down underneath.",
        "cause": "Passalora fulva (Cladosporium fulvum) fungus, very common in greenhouse and polyhouse environments with >85% humidity.",
        "organic_treatment": "Copper hydroxide spray; sulfur vaporization in protected greenhouses.",
        "chemical_treatment": "Chlorothalonil, Difenoconazole, or Boscalid.",
        "prevention": "Increase greenhouse ventilation, increase spacing between plants, and maintain relative humidity below 80%."
    },
    "Tomato___Septoria_leaf_spot": {
        "crop": "Tomato",
        "condition": "Septoria leaf spot",
        "is_healthy": False,
        "symptoms": "Numerous circular spots (1-3 mm) with dark brown margins and sunken grayish-white centers containing tiny black specks (pycnidia).",
        "cause": "Septoria lycopersici fungus spreading rapidly from lower leaves upward.",
        "organic_treatment": "Remove infected lower leaves; apply copper-based fungicides or bio-fungicide Bacillus amyloliquefaciens.",
        "chemical_treatment": "Chlorothalonil, Mancozeb, or Pyraclostrobin.",
        "prevention": "Mulch soil surface to block spore splash; clean all gardening equipment; rotate crops annually."
    },
    "Tomato___Spider_mites_two_spotted_spider_mite": {
        "crop": "Tomato",
        "condition": "Spider mites (Two-spotted spider mite)",
        "is_healthy": False,
        "symptoms": "Fine yellow stippling or speckling on leaves; fine webbing on leaf undersides; leaves turn bronze and desiccate.",
        "cause": "Tetranychus urticae (microscopic arachnid pest) exploding in hot, dry, dusty environments.",
        "organic_treatment": "Release predatory mites (Phytoseiulus persimilis); spray neem oil, insecticidal soap, or cold-pressed horticultural mineral oil.",
        "chemical_treatment": "Abamectin, Bifenazate, or Spiromesifen (rotate modes of action to prevent rapid resistance).",
        "prevention": "Overhead misting to discourage dry-loving mites; keep farm pathways damp and dust-free."
    },
    "Tomato___Target_spot": {
        "crop": "Tomato",
        "condition": "Target spot",
        "is_healthy": False,
        "symptoms": "Small brown lesions that enlarge with subtle concentric rings; lesions on fruit are sunken with pale brown centers.",
        "cause": "Corynespora cassiicola fungus favored by warm temperatures (20-30°C) and long periods of leaf wetness.",
        "organic_treatment": "Copper sulfate or copper hydroxide sprays; Bacillus subtilis bio-fungicide.",
        "chemical_treatment": "Famoxadone + Cymoxanil, Azoxystrobin, or Fluxapyroxad.",
        "prevention": "Avoid overhead watering; improve air flow; remove crop debris immediately post-harvest."
    },
    "Tomato___Tomato_mosaic_virus": {
        "crop": "Tomato",
        "condition": "Tomato mosaic virus (ToMV)",
        "is_healthy": False,
        "symptoms": "Mottled light and dark green mosaic patterns on leaves; leaf curling, blistering, and 'shoestring' distortion; stunted growth.",
        "cause": "Tomato mosaic tobamovirus — extremely stable and easily transmitted mechanically via hands, tools, and tobacco products.",
        "organic_treatment": "No cure exists once infected. Immediately rogue out and burn infected plants to protect healthy crop.",
        "chemical_treatment": "No virucidal chemical treatment exists. Control vector insects and disinfect tools.",
        "prevention": "Wash hands with milk or 10% trisodium phosphate before handling plants; never smoke near tomato beds; plant ToMV-resistant seeds."
    },
    "Tomato___Yellow_leaf_curl_virus": {
        "crop": "Tomato",
        "condition": "Tomato yellow leaf curl virus (TYLCV)",
        "is_healthy": False,
        "symptoms": "Severe upward leaf cupping; yellowing along leaf margins; leaves become small, puckered, and leathery; severe plant stunting and flower abortion.",
        "cause": "Begomovirus transmitted exclusively by the sweetpotato whitefly (Bemisia tabaci).",
        "organic_treatment": "Install yellow sticky traps (10-12 per acre) to monitor and trap whiteflies; spray neem oil (3-5 ml/L) or soap solution on leaf undersides.",
        "chemical_treatment": "Control whitefly vectors using Acetamiprid, Imidacloprid, Diafenthiuron, or Spirotetramat.",
        "prevention": "Use 50-mesh insect-proof netting in nurseries; grow TYLCV-resistant hybrids; avoid overlapping tomato crops."
    }
}

target_dir = os.path.join(os.path.dirname(__file__), "plant_doctor")
os.makedirs(target_dir, exist_ok=True)
output_path = os.path.join(target_dir, "treatments.json")

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(treatments_data, f, indent=2, ensure_ascii=False)

print(f"Successfully generated treatments database for {len(treatments_data)} conditions at {output_path}!")

