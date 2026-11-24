import os
import sys
import io
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# pyrefly: ignore[missing-import]
# pyrefly: ignore[missing-import]
# pyrefly: ignore[missing-import]
from predictor import PlantDiseasePredictor

app = FastAPI(
    title="AgriSense AI - Plant Doctor API",
    description="Deep-learning powered crop disease identification, severity assessment, and organic/chemical treatment recommendation system.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy loading / singleton predictor
predictor: Optional[PlantDiseasePredictor] = None

def get_predictor():
    global predictor
    if predictor is None:
        predictor = PlantDiseasePredictor()
    return predictor

# pyrefly: ignore[deprecated]
@app.on_event("startup")
async def startup_event():
    try:
        get_predictor()
        print("[PlantDoctor API] Model and predictor loaded successfully.")
    except Exception as e:
        print(f"[PlantDoctor API] Warning during model initialization: {e}")

class TopPrediction(BaseModel):
    class_name: str
    crop: str
    disease: str
    is_healthy: bool
    confidence: float

class TreatmentInfo(BaseModel):
    crop: Optional[str] = None
    condition: Optional[str] = None
    is_healthy: Optional[bool] = None
    symptoms: Optional[str] = None
    cause: Optional[str] = None
    organic_treatment: Optional[str] = None
    chemical_treatment: Optional[str] = None
    prevention: Optional[str] = None

class DiagnosisResponse(BaseModel):
    status: str
    message: str
    crop: Optional[str]
    disease: Optional[str]
    is_healthy: Optional[bool]
    confidence: Optional[float]
    top3: List[Dict[str, Any]]
    treatment: Optional[Dict[str, Any]]

@app.get("/")
def root():
    return {
        "service": "Plant Doctor Diagnostic Engine",
        "status": "online",
        "version": "1.0.0",
        "supported_crops_count": 9,
        "supported_conditions_count": 33
    }

@app.get("/health")
def health():
    engine = get_predictor()
    return {
        "status": "healthy",
        "model_loaded": engine is not None,
        "is_tflite": engine.is_tflite if engine else None,
        "classes_count": len(engine.class_names) if engine else 0
    }

@app.get("/classes")
def get_supported_classes():
    engine = get_predictor()
    return {
        "count": len(engine.class_names),
        "classes": engine.class_names
    }

@app.post("/diagnose", response_model=DiagnosisResponse)
async def diagnose_leaf(file: UploadFile = File(...)):
    """
    Accepts an uploaded image file of a crop leaf and returns diagnosis, confidence score,
    top-3 candidate conditions, and tailored treatment recommendations.
    """
    # pyrefly: ignore[missing-attribute]
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Please upload an image (JPEG, PNG, WEBP)."
        )

    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
        engine = get_predictor()
        result = engine.predict(contents)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8001, reload=False)

