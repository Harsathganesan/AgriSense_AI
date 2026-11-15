import os
import asyncio
from typing import Dict, Any, List, Optional
from app.config import settings

class GeminiFarmAssistant:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = None
        self.model_name = "models/gemini-2.5-flash"
        self._init_client()

    def _init_client(self):
        if not self.api_key:
            return
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            # Find the best available text generation model
            model_candidates = [
                "models/gemini-2.5-flash",
                "models/gemini-flash-latest",
                "gemini-2.5-flash",
                "gemini-flash-latest",
                "models/gemini-1.5-flash",
                "gemini-1.5-flash"
            ]
            for cand in model_candidates:
                try:
                    self.model = genai.GenerativeModel(cand)
                    self.model_name = cand
                    print(f"[AgriSense AI] Gemini API initialized successfully with {cand}")
                    break
                except Exception:
                    continue
        except Exception as e:
            print(f"[AgriSense AI] Gemini initialization error: {e}")
            self.model = None

    async def generate_response(
        self,
        user_message: str,
        farm_context: Optional[Dict[str, Any]] = None,
        soil_context: Optional[Dict[str, Any]] = None,
        nasa_context: Optional[Dict[str, Any]] = None,
        rotation_context: Optional[Dict[str, Any]] = None,
        language: str = "en",  # "en" or "ta"
        history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Smart, friendly, conversational ChatGPT-like AI assistant with deep Agricultural Expertise.
        - Supports normal casual conversations naturally without forcing agriculture.
        - Activates Expert Agriculture Mode when farming questions are asked.
        """
        # Build structured context string
        context_parts = []
        if farm_context:
            context_parts.append(
                f"FARM PROFILE: Name={farm_context.get('name')}, District={farm_context.get('district')}, State={farm_context.get('state')}, Area={farm_context.get('area_acres')} acres, Soil={farm_context.get('soil_type')} ({farm_context.get('soil_type_tamil')}), Irrigation={farm_context.get('irrigation_type')}, Cropping Pattern={farm_context.get('current_crops')}."
            )
        if soil_context:
            params = soil_context.get("parameters", {})
            ph = params.get("ph", {}).get("value")
            n = params.get("nitrogen", {}).get("value")
            p = params.get("phosphorus", {}).get("value")
            k = params.get("potassium", {}).get("value")
            oc = params.get("organic_carbon", {}).get("value")
            context_parts.append(
                f"SOIL HEALTH DATA: Score={soil_context.get('composite_health_score')}/100, pH={ph}, Available N={n} kg/ha, P={p} kg/ha, K={k} kg/ha, Organic Carbon={oc}%, Lab={soil_context.get('lab_name')}."
            )
        if nasa_context:
            cur = nasa_context.get("current_metrics", {})
            context_parts.append(
                f"NASA SATELLITE TELEMETRY: 30-Day Rain={cur.get('precipitation_30d_mm', 45)} mm, Avg Temp={cur.get('avg_temp_c', 29)}°C, SMAP Soil Moisture={cur.get('smap_moisture_pct', 25)}%, NDVI Greenness={cur.get('ndvi', 0.52)}."
            )
        if rotation_context:
            strats = rotation_context.get("strategies", [])
            s_names = [s.get("name", str(s)) if isinstance(s, dict) else str(s) for s in strats]
            context_parts.append(f"RECOMMENDED ROTATIONS: {', '.join(s_names)}.")

        context_str = "\n".join(context_parts)

        # Build recent conversation history
        history_lines = []
        if history:
            for turn in history[-10:]:
                role_label = "User" if (turn.get("sender") == "user" or turn.get("role") == "user") else "AgriSense AI"
                turn_text = turn.get("text") or turn.get("content") or turn.get("message") or ""
                if turn_text.strip():
                    history_lines.append(f"{role_label}: {turn_text.strip()}")
        history_str = "\n".join(history_lines) if history_lines else "None (Start of conversation)"

        system_instructions = (
            "You are 'AgriSense AI', an intelligent, warm, human-friendly ChatGPT-like conversational AI assistant for AgriSense AI.\n\n"
            "CORE BEHAVIOR & PERSONALITY:\n"
            "1. NATURAL CHATGPT-LIKE CONVERSATION:\n"
            "   - You behave like a friendly, thoughtful human conversational AI.\n"
            "   - Support normal casual conversations (e.g., greetings, how are you, thank you, jokes, general knowledge, follow-up questions).\n"
            "   - If the user says 'Hi', 'Hello', 'வணக்கம்', 'Hey': reply naturally and warmly, e.g.: 'Hi! 👋 How are you doing today? How can I help you?'\n"
            "   - If the user says 'How are you?', respond conversationally like a helpful friend.\n"
            "   - NEVER force agriculture, farm data, or soil metrics onto casual conversations. Answer normal questions normally!\n\n"
            "2. AGRICULTURE EXPERT MODE (When asked farming/crop/soil questions):\n"
            "   - Act as a world-class agricultural scientist and agronomy advisor.\n"
            "   - Knowledge areas: Crop cultivation & selection, soil health, pH, NPK, micronutrients, 3-season crop rotation, intercropping, irrigation & water management, plant diseases & pest management, organic & chemical fertilizers, NASA environmental telemetry, weather & climate, sowing methods, yield improvement, government schemes (PM-KISAN, TNAU schemes), and sustainable farming.\n"
            "   - Ground location-specific advice on the provided District, Soil Type, and NASA Earth observations.\n"
            "   - Ask for crop, location, soil type or conditions when needed to give accurate recommendations.\n"
            "   - Provide step-by-step farming guidance with clear explanations for agricultural terms.\n\n"
            "3. NASA DATA INTEGRATION:\n"
            "   - Use available NASA POWER (temperature/rainfall), GPM (precipitation), and SMAP (soil moisture) when relevant.\n"
            "   - NEVER invent NASA measurements or claim that satellite telemetry proves a specific disease or nutrient deficiency.\n\n"
            "4. SAFETY & ACCURACY:\n"
            "   - Never invent chemical pesticide doses. For chemical controls, always advise following manufacturer label instructions and consulting local agricultural extension officers.\n"
            "   - Clearly communicate uncertainty and recommend soil testing when nutrient levels are unverified.\n\n"
            "5. CONVERSATIONAL STYLE & LANGUAGE:\n"
            "   - Friendly, polite, and encouraging.\n"
            "   - Short, direct answers for simple questions. Structured, thorough explanations with bullet points and friendly emojis for technical topics.\n"
            "   - Tamil (தமிழ்): When user speaks in Tamil or requested language is 'ta', reply in warm, natural, respectful Tamil.\n"
            "   - Tanglish: When user types Tamil using English letters (e.g., 'hi bro thakkali ku enna uram podanum'), reply in friendly, easy-to-read Tanglish or warm Tamil.\n"
            "   - English: Respond in clean, natural, friendly English.\n"
            "   - Maintain conversation context and reference previous messages seamlessly."
        )

        full_prompt = (
            f"{system_instructions}\n\n"
            f"FARM & SATELLITE CONTEXT (Reference only when user asks farming questions):\n{context_str}\n\n"
            f"RECENT CONVERSATION HISTORY:\n{history_str}\n\n"
            f"USER'S LATEST MESSAGE:\n{user_message}\n\n"
            f"Reply naturally as AgriSense AI:"
        )

        if self.model:
            try:
                response = await asyncio.to_thread(self.model.generate_content, full_prompt)
                if response and response.text:
                    return {
                        "reply": response.text.strip(),
                        "engine": f"Gemini AI ({self.model_name.replace('models/', '')})",
                        "is_live_gemini": True,
                        "language": language
                    }
            except Exception as e:
                print(f"[Gemini] Primary model execution error: {e}. Trying fallback models...")
                # Dynamic fallback candidate loop
                fallback_candidates = [
                    "models/gemini-2.5-flash",
                    "models/gemini-flash-latest",
                    "models/gemini-1.5-flash",
                    "gemini-2.5-flash",
                    "gemini-1.5-flash"
                ]
                for fb in fallback_candidates:
                    if fb == getattr(self, "model_name", ""):
                        continue
                    try:
                        import google.generativeai as genai
                        alt_model = genai.GenerativeModel(fb)
                        response = await asyncio.to_thread(alt_model.generate_content, full_prompt)
                        if response and response.text:
                            self.model = alt_model
                            self.model_name = fb
                            return {
                                "reply": response.text.strip(),
                                "engine": f"Gemini AI ({fb.replace('models/', '')})",
                                "is_live_gemini": True,
                                "language": language
                            }
                    except Exception:
                        continue

        # Friendly fallback response when Gemini API is offline/unreachable
        fallback_reply = self._generate_friendly_fallback(user_message, farm_context, soil_context, nasa_context, language)
        return {
            "reply": fallback_reply,
            "engine": "AgriSense AI (Offline Engine)",
            "is_live_gemini": False,
            "language": language
        }

    def _generate_friendly_fallback(
        self,
        message: str,
        farm_context: Optional[Dict[str, Any]],
        soil_context: Optional[Dict[str, Any]],
        nasa_context: Optional[Dict[str, Any]],
        language: str
    ) -> str:
        msg_lower = message.lower().strip()
        is_ta = (language == "ta") or any("\u0b80" <= c <= "\u0bff" for c in message)

        district = farm_context.get("district", "Pudukkottai") if farm_context else "Pudukkottai"
        soil_name_ta = farm_context.get("soil_type_tamil", "செம்மண் மற்றும் சரளை மண்") if farm_context else "செம்மண் மற்றும் சரளை மண்"
        soil_name_en = farm_context.get("soil_type", "Red Sandy Loam") if farm_context else "Red Sandy Loam"
        params = soil_context.get("parameters", {}) if soil_context else {}
        ph_val = params.get("ph", {}).get("value", 6.4)
        n_val = params.get("nitrogen", {}).get("value", 185.0)

        # 1. Casual Greetings & General Chat
        if msg_lower in ["hi", "hello", "hey", "vanakkam", "வணக்கம்"]:
            if is_ta:
                return "வணக்கம்! 👋 எப்படி இருக்கீங்க? இன்று உங்களுக்கு நான் எப்படி உதவலாம்?"
            return "Hi! 👋 How are you doing today? How can I help you?"

        if any(w in msg_lower for w in ["how are you", "how r u", "epdi iruka", "epdi irukinga", "நலமா"]):
            if is_ta:
                return "நான் நலமாக இருக்கிறேன், நன்றி! 😊 நீங்கள் எப்படி இருக்கிறீர்கள்? உங்கள் பண்ணை மற்றும் விவசாயம் எல்லாம் எப்படி செல்கிறது?"
            return "I'm doing great, thank you! 😊 How are you doing? How is everything going with you and your farm?"

        if any(w in msg_lower for w in ["thank you", "thanks", "நன்றி"]):
            if is_ta:
                return "மிக்க மகிழ்ச்சி! 😊 உங்களுக்கு எப்போது உதவி தேவைப்பட்டாலும் நான் இங்கேயே இருப்பேன். வேறு ஏதேனும் கேள்விகள் உள்ளதா?"
            return "You're very welcome! 😊 Happy to help anytime. Let me know if you have any other questions!"

        # 2. Agriculture Topics
        if is_ta:
            if any(w in msg_lower for w in ["சுழற்சி", "rotation", "பயிர்", "விதை", "crop"]):
                return (
                    f"நண்பரே, **{district}** மாவட்டத்தின் ({soil_name_ta}) நிலத்திற்கு இந்த 3 பருவ பயிர் சுழற்சி மிக சிறந்தது:\n\n"
                    f"1. **முதல் பருவம் (ஆடி / சம்பா):** நிலக்கடலை அல்லது பாரம்பரிய நெல் சாகுபடி.\n"
                    f"2. **இரண்டாம் பருவம் (கார்த்திகை / தை):** உளுந்து (வம்பன் ரகங்கள்). நிலத்தில் உள்ள எஞ்சிய ஈரப்பதத்திலேயே ஏக்கருக்கு 35 கிலோ இயற்கை தழைச்சத்தை நிலைநிறுத்தும்.\n"
                    f"3. **மூன்றாம் பருவம் (கோடை):** சணப்பை (பசுந்தாள் உரம்) அல்லது தினை/குதிரைவாலி சிறுதானியங்கள். 40% நீர் சேமிப்புடன் மண்ணை பொலபொலப்பாக்கும்.\n\n"
                    f"💡 இந்த சுழற்சியைப் பின்பற்றினால் பூச்சித் தாக்குதல் குறையும், யூரியா மற்றும் உரச் செலவு 30% மிச்சமாகும்!"
                )
            elif any(w in msg_lower for w in ["உரம்", "fertilizer", "மண்", "soil", "தழை"]):
                return (
                    f"🌾 **{district} மாவட்ட மண்வளப் பரிந்துரைகள்:**\n\n"
                    f"- **மண் வகை:** {soil_name_ta}\n"
                    f"- **கார அமிலத்தன்மை (pH):** {ph_val}\n"
                    f"- **தழைச்சத்து (N):** {n_val} kg/ha\n\n"
                    f"💡 **மேம்படுத்தும் எளிய வழிகள்:**\n"
                    f"• பயிர் கழிவுகளை எரிக்காமல் நிலத்தில் மடக்கி உழவும்.\n"
                    f"• அசோஸ்பைரில்லம் மற்றும் பாஸ்போபாக்டீரியா உயிர் உரங்களை தொழுவுரத்துடன் கலந்து இடவும்.\n"
                    f"• பயறு வகை பயிர்களை நடுவது இயற்கை தழைச்சத்தை கூட்டும்."
                )
            else:
                return (
                    f"உங்க கேள்வி புரிந்தது நண்பரே! **{district}** மாவட்ட மண் மற்றும் வானிலை சூழலுக்கு ஏற்ப உங்களுக்கு உதவ நான் தயாராக இருக்கிறேன். "
                    f"பயிர் தேர்வு, உரம், நோய் தடுப்பு அல்லது பொதுவான உரையாடல் என எதை வேண்டுமானாலும் கேளுங்கள்! 😊"
                )
        else:
            if any(w in msg_lower for w in ["soil", "health", "fertilizer", "nutrient"]):
                return (
                    f"🌾 **Soil Health Improvement Guidelines for {district} ({soil_name_en}):**\n\n"
                    f"1. **Organic Carbon:** Incorporate crop residues and well-decomposed farmyard manure (FYM) to improve microbial biomass.\n"
                    f"2. **Biofertilizers:** Inoculate with Azospirillum and Phosphobacteria (2 kg/acre) to unlock bonded nutrients.\n"
                    f"3. **Green Manuring:** Grow Sunn Hemp or Dhaincha prior to main cropping to boost natural nitrogen without chemical cost.\n"
                    f"4. **Soil Testing:** Regular laboratory tests every 2 years are strongly recommended to avoid fertilizer wastage."
                )
            elif any(w in msg_lower for w in ["rotation", "crop", "suitable", "water"]):
                return (
                    f"🌱 **Recommended Crop Advisory for {district}:**\n\n"
                    f"- **Primary Soil:** {soil_name_en}\n"
                    f"- **Recommended Sequence:** Kharif Groundnut ➔ Rabi Black Gram (Pulse) ➔ Summer Millets / Green Manure.\n"
                    f"- **Water Management:** Drip irrigation reduces water usage by ~40% while preserving root-zone moisture recorded by NASA SMAP satellite telemetry."
                )
            else:
                return (
                    f"I'm here to help! Whether you'd like to chat casually or explore crop rotation, soil diagnostics, irrigation, or NASA weather telemetry for **{district}**, feel free to ask anything! 😊"
                )

gemini_assistant = GeminiFarmAssistant()
