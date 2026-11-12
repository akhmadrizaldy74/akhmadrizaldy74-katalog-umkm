from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.database import get_db
from app.models import Store
from app.schemas import StoreIn, StoreOut

router = APIRouter(prefix="/api/store", tags=["store"])


def get_store(db: Session) -> Store:
    return db.scalar(select(Store).limit(1))


@router.get("", response_model=StoreOut)
def read_store(db: Session = Depends(get_db)):
    return get_store(db)


@router.put("", response_model=StoreOut, dependencies=[Depends(require_admin)])
def update_store(body: StoreIn, db: Session = Depends(get_db)):
    store = get_store(db)
    for k, v in body.model_dump().items():
        setattr(store, k, v)
    db.commit()
    return store
