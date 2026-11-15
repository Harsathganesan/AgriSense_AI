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
        Generates friendly, conversational, context-grounded agricultural advisory responses.
        Acts as a warm, helpful farming companion and agronomy friend for farmers.
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
            for turn in history[-8:]:
                role_label = "Farmer" if (turn.get("sender") == "user" or turn.get("role") == "user") else "AgriSense AI"
                turn_text = turn.get("text") or turn.get("content") or turn.get("message") or ""
                if turn_text.strip():
                    history_lines.append(f"{role_label}: {turn_text.strip()}")
        history_str = "\n".join(history_lines) if history_lines else "None (First message in this session)"

        system_instructions = (
            "You are 'AgriSense AI', a warm, friendly, caring, and knowledgeable agricultural companion and digital farming advisor (விவசாய நண்பன் & வழிகாட்டி) for farmers in Tamil Nadu and India.\n\n"
            "YOUR PERSONALITY & CONVERSATIONAL STYLE:\n"
            "1. Be genuinely friendly, encouraging, polite, and natural — like a knowledgeable local farming friend who cares about the farmer's success.\n"
            "2. If the farmer says a greeting (like 'Hi', 'Hello', 'வணக்கம்', 'Vanakkam', 'எப்படி இருக்கீங்க', 'Epdi irukinga'), greet them back warmly, ask how their day or farm is going, and offer help with a smile.\n"
            "3. Directly answer whatever the farmer asks in a clear, friendly, and practical way.\n"
            "4. Language matching:\n"
            "   - If the user writes in Tamil (தமிழ்) or selected language is 'ta': reply in natural, warm, conversational Tamil with helpful farming terms.\n"
            "   - If the user writes in Tanglish (Tamil in English letters like 'thakkali ku enna uram podanum', 'weather epdi iruku', 'tanni kammiya iruku'): reply in friendly, conversational Tanglish or easy Tamil.\n"
            "   - If the user writes in English: reply in friendly, simple, conversational English.\n"
            "5. When giving agricultural advice, naturally incorporate their farm district, soil type, and weather conditions where relevant, but keep it conversational (use friendly emojis, clean bullet points for steps, easy-to-read paragraphs).\n"
            "6. Never be robotic, repetitive, or cold. Talk like a real conversational friend."
        )

        full_prompt = (
            f"{system_instructions}\n\n"
            f"FARM & SATELLITE CONTEXT:\n{context_str}\n\n"
            f"RECENT CHAT HISTORY:\n{history_str}\n\n"
            f"FARMER'S CURRENT MESSAGE:\n{user_message}\n\n"
            f"Please reply warmly and conversationally as their friendly farming companion:"
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

        # Warm & friendly Agronomic fallback response when Gemini is offline
        fallback_reply = self._generate_friendly_fallback(user_message, farm_context, soil_context, nasa_context, language)
        return {
            "reply": fallback_reply,
            "engine": "AgriSense Agronomy Companion",
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

        # Casual friendly greetings
        greetings_ta = ["வணக்கம்", "வணக்கம் நண்பா", "ஹலோ", "எப்படி இருக்கீங்க", "ஹாய்", "நலமா"]
        greetings_en = ["hi", "hello", "hey", "how are you", "good morning", "good evening", "vanakkam", "epdi irukinga"]

        if any(g in msg_lower for g in greetings_ta) or (msg_lower in ["hi", "hello", "hey"] and is_ta):
            return (
                f"வணக்கம் நண்பரே! 😊 நான் நல்லா இருக்கேன், உங்க பண்ணை மற்றும் பயிர்கள் எல்லாம் எப்படி இருக்கு?\n\n"
                f"நான் உங்க **{district}** மாவட்ட மண்வளம், நாசா வானிலை தகவல்களுடன் இணைந்திருக்கேன். "
                f"பயிர் சுழற்சி, உரம், பூச்சி தாக்குதல் அல்லது நீர் பாசனம் பற்றி என்ன பேசலாம் சொல்லுங்க, நண்பனா கூடவே இருந்து உதவுகிறேன்! 🌾"
            )
        elif any(g in msg_lower for g in greetings_en):
            return (
                f"Hello friend! 😊 I am doing great, thank you! How is your farm and your crops doing today?\n\n"
                f"I am connected to your **{district}** soil records and live NASA weather telemetry. "
                f"Whether you want to discuss crop rotation, organic fertilizer, irrigation, or pest control — ask me anything, I'm right here with you! 🌾"
            )

        # Topic responses
        if is_ta:
            if any(w in msg_lower for w in ["சுழற்சி", "rotation", "பயிர்", "விதை"]):
                return (
                    f"நண்பரே, **{district}** மாவட்டத்தின் ({soil_name_ta}) நிலத்திற்கு இந்த 3 பருவ பயிர் சுழற்சி மிக அருமையாக கை கொடுக்கும்:\n\n"
                    f"1. **முதல் பருவம் (ஆடி / சம்பா):** நிலக்கடலை அல்லது பாரம்பரிய நெல் சாகுபடி.\n"
                    f"2. **இரண்டாம் பருவம் (கார்த்திகை / தை):** உளுந்து (வம்பன் ரகங்கள்). உழவு செய்யாமல் எஞ்சிய ஈரத்திலேயே ஏக்கருக்கு 35 கிலோ இயற்கை தழைச்சத்தை மண்ணில் சேர்க்கும்.\n"
                    f"3. **மூன்றாம் பருவம் (கோடை):** சணப்பை (பசுந்தாள் உரம்) அல்லது தினை/குதிரைவாலி சிறுதானியங்கள். 40% நீர் சேமிப்புடன் மண்ணை பொலபொலப்பாக்கும்.\n\n"
                    f"💡 இந்த சுழற்சியால் பூச்சித் தாக்குதல் குறையும், யூரியா உரச் செலவும் 30% மிச்சமாகும் நண்பரே!"
                )
            elif any(w in msg_lower for w in ["உரம்", "fertilizer", "மண்", "soil", "தழை"]):
                return (
                    f"நண்பா, உங்க **{district}** நிலத்துல pH **{ph_val}** மற்றும் தழைச்சத்து **{n_val} kg/ha** இருக்கு.\n\n"
                    f"மண்ணை வளமாக்க எளிய வழிகள்:\n"
                    f"• அறுவடைக்குப் பிறகு பயிர் கழிவுகளை எரிக்காமல் மடக்கி உழுங்கள்.\n"
                    f"• அசோஸ்பைரில்லம் மற்றும் பாஸ்போபாக்டீரியா உயிர் உரங்களை தொழுவுரத்துடன் கலந்து இடுங்கள்.\n"
                    f"• உளுந்து அல்லது பாசிப்பயறு நடுவது வேர் முடிச்சுகள் மூலம் இயற்கை தழைச்சத்தை கூட்டும்!"
                )
            else:
                return (
                    f"நண்பரே, உங்க கேள்வி புரிஞ்சது! **{district}** மாவட்ட மண்ணிற்கு ({soil_name_ta}) ஏற்ற சிறந்த ஆலோசனைகளைத் தருகிறேன்.\n\n"
                    f"உர மேலாண்மை, பயிர் சுழற்சி, நாசா வானிலை அல்லது பூச்சித் தடுப்பு பற்றி இன்னும் தெளிவா கேளுங்க, பேசி நல்ல தீர்வைக் கண்டுபிடிப்போம்! 😊"
                )
        else:
            if any(w in msg_lower for w in ["rotation", "crop", "sow", "plant"]):
                return (
                    f"Friend, for **{district}** ({soil_name_en}), here is a high-reward 3-season rotation:\n\n"
                    f"1. **Season 1 (Kharif):** Groundnut or Traditional Paddy.\n"
                    f"2. **Season 2 (Rabi):** Black Gram (Vamban variety). Relies on residual moisture and adds 35 kg natural Nitrogen/acre.\n"
                    f"3. **Season 3 (Summer):** Sunn Hemp green manure or Millets. Conserves 40% water and replenishes soil organic carbon.\n\n"
                    f"💡 Alternating crops like this stops pests and cuts synthetic fertilizer bills by ~30%!"
                )
            else:
                return (
                    f"Got it, friend! Grounded in **{district}** soil data ({soil_name_en}, pH {ph_val}), I'm right here to guide you.\n\n"
                    f"Feel free to ask more details on fertilizers, pest prevention, optimal sowing times, or NASA weather! 😊"
                )

gemini_assistant = GeminiFarmAssistant()
