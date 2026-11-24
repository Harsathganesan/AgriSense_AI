# AgriSense AI – Plant Doctor Module

Deep-learning crop disease diagnostic system trained on combined, deduplicated, and field-augmented crop pathology datasets.

---

## 1. Overview & Capabilities
- **Architecture:** MobileNetV2 pretrained on ImageNet with custom regularization head (BatchNormalization, Dropout, Dense(256), Softmax(33)).
- **Input:** 224x224 RGB Leaf images.
- **Output:** Canonical crop name, disease classification (or "Healthy"), prediction confidence score, top-3 candidates, and localized agronomic treatments (Organic, Chemical, Symptoms, Cause, Prevention).
- **Safety Fallback:** If confidence is below `70.0%`, returns `"Uncertain - please upload a clearer image of a single leaf"` to prevent misdiagnosis.
- **Format:** Dual export in Keras (`.keras`) and optimized quantized TensorFlow Lite (`.tflite`).

---

## 2. Supported Crops & Conditions (33 Classes)

| Crop | Supported Conditions |
|---|---|
| **Apple** | Apple scab, Black rot, Cedar apple rust, Healthy |
| **Cherry** | Powdery mildew, Healthy |
| **Corn (Maize)** | Cercospora leaf spot, Common rust, Northern leaf blight, Healthy |
| **Grape** | Black rot, Esca (Black measles), Leaf blight, Healthy |
| **Peach** | Bacterial spot, Healthy |
| **Pepper Bell** | Bacterial spot, Healthy |
| **Potato** | Early blight, Late blight, Healthy |
| **Strawberry** | Leaf scorch, Healthy |
| **Tomato** | Bacterial spot, Early blight, Late blight, Leaf mold, Septoria leaf spot, Spider mites, Target spot, Mosaic virus, Yellow leaf curl virus, Healthy |

---

## 3. Dataset Audit & Preparation
- **Raw Total Images Scanned:** 87,749 images across Dataset A (`archive.zip`) and Dataset B (`PlantVillage`).
- **Deduplication:** 13,523 exact duplicate image hashes identified and pruned via MD5 hashing.
- **Net Unique Dataset:** 74,226 verified clean images.
- **Stratified Split (70 / 15 / 15):**
  - **Train Split:** 51,958 images
  - **Val Split:** 11,134 images
  - **Test Split:** 11,134 images (untouched holdout)
  - Zero data leakage verified across splits (`train ∩ val = ∅`, `train ∩ test = ∅`).
- **Field Augmentation Pipeline:** Applied strictly to train set:
  - RandomRotation, RandomFlip, RandomZoom, RandomContrast, RandomBrightness, GaussianNoise.

---

## 4. Training Procedure
A 2-stage transfer learning pipeline:
1. **Stage 1 (Feature Extraction):** MobileNetV2 base frozen, Adam optimizer ($lr=10^{-3}$), training classification head with balanced inverse class weights.
2. **Stage 2 (Fine-Tuning):** Unfreeze top 30 layers of MobileNetV2, Adam optimizer ($lr=10^{-4}$), fine-tuning with `ReduceLROnPlateau`, `EarlyStopping`, and `ModelCheckpoint`.

To retrain or run training:
```bash
# Activate virtual environment
ml-training\venv\Scripts\activate

# Train model
python ml-training/train_plant_doctor.py --batch-size 64 --stage1-epochs 2 --stage2-epochs 2
```

---

## 5. Plant Doctor Module Components

### `predictor.py`
The core prediction engine:
```python
from plant_doctor.predictor import PlantDiseasePredictor

predictor = PlantDiseasePredictor()
result = predictor.predict("path/to/leaf_image.jpg")

# Result schema:
# {
#   "status": "success",
#   "crop": "Tomato",
#   "disease": "Late blight",
#   "is_healthy": false,
#   "confidence": 0.9842,
#   "top3": [...],
#   "treatment": {
#       "symptoms": "...",
#       "cause": "Phytophthora infestans...",
#       "organic_treatment": "...",
#       "chemical_treatment": "...",
#       "prevention": "..."
#   }
# }
```

### `api.py` (FastAPI Endpoint)
Run the standalone diagnostic API:
```bash
python ml-training/plant_doctor/api.py
```
- Endpoint: `POST /diagnose`
  - Accepts multipart `file` upload.
  - Returns complete diagnosis and treatment JSON.
- Endpoint: `GET /health`
- Endpoint: `GET /classes`

---

## 6. Running Unit Tests
```bash
ml-training\venv\Scripts\python.exe -m unittest ml-training/tests/test_predictor.py
```

