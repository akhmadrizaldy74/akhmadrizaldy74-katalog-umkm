import re
import secrets
import string
import unicodedata
from urllib.parse import quote

from sqlalchemy import select
from sqlalchemy.orm import Session


def rupiah(n: int) -> str:
    """1500000 -> 'Rp1.500.000'"""
    return "Rp" + f"{n:,}".replace(",", ".")


def normalize_phone(raw: str) -> str:
    """Ubah '0812-3456 7890' / '+62812...' menjadi '62812...' (format wa.me)."""
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("0"):
        digits = "62" + digits[1:]
    elif digits.startswith("8"):
        digits = "62" + digits
    if not digits.startswith("62") or not 10 <= len(digits) <= 15:
        raise ValueError("Nomor HP tidak valid. Contoh: 081234567890")
    return digits


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text or "item"


def unique_slug(db: Session, model, text: str, exclude_id: int | None = None) -> str:
    base = slugify(text)
    slug, i = base, 2
    while True:
        q = select(model.id).where(model.slug == slug)
        if exclude_id is not None:
            q = q.where(model.id != exclude_id)
        if db.scalar(q) is None:
            return slug
        slug, i = f"{base}-{i}", i + 1


def order_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "ORD-" + "".join(secrets.choice(alphabet) for _ in range(6))


def build_whatsapp_url(store_name: str, store_wa: str, order) -> str:
    lines = [f"Halo {store_name}, saya mau pesan:", "", f"*Kode pesanan: {order.code}*"]
    for i, it in enumerate(order.items, 1):
        lines.append(f"{i}. {it.product_name} x{it.quantity} = {rupiah(it.subtotal)}")
    lines += [
        "",
        f"*Total: {rupiah(order.total)}*",
        "",
        f"Nama: {order.customer_name}",
        f"No. HP: {order.customer_phone}",
        f"Alamat: {order.customer_address}",
    ]
    if order.note:
        lines.append(f"Catatan: {order.note}")
    lines += ["", "Mohon info ongkir & cara pembayarannya ya. Terima kasih!"]
    return f"https://wa.me/{store_wa}?text={quote(chr(10).join(lines))}"
