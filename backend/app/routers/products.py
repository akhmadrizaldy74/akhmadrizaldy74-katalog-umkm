from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.auth import optional_admin, require_admin
from app.database import get_db
from app.models import AdminUser, Category, Product
from app.schemas import ProductIn, ProductOut, ProductPage, ProductUpdate
from app.storage import save_product_image
from app.utils import unique_slug

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=ProductPage)
def list_products(
    q: str | None = Query(default=None, max_length=100),
    category: str | None = Query(default=None, description="slug kategori"),
    include_inactive: bool = False,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=100),
    admin: AdminUser | None = Depends(optional_admin),
    db: Session = Depends(get_db),
):
    stmt = select(Product)
    if not (include_inactive and admin):
        stmt = stmt.where(Product.is_active.is_(True))
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Product.name.ilike(like), Product.description.ilike(like)))
    if category:
        stmt = stmt.join(Category).where(Category.slug == category)

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    items = db.scalars(
        stmt.options(joinedload(Product.category))
        .order_by(Product.created_at.desc(), Product.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    return ProductPage(items=items, total=total, page=page, limit=limit)


@router.get("/{slug}", response_model=ProductOut)
def get_product(slug: str, admin: AdminUser | None = Depends(optional_admin), db: Session = Depends(get_db)):
    p = db.scalar(select(Product).where(Product.slug == slug))
    if p is None or (not p.is_active and admin is None):
        raise HTTPException(404, "Produk tidak ditemukan")
    return p


@router.post("", response_model=ProductOut, status_code=201, dependencies=[Depends(require_admin)])
def create_product(body: ProductIn, db: Session = Depends(get_db)):
    _check_category(db, body.category_id)
    p = Product(**body.model_dump(), slug=unique_slug(db, Product, body.name))
    db.add(p)
    db.commit()
    return p


@router.put("/{product_id}", response_model=ProductOut, dependencies=[Depends(require_admin)])
def update_product(product_id: int, body: ProductUpdate, db: Session = Depends(get_db)):
    p = _get_or_404(db, product_id)
    data = body.model_dump(exclude_unset=True)
    if "category_id" in data:
        _check_category(db, data["category_id"])
    if "name" in data and data["name"] != p.name:
        p.slug = unique_slug(db, Product, data["name"], exclude_id=p.id)
    for k, v in data.items():
        setattr(p, k, v)
    db.commit()
    return p


@router.post("/{product_id}/image", response_model=ProductOut, dependencies=[Depends(require_admin)])
async def upload_image(product_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    p = _get_or_404(db, product_id)
    p.image_url = await save_product_image(file)
    db.commit()
    return p


@router.delete("/{product_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, product_id))
    db.commit()


def _get_or_404(db: Session, product_id: int) -> Product:
    p = db.get(Product, product_id)
    if p is None:
        raise HTTPException(404, "Produk tidak ditemukan")
    return p


def _check_category(db: Session, category_id: int | None) -> None:
    if category_id is not None and db.get(Category, category_id) is None:
        raise HTTPException(400, "Kategori tidak ditemukan")
