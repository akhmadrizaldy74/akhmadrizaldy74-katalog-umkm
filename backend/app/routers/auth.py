from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import create_token, require_admin, verify_password
from app.database import get_db
from app.models import AdminUser
from app.schemas import AdminOut, LoginIn, TokenOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    admin = db.scalar(select(AdminUser).where(AdminUser.email == body.email.lower()))
    if admin is None or not verify_password(body.password, admin.password_hash):
        raise HTTPException(401, "Email atau password salah")
    return TokenOut(access_token=create_token(admin.id))


@router.get("/me", response_model=AdminOut)
def me(admin: AdminUser = Depends(require_admin)):
    return admin
