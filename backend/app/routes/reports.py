import os
import tempfile
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
from app.services.auth_service import get_current_user
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
    farm_id: str

@router.post("/generate")
async def generate_report(
    request: ReportGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    farms_col = get_collection("farms")
    soil_col = get_collection("soil_records")
    rotation_col = get_collection("rotation_analyses")
    reports_col = get_collection("reports")
    history_col = get_collection("analysis_history")

    farm = farms_col.find_one({"_id": request.farm_id})
    if not farm:
        farm = farms_col.find_one({"user_id": current_user["_id"]})
        if not farm:
            district = current_user.get("district") or "Thanjavur"
            farm = {
                "_id": request.farm_id or "default_farm",
                "name": f"{district} Farm Area",
                "user_id": current_user["_id"],
                "district": district,
                "state": current_user.get("state", "Tamil Nadu"),
                "latitude": 10.7870,
                "longitude": 79.1378
            }

    lat = float(farm.get("latitude", 10.7870))
    lon = float(farm.get("longitude", 79.1378))

    # NASA Data
    power = await NASAService.fetch_power_daily(lat, lon)
    sat = NASAService.get_satellite_layer_metrics(lat, lon)
    climate = NASAService.analyze_climate_anomalies_and_alerts(power.get("daily_records", []), sat.get("smap_soil_moisture", {}), lat)
    nasa_data = {
        "current_metrics": {
            "avg_temp_c": climate.get("avg_temperature_c"),
            "precipitation_30d_mm": climate.get("total_precipitation_30d_mm"),
            "smap_moisture_pct": sat.get("smap_soil_moisture", {}).get("volumetric_moisture_pct"),
            "ndvi": sat.get("modis_vegetation", {}).get("ndvi_current"),
            "elevation_m": sat.get("srtm_elevation", {}).get("elevation_meters"),
            "slope_pct": sat.get("srtm_elevation", {}).get("slope_pct")
        }
    }

    # Soil Data
    soil_rec = soil_col.find_one({"farm_id": farm["_id"]})
    if soil_rec and "status_summary" in soil_rec:
        soil_eval = soil_rec["status_summary"]
    else:
        soil_eval = SoilService.evaluate_soil_health(
            ph=6.8, nitrogen_kg_ha=240.0, phosphorus_kg_ha=16.0,
            potassium_kg_ha=200.0, organic_carbon_pct=0.58
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

    report_id = str(uuid.uuid4())
    filename = f"AgriSense_Report_{farm.get('name', 'Farm').replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
    file_path = REPORTS_DIR / f"{report_id}.pdf"
    
    with open(file_path, "wb") as f:
        f.write(pdf_bytes)

    now = datetime.utcnow().isoformat()
    report_doc = {
        "_id": report_id,
        "user_id": current_user["_id"],
        "farm_id": farm["_id"],
        "farm_name": farm.get("name"),
        "filename": filename,
        "created_at": now,
        "size_kb": round(len(pdf_bytes) / 1024, 1),
        "download_url": f"/api/reports/download/{report_id}"
    }
    reports_col.insert_one(report_doc)

    history_col.insert_one({
        "_id": str(uuid.uuid4()),
        "user_id": current_user["_id"],
        "farm_id": farm["_id"],
        "farm_name": farm.get("name"),
        "analysis_type": "PDF Report Export",
        "analysis_id": report_id,
        "created_at": now,
        "summary": f"Generated comprehensive diagnostic report: {filename}"
    })

    return report_doc

@router.get("/download/{report_id}")
async def download_report(report_id: str):
    reports_col = get_collection("reports")
    report = reports_col.find_one({"_id": report_id})
    file_path = REPORTS_DIR / f"{report_id}.pdf"
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Report file not found")

    with open(file_path, "rb") as f:
        pdf_bytes = f.read()

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

