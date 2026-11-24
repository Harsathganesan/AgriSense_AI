import os
import json
import numpy as np
from PIL import Image

# Supported crops canonical list
SUPPORTED_CROPS = {
    "Apple",
    "Cherry",
    "Corn",
    "Grape",
    "Peach",
    "Pepper_bell",
    "Potato",
    "Strawberry",
    "Tomato"
}

CONFIDENCE_THRESHOLD = 0.70

class PlantDiseasePredictor:
    """
    Inference engine for Plant Doctor.
    Loads trained MobileNetV2 model (.keras or .tflite) and performs leaf disease diagnosis
    with confidence filtering, top-3 predictions, and treatment guidance.
    """
    def __init__(self, model_path=None, class_names_path=None, treatments_path=None):
        base_dir = os.path.dirname(__file__)
        parent_dir = os.path.abspath(os.path.join(base_dir, ".."))

        # 1. Resolve Class Names
        if not class_names_path:
            class_names_path = os.path.join(parent_dir, "class_names.json")
            if not os.path.exists(class_names_path):
                class_names_path = os.path.join(base_dir, "class_names.json")
        
        with open(class_names_path, "r", encoding="utf-8") as f:
            self.class_names = json.load(f)

        # 2. Resolve Treatments Database
        if not treatments_path:
            treatments_path = os.path.join(base_dir, "treatments.json")
        
        with open(treatments_path, "r", encoding="utf-8") as f:
            self.treatments = json.load(f)

        # 3. Resolve Model Path (.tflite preferred for fast inference, fallback to .keras)
        if not model_path:
            tflite_candidate = os.path.join(parent_dir, "plant_disease_model.tflite")
            keras_candidate = os.path.join(parent_dir, "plant_disease_model.keras")
            
            if os.path.exists(tflite_candidate):
                model_path = tflite_candidate
            elif os.path.exists(keras_candidate):
                model_path = keras_candidate
            else:
                model_path = tflite_candidate

        self.model_path = model_path
        self.is_tflite = model_path.endswith(".tflite")
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found at {self.model_path}")

        if self.is_tflite:
            try:
                # pyrefly: ignore[missing-import]
                import tflite_runtime.interpreter as tflite
                self.interpreter = tflite.Interpreter(model_path=self.model_path)
            except ImportError:
                # pyrefly: ignore[untyped-import]
                import tensorflow as tf
                # pyrefly: ignore[implicit-import, missing-attribute]
                self.interpreter = tf.lite.Interpreter(model_path=self.model_path)
            
            self.interpreter.allocate_tensors()
            self.input_details = self.interpreter.get_input_details()
            self.output_details = self.interpreter.get_output_details()
            print(f"[Predictor] Loaded TFLite model from {self.model_path}")
        else:
            # pyrefly: ignore[untyped-import]
            import tensorflow as tf
            self.model = tf.keras.models.load_model(self.model_path)
            print(f"[Predictor] Loaded Keras model from {self.model_path}")

    def preprocess_image(self, image_input):
        """
        Accepts file path, bytes, or PIL Image.
        Returns numpy array shaped (1, 224, 224, 3) with float32 RGB values in [0, 255].
        """
        if isinstance(image_input, (str, os.PathLike)):
            img = Image.open(image_input)
        elif isinstance(image_input, bytes):
            import io
            img = Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, Image.Image):
            img = image_input
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        # Convert to RGB (handles RGBA, grayscale, palette)
        img = img.convert("RGB")
        # High quality Lanczos resize to 224x224
        img = img.resize((224, 224), Image.Resampling.LANCZOS)
        
        arr = np.array(img, dtype=np.float32)
        arr = np.expand_dims(arr, axis=0) # (1, 224, 224, 3)
        return arr

    def parse_class_label(self, class_label):
        """
        Parses canonical Crop___Disease string into formatted {crop, disease, is_healthy}.
        Example: 'Tomato___Early_blight' -> crop='Tomato', disease='Early blight', is_healthy=False
        """
        if "___" in class_label:
            crop_raw, disease_raw = class_label.split("___", 1)
        else:
            parts = class_label.split("_", 1)
            crop_raw = parts[0]
            disease_raw = parts[1] if len(parts) > 1 else "Unknown"

        crop = crop_raw.replace("_", " ").title()
        disease = disease_raw.replace("_", " ").title()
        is_healthy = disease.lower() == "healthy"

        return crop, disease, is_healthy

    def predict(self, image_input):
        """
        Runs diagnosis on an image.
        Returns:
            {
                "crop": str,
                "disease": str,
                "is_healthy": bool,
                "confidence": float,
                "status": "success" | "uncertain" | "unsupported",
                "message": str,
                "top3": list of dicts,
                "treatment": dict (symptoms, cause, organic, chemical, prevention)
            }
        """
        img_tensor = self.preprocess_image(image_input)

        if self.is_tflite:
            self.interpreter.set_tensor(self.input_details[0]['index'], img_tensor)
            self.interpreter.invoke()
            probabilities = self.interpreter.get_tensor(self.output_details[0]['index'])[0]
        else:
            preds = self.model(img_tensor, training=False)
            probabilities = preds.numpy()[0]

        top_indices = np.argsort(probabilities)[::-1][:3]
        top_idx = int(top_indices[0])
        top_confidence = float(probabilities[top_idx])
        top_class = self.class_names[top_idx]

        crop, disease, is_healthy = self.parse_class_label(top_class)

        # Build top 3 ranking
        top3 = []
        for idx in top_indices:
            c_name = self.class_names[int(idx)]
            c_crop, c_dis, c_hlth = self.parse_class_label(c_name)
            top3.append({
                "class": c_name,
                "crop": c_crop,
                "disease": c_dis,
                "is_healthy": c_hlth,
                "confidence": round(float(probabilities[int(idx)]), 4)
            })

        # Fetch agronomic treatment advice
        treatment_info = self.treatments.get(top_class, {
            "crop": crop,
            "condition": disease,
            "is_healthy": is_healthy,
            "symptoms": "N/A",
            "cause": "N/A",
            "organic_treatment": "Consult local Krishi Vigyan Kendra (KVK) or extension officer.",
            "chemical_treatment": "Consult licensed agronomist.",
            "prevention": "Maintain soil health and crop rotation."
        })

        # Unsupported crop validation
        if crop not in SUPPORTED_CROPS:
            return {
                "status": "unsupported",
                "message": f"Crop '{crop}' is not currently in the supported database ({', '.join(sorted(SUPPORTED_CROPS))}).",
                "crop": crop,
                "disease": disease,
                "is_healthy": is_healthy,
                "confidence": round(top_confidence, 4),
                "top3": top3,
                "treatment": None
            }

        # Confidence Threshold Validation (< 0.70)
        if top_confidence < CONFIDENCE_THRESHOLD:
            return {
                "status": "uncertain",
                "message": "Uncertain - please upload a clearer image of a single leaf",
                "crop": crop,
                "disease": disease,
                "is_healthy": is_healthy,
                "confidence": round(top_confidence, 4),
                "top3": top3,
                "treatment": treatment_info
            }

        return {
            "status": "success",
            "message": "Diagnosis completed successfully.",
            "crop": crop,
            "disease": disease,
            "is_healthy": is_healthy,
            "confidence": round(top_confidence, 4),
            "top3": top3,
            "treatment": treatment_info
        }

if __name__ == "__main__":
    predictor = PlantDiseasePredictor()
    print("PlantDoctor predictor initialized successfully.")

