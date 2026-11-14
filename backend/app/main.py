import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import get_collection
from app.services.auth_service import AuthService
from app.routes import auth, farms, nasa, soil, crops, rotation, assistant, reports, history, location, analysis, district

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure demo user and initial data
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
        print("[AgriSense AI] Demo farmer account provisioned: farmer@agrisense.ai / farmer123")
    yield
    print("[AgriSense AI] Backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Smart Crop Rotation & Soil Health Decision Platform powered by NASA Earth Observations and Gemini AI",
    redirect_slashes=False,
    lifespan=lifespan
)

# CORS configuration
allowed_origins = [
    "https://frontend-chi-olive-vuf81ldsw2.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Register API Routers with /api prefix
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(farms.router, prefix=settings.API_PREFIX)
app.include_router(nasa.router, prefix=settings.API_PREFIX)
app.include_router(soil.router, prefix=settings.API_PREFIX)
app.include_router(crops.router, prefix=settings.API_PREFIX)
app.include_router(rotation.router, prefix=settings.API_PREFIX)
app.include_router(assistant.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)
app.include_router(history.router, prefix=settings.API_PREFIX)
app.include_router(location.router, prefix=settings.API_PREFIX)
app.include_router(analysis.router, prefix=settings.API_PREFIX)
app.include_router(district.router, prefix=settings.API_PREFIX)

# Also register without prefix so endpoints work whether requested as /api/crops or /crops
app.include_router(auth.router)
app.include_router(farms.router)
app.include_router(nasa.router)
app.include_router(soil.router)
app.include_router(crops.router)
app.include_router(rotation.router)
app.include_router(assistant.router)
app.include_router(reports.router)
app.include_router(history.router)
app.include_router(location.router)
app.include_router(analysis.router)
app.include_router(district.router)

@app.get("/")
@app.get("/api")
@app.get("/api/")
@app.get("/api/index")
@app.get("/api/index.py")
@app.get("/index.py")
async def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "Online",
        "description": "Smart Crop Rotation & Soil Health Decision Platform",
        "api_docs": "/docs"
    }

@app.get("/health")
@app.get("/api/health")
@app.get("/api/health/")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": "Active",
        "nasa_services": "Operational",
        "gemini_assistant": "Available" if settings.GEMINI_API_KEY else "Agronomy Mode"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

