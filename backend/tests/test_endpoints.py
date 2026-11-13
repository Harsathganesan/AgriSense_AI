import asyncio
import sys
from pathlib import Path

# Add backend root to sys.path
backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

import httpx
from app.main import app
from app.database import get_collection
from app.services.auth_service import AuthService

async def run_all_tests():
    print("--- Starting AgriSense AI API Verification Suite ---", flush=True)
    
    # 1. Provision Demo User
    print("Step 1: Check demo user...", flush=True)
    users_col = get_collection("users")
    demo_user = users_col.find_one({"email": "farmer@agrisense.ai"})
    if not demo_user:
        print("Creating demo user...", flush=True)
        hashed_pwd = AuthService.get_password_hash("farmer123")
        users_col.insert_one({
            "_id": "user_demo_farmer",
            "name": "Kandasamy Muthusamy (முத்துசாமி)",
            "email": "farmer@agrisense.ai",
            "hashed_password": hashed_pwd,
            "language": "en",
            "phone": "+91 94431 82740",
            "district": "Thanjavur",
            "state": "Tamil Nadu",
            "priorities": {
                "soil_regeneration": 0.35,
                "water_conservation": 0.35,
                "market_profitability": 0.30,
                "risk_tolerance": "medium"
            },
            "created_at": "2026-01-10T08:00:00"
        })
    print("Step 1 done.", flush=True)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Test 1: Health
        r = await client.get("/api/health")
        assert r.status_code == 200, f"Health check failed: {r.text}"
        print("✓ Health Check Passed:", r.json()["status"])

        # Test 2: Login
        r = await client.post("/api/auth/login", json={
            "email": "farmer@agrisense.ai",
            "password": "farmer123"
        })
        assert r.status_code == 200, f"Login failed: {r.text}"
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✓ Authentication & JWT Token Passed")

        # Test 3: Get Farms
        r = await client.get("/api/farms", headers=headers)
        assert r.status_code == 200
        farms = r.json()
        assert len(farms) >= 1
        farm_id = farms[0]["id"]
        print(f"✓ Farms Service Passed: {farms[0]['name']} ({farm_id})")

        # Test 4: NASA Summary Telemetry
        r = await client.get(f"/api/nasa/summary?latitude={farms[0]['latitude']}&longitude={farms[0]['longitude']}")
        assert r.status_code == 200
        nasa_data = r.json()
        print("✓ NASA Earth Observation Telemetry Passed:", {
            "GPM_Precip": nasa_data["current_metrics"]["precipitation_30d_mm"],
            "SMAP_Moisture": nasa_data["current_metrics"]["smap_moisture_pct"],
            "MODIS_NDVI": nasa_data["current_metrics"]["ndvi"],
            "SRTM_Elevation": nasa_data["current_metrics"]["elevation_m"]
        })

        # Test 5: Soil Records & Diagnostics
        r = await client.get(f"/api/soil/latest?farm_id={farm_id}", headers=headers)
        assert r.status_code == 200
        soil_data = r.json()
        print(f"✓ Soil Health Diagnostic Passed: Score={soil_data['health_score']}/100, pH={soil_data['ph']}")

        # Test 6: Crops Database
        r = await client.get("/api/crops")
        assert r.status_code == 200
        crops = r.json()
        assert len(crops) >= 10
        print(f"✓ Crop Database Passed: {len(crops)} crops loaded including Tamil Nadu staples")

        # Test 7: Crop Rotation MCDA Engine
        r = await client.post(
            "/api/rotation/generate",
            json={"farm_id": farm_id},
            headers=headers
        )
        assert r.status_code == 200
        rot_data = r.json()
        assert len(rot_data["strategies"]) == 3
        print("✓ Crop Rotation Intelligence (3 Strategies Generated):")
        for s in rot_data["strategies"]:
            print(f"  - {s['name']}: Score={s['overall_score']}/100, WaterSaved={s['water_savings_pct']}%, N_Added=+{s['nitrogen_added_kg_ha']}kg/ha")

        # Test 8: What-If Simulation
        r = await client.post(
            "/api/rotation/what-if",
            json={
                "farm_id": farm_id,
                "water_deficit_pct": 25.0,
                "temperature_increase_c": 2.0
            },
            headers=headers
        )
        assert r.status_code == 200
        sim_data = r.json()
        print("✓ What-If Drought & Climate Simulation Passed:", sim_data["impact_analysis"]["recommended_pivot"])

        # Test 9: AI Farm Assistant
        r = await client.post(
            "/api/assistant/chat",
            json={
                "message": "Explain crop rotation benefits for my farm in Tamil",
                "farm_id": farm_id,
                "language": "ta"
            },
            headers=headers
        )
        assert r.status_code == 200
        ai_reply = r.json()
        print("✓ AI Farm Assistant (Tamil/English) Passed. Engine:", ai_reply.get("engine"))

        # Test 10: PDF Report Generation
        r = await client.post(
            "/api/reports/generate",
            json={"farm_id": farm_id},
            headers=headers
        )
        assert r.status_code == 200
        report_meta = r.json()
        print("✓ PDF Report Generation Passed:", report_meta["filename"], f"({report_meta['size_kb']} KB)")

        # Test 11: History
        r = await client.get("/api/history", headers=headers)
        assert r.status_code == 200
        history_items = r.json()
        print(f"✓ History Log Passed: {len(history_items)} entries tracked.")

    print("\n=======================================================")
    print("ALL 11 BACKEND API MODULES & INTEGRATIONS PASSED 100%!")
    print("=======================================================")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
