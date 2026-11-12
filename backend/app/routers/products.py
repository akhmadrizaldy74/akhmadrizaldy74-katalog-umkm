from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.auth import optional_admin, require_admin
from app.database import get_db
from app.models import AdminUser, Category, Product, ProductImage
from app.schemas import ProductIn, ProductOut, ProductPage, ProductUpdate
from app.storage import save_product_image
from app.utils import unique_slug

router = APIRouter(prefix="/api/products", tags=["products"])

MAX_IMAGES = 8
SORTS = {
    "newest": (Product.created_at.desc(), Product.id.desc()),
    "price_asc": (Product.price.asc(), Product.id.desc()),
    "price_desc": (Product.price.desc(), Product.id.desc()),
    "name": (Product.name.asc(), Product.id.asc()),
}


@router.get("", response_model=ProductPage)
def list_products(
    q: str | None = Query(default=None, max_length=100),
    category: str | None = Query(default=None, description="slug kategori"),
    include_inactive: bool = False,
    sort: str = Query(default="newest", pattern="^(newest|price_asc|price_desc|name)$"),
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
        stmt.options(joinedload(Product.category), selectinload(Product.images))
        .order_by(*SORTS[sort])
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
    """Unggah satu foto dan jadikan foto sampul (ditaruh paling depan di galeri)."""
    p = _get_or_404(db, product_id)
    _sync_cover(p)
    _check_room(p, 1)
    url = await save_product_image(file)
    for img in p.images:
        img.position += 1
    p.images.insert(0, ProductImage(url=url, position=0))
    p.image_url = url
    db.commit()
    return p


@router.post("/{product_id}/images", response_model=ProductOut, dependencies=[Depends(require_admin)])
async def upload_images(product_id: int, files: list[UploadFile] = File(...), db: Session = Depends(get_db)):
    """Tambah beberapa foto ke galeri. Kalau produk belum punya sampul, foto pertama jadi sampul."""
    p = _get_or_404(db, product_id)
    _sync_cover(p)
    _check_room(p, len(files))
    start = max((i.position for i in p.images), default=-1) + 1
    for n, f in enumerate(files):
        p.images.append(ProductImage(url=await save_product_image(f), position=start + n))
    if not p.image_url:
        p.image_url = p.images[0].url
    db.commit()
    return p


@router.put("/{product_id}/images/{image_id}/cover", response_model=ProductOut, dependencies=[Depends(require_admin)])
def set_cover(product_id: int, image_id: int, db: Session = Depends(get_db)):
    p = _get_or_404(db, product_id)
    img = _image_or_404(p, image_id)
    for i in p.images:  # sampul selalu di urutan pertama
        if i.position < img.position:
            i.position += 1
    img.position = 0
    p.image_url = img.url
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{product_id}/images/{image_id}", response_model=ProductOut, dependencies=[Depends(require_admin)])
def delete_image(product_id: int, image_id: int, db: Session = Depends(get_db)):
    p = _get_or_404(db, product_id)
    img = _image_or_404(p, image_id)
    p.images.remove(img)
    if p.image_url == img.url:
        p.image_url = p.images[0].url if p.images else None
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


def _image_or_404(p: Product, image_id: int) -> ProductImage:
    img = next((i for i in p.images if i.id == image_id), None)
    if img is None:
        raise HTTPException(404, "Foto tidak ditemukan")
    return img


def _sync_cover(p: Product) -> None:
    """Produk lama hanya punya image_url tanpa galeri: masukkan sampulnya ke galeri dulu."""
    if p.image_url and all(i.url != p.image_url for i in p.images):
        for i in p.images:
            i.position += 1
        p.images.insert(0, ProductImage(url=p.image_url, position=0))


def _check_room(p: Product, adding: int) -> None:
    if len(p.images) + adding > MAX_IMAGES:
        raise HTTPException(400, f"Maksimal {MAX_IMAGES} foto per produk (sekarang {len(p.images)})")


def _check_category(db: Session, category_id: int | None) -> None:
    if category_id is not None and db.get(Category, category_id) is None:
        raise HTTPException(400, "Kategori tidak ditemukan")
