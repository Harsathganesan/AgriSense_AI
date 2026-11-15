"""
AgriSense AI - Plant Disease Detection & Agronomic Diagnosis Routes
Phase 3 & Phase 6: FastAPI Endpoints & MongoDB Scan History

Endpoints:
- POST /api/disease/predict : Image analysis, uncertainty threshold, NASA risk & advisory
- GET  /api/disease/classes : Supported crops and disease classes list
- GET  /api/disease/health  : Model availability and API health status
- GET  /api/disease/history : User scan history from MongoDB
- GET  /api/disease/scan/{scan_id} : Detailed report retrieval
- DELETE /api/disease/scan/{scan_id} : Remove scan record
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends, status

from app.database import get_collection
from app.services.auth_service import get_current_user_optional
from app.services.disease_detector import disease_detector
from app.data.plant_disease_db import PLANT_DISEASE_KNOWLEDGE_BASE, get_disease_info

router = APIRouter(prefix="/disease", tags=["Plant Disease Detection"])

ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/webp"
}

@router.get("/health")
async def check_disease_service_health():
    """
    Check plant disease model availability and system health.
    """
    return {
        "status": "online",
        "service": "AgriSense AI Plant Doctor Diagnostic Engine",
        "model_loaded": disease_detector.model_loaded,
        "engine_type": disease_detector.model_type if disease_detector.model_loaded else "Gemini Multimodal Vision Fallback",
        "total_classes_supported": len(disease_detector.class_names),
        "supported_crops": ["Bell Pepper (குடைமிளகாய்)", "Potato (உருளைக்கிழங்கு)", "Tomato (தக்காளி)"],
        "uncertainty_threshold_pct": 60.0,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/classes")
async def get_supported_disease_classes():
    """
    Return all supported crop categories and disease diagnostic classes.
    """
    classes_list = []
    crops_map = {
        "Pepper": {"name_en": "Bell Pepper (Capsicum)", "name_ta": "குடைமிளகாய்", "classes": []},
        "Potato": {"name_en": "Potato", "name_ta": "உருளைக்கிழங்கு", "classes": []},
        "Tomato": {"name_en": "Tomato", "name_ta": "தக்காளி", "classes": []}
    }

    for raw_class, info in PLANT_DISEASE_KNOWLEDGE_BASE.items():
        crop_key = "Pepper" if "pepper" in raw_class.lower() else ("Potato" if "potato" in raw_class.lower() else "Tomato")
        class_entry = {
            "class_key": raw_class,
            "disease_name_en": info.get("disease_name_en"),
            "disease_name_ta": info.get("disease_name_ta"),
            "is_healthy": info.get("is_healthy", False),
            "severity": info.get("severity", "Moderate")
        }
        crops_map[crop_key]["classes"].append(class_entry)
        classes_list.append({
            "raw_class": raw_class,
            "crop_en": info.get("crop_en"),
            "crop_ta": info.get("crop_ta"),
            "disease_name_en": info.get("disease_name_en"),
            "disease_name_ta": info.get("disease_name_ta"),
            "severity": info.get("severity")
        })

    return {
        "total_classes": len(classes_list),
        "crops": crops_map,
        "all_classes": classes_list
    }

@router.post("/predict")
async def predict_plant_disease(
    file: UploadFile = File(..., description="Agricultural crop leaf photograph (JPEG/PNG/WEBP)"),
    district: Optional[str] = Form("Pudukkottai", description="Farmer district for NASA environmental risk correlation"),
    crop_hint: Optional[str] = Form(None, description="Optional crop selected by user"),
    save_history: Optional[bool] = Form(True, description="Save scan record in MongoDB history"),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Upload and analyze plant leaf image.
    Validates image, computes predictions, applies 60% confidence threshold,
    and returns ICAR/TNAU verified treatment protocols and NASA climate risk indicators.
    """
    # 1. Validate MIME type
    content_type = file.content_type or ""
    if content_type.lower() not in ALLOWED_MIME_TYPES and not file.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{content_type}'. Please upload a JPEG, PNG, or WEBP image."
        )

    # 2. Read image content
    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to read image stream: {e}")

    if len(image_bytes) < 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty or too small.")

    # 3. Perform Diagnosis
    try:
        diagnosis = await disease_detector.diagnose_leaf_image(
            image_bytes=image_bytes,
            filename=file.filename or "leaf.jpg",
            district=district or "Pudukkottai"
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Diagnostic pipeline error: {e}")

    # 4. Save scan to MongoDB Atlas if save_history is True
    scan_id = f"scan_{uuid.uuid4().hex[:12]}"
    user_id = current_user.get("_id") if current_user else "farmer_demo_guest"
    user_email = current_user.get("email") if current_user else "guest@agrisense.ai"

    if save_history and diagnosis.get("status") == "diagnosed":
        try:
            scans_col = get_collection("disease_scans")
            scan_record = {
                "_id": scan_id,
                "user_id": user_id,
                "user_email": user_email,
                "crop_en": diagnosis.get("crop_en"),
                "crop_ta": diagnosis.get("crop_ta"),
                "disease_name_en": diagnosis.get("disease_name_en"),
                "disease_name_ta": diagnosis.get("disease_name_ta"),
                "predicted_class": diagnosis.get("predicted_class"),
                "confidence_score": diagnosis.get("confidence_score"),
                "severity": diagnosis.get("severity"),
                "is_healthy": diagnosis.get("is_healthy", False),
                "district": district or "Pudukkottai",
                "filename": file.filename,
                "scan_date": datetime.utcnow().isoformat(),
                "treatment_summary_en": diagnosis.get("organic_controls_en", [])[:2],
                "chemical_summary_en": diagnosis.get("chemical_controls_en", [])[:2],
                "nasa_risk_level": diagnosis.get("nasa_environmental_risk", {}).get("risk_level", "Low"),
                "observations": diagnosis.get("observations")
            }
            scans_col.insert_one(scan_record)
            diagnosis["scan_id"] = scan_id
        except Exception as e:
            # Non-blocking log if DB write fails
            print(f"[AgriSense AI] Could not persist scan history: {e}")
            diagnosis["scan_id"] = scan_id
    else:
        diagnosis["scan_id"] = scan_id

    return diagnosis

@router.get("/history")
async def get_disease_scan_history(
    limit: int = 15,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Retrieve historical scans from MongoDB Atlas for the active user.
    """
    user_id = current_user.get("_id") if current_user else "farmer_demo_guest"
    scans_col = get_collection("disease_scans")

    # Fetch records matching user_id, or demo records if guest
    query = {"user_id": user_id}
    cursor = scans_col.find(query).sort("scan_date", -1).limit(limit)
    scans = list(cursor)

    # Sanitize Mongo ObjectId if present
    for s in scans:
        if "_id" in s:
            s["id"] = str(s["_id"])

    return {
        "total_scans": len(scans),
        "history": scans
    }

@router.get("/scan/{scan_id}")
async def get_scan_details(
    scan_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Retrieve a specific diagnostic report by ID with full treatment instructions.
    """
    scans_col = get_collection("disease_scans")
    scan = scans_col.find_one({"_id": scan_id})
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan record not found.")

    # Attach full knowledge base details if available
    pred_class = scan.get("predicted_class")
    if pred_class and pred_class in PLANT_DISEASE_KNOWLEDGE_BASE:
        kb_info = get_disease_info(pred_class)
        scan["full_advisory"] = kb_info

    if "_id" in scan:
        scan["id"] = str(scan["_id"])

    return scan

@router.delete("/scan/{scan_id}")
async def delete_scan_record(
    scan_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Delete a scan record from MongoDB Atlas.
    """
    user_id = current_user.get("_id") if current_user else "farmer_demo_guest"
    scans_col = get_collection("disease_scans")
    
    res = scans_col.delete_one({"_id": scan_id, "user_id": user_id})
    if res.deleted_count == 0:
        # Try finding if admin or guest demo
        scans_col.delete_one({"_id": scan_id})

    return {"status": "success", "message": f"Scan {scan_id} deleted successfully."}

