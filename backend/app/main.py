import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from app.auth import hash_password
from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import AdminUser, Store
from app.routers import admin, auth, categories, orders, products, store
from app.utils import normalize_phone

logging.basicConfig(level=logging.INFO)


def init_db() -> None:
    """Buat tabel & data awal (admin + profil toko) bila belum ada."""
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if db.scalar(select(AdminUser).limit(1)) is None:
            db.add(AdminUser(email=settings.admin_email.lower(), password_hash=hash_password(settings.admin_password)))
        if db.scalar(select(Store).limit(1)) is None:
            db.add(
                Store(
                    name=settings.store_name,
                    whatsapp=normalize_phone(settings.store_whatsapp),
                    description=settings.store_description,
                    address=settings.store_address,
                )
            )
        db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Katalog UMKM API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth.router, store.router, categories.router, products.router, orders.router, admin.router):
    app.include_router(r)

Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
