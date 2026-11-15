"""
AgriSense AI - AI Plant Disease Detection & Diagnostic Service
Phase 3 & Phase 7: Prediction Engine & NASA Environmental Risk Assessment

This service:
1. Loads MobileNetV2 / TFLite trained weights or leverages Gemini Vision fallback.
2. Validates image payload, MIME type, dimensions, and file size.
3. Preprocesses input to 224x224 RGB with normalized scale [-1, 1].
4. Enforces 60% uncertainty threshold (returns inconclusive if low confidence or non-plant).
5. Correlates NASA environmental data (POWER, SMAP, GPM) for disease development risk.
6. Enriches predictions with verified agronomic advisory from PLANT_DISEASE_KNOWLEDGE_BASE.

Config (optional env vars):
  AGRISENSE_MODEL_NORMALIZE = "1" (default) -> app does (x/127.5 - 1) before the model.
                              "0"           -> model has its own preprocess layer; feed raw 0-255.
"""

import os
import sys
import glob

# ---------------------------------------------------------------------------
# Virtual-env site-packages injection (cross-platform: Windows + Linux/macOS)
# ---------------------------------------------------------------------------
_curr_dir = os.path.dirname(os.path.abspath(__file__))
_root_dir = os.path.abspath(os.path.join(_curr_dir, "..", "..", ".."))
for _venv_rel in [os.path.join("ml-training", "venv"), os.path.join("backend", "venv")]:
    _candidates = [os.path.join(_root_dir, _venv_rel, "Lib", "site-packages")]  # Windows
    _candidates += glob.glob(os.path.join(_root_dir, _venv_rel, "lib", "python*", "site-packages"))  # POSIX
    for _sp in _candidates:
        if os.path.exists(_sp) and _sp not in sys.path:
            sys.path.insert(0, _sp)

import tempfile

# Prevent permission issues in locked sandbox environments
os.environ.setdefault("KERAS_HOME", os.path.join(tempfile.gettempdir(), ".keras"))
os.environ.setdefault("MPLCONFIGDIR", os.path.join(tempfile.gettempdir(), "matplotlib"))
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

import io
import json
import asyncio
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image, ImageOps  # type: ignore

try:
    import numpy as np  # type: ignore
except ImportError:
    np = None  # type: ignore

try:
    from app.config import settings  # type: ignore
    from app.data.plant_disease_db import (  # type: ignore
        PLANT_DISEASE_KNOWLEDGE_BASE,
        get_disease_info,
        get_all_supported_classes,
    )
    from app.services.nasa_service import NASAService  # type: ignore
except ImportError:
    from backend.app.config import settings  # type: ignore
    from backend.app.data.plant_disease_db import (  # type: ignore
        PLANT_DISEASE_KNOWLEDGE_BASE,
        get_disease_info,
        get_all_supported_classes,
    )
    from backend.app.services.nasa_service import NASAService  # type: ignore

logger = logging.getLogger("agrisense.disease_detector")

UNCERTAINTY_THRESHOLD = 0.60  # 60% minimum confidence
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_IMAGE_DIMENSION = 8000  # px, per side (protects memory)
MIN_IMAGE_DIMENSION = 32  # px, per side
ALLOWED_FORMATS = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}
MODEL_INPUT_SIZE = (224, 224)

# Guard against decompression bombs
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_DIMENSION * MAX_IMAGE_DIMENSION

# The trained MobileNetV2 / TFLite models embed Rescaling(1/127.5, offset=-1) inside the model graph.
# Hence raw [0, 255] pixels should be passed directly. Default to "0" (no external double-scaling).
APPLY_EXTERNAL_NORMALIZATION = os.environ.get("AGRISENSE_MODEL_NORMALIZE", "0") == "1"

DISTRICT_COORDS = {
    "thanjavur": (10.7870, 79.1378),
    "tiruvarur": (10.7725, 79.6365),
    "nagapattinam": (10.7672, 79.8449),
    "pudukkottai": (10.3833, 78.8001),
    "madurai": (9.9252, 78.1198),
    "coimbatore": (11.0168, 76.9558),
    "salem": (11.6643, 78.1460),
    "tiruchirappalli": (10.7905, 78.7047),
}

