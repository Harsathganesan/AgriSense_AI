import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

ROOT_DIR = BASE_DIR.parent
if (ROOT_DIR / ".env").exists():
    load_dotenv(ROOT_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "AgriSense AI"
    VERSION: str = "1.0.8"
    API_PREFIX: str = "/api"
    
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    CORS_ORIGINS: list = [
        origin.strip() for origin in os.getenv(
            "CORS_ORIGINS", 
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,https://frontend-chi-olive-vuf81ldsw2.vercel.app"
        ).split(",")
    ]
    
    # MongoDB Atlas Connection
    MONGODB_URI: str = os.getenv(
        "MONGODB_URI",
        "mongodb+srv://harsath137_db_user:9jsMz0qF10EJLDwJ@cluster0.eqwgeh8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "agrisense_ai")
    
    # JWT Security
    JWT_SECRET: str = os.getenv(
        "JWT_SECRET",
        "aq1hEH78_eA7U51vr6OlxXE6dkuKPLW04V6im4hdDn4lQ7yF5EXurqRo4gX2WirMjUh52iu_Dk5kJGZm0PZqpMQ"
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
    
    # Gemini AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # NASA APIs
    NASA_EARTHDATA_USERNAME: str = os.getenv("NASA_EARTHDATA_USERNAME", "")
    NASA_EARTHDATA_PASSWORD: str = os.getenv("NASA_EARTHDATA_PASSWORD", "")

settings = Settings()


