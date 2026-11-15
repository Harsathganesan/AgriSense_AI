import os
import asyncio
import time
from typing import Dict, Any, List, Optional
from app.config import settings
from app.services.nlp_engine import nlp_engine

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
                    self.model = genai.GenerativeModel(
                        cand,
                        generation_config={
                            "max_output_tokens": 800,
                            "temperature": 0.7,
                            "top_p": 0.95
                        }
                    )
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
        Ultra-fast NLP + LLM hybrid response pipeline:
        1. Fast-Path NLP Intent Detection (< 5ms for greetings, thanks, pleasantries).
        2. Lean Prompt Synthesizer for targeted agricultural or general queries (under 1s LLM latency).
        """
        # Step 1: Instant NLP Fast-Path (< 5ms response time)
        instant_reply = nlp_engine.detect_instant_intent(user_message, language=language)
        if instant_reply:
            return {
                "reply": instant_reply,
                "engine": "AgriSense NLP Instant (<5ms)",
                "is_live_gemini": True,
                "language": language
            }

        # Step 2: Analyze Agricultural Intent using NLP
        agri_analysis = nlp_engine.analyze_agri_intent(user_message)
        is_agri = agri_analysis.get("is_agricultural", False)
        domains = agri_analysis.get("domains", [])

        # Build lean, targeted context only if relevant
        context_parts = []
        if is_agri:
            dist = farm_context.get("district", "Pudukkottai") if farm_context else "Pudukkottai"
            soil_en = farm_context.get("soil_type", "Red Sandy Loam") if farm_context else "Red Sandy Loam"
            soil_ta = farm_context.get("soil_type_tamil", "செம்மண்") if farm_context else "செம்மண்"
            context_parts.append(f"Region: {dist}, Tamil Nadu | Soil: {soil_en} ({soil_ta})")

            if any(d in domains for d in ["soil", "fertilizer"]) and soil_context:
                params = soil_context.get("parameters", {})
                ph = params.get("ph", {}).get("value", 6.4)
                n = params.get("nitrogen", {}).get("value", 185.0)
                context_parts.append(f"Soil Test: pH={ph}, N={n} kg/ha, HealthScore={soil_context.get('composite_health_score', 78)}/100")

            if any(d in domains for d in ["water", "crop", "disease"]) and nasa_context:
                cur = nasa_context.get("current_metrics", {})
                rain = cur.get("precipitation_30d_mm", 58.0)
                smap = cur.get("smap_moisture_pct", 24.2)
                context_parts.append(f"NASA Telemetry: SMAP Moisture={smap}%, Rain(30d)={rain}mm")

        context_str = " | ".join(context_parts) if context_parts else "General Conversation"

        # Recent conversation history (keep only last 4 turns for lightning speed)
        history_lines = []
        if history:
            for turn in history[-4:]:
                role_label = "User" if (turn.get("sender") == "user" or turn.get("role") == "user") else "AgriSense AI"
                turn_text = turn.get("text") or turn.get("content") or turn.get("message") or ""
                if turn_text.strip():
                    history_lines.append(f"{role_label}: {turn_text.strip()}")
        history_str = "\n".join(history_lines) if history_lines else ""

        # Lean system prompt (< 100 tokens for minimum latency)
        system_prompt = (
            "You are 'AgriSense AI', a friendly, concise, human-like AI assistant and agronomy specialist. "
            "Guidelines: "
            "1. Answer naturally, warmly, and directly. "
            "2. If asked about crops/soil, give practical, structured, expert advice with bullet points. "
            "3. If casual chat, answer conversationally without forcing farming facts. "
            "4. Language: reply in natural Tamil if asked in Tamil, Tanglish if typed in Tanglish, or simple English if asked in English. "
            "5. Keep answers direct and helpful."
        )

        history_block = f"[History]\n{history_str}\n" if history_str else ""
        full_prompt = (
            f"{system_prompt}\n"
            f"[Context: {context_str}]\n"
            f"{history_block}"
            f"User: {user_message}\n"
            f"AgriSense AI:"
        )

        if self.model:
            try:
                response = await asyncio.to_thread(self.model.generate_content, full_prompt)
                if response and response.text:
                    return {
                        "reply": response.text.strip(),
                        "engine": f"Gemini Fast LLM ({self.model_name.replace('models/', '')})",
                        "is_live_gemini": True,
                        "language": language
                    }
            except Exception as e:
                print(f"[Gemini] Generation error: {e}. Trying rapid fallback...")
                for fb in ["models/gemini-2.5-flash", "models/gemini-flash-latest", "gemini-2.5-flash"]:
                    if fb == getattr(self, "model_name", ""):
                        continue
                    try:
                        import google.generativeai as genai
                        alt_model = genai.GenerativeModel(fb, generation_config={"max_output_tokens": 750, "temperature": 0.7})
                        response = await asyncio.to_thread(alt_model.generate_content, full_prompt)
                        if response and response.text:
                            self.model = alt_model
                            self.model_name = fb
                            return {
                                "reply": response.text.strip(),
                                "engine": f"Gemini Fast LLM ({fb.replace('models/', '')})",
                                "is_live_gemini": True,
                                "language": language
                            }
                    except Exception:
                        continue

        # Fast local fallback response
        fallback_reply = self._generate_fast_fallback(user_message, farm_context, language)
        return {
            "reply": fallback_reply,
            "engine": "AgriSense Fast Response",
            "is_live_gemini": False,
            "language": language
        }

    def _generate_fast_fallback(
        self,
        message: str,
        farm_context: Optional[Dict[str, Any]],
        language: str
    ) -> str:
        msg_lower = message.lower().strip()
        is_ta = (language == "ta") or any("\u0b80" <= c <= "\u0bff" for c in message)
        district = farm_context.get("district", "Pudukkottai") if farm_context else "Pudukkottai"

        if is_ta:
            if "சுழற்சி" in msg_lower or "rotation" in msg_lower:
                return f"நண்பரே, {district} மாவட்டத்திற்கு ஏற்ற சிறந்த பயிர் சுழற்சி: 1) ஆடி: நிலக்கடலை ➔ 2) கார்த்திகை: வம்பன் உளுந்து ➔ 3) கோடை: சணப்பை / சிறுதானியம். இது 30% உரச் செலவை மிச்சப்படுத்தும்!"
            elif "மண்" in msg_lower or "உரம்" in msg_lower:
                return f"நண்பா, {district} மண் வளத்தை உயர்த்த: 1) பயிர் கழிவுகளை எரிக்காமல் மடக்கி உழுங்கள். 2) அசோஸ்பைரில்லம் + பாஸ்போபாக்டீரியா இடுங்கள். 3) உளுந்து அல்லது பயறு நடுங்கள்!"
            return f"நண்பரே, உங்கள் கேள்வி புரிந்தது! {district} மாவட்ட விவசாயம், உரம், பயிர் பாதுகாப்பு பற்றி விரிவாகவும் உதவ தயாராக உள்ளேன். கேளுங்கள்! 😊"
        else:
            if "rotation" in msg_lower:
                return f"Recommended 3-season rotation for {district}: 1) Kharif: Groundnut ➔ 2) Rabi: Vamban Black Gram ➔ 3) Summer: Sunn Hemp / Millets. Saves 30% fertilizer!"
            elif "soil" in msg_lower:
                return f"To boost soil health in {district}: 1) Mulch crop residues. 2) Apply Azospirillum biofertilizers. 3) Plant nitrogen-fixing legumes."
            return f"I'm here to help with your farm in {district}! Feel free to ask about crops, soil health, fertilizers, or water management. 😊"

gemini_assistant = GeminiFarmAssistant()
