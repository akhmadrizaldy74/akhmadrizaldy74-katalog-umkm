from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.database import get_db
from app.models import Order, OrderItem, OrderStatus, Product
from app.schemas import LowStockProduct, StatsOut, TopProduct

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])

LOW_STOCK = 5
PAID_STATUSES = (OrderStatus.confirmed, OrderStatus.shipped, OrderStatus.done)


@router.get("/stats", response_model=StatsOut)
def stats(db: Session = Depends(get_db)):
    by_status = {s.value: 0 for s in OrderStatus}
    for status, count in db.execute(select(Order.status, func.count()).group_by(Order.status)):
        by_status[status.value] = count

    top = db.execute(
        select(OrderItem.product_name, func.sum(OrderItem.quantity).label("qty"))
        .join(Order)
        .where(Order.status.in_(PAID_STATUSES))
        .group_by(OrderItem.product_name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
    ).all()

    return StatsOut(
        total_products=db.scalar(select(func.count(Product.id))),
        active_products=db.scalar(select(func.count(Product.id)).where(Product.is_active.is_(True))),
        low_stock=db.scalar(
            select(func.count(Product.id)).where(Product.is_active.is_(True), Product.stock <= LOW_STOCK)
        ),
        orders_by_status=by_status,
        revenue=db.scalar(select(func.coalesce(func.sum(Order.total), 0)).where(Order.status.in_(PAID_STATUSES))),
        top_products=[TopProduct(product_name=n, quantity=int(q)) for n, q in top],
        low_stock_products=[
            LowStockProduct.model_validate(p)
            for p in db.scalars(
                select(Product)
                .where(Product.is_active.is_(True), Product.stock <= LOW_STOCK)
                .order_by(Product.stock, Product.name)
                .limit(8)
            )
        ],
    )