INCONCLUSIVE_MSG_EN = (
    "AI confidence is below the safety threshold (60%) or the uploaded photograph does not clearly "
    "show a leaf of our supported crops (Bell Pepper, Potato, Tomato). Please provide a well-lit, "
    "sharp, close-up photograph of the affected leaf."
)
INCONCLUSIVE_MSG_TA = (
    "நம்பகத்தன்மை அளவு 60%க்கும் குறைவாக உள்ளது அல்லது பதிவேற்றப்பட்ட படம் எங்களது ஆதரிக்கப்படும் "
    "பயிர்களின் (குடைமிளகாய், உருளைக்கிழங்கு, தக்காளி) இலையாக இல்லை. நல்ல வெளிச்சத்தில் "
    "எடுக்கப்பட்ட தெளிவான இலையின் புகைப்படத்தை மீண்டும் பதிவேற்றவும்."
)


class ImageValidationError(ValueError):
    """Raised for bad user uploads (never triggers the Gemini fallback)."""


class PlantDiseaseDetector:
    def __init__(self):
        self.model: Any = None
        self.tflite_interpreter: Any = None
        self.class_names: List[str] = []
        self.model_loaded: bool = False
        self.model_type: str = "none"
        self._kb_keys_lower: Dict[str, str] = {k.lower(): k for k in PLANT_DISEASE_KNOWLEDGE_BASE.keys()}
        self._load_class_names()
        self._validate_class_names_against_kb()
        self._try_load_model()

    # ------------------------------------------------------------------
    # Setup
    # ------------------------------------------------------------------
    def _load_class_names(self):
        service_dir = Path(__file__).resolve().parent
        app_dir = service_dir.parent
        backend_dir = app_dir.parent
        project_root = backend_dir.parent

        search_paths = [
            project_root / "ml-training" / "class_names.json",
            app_dir / "models" / "class_names.json",
            app_dir / "data" / "class_names.json",
        ]
        for p in search_paths:
            if p.exists():
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        loaded = json.load(f)
                    if isinstance(loaded, dict):
                        # Support {"0": "Tomato_Early_blight", ...} format
                        loaded = [loaded[k] for k in sorted(loaded.keys(), key=lambda x: int(x))]
                    if not isinstance(loaded, list) or not loaded:
                        raise ValueError("class_names.json must be a non-empty list")
                    self.class_names = [str(c) for c in loaded]
                    logger.info(f"[DiseaseDetector] Loaded {len(self.class_names)} classes from {p}")
                    return
                except Exception as e:
                    logger.warning(f"Error loading class names from {p}: {e}")

        # Fallback to predefined classes from knowledge base
        self.class_names = list(get_all_supported_classes())
        logger.info(f"[DiseaseDetector] Initialized with {len(self.class_names)} knowledge base classes.")

    def _validate_class_names_against_kb(self):
        """Warn loudly if class names don't match KB keys (would make everything 'inconclusive')."""
        missing = [c for c in self.class_names if c not in PLANT_DISEASE_KNOWLEDGE_BASE]
        if missing:
            fixable = [c for c in missing if c.lower() in self._kb_keys_lower]
            logger.error(
                f"[DiseaseDetector] {len(missing)} class name(s) are NOT KB keys: {missing}. "
                f"Case-only mismatches (auto-resolved at runtime): {fixable}. "
                f"KB keys: {sorted(PLANT_DISEASE_KNOWLEDGE_BASE.keys())}"
            )

    def _resolve_kb_key(self, class_name: Optional[str]) -> Optional[str]:
        """Map a predicted class string to an exact KB key (case/whitespace tolerant)."""
        if not class_name:
            return None
        if class_name in PLANT_DISEASE_KNOWLEDGE_BASE:
            return class_name
        # pyrefly: ignore[unnecessary-type-conversion]
        return self._kb_keys_lower.get(str(class_name).strip().lower())

    def _try_load_model(self):
        service_dir = Path(__file__).resolve().parent
        app_dir = service_dir.parent
        backend_dir = app_dir.parent
        project_root = backend_dir.parent

        possible_paths = [
            app_dir / "models" / "plant_disease_model.tflite",
            project_root / "ml-training" / "plant_disease_model.tflite",
            app_dir / "models" / "plant_disease_model.keras",
            project_root / "ml-training" / "plant_disease_model.keras",
        ]

        for p in possible_paths:
            if not p.exists():
                continue
            try:
                if p.suffix in (".keras", ".h5"):
                    import tensorflow as tf  # type: ignore
                    model = tf.keras.models.load_model(str(p))
                    out_size = int(model.output_shape[-1])
                    if out_size != len(self.class_names):
                        logger.error(
                            f"[DiseaseDetector] Model {p.name} outputs {out_size} classes but "
                            f"class_names has {len(self.class_names)}. Skipping this model."
                        )
                        continue
                    self.model = model
                    self.model_loaded = True
                    self.model_type = "keras"
                    logger.info(f"[DiseaseDetector] Loaded Keras model from {p}")
                    return
                elif p.suffix == ".tflite":
                    import tensorflow as tf  # type: ignore
                    # pyrefly: ignore[implicit-import, missing-attribute]
                    interpreter = tf.lite.Interpreter(model_path=str(p))
                    interpreter.allocate_tensors()
                    out_size = int(interpreter.get_output_details()[0]["shape"][-1])
                    if out_size != len(self.class_names):
                        logger.error(
                            f"[DiseaseDetector] TFLite model {p.name} outputs {out_size} classes but "
                            f"class_names has {len(self.class_names)}. Skipping this model."
                        )
                        continue
                    self.tflite_interpreter = interpreter
                    self.model_loaded = True
                    self.model_type = "tflite"
                    logger.info(f"[DiseaseDetector] Loaded TFLite model from {p}")
                    return
            except Exception as e:
                logger.warning(f"[DiseaseDetector] Failed to load model from {p}: {e}")

        logger.info("[DiseaseDetector] No usable local .keras/.tflite model found. Ready for Gemini Vision fallback.")

    # ------------------------------------------------------------------
    # Image validation / preprocessing
    # ------------------------------------------------------------------
    def validate_image(self, image_bytes: bytes) -> Tuple[Image.Image, str]:
        """
        Validate upload and return (RGB PIL image, mime_type).
        Raises ImageValidationError for any user-side problem.
        """
        if not image_bytes:
            raise ImageValidationError("Empty image upload.")
        if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
            raise ImageValidationError(
                f"Image file exceeds maximum allowable size of 10MB "
                f"(Received: {len(image_bytes) / (1024 * 1024):.2f}MB)."
            )

        try:
            probe = Image.open(io.BytesIO(image_bytes))
            fmt = (probe.format or "").upper()
            probe.verify()  # integrity check (invalidates the handle)
            image = Image.open(io.BytesIO(image_bytes))
            image.load()
        except Exception as e:
            raise ImageValidationError(f"Invalid or corrupted image file: {e}")

        if fmt not in ALLOWED_FORMATS:
            raise ImageValidationError(
                f"Unsupported image format '{fmt or 'unknown'}'. Allowed: JPEG, PNG, WEBP."
            )

        w, h = image.size
        if w > MAX_IMAGE_DIMENSION or h > MAX_IMAGE_DIMENSION:
            raise ImageValidationError(f"Image dimensions {w}x{h} exceed the {MAX_IMAGE_DIMENSION}px limit.")
        if w < MIN_IMAGE_DIMENSION or h < MIN_IMAGE_DIMENSION:
            raise ImageValidationError(f"Image dimensions {w}x{h} are too small for diagnosis.")

        # Respect phone-camera EXIF orientation
        image = ImageOps.exif_transpose(image)

        if image.mode != "RGB":
            if image.mode in ("RGBA", "LA", "P"):
                rgba = image.convert("RGBA")
                background = Image.new("RGB", rgba.size, (255, 255, 255))
                background.paste(rgba, mask=rgba.split()[-1])
                image = background
            else:
                image = image.convert("RGB")

        return image, ALLOWED_FORMATS[fmt]

    def preprocess_image(self, image_bytes: bytes) -> Tuple[Any, Image.Image]:
        """Validate and preprocess image bytes into (1, 224, 224, 3) tensor."""
        image, _ = self.validate_image(image_bytes)
        return self._image_to_batch(image), image

    def _image_to_batch(self, image: Image.Image) -> Any:
        if np is None:
            raise RuntimeError("NumPy is required for local model inference. On Vercel, Gemini Vision is used.")
        resized = image.resize(MODEL_INPUT_SIZE, Image.Resampling.BILINEAR)
        img_array = np.array(resized, dtype=np.float32)

        if APPLY_EXTERNAL_NORMALIZATION:
            # MobileNetV2 normalization: scales [0, 255] to [-1, 1]
            img_array = (img_array / 127.5) - 1.0
        # else: model contains its own preprocessing layer -> raw 0..255

        return np.expand_dims(img_array, axis=0)

    # ------------------------------------------------------------------
    # Inference engines
    # ------------------------------------------------------------------
    async def predict_with_gemini_vision(self, image_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Multimodal diagnostic inference using Gemini Vision API.
        Used for verification, serverless hosting, or when Keras weights are pending.
        """
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not configured in backend/.env.")

        try:
            import google.generativeai as genai  # type: ignore
        except ImportError:
            raise RuntimeError("google-generativeai package not installed.")

        # Validate + detect real MIME type (no more hardcoded image/jpeg)
        image, mime_type = self.validate_image(image_bytes)
        send_bytes = image_bytes
        if mime_type not in ("image/jpeg", "image/png", "image/webp"):
            buf = io.BytesIO()
            image.save(buf, format="JPEG", quality=92)
            send_bytes, mime_type = buf.getvalue(), "image/jpeg"

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.1,
            },
        )

        supported_list = "\n".join([f"- {c}" for c in self.class_names])

        prompt = f"""
You are an expert plant pathologist and agronomist at AgriSense AI.
Examine this agricultural leaf photo and perform a strict diagnostic analysis.

You MUST choose from EXACTLY one of these {len(self.class_names)} supported class keys:
{supported_list}

RULES:
1. First evaluate if the image clearly shows an agricultural crop leaf. If it is a human, animal, furniture, scenery, or random object, set "is_plant": false and "confidence": 0.0.
2. If it is an unsupported crop (e.g. apple, grape, corn, weeds) or the image is too blurry/dark/unclear to make a confident diagnosis, set "confidence": 0.35 and provide an explanation.
3. If it is one of Bell Pepper, Potato, or Tomato, identify the condition (healthy or specific disease).
4. Provide a confidence score between 0.0 and 1.0 (e.g. 0.94 for 94%).
5. "predicted_class" MUST be copied exactly from the supported class keys above.
6. Return strictly valid JSON with this exact schema:
{{
  "is_plant": true,
  "crop_name": "Tomato",
  "disease_name": "Early Blight",
  "predicted_class": "Tomato_Early_blight",
  "confidence": 0.92,
  "top_3": [
    {{"class": "Tomato_Early_blight", "confidence": 0.92, "label": "Tomato - Early Blight"}},
    {{"class": "Tomato_Late_blight", "confidence": 0.05, "label": "Tomato - Late Blight"}},
    {{"class": "Tomato_Septoria_leaf_spot", "confidence": 0.03, "label": "Tomato - Septoria Leaf Spot"}}
  ],
  "visual_observations": "Concentric rings and brown circular lesions visible on lower leaf margin with surrounding chlorotic halo.",
  "visual_observations_ta": "இலைகளின் விளிம்பில் வட்ட வளையங்களுடன் கூடிய பழுப்பு நிற கருகல் புள்ளிகள் மற்றும் மஞ்சள் வளையம் தெளிவாக காணப்படுகிறது."
}}
"""

        image_part = {"mime_type": mime_type, "data": send_bytes}
        last_error: Optional[Exception] = None

        for attempt in range(2):  # one retry on malformed output / transient failure
            try:
                response = await model.generate_content_async([prompt, image_part])
                result = self._parse_gemini_json(response.text)
                return self._normalize_gemini_result(result)
            except Exception as e:
                last_error = e
                logger.warning(f"[Gemini Vision] attempt {attempt + 1} failed: {e}")

        logger.error(f"[Gemini Vision Error] {last_error}")
        raise RuntimeError(f"Vision analysis error: {last_error}")

    @staticmethod
    def _parse_gemini_json(raw_text: str) -> Dict[str, Any]:
        text = (raw_text or "").strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        parsed = json.loads(text)
        if not isinstance(parsed, dict):
            raise ValueError("Gemini response is not a JSON object.")
        return parsed

    def _normalize_gemini_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Coerce Gemini output into safe types and exact KB class keys."""
        try:
            conf = float(result.get("confidence", 0.0))
        except (TypeError, ValueError):
            conf = 0.0
        conf = max(0.0, min(conf, 1.0))
        result["confidence"] = conf
        result["is_plant"] = bool(result.get("is_plant", True))

        resolved = self._resolve_kb_key(result.get("predicted_class"))
        if resolved:
            result["predicted_class"] = resolved
        else:
            result["predicted_class"] = result.get("predicted_class") or ""

        top3 = []
        for item in result.get("top_3") or []:
            if not isinstance(item, dict):
                continue
            key = self._resolve_kb_key(item.get("class")) or item.get("class", "")
            try:
                c = float(item.get("confidence", 0.0))
            except (TypeError, ValueError):
                c = 0.0
            top3.append({**item, "class": key, "confidence": round(max(0.0, min(c, 1.0)), 4)})
        result["top_3"] = top3
        return result

    def predict_with_local_model(self, img_batch: np.ndarray) -> Dict[str, Any]:
        """Inference with loaded local Keras or TFLite model."""
        if self.model_type == "keras" and self.model is not None:
            probs = np.asarray(self.model.predict(img_batch, verbose=0)[0], dtype=np.float32)
        elif self.model_type == "tflite" and self.tflite_interpreter is not None:
            input_details = self.tflite_interpreter.get_input_details()[0]
            output_details = self.tflite_interpreter.get_output_details()[0]

            tensor = img_batch
            if input_details["dtype"] == np.uint8:
                # Quantized model expects raw 0..255 bytes
                raw = (img_batch + 1.0) * 127.5 if APPLY_EXTERNAL_NORMALIZATION else img_batch
                tensor = np.clip(raw, 0, 255).astype(np.uint8)
            else:
                tensor = img_batch.astype(input_details["dtype"])

            self.tflite_interpreter.set_tensor(input_details["index"], tensor)
            self.tflite_interpreter.invoke()
            probs = np.asarray(
                self.tflite_interpreter.get_tensor(output_details["index"])[0], dtype=np.float32
            )
        else:
            raise RuntimeError("No local model loaded.")

        if probs.shape[0] != len(self.class_names):
            raise RuntimeError(
                f"Model output size ({probs.shape[0]}) != class_names ({len(self.class_names)}). "
                f"Check class_names.json order/length against training."
            )

        # If the model emits logits instead of probabilities, softmax them
        if probs.min() < 0.0 or probs.max() > 1.0 or not np.isclose(probs.sum(), 1.0, atol=1e-2):
            shifted = probs - np.max(probs)
            exp = np.exp(shifted)
            probs = exp / exp.sum()

        top_indices = np.argsort(probs)[::-1][:3]
        top_idx = int(top_indices[0])
        top_conf = float(probs[top_idx])
        top_class = self._resolve_kb_key(self.class_names[top_idx]) or self.class_names[top_idx]

        top_3 = []
        for idx in top_indices:
            raw_name = self.class_names[int(idx)]
            c_name = self._resolve_kb_key(raw_name) or raw_name
            info = get_disease_info(c_name) or {}
            top_3.append({
                "class": c_name,
                "confidence": round(float(probs[int(idx)]), 4),
                "confidence_pct": round(float(probs[int(idx)]) * 100, 1),
                "label": f"{info.get('crop_en', '')} - {info.get('disease_name_en', '')}".strip(" -"),
                "disease_name_en": info.get("disease_name_en", c_name),
                "disease_name_ta": info.get("disease_name_ta", ""),
            })

        info = get_disease_info(top_class) or {}
        return {
            "is_plant": True,
            "crop_name": info.get("crop_en", "Crop"),
            "disease_name": info.get("disease_name_en", "Condition"),
            "predicted_class": top_class,
            "confidence": round(top_conf, 4),
            "top_3": top_3,
            "visual_observations": "Spectral feature activation indicates pattern alignment with "
            + info.get("disease_name_en", "condition"),
            "visual_observations_ta": f"மாதிரி இலைத் தோற்றத்தின் அம்சங்கள் {info.get('disease_name_ta', '')} உடன் பொருந்துகின்றன.",
        }

    # ------------------------------------------------------------------
    # NASA environmental risk
    # ------------------------------------------------------------------
    @staticmethod
    def _first_float(source: Any, keys: List[str]) -> Optional[float]:
        """Return the first numeric value found under any of `keys` in a dict."""
        if not isinstance(source, dict):
            return None
        for k in keys:
            v = source.get(k)
            if isinstance(v, (int, float)):
                return float(v)
        return None

    def evaluate_nasa_environmental_risk(self, disease_class: str, district: str) -> Dict[str, Any]:
        """
        Phase 7: NASA Environmental Risk Assessment.
        Correlates NASA POWER weather telemetry and SMAP soil moisture to calculate
        the climate-driven risk of pathogen proliferation.
        """
        disease_data = get_disease_info(disease_class)
        dist_key = district.lower().strip() if district else "pudukkottai"
        lat, lon = DISTRICT_COORDS.get(dist_key, DISTRICT_COORDS["pudukkottai"])

        if not disease_data or disease_data.get("is_healthy"):
            return {
                "risk_level": "Low",
                "risk_badge": "Optimal Growth",
                "risk_score": 15,
                "summary_en": "Environmental conditions are balanced with no adverse climatic risk for crop disease outbreak.",
                "summary_ta": "வானிலை சூழல் சீராக உள்ளது; பயிர் நோய் பரவுவதற்கான வானிலை ஆபத்து மிகக் குறைவு.",
                "environmental_telemetry": {
                    "district": district,
                    "avg_temp_c": 28.5,
                    "relative_humidity_pct": 68.0,
                    "smap_soil_moisture_pct": 24.2,
                    "source": "Regional seasonal baseline (healthy specimen - no live query)",
                },
            }

        # Seasonal regional defaults for Tamil Nadu (used only if live data is missing)
        temp_c, rh_pct, smap_pct, precip_mm = 29.0, 76.0, 25.5, 35.0
        live_weather = False
        live_smap = False

        try:
            sat_layers = NASAService.get_satellite_layer_metrics(lat, lon) or {}

            smap_val = self._first_float(sat_layers.get("smap_soil_moisture"), ["volumetric_moisture_pct"])
            if smap_val is not None:
                smap_pct, live_smap = smap_val, True

            gpm_val = self._first_float(sat_layers.get("gpm_precipitation"), ["accumulated_30d_mm"])
            if gpm_val is not None:
                precip_mm = gpm_val

            # POWER weather: try common keys if the NASA service exposes them
            power = (
                sat_layers.get("nasa_power")
                or sat_layers.get("power")
                or sat_layers.get("power_weather")
                or {}
            )
            t_val = self._first_float(power, ["avg_temp_c", "temperature_c", "T2M", "temp_c"])
            h_val = self._first_float(power, ["relative_humidity_pct", "humidity_pct", "RH2M", "rh_pct"])
            if t_val is not None:
                temp_c, live_weather = t_val, True
            if h_val is not None:
                rh_pct, live_weather = h_val, True
        except Exception as e:
            logger.warning(f"[DiseaseDetector] NASA telemetry unavailable, using seasonal baseline: {e}")

        risk_indicators = disease_data.get("nasa_risk_indicators", {}) or {}
        temp_min, temp_max = risk_indicators.get("temp_range_c", [20, 32])
        humidity_min = risk_indicators.get("humidity_min_pct")
        humidity_max = risk_indicators.get("humidity_max_pct")

        # ---- Risk scoring algorithm ----
        risk_score = 30  # Baseline

        # Temperature alignment (+25)
        if temp_min <= temp_c <= temp_max:
            risk_score += 25

        # Humidity alignment (+30)
        # - only min given  -> humid-loving pathogens (rh >= min)
        # - only max given  -> dry-climate pests like spider mites (rh <= max)
        # - both given      -> rh must be inside the band
        if humidity_min is not None and humidity_max is None:
            if rh_pct >= humidity_min:
                risk_score += 30
        elif humidity_min is None and humidity_max is not None:
            if rh_pct <= humidity_max:
                risk_score += 30
        elif humidity_min is not None and humidity_max is not None:
            if humidity_min <= rh_pct <= humidity_max:
                risk_score += 30

        # SMAP elevated moisture (+15)
        if risk_indicators.get("smap_moisture_elevated") and smap_pct > 28.0:
            risk_score += 15

        disease_en = disease_data.get("disease_name_en", "this disease")
        disease_ta = disease_data.get("disease_name_ta", "")

        if risk_score >= 70:
            level = "High"
            badge = "Elevated Climatic Risk"
            summary_en = (
                f"CRITICAL: Current district microclimate ({temp_c:.1f}°C, {rh_pct:.0f}% RH) strongly accelerates "
                f"{disease_en} infection pressure. Immediate preventive field management recommended."
            )
            summary_ta = (
                f"எச்சரிக்கை: தற்போதைய வானிலை ({temp_c:.1f}°C, {rh_pct:.0f}% காற்று ஈரப்பதம்) "
                f"{disease_ta} நோய் பரவ மிகவும் சாதகமாக உள்ளது. உடனடியாக தடுப்பு நடவடிக்கைகளை மேற்கொள்ளவும்."
            )
        elif risk_score >= 45:
            level = "Moderate"
            badge = "Moderate Climatic Risk"
            summary_en = (
                f"MODERATE: Ambient conditions ({temp_c:.1f}°C, {rh_pct:.0f}% RH) are moderately conducive for "
                f"pathogen reproduction. Continue regular scouting."
            )
            summary_ta = (
                f"மிதமான சூழல்: தற்போதைய வெப்பநிலை ({temp_c:.1f}°C) மற்றும் ஈரப்பதம் இந்நோய் மிதமாக "
                f"வளர வாய்ப்பளிக்கிறது. தொடர்ந்து பயிரை கண்காணிக்கவும்."
            )
        else:
            level = "Low"
            badge = "Inconducive Climate"
            summary_en = "LOW: Current temperature and moisture levels are unfavorable for rapid pathogen dissemination."
            summary_ta = "குறைந்த அபாயம்: தற்போதைய வானிலை இந்நோய் வேகமாக பரவுவதை தடுக்கும் வகையில் உள்ளது."

        if live_weather and live_smap:
            source = "NASA POWER Agroclimatology & SMAP Satellite"
        elif live_smap:
            source = "NASA SMAP Satellite (temperature/humidity: regional seasonal baseline)"
        else:
            source = "Regional seasonal baseline (live NASA data unavailable)"

        return {
            "risk_level": level,
            "risk_badge": badge,
            "risk_score": min(risk_score, 100),
            "summary_en": summary_en,
            "summary_ta": summary_ta,
            "environmental_telemetry": {
                "district": district,
                "avg_temp_c": round(temp_c, 1),
                "relative_humidity_pct": round(rh_pct, 1),
                "smap_soil_moisture_pct": round(smap_pct, 1),
                "gpm_precip_30d_mm": round(precip_mm, 1),
                # pyrefly: ignore[unnecessary-type-conversion]
                "is_live_data": bool(live_weather and live_smap),
                "source": source,
            },
            "disclaimer_en": "Environmental indicators assess climate conduciveness for pathogen spread, and do not constitute an independent diagnostic proof.",
            "disclaimer_ta": "நாசா வானிலை குறியீடுகள் நோய் பரவலுக்கான வானிலை சூழலை மட்டுமே குறிக்கின்றன; இது நேரடி மருத்துவ உறுதிப்படுத்தல் அல்ல.",
        }

    # ------------------------------------------------------------------
    # Response builders (shared by sync + async pipelines)
    # ------------------------------------------------------------------
    def _build_inconclusive_response(
        self, prediction: Dict[str, Any], engine: str, resolved_class: Optional[str]
    ) -> Dict[str, Any]:
        conf = float(prediction.get("confidence", 0.0))
        pred_class = resolved_class or prediction.get("predicted_class", "") or ""
        kb = get_disease_info(resolved_class) if resolved_class else None
        kb = kb or {}
        return {
            "status": "inconclusive",
            "confidence_score": round(conf * 100, 1),
            "threshold_score": round(UNCERTAINTY_THRESHOLD * 100, 1),
            "predicted_class": pred_class,
            "crop_en": prediction.get("crop_name") or kb.get("crop_en") or "",
            "crop_ta": kb.get("crop_ta") or "",
            "disease_name_en": "Inconclusive / Unsupported Specimen",
            "disease_name_ta": "தெளிவற்ற முடிவு / அறியப்படாத மாதிரி",
            "message_en": INCONCLUSIVE_MSG_EN,
            "message_ta": INCONCLUSIVE_MSG_TA,
            "observations": prediction.get("visual_observations")
            or "Unable to detect characteristic diagnostic disease patterns with high confidence.",
            "observations_ta": prediction.get("visual_observations_ta")
            or "நோயின் தனித்துவமான அறிகுறிகளை அதிக நம்பகத்தன்மையுடன் கண்டறிய முடியவில்லை.",
            "top_3_predictions": prediction.get("top_3", []),
            "nasa_environmental_risk": None,
            "engine": engine,
        }

    def _build_diagnosed_response(
        self, prediction: Dict[str, Any], resolved_class: str, district: str, engine: str
    ) -> Dict[str, Any]:
        conf = float(prediction.get("confidence", 0.0))
        kb_info = get_disease_info(resolved_class) or {}
        nasa_risk = self.evaluate_nasa_environmental_risk(resolved_class, district)

        return {
            "status": "diagnosed",
            "confidence_score": round(conf * 100, 1),
            "threshold_score": round(UNCERTAINTY_THRESHOLD * 100, 1),
            "predicted_class": resolved_class,
            "crop_en": kb_info.get("crop_en"),
            "crop_ta": kb_info.get("crop_ta"),
            "disease_name_en": kb_info.get("disease_name_en"),
            "disease_name_ta": kb_info.get("disease_name_ta"),
            "causal_agent": kb_info.get("causal_agent"),
            "pathogen_type": kb_info.get("pathogen_type"),
            "is_healthy": kb_info.get("is_healthy", False),
            "severity": kb_info.get("severity", "Moderate"),
            "symptoms_en": kb_info.get("symptoms_en", []),
            "symptoms_ta": kb_info.get("symptoms_ta", []),
            "causes_en": kb_info.get("causes_en", []),
            "causes_ta": kb_info.get("causes_ta", []),
            "organic_controls_en": kb_info.get("organic_controls_en", []),
            "organic_controls_ta": kb_info.get("organic_controls_ta", []),
            "chemical_controls_en": kb_info.get("chemical_controls_en", []),
            "chemical_controls_ta": kb_info.get("chemical_controls_ta", []),
            "preventive_measures_en": kb_info.get("preventive_measures_en", []),
            "preventive_measures_ta": kb_info.get("preventive_measures_ta", []),
            "top_3_predictions": prediction.get("top_3", []),
            "observations": prediction.get("visual_observations"),
            "observations_ta": prediction.get("visual_observations_ta"),
            "nasa_environmental_risk": nasa_risk,
            "engine": engine,
        }

    def _finalize(self, prediction: Dict[str, Any], district: str, engine: str) -> Dict[str, Any]:
        """Apply the 60% uncertainty threshold and build the final response."""
        conf = float(prediction.get("confidence", 0.0))
        is_plant = bool(prediction.get("is_plant", True))
        resolved = self._resolve_kb_key(prediction.get("predicted_class", ""))

        if not is_plant or conf < UNCERTAINTY_THRESHOLD or resolved is None:
            return self._build_inconclusive_response(prediction, engine, resolved)
        return self._build_diagnosed_response(prediction, resolved, district, engine)

    # ------------------------------------------------------------------
    # Public pipelines
    # ------------------------------------------------------------------
    def diagnose_leaf_image_sync(
        self, image_bytes: bytes, filename: str, district: str = "Pudukkottai"
    ) -> Dict[str, Any]:
        """
        Synchronous diagnostic pipeline using loaded local model.
        Fast, zero async overhead, ideal for CPU inference and testing.
        """
        img_batch, _ = self.preprocess_image(image_bytes)  # raises ImageValidationError on bad input

        if not self.model_loaded:
            raise RuntimeError("Local model weights not loaded. Use async diagnose_leaf_image for Gemini fallback.")

        prediction = self.predict_with_local_model(img_batch)
        return self._finalize(prediction, district, engine="local_model")

    async def diagnose_leaf_image(
        self, image_bytes: bytes, filename: str, district: str = "Pudukkottai"
    ) -> Dict[str, Any]:
        """
        Full End-to-End Diagnostic Pipeline:
        1. Preprocess & Validate (bad uploads fail fast, no fallback)
        2. Infer via Local Model (if available) or Gemini Vision Fallback
        3. Apply Uncertainty Threshold (< 60% = inconclusive)
        4. Correlate NASA Environmental Risk
        5. Attach Verified Agronomic Advisory
        """
        # Validate once up-front: user errors must never trigger the fallback path
        self.validate_image(image_bytes)

        local_error: Optional[Exception] = None
        if self.model_loaded:
            try:
                # Keep the event loop free during CPU-bound inference
                return await asyncio.to_thread(self.diagnose_leaf_image_sync, image_bytes, filename, district)
            except ImageValidationError:
                raise
            except Exception as e:
                local_error = e
                logger.warning(f"[DiseaseDetector] Local inference error: {e}. Falling back to Vision API.")

        # Fallback to Gemini Multimodal Vision API
        try:
            prediction = await self.predict_with_gemini_vision(image_bytes, filename)
        except Exception as gemini_error:
            if local_error is not None:
                raise RuntimeError(
                    f"Both engines failed. Local model: {local_error} | Gemini Vision: {gemini_error}"
                ) from gemini_error
            raise

        return await asyncio.to_thread(self._finalize, prediction, district, "gemini_vision")


# Global singleton instance
disease_detector = PlantDiseaseDetector()