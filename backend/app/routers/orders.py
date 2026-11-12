from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.auth import require_admin
from app.database import get_db
from app.models import Order, OrderItem, OrderStatus, Product
from app.notify import order_event, publish_order_created
from app.routers.store import get_store
from app.schemas import OrderCreated, OrderIn, OrderOut, OrderStatusIn
from app.utils import build_whatsapp_url, order_code

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=OrderCreated, status_code=201)
def create_order(body: OrderIn, background: BackgroundTasks, db: Session = Depends(get_db)):
    # Gabungkan item duplikat (produk sama dikirim 2x)
    wanted: dict[int, int] = {}
    for it in body.items:
        wanted[it.product_id] = wanted.get(it.product_id, 0) + it.quantity

    # Kunci baris produk agar stok tidak minus saat ada order bersamaan (PostgreSQL)
    products = {p.id: p for p in db.scalars(select(Product).where(Product.id.in_(wanted)).with_for_update()).all()}

    order = Order(
        code=_unique_code(db),
        customer_name=body.customer_name.strip(),
        customer_phone=body.customer_phone,
        customer_address=body.customer_address.strip(),
        note=body.note.strip(),
        total=0,
    )
    for pid, qty in wanted.items():
        p = products.get(pid)
        if p is None or not p.is_active:
            raise HTTPException(400, f"Produk #{pid} tidak tersedia")
        if p.stock < qty:
            raise HTTPException(400, f"Stok {p.name} tidak cukup (sisa {p.stock})")
        p.stock -= qty
        subtotal = p.price * qty  # harga selalu diambil dari DB, bukan dari client
        order.items.append(
            OrderItem(product_id=p.id, product_name=p.name, price=p.price, quantity=qty, subtotal=subtotal)
        )
        order.total += subtotal

    db.add(order)
    db.commit()

    store = get_store(db)
    background.add_task(publish_order_created, order_event(order, store.name))
    return OrderCreated(order=order, whatsapp_url=build_whatsapp_url(store.name, store.whatsapp, order))


@router.get("", response_model=list[OrderOut], dependencies=[Depends(require_admin)])
def list_orders(
    status: OrderStatus | None = None,
    q: str | None = Query(default=None, max_length=100, description="cari kode, nama, atau no. HP"),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    stmt = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc(), Order.id.desc())
    if status:
        stmt = stmt.where(Order.status == status)
    if q and q.strip():
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(Order.code.ilike(like), Order.customer_name.ilike(like), Order.customer_phone.ilike(like))
        )
    return db.scalars(stmt.limit(limit)).all()


@router.get("/{code}", response_model=OrderOut, dependencies=[Depends(require_admin)])
def get_order(code: str, db: Session = Depends(get_db)):
    order = db.scalar(select(Order).where(Order.code == code.upper()))
    if order is None:
        raise HTTPException(404, "Pesanan tidak ditemukan")
    return order


@router.patch("/{order_id}/status", response_model=OrderOut, dependencies=[Depends(require_admin)])
def update_status(order_id: int, body: OrderStatusIn, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(404, "Pesanan tidak ditemukan")
    if order.status == OrderStatus.cancelled and body.status != OrderStatus.cancelled:
        raise HTTPException(400, "Pesanan yang sudah dibatalkan tidak bisa diaktifkan lagi")

    if body.status == OrderStatus.cancelled and order.status != OrderStatus.cancelled:
        # Kembalikan stok
        for it in order.items:
            if it.product_id and (p := db.get(Product, it.product_id)):
                p.stock += it.quantity

    order.status = body.status
    db.commit()
    return order


def _unique_code(db: Session) -> str:
    while True:
        code = order_code()
        if not db.scalar(select(func.count()).where(Order.code == code)):
            return code
