from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import AdminUser

ALGORITHM = "HS256"
bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:
        return False


def create_token(admin_id: int) -> str:
    exp = datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode({"sub": str(admin_id), "exp": exp}, settings.jwt_secret, algorithm=ALGORITHM)


def _admin_from_creds(creds: HTTPAuthorizationCredentials | None, db: Session) -> AdminUser | None:
    if creds is None:
        return None
    try:
        payload = jwt.decode(creds.credentials, settings.jwt_secret, algorithms=[ALGORITHM])
        return db.get(AdminUser, int(payload["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


def require_admin(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)
) -> AdminUser:
    admin = _admin_from_creds(creds, db)
    if admin is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Silakan login sebagai admin", {"WWW-Authenticate": "Bearer"})
    return admin


def optional_admin(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)
) -> AdminUser | None:
    return _admin_from_creds(creds, db)
