import unittest
import json
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_collection
from app.services.auth_service import AuthService

class TestAgriSenseAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Ensure demo user exists
        users_col = get_collection("users")
        demo_user = users_col.find_one({"email": "farmer@agrisense.ai"})
        if not demo_user:
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

        cls.client = TestClient(app)
        resp = cls.client.post("/api/auth/login", json={
            "email": "farmer@agrisense.ai",
            "password": "farmer123"
        })
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        cls.token = resp.json()["access_token"]
        cls.headers = {"Authorization": f"Bearer {cls.token}"}

    def test_01_health_check(self):
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "healthy")

    def test_02_auth_me(self):
        resp = self.client.get("/api/auth/me", headers=self.headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("email", data)
        self.assertEqual(data["email"], "farmer@agrisense.ai")

    def test_03_farms_list(self):
        resp = self.client.get("/api/farms", headers=self.headers)
        self.assertEqual(resp.status_code, 200)
        farms = resp.json()
        self.assertIsInstance(farms, list)
        self.assertGreaterEqual(len(farms), 1)
        self.assertEqual(farms[0]["district"], "Thanjavur")

    def test_04_nasa_summary(self):
        resp = self.client.get("/api/nasa/summary?latitude=10.7870&longitude=79.1378")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("current_metrics", data)
        self.assertIn("alerts", data)
        self.assertIn("source_metadata", data)
        self.assertIn("monthly_climatology", data)

    def test_05_soil_analyze(self):
        payload = {
            "ph": 6.8,
            "nitrogen_kg_ha": 230.0,
            "phosphorus_kg_ha": 15.0,
            "potassium_kg_ha": 210.0,
            "organic_carbon_pct": 0.62,
            "soil_moisture_pct": 25.0
        }
        resp = self.client.post("/api/soil/analyze", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("composite_health_score", data)
        self.assertIn("parameters", data)
        self.assertGreater(data["composite_health_score"], 0)

    def test_06_crops_list(self):
        resp = self.client.get("/api/crops")
        self.assertEqual(resp.status_code, 200)
        crops = resp.json()
        self.assertGreaterEqual(len(crops), 10)
        paddy = next((c for c in crops if "Rice" in c["name"]), None)
        self.assertIsNotNone(paddy)
        self.assertEqual(paddy["tamil_name"], "நெல் (Paddy)")

    def test_07_rotation_generate(self):
        farms_resp = self.client.get("/api/farms", headers=self.headers)
        farm_id = farms_resp.json()[0]["id"]

        resp = self.client.post(
            "/api/rotation/generate",
            json={"farm_id": farm_id},
            headers=self.headers
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("strategies", data)
        self.assertEqual(len(data["strategies"]), 3)
        self.assertIn("comparison_matrix", data)
        self.assertIn("agronomic_advisory", data)

    def test_08_what_if_simulation(self):
        farms_resp = self.client.get("/api/farms", headers=self.headers)
        farm_id = farms_resp.json()[0]["id"]

        resp = self.client.post(
            "/api/rotation/what-if",
            json={
                "farm_id": farm_id,
                "water_deficit_pct": 25.0,
                "temperature_increase_c": 1.5
            },
            headers=self.headers
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("impact_analysis", data)
        self.assertIn("strategies", data)

    def test_09_assistant_chat(self):
        farms_resp = self.client.get("/api/farms", headers=self.headers)
        farm_id = farms_resp.json()[0]["id"]

        resp_en = self.client.post(
            "/api/assistant/chat",
            json={"message": "What is the recommended crop rotation?", "farm_id": farm_id, "language": "en"},
            headers=self.headers
        )
        self.assertEqual(resp_en.status_code, 200)
        self.assertIn("reply", resp_en.json())

    def test_10_pdf_report_generate(self):
        farms_resp = self.client.get("/api/farms", headers=self.headers)
        farm_id = farms_resp.json()[0]["id"]

        resp = self.client.post(
            "/api/reports/generate",
            json={"farm_id": farm_id},
            headers=self.headers
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("download_url", data)

if __name__ == "__main__":
    unittest.main()
