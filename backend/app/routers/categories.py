from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.database import get_db
from app.models import Category
from app.schemas import CategoryIn, CategoryOut
from app.utils import unique_slug

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.scalars(select(Category).order_by(Category.name)).all()


@router.post("", response_model=CategoryOut, status_code=201, dependencies=[Depends(require_admin)])
def create_category(body: CategoryIn, db: Session = Depends(get_db)):
    cat = Category(name=body.name.strip(), slug=unique_slug(db, Category, body.name))
    db.add(cat)
    db.commit()
    return cat


@router.put("/{category_id}", response_model=CategoryOut, dependencies=[Depends(require_admin)])
def update_category(category_id: int, body: CategoryIn, db: Session = Depends(get_db)):
    cat = db.get(Category, category_id) or _404()
    cat.name = body.name.strip()
    cat.slug = unique_slug(db, Category, body.name, exclude_id=cat.id)
    db.commit()
    return cat


@router.delete("/{category_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_category(category_id: int, db: Session = Depends(get_db)):
    cat = db.get(Category, category_id) or _404()
    for p in cat.products:  # produk tetap ada, hanya kehilangan kategori
        p.category_id = None
    db.delete(cat)
    db.commit()


def _404():
    raise HTTPException(404, "Kategori tidak ditemukan")
