"""
AgriSense AI - Smart NLP Engine & Fast-Path Intent Router
Enables instantaneous (<10ms) responses for common conversational intents
and optimizes prompt payloads for rapid LLM generation.
"""

import re
import random
from typing import Dict, Any, Optional, Tuple

class AgriSenseNLPEngine:
    def __init__(self):
        # Conversational regex patterns (English, Tamil script, Tanglish)
        self.greetings_regex = re.compile(
            r"^(hi|hello|hey|heya|hiya|vanakkam|vanakam|வணக்கம்|வணக்கம் நண்பா|ஹலோ|ஹாய்|ஹே|sup|good morning|good evening|good afternoon)[\s!.,?]*$",
            re.IGNORECASE
        )
        self.wellbeing_regex = re.compile(
            r"(how are you|how r u|how do you do|how's it going|how is it going|epdi irukinga|epdi iruka|eppadi irukkeenga|nalama|நலமா|சௌக்கியமா|என்ன பண்ற|enna panra)",
            re.IGNORECASE
        )
        self.identity_regex = re.compile(
            r"(who are you|who r u|what are you|what can you do|un peru enna|unga peru enna|நீ யார்|உன் பெயர் என்ன|உங்களால் என்ன செய்ய முடியும்)",
            re.IGNORECASE
        )
        self.thanks_regex = re.compile(
            r"^(thanks|thank you|thx|tq|thank u|நன்றி|மிக்க நன்றி|romba nandri|romba thanks|super|great|awesome|dhanyavadham)[\s!.,?]*$",
            re.IGNORECASE
        )
        self.farewell_regex = re.compile(
            r"^(bye|goodbye|see you|cya|take care|poi varen|போய் வருகிறேன்|வரேன்)[\s!.,?]*$",
            re.IGNORECASE
        )
        self.affirmation_regex = re.compile(
            r"^(ok|okay|k|cool|sure|seri|சரி|சரிங்க|done|got it|understood)[\s!.,?]*$",
            re.IGNORECASE
        )

        # Agriculture indicator keywords
        self.agri_keywords = {
            "soil": ["soil", "மண்", "ph", "npk", "nitrogen", "phosphorus", "potassium", "carbon", "தழைச்சத்து", "கரிமச்சத்து", "fertility"],
            "disease": ["disease", "pest", "fungus", "blight", "spot", "rot", "பூச்சி", "நோய்", "கருகல்", "புள்ளி", "மருந்து", "spray", "cure"],
            "crop": ["crop", "seed", "paddy", "rice", "tomato", "potato", "groundnut", "peanut", "gram", "millet", "பயிர்", "விதை", "நெல்", "தக்காளி", "உருளை", "நிலக்கடலை", "உளுந்து", "சிறுதானியம்", "சாகுபடி"],
            "water": ["water", "irrigation", "rain", "drip", "smap", "moisture", "தண்ணீர்", "பாசனம்", "மழை", "ஈரப்பதம்", "சொட்டுநீர்"],
            "rotation": ["rotation", "intercrop", "sequence", "சுழற்சி", "ஊடுபயிர்", "அடுத்த பயிர்"],
            "fertilizer": ["fertilizer", "urea", "manure", "compost", "உரம்", "யூரியா", "தொழுவுரம்", "சாணம்", "டிஏபி"]
        }

    def detect_instant_intent(self, message: str, language: str = "en") -> Optional[str]:
        """
        Detects if message is a pure conversational pleasantry.
        Returns instant human-like response if matched, else None.
        """
        clean = message.strip()
        is_ta = (language == "ta") or any("\u0b80" <= c <= "\u0bff" for c in clean)

        # 1. Greetings
        if self.greetings_regex.match(clean):
            if is_ta:
                options = [
                    "வணக்கம்! 👋 எப்படி இருக்கீங்க? இன்று உங்களுக்கு நான் எப்படி உதவலாம்?",
                    "வணக்கம் நண்பரே! 🙏 உங்கள் விவசாயம் எல்லாம் எப்படி போகிறது? என்ன உதவி வேண்டும் சொல்லுங்கள்!",
                    "ஹலோ! 😊 நலமாக இருக்கிறீர்களா? உங்கள் தோட்டத்தைப் பற்றி பேசலாமா அல்லது வேறு ஏதேனும் கேள்விகள் உள்ளதா?"
                ]
            else:
                options = [
                    "Hi! 👋 How are you doing today? How can I help you?",
                    "Hello! 😊 Hope you're having a great day. What's on your mind today?",
                    "Hey there! 👋 I'm AgriSense AI. How can I assist you and your farm today?"
                ]
            return random.choice(options)

        # 2. Well-being
        if self.wellbeing_regex.search(clean) and len(clean.split()) <= 6:
            if is_ta:
                options = [
                    "நான் ரொம்ப நல்லா இருக்கேன், நன்றி! 😊 நீங்க எப்படி இருக்கீங்க? உங்க பயிர்கள் எல்லாம் செழிப்பா வளருதா?",
                    "மிக்க மகிழ்ச்சி, நான் நலமாக உள்ளேன்! 🙏 உங்க நாள் எப்படி செல்கிறது? விவசாயம் பற்றி பேசலாமா?",
                ]
            else:
                options = [
                    "I'm doing great, thank you for asking! 😊 How are you doing today? How is your farm and your crops?",
                    "Doing wonderful, thank you! 👍 How are things going on your end?",
                ]
            return random.choice(options)

        # 3. Identity / Capability
        if self.identity_regex.search(clean) and len(clean.split()) <= 7:
            if is_ta:
                return (
                    "நான் உங்கள் **AgriSense AI**! 🌾\n\n"
                    "ஒரு நண்பனைப் போல உங்களுடன் சாதாரணமாகவும் பேச முடியும், அதே சமயம் உங்கள் மாவட்ட மண் வளம், நாசா வானிலை, பயிர் சுழற்சி மற்றும் பயிர் நோய் தீர்வுகள் என அனைத்து விவசாய சந்தேகங்களுக்கும் துல்லியமாக வழிகாட்ட முடியும்! 😊"
                )
            else:
                return (
                    "I'm **AgriSense AI**! 🌾\n\n"
                    "I can chat with you naturally just like a friend, while also providing precision agricultural advice on crop rotation, soil health, plant diseases, and NASA satellite weather telemetry! How can I help you today? 😊"
                )

        # 4. Gratitude
        if self.thanks_regex.match(clean):
            if is_ta:
                options = [
                    "மிக்க மகிழ்ச்சி நண்பரே! 😊 உங்களுக்கு எப்போது உதவி தேவைப்பட்டாலும் நான் இங்கேயே இருப்பேன்.",
                    "ரொம்ப சந்தோஷம்! 🙏 வேறு ஏதேனும் சந்தேகம் இருந்தாலும் தயங்காமல் கேளுங்கள்!",
                ]
            else:
                options = [
                    "You're very welcome! 😊 Glad I could help. Let me know if you need anything else!",
                    "Anytime! 👍 Happy farming and feel free to ask if you have more questions!",
                ]
            return random.choice(options)

        # 5. Farewell
        if self.farewell_regex.match(clean):
            if is_ta:
                return "போய் வாருங்கள்! 👋 நல்லபடியாக இருங்கள், உங்கள் பயிர்கள் செழிக்க என் மனமார்ந்த வாழ்த்துகள்! 🌾"
            return "Goodbye! 👋 Take care, and best wishes for a bountiful harvest! 🌾"

        # 6. Simple Affirmation
        if self.affirmation_regex.match(clean):
            if is_ta:
                return "சரிங்க நண்பரே! 👍 அடுத்து என்ன பேசலாம்? உங்கள் கேள்வியை கேளுங்கள்."
            return "Sounds good! 👍 What would you like to explore next?"

        return None

    def analyze_agri_intent(self, message: str) -> Dict[str, Any]:
        """
        Classifies whether query has agricultural context and extracts matched domains.
        """
        msg_lower = message.lower()
        matched_domains = []
        for domain, keywords in self.agri_keywords.items():
            if any(k in msg_lower for k in keywords):
                matched_domains.append(domain)

        is_agri = len(matched_domains) > 0
        return {
            "is_agricultural": is_agri,
            "domains": matched_domains,
            "is_complex": len(message.split()) > 15 or len(matched_domains) >= 2
        }

nlp_engine = AgriSenseNLPEngine()
