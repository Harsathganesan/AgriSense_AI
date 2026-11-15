import os
import tempfile
import base64
from fastapi import APIRouter, HTTPException, Depends, Response
from pydantic import BaseModel
from datetime import datetime
import uuid
from pathlib import Path
from typing import List, Optional
from app.services.pdf_service import PDFReportService
from app.services.nasa_service import NASAService
from app.services.soil_service import SoilService
from app.services.rotation_engine import RotationEngine
from app.services.auth_service import get_current_user, get_current_user_optional
from app.services.district_service import DistrictService
from app.database import get_collection

router = APIRouter(prefix="/reports", tags=["Reports"])

# Serverless environment (e.g. Vercel) has a read-only root; use system tempdir for generated PDFs
is_serverless = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
if is_serverless:
    REPORTS_DIR = Path(tempfile.gettempdir()) / "agrisense_reports"
else:
    REPORTS_DIR = Path(__file__).resolve().parent.parent.parent / "generated_reports"

try:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    REPORTS_DIR = Path(tempfile.gettempdir()) / "agrisense_reports"
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

class ReportGenerateRequest(BaseModel):
    farm_id: Optional[str] = "default_farm"
    district: Optional[str] = "Pudukkottai"

async def _build_report_payload(district: str, farm_id: Optional[str], current_user: Optional[dict]):
    farms_col = get_collection("farms")
    soil_col = get_collection("soil_records")
    rotation_col = get_collection("rotation_analyses")

    user_id = current_user.get("_id", "guest_farmer") if current_user else "guest_farmer"

    farm = None
    if farm_id and farm_id != "default_farm":
        farm = farms_col.find_one({"_id": farm_id})
    if not farm and current_user:
        farm = farms_col.find_one({"user_id": user_id})

    # Load agro profile for target district
    agro = DistrictService.get_district_agro_profile(district)
    lab = agro.get("baseline_lab_soil", {})

    if not farm:
        farm = {
            "_id": farm_id or "default_farm",
            "name": f"{district} Precision Farm Area",
            "user_id": user_id,
            "district": district,
            "state": "Tamil Nadu",
            "area_acres": 5.0,
            "soil_type": agro.get("primary_soil", "Red Sandy Loam"),
            "latitude": 10.3833,
            "longitude": 78.8000
        }

    lat = float(farm.get("latitude", 10.3833))
    lon = float(farm.get("longitude", 78.8000))

    # NASA Data
    power = await NASAService.fetch_power_daily(lat, lon)
    sat = NASAService.get_satellite_layer_metrics(lat, lon)
    climate = NASAService.analyze_climate_anomalies_and_alerts(power.get("daily_records", []), sat.get("smap_soil_moisture", {}), lat)
    nasa_data = {
        "current_metrics": {
            "avg_temp_c": climate.get("avg_temperature_c", 27.5),
            "precipitation_30d_mm": climate.get("total_precipitation_30d_mm", 58.0),
            "smap_moisture_pct": sat.get("smap_soil_moisture", {}).get("volumetric_moisture_pct", 24.2),
            "ndvi": sat.get("modis_vegetation", {}).get("ndvi_current", 0.54),
            "elevation_m": sat.get("srtm_elevation", {}).get("elevation_meters", 115.0),
            "slope_pct": sat.get("srtm_elevation", {}).get("slope_pct", 0.8)
        }
    }

    # Soil Data
    soil_rec = soil_col.find_one({"farm_id": farm["_id"]})
    if soil_rec and "status_summary" in soil_rec:
        soil_eval = soil_rec["status_summary"]
    else:
        soil_eval = SoilService.evaluate_soil_health(
            ph=float(lab.get("ph", 6.4)),
            nitrogen_kg_ha=float(lab.get("nitrogen_kg_ha", 185.0)),
            phosphorus_kg_ha=float(lab.get("phosphorus_kg_ha", 12.0)),
            potassium_kg_ha=float(lab.get("potassium_kg_ha", 175.0)),
            organic_carbon_pct=float(lab.get("organic_carbon_pct", 0.38))
        )

    # Rotation Data
    rot_rec = rotation_col.find_one({"farm_id": farm["_id"]})
    if rot_rec and "strategies" in rot_rec:
        rotation_data = rot_rec
    else:
        strats = RotationEngine.generate_three_strategies(farm, soil_eval, climate)
        rotation_data = {"strategies": [s.dict() for s in strats]}

    pdf_bytes = PDFReportService.generate_comprehensive_farm_report(
        farm_data=farm,
        soil_eval=soil_eval,
        nasa_data=nasa_data,
        rotation_data=rotation_data
    )

    filename = f"AgriSense_Report_{district}_{farm.get('name', 'Farm').replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
    return farm, user_id, filename, pdf_bytes

@router.post("/generate")
async def generate_report(
    request: ReportGenerateRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    reports_col = get_collection("reports")
    history_col = get_collection("analysis_history")

    target_district = request.district or (current_user.get("district") if current_user else None) or "Pudukkottai"
    farm, user_id, filename, pdf_bytes = await _build_report_payload(target_district, request.farm_id, current_user)

    report_id = str(uuid.uuid4())
    file_path = REPORTS_DIR / f"{report_id}.pdf"
    
    try:
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)
    except Exception as e:
        print("Local file write warning:", e)

    now = datetime.utcnow().isoformat()
    pdf_b64 = base64.b64encode(pdf_bytes).decode('utf-8')

    report_doc = {
        "_id": report_id,
        "user_id": user_id,
        "farm_id": farm["_id"],
        "farm_name": farm.get("name"),
        "district": target_district,
        "filename": filename,
        "created_at": now,
        "size_kb": round(len(pdf_bytes) / 1024, 1),
        "download_url": f"/api/reports/download/{report_id}",
        "pdf_base64": pdf_b64
    }
    
    try:
        reports_col.insert_one(report_doc)
        history_col.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "farm_id": farm["_id"],
            "farm_name": farm.get("name"),
            "analysis_type": "PDF Report Export",
            "analysis_id": report_id,
            "created_at": now,
            "summary": f"Generated comprehensive diagnostic report: {filename}"
        })
    except Exception as e:
        print("Database save warning:", e)

    return report_doc

@router.get("/export")
@router.post("/export")
async def export_report_direct(
    district: Optional[str] = "Pudukkottai",
    farm_id: Optional[str] = "default_farm",
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Directly streams the generated PDF bytes as an attachment with full mobile browser compatibility."""
    target_district = district or "Pudukkottai"
    _, _, filename, pdf_bytes = await _build_report_payload(target_district, farm_id, current_user)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.get("/download/{report_id}")
async def download_report(report_id: str):
    reports_col = get_collection("reports")
    report = reports_col.find_one({"_id": report_id})
    file_path = REPORTS_DIR / f"{report_id}.pdf"
    
    pdf_bytes = None
    if file_path.exists():
        with open(file_path, "rb") as f:
            pdf_bytes = f.read()
    elif report and "pdf_base64" in report:
        pdf_bytes = base64.b64decode(report["pdf_base64"])

    if not pdf_bytes:
        raise HTTPException(status_code=404, detail="Report file not found")

    filename = report.get("filename", f"AgriSense_Report_{report_id}.pdf") if report else f"AgriSense_Report_{report_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@router.get("/list")
async def list_reports(current_user: dict = Depends(get_current_user)):
    reports_col = get_collection("reports")
    cursor = reports_col.find({"user_id": current_user["_id"]})
    return list(cursor)

