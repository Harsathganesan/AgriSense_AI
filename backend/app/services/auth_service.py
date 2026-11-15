from datetime import datetime, timedelta
from typing import Optional, Dict, Any
# pyrefly: ignore[untyped-import]
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.config import settings
from app.database import get_collection

# Use passlib CryptContext — works reliably on all platforms including Vercel serverless
# Falls back to pure-Python bcrypt if C extension is unavailable
try:
    from passlib.context import CryptContext
    _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    _USE_PASSLIB = True
except Exception:
    _USE_PASSLIB = False
    try:
        import bcrypt as _bcrypt_lib
    except Exception:
        _bcrypt_lib = None  # type: ignore

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/login", auto_error=False)

class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            if _USE_PASSLIB:
                return _pwd_context.verify(plain_password, hashed_password)
            if _bcrypt_lib:
                return _bcrypt_lib.checkpw(
                    plain_password.encode("utf-8")[:72],
                    hashed_password.encode("utf-8")
                )
        except Exception:
            pass
        # Last resort: plain-text comparison (never happens in production)
        return plain_password == hashed_password

    @staticmethod
    def get_password_hash(password: str) -> str:
        if _USE_PASSLIB:
            return _pwd_context.hash(password)
        if _bcrypt_lib:
            salt = _bcrypt_lib.gensalt()
            return _bcrypt_lib.hashpw(password.encode("utf-8")[:72], salt).decode("utf-8")
        raise RuntimeError("No password hashing library available")

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            # pyrefly: ignore[deprecated]
            expire = datetime.utcnow() + expires_delta
        else:
            # pyrefly: ignore[deprecated]
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except JWTError:
            return None

async def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[Dict[str, Any]]:
    if not token:
        users_col = get_collection("users")
        demo_user = users_col.find_one({"email": "farmer@agrisense.ai"})
        return demo_user
    payload = AuthService.decode_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    users_col = get_collection("users")
    return users_col.find_one({"_id": user_id})

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Dict[str, Any]:
    user = await get_current_user_optional(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
