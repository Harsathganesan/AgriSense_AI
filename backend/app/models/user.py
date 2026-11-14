from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)
    language: str = "en"  # "en" or "ta"
    phone: Optional[str] = None
    country: Optional[str] = "India"
    state: Optional[str] = "Tamil Nadu"
    district: Optional[str] = "Thanjavur"
    registered_location: Optional[Dict[str, Any]] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserPriorities(BaseModel):
    soil_regeneration: float = Field(0.35, ge=0.0, le=1.0)
    water_conservation: float = Field(0.35, ge=0.0, le=1.0)
    market_profitability: float = Field(0.30, ge=0.0, le=1.0)
    risk_tolerance: str = "medium"  # "low", "medium", "high"

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    registered_location: Optional[Dict[str, Any]] = None
    current_gps_location: Optional[Dict[str, Any]] = None
    priorities: Optional[UserPriorities] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    language: str
    phone: Optional[str] = None
    country: Optional[str] = "India"
    state: Optional[str] = "Tamil Nadu"
    district: Optional[str] = "Thanjavur"
    registered_location: Optional[Dict[str, Any]] = None
    current_gps_location: Optional[Dict[str, Any]] = None
    priorities: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

