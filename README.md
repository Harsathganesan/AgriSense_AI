# AgriSense AI – Smart Crop Rotation & Soil Health Decision Platform

![AgriSense AI Theme](https://img.shields.io/badge/AgriSense%20AI-v1.0.0-238636?style=for-the-badge)
![NASA Earth Observations](https://img.shields.io/badge/NASA%20Data-POWER%20%7C%20GPM%20%7C%20SMAP%20%7C%20MODIS%20%7C%20SRTM-0284c7?style=for-the-badge)
![FastAPI Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11-009688?style=for-the-badge)
![React Vite](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Tailwind-61dafb?style=for-the-badge)
![Tamil & English](https://img.shields.io/badge/Language-English%20%7C%20%E0%AE%A4%E0%AE%AE%E0%AE%BF%E0%AE%B4%E0%AF%8D-238636?style=for-the-badge)

**AgriSense AI** is a production-ready, full-stack decision platform engineered for Indian and tropical agricultural ecosystems (with deep regional calibration for **Tamil Nadu** and the Cauvery delta). The platform translates real-time **NASA Earth Observations** and laboratory soil chemistry into transparent, multi-criteria crop rotation strategies, water conservation plans, and bilingual AI agronomy guidance.

---

## Key Modules & Features

1. **Dashboard**
   - Farm summary, current ambient temperature, 30-day precipitation, root-zone volumetric soil moisture, MODIS NDVI vegetation health index, and SRTM digital elevation.
   - Real-time environmental risk alerts (prolonged dry spells, heat stress, moisture deficit).
   - Interactive 30-day weather telemetry and 12-month historical climatology baseline charts.
2. **My Farm Management**
   - Add, edit, and switch across multiple farm plots.
   - Geographic coordinates (latitude/longitude), land area (acres), soil classification (Alluvial, Black soil, Red loam, Sandy loam), irrigation infrastructure, and crop histories.
3. **NASA Data Explorer**
   - Direct integration with **NASA POWER API** (Daily surface temperature, precipitation, relative humidity, all-sky solar radiation).
   - **NASA GPM IMERG:** Accumulated precipitation patterns and rainfall anomaly tracking.
   - **NASA SMAP:** Root-zone (0-100 cm) and surface (0-5 cm) volumetric soil moisture in $\text{m}^3/\text{m}^3$ and percentage.
   - **NASA MODIS:** 250m 16-day NDVI vegetation canopy vigor index.
   - **NASA SRTM v3:** 30m digital elevation and topographic slope analysis.
   - Transparent metadata distinguishing real observations from 30-year climatology baselines.
4. **Soil Health Diagnostics**
   - Soil reaction (pH), Available Nitrogen (N), Phosphorus (P), Potassium (K), Soil Organic Carbon (OC %), Soil Moisture (%), and Electrical Conductivity (EC).
   - Algorithmic composite fertility scorecard ($0-100$) calibrated against **ICAR** and **TNAU** standards.
   - Laboratory soil-test entry form and longitudinal soil history tracker.
5. **Crop Explorer**
   - Complete agronomic catalog containing 18+ crops with heavy emphasis on Tamil Nadu staples:
     - **Cereals:** Rice / Paddy (நெல்), Maize (மக்காச்சோளம்).
     - **Pulses & Legumes:** Black Gram / Urad (உளுந்து), Green Gram / Moong (பச்சைப்பயறு), Cowpea (காராமணி), Red Gram / Pigeon Pea (துவரை).
     - **Millets:** Finger Millet / Ragi (கேழ்வரகு), Pearl Millet / Bajra (கம்பு), Sorghum (சோளம்), Barnyard Millet (குதிரைவாலி), Foxtail Millet (தினை).
     - **Oilseeds & Cash Crops:** Groundnut (வேர்க்கடலை), Sesame / Gingelly (எள்), Sunflower (சூரியகாந்தி), Cotton (பருத்தி), Sugarcane (கரும்பு), Banana (வாழை).
     - **Green Manure:** Sunn Hemp (சணப்பை).
   - Complete water footprints (mm), growing durations, temperature limits, pest vulnerabilities, and break-crop compatibility.
6. **Crop Rotation Intelligence Engine**
   - Transparent Multi-Criteria Decision Analysis (**MCDA**) scoring:
     - Climate Suitability: $25\%$
     - Water Suitability: $20\%$
     - Soil Health & Structure: $20\%$
     - Nutrient Cycling & Nitrogen Fixation: $15\%$
     - Environmental & Pest Break Suitability: $10\%$
     - Market Demand & Economic Return: $10\%$
   - Generates and compares 3 actionable strategies:
     1. **Existing Traditional Rotation:** (e.g. Rice - Rice - Bare Fallow)
     2. **Soil-Health-Focused Rotation:** (Sunn Hemp Green Manure - Samba Rice - Rice Fallow Black Gram Relay)
     3. **Water-Efficient & Climate-Resilient Rotation:** (Finger Millet - Groundnut - Sesame)
   - Side-by-side comparison matrix showing water savings $\%$, biological nitrogen fixed ($\text{kg/ha}$), and soil health delta score.
   - **What-If Simulation:** Test drought scenarios (e.g. $-25\%$ rainfall deficit), extreme summer heat ($+2^\circ\text{C}$), or soil pH shifts.
7. **AI Farm Assistant**
   - Context-grounded Gemini-powered chatbot with an agronomic expert fallback.
   - Bilingual support: Seamless switching between English and natural **Tamil (தமிழ்)**.
   - Answers questions grounded exclusively on your farm's calculated soil tests, NASA satellite metrics, and rotation sequences.
8. **Interactive Farm Map**
   - Powered by Leaflet and OpenStreetMap.
   - Polygon boundary overlays for active farm plots.
   - Toggleable satellite overlays (Street Map, Satellite Imagery, MODIS NDVI, SMAP Soil Moisture).
9. **PDF Reports**
   - One-click server-side PDF generation powered by Python ReportLab.
   - Complete formal agronomic report containing Farm Profile, Soil Health Scorecard, NASA Satellite Telemetry, 3-Strategy Comparison Table, and Actionable Fertilizer Optimization Guidelines.
10. **History & Audit Log**
    - Chronological log of all analyses, soil tests, simulations, and report downloads.
11. **Settings & Localization**
    - Profile management, English/Tamil language toggle, and custom algorithmic priority weight tuners (Soil Regeneration vs Water Conservation vs Profitability).

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, React Router v6, Axios, Recharts, Leaflet, React Leaflet, Lucide React |
| **Backend** | Python 3.11, FastAPI, Uvicorn, Pydantic v2, PyMongo, python-jose, bcrypt, httpx, ReportLab |
| **Data & AI** | NASA POWER REST API, NASA GPM/SMAP/MODIS/SRTM models, Gemini API (`gemini-2.5-flash`), NumPy, Scikit-learn, Pandas |
| **Database** | MongoDB Atlas / Local MongoDB, with dual-mode embedded JSON document store fallback for zero-dependency local runs |
| **Deployment** | Vercel (Frontend), Render (Full-Stack), Docker ready |

---

## Quick Start & Setup

### 1. Prerequisites
- **Node.js** v18+ and **npm**
- **Python** 3.11+

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env and optionally add your GEMINI_API_KEY
cp .env.example .env

# Run FastAPI backend server (runs at http://localhost:8000)
uvicorn app.main:app --reload --port 8000
```

> **Note:** AgriSense AI automatically detects MongoDB. If MongoDB is not running locally, it gracefully operates using an embedded persistent storage engine in `backend/data_store/`, ensuring 100% functionality out-of-the-box!

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend
npm install

# Configure environment variables (optional: defaults work out of the box)
cp .env.example .env
```

### Option A: One-Command Startup (Frontend Auto-Starts Backend)

Simply start the frontend dev server, and **AgriSense AI will automatically detect and launch the FastAPI backend**:

```bash
# From the project root:
npm run dev

# Or from the frontend directory:
cd frontend
npm run dev
```

*The Vite development server will check port 8000. If the backend is not already running, it automatically spawns the FastAPI server, connects to MongoDB Atlas, authenticates with NASA Earthdata, and sets up reverse proxying seamlessly!*

### Option B: Windows Launcher Scripts

Double-click either launcher script in the project root:
- **`start-frontend.bat`**: Launches frontend on `http://localhost:5173` and automatically starts backend if not already active.
- **`start-all.bat`**: Explicitly launches both backend and frontend in dedicated console windows.

---

## Instant Demo Credentials

The platform is pre-seeded with a verified demo farmer profile for instant exploration:
- **Email:** `farmer@agrisense.ai`
- **Password:** `farmer123`
- **Location:** Cauvery Delta Green Valley Farm, Thanjavur, Tamil Nadu (10.7870°N, 79.1378°E)

---

## Automated Test Suite

AgriSense AI comes with an end-to-end verification suite testing all 11 modules:
```bash
cd backend
.\venv\Scripts\python tests/test_endpoints.py
```
Expected output:
```
✓ Health Check Passed: healthy
✓ Authentication & JWT Token Passed
✓ Farms Service Passed: Cauvery Delta Green Valley Farm
✓ NASA Earth Observation Telemetry Passed: GPM, SMAP, MODIS, SRTM
✓ Soil Health Diagnostic Passed: Score 86.9/100
✓ Crop Database Passed: 18 crops loaded including Tamil Nadu staples
✓ Crop Rotation Intelligence (3 Strategies Generated)
✓ What-If Drought & Climate Simulation Passed
✓ AI Farm Assistant (Tamil/English) Passed
✓ PDF Report Generation Passed
✓ History Log Passed
=======================================================
ALL 11 BACKEND API MODULES & INTEGRATIONS PASSED 100%!
=======================================================
```

---

## Production Deployment on Vercel (Full-Stack Monorepo)

AgriSense AI is fully pre-configured for **single-project full-stack deployment on Vercel** (both Vite React frontend & FastAPI Python backend running together on one domain):

### Deploying to Vercel in 3 Steps:

1. **Push your repository to GitHub.**
2. **Go to [Vercel](https://vercel.com/new) and Import your GitHub repository:**
   - **Framework Preset:** Vite (or Other)
   - **Root Directory:** `./` (Leave as root)
   - **Build Command:** `npm --prefix frontend install && npm --prefix frontend run build` (configured automatically via `vercel.json`)
   - **Output Directory:** `frontend/dist` (configured automatically via `vercel.json`)
3. **Add Environment Variables in Vercel Settings:**
   In your Vercel Project -> **Settings** -> **Environment Variables**, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection string (e.g. `mongodb+srv://...`)
   - `DATABASE_NAME`: `agrisense_ai`
   - `JWT_SECRET`: A strong secret key (e.g. `agrisense_super_secret_jwt_key_2026`)
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `NASA_EARTHDATA_USERNAME`: Your NASA Earthdata username (optional)
   - `NASA_EARTHDATA_PASSWORD`: Your NASA Earthdata password (optional)
   - *(Note: `VITE_API_BASE_URL` should be left empty or omitted so the frontend automatically calls `/api` on the same Vercel domain!)*

Click **Deploy**! Vercel will build the frontend assets, compile the Python serverless function at `/api/index.py`, and launch your full-stack platform live on `https://your-project.vercel.app`!

---

## Agronomic Scoring Disclaimer

Crop rotation strategy suitability scores and guidelines generated by AgriSense AI are calculated using multi-criteria decision algorithms and NASA Earth observation telemetry. Agricultural yields, moisture retention, and pest cycles are influenced by localized weather fluctuations and farmer management practices. Model estimates are advisory and do not unconditionally guarantee specific financial yields.

