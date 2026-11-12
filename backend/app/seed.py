"""Isi data contoh untuk demo: `python -m app.seed`

Produk contoh otomatis diberi foto ilustrasi dari folder seed_images/.
Kalau database sudah berisi produk, seed hanya menambahkan foto ke produk contoh yang belum punya foto.
"""

from pathlib import Path

from sqlalchemy import select

from app.database import SessionLocal
from app.main import init_db
from app.models import Category, Product, ProductImage
from app.storage import store_webp
from app.utils import slugify

IMAGES_DIR = Path(__file__).parent / "seed_images"

DEMO = {
    "Makanan": [
        ("Keripik Singkong Balado", 15000, 40, "Keripik singkong renyah dengan bumbu balado pedas manis. 200 gram."),
        ("Rendang Daging Kemasan", 85000, 12, "Rendang sapi asli Padang, tahan 1 bulan tanpa pengawet. 250 gram."),
        ("Sambal Bawang Botol", 25000, 30, "Sambal bawang homemade, level pedas sedang. 150 ml."),
    ],
    "Minuman": [
        ("Kopi Gayo Bubuk", 55000, 25, "Kopi arabika Gayo, roasting medium, digiling halus. 200 gram."),
        ("Teh Rosella Kering", 30000, 18, "Kelopak rosella kering untuk teh herbal, kaya antioksidan. 50 gram."),
    ],
    "Kerajinan": [
        ("Tas Anyaman Pandan", 120000, 6, "Tas jinjing anyaman pandan buatan tangan pengrajin Tasikmalaya."),
        ("Batik Tulis Motif Parang", 350000, 3, "Kain batik tulis 2 meter, pewarna alami."),
    ],
}


def attach_demo_images(product: Product) -> int:
    """Pasang foto contoh (slug-1.webp, slug-2.webp, ...) ke produk yang belum punya foto."""
    if product.image_url or product.images:
        return 0
    files = sorted(IMAGES_DIR.glob(f"{product.slug}-*.webp"))
    for pos, f in enumerate(files):
        product.images.append(ProductImage(url=store_webp(f.read_bytes()), position=pos))
    if product.images:
        product.image_url = product.images[0].url
    return len(files)


def run() -> None:
    init_db()
    with SessionLocal() as db:
        if db.scalar(select(Product).limit(1)):
            added = sum(attach_demo_images(p) for p in db.scalars(select(Product)))
            db.commit()
            print(f"Data produk sudah ada. Foto contoh ditambahkan: {added}.")
            return
        for cat_name, items in DEMO.items():
            cat = Category(name=cat_name, slug=slugify(cat_name))
            db.add(cat)
            for name, price, stock, desc in items:
                p = Product(name=name, slug=slugify(name), price=price, stock=stock, description=desc, category=cat)
                attach_demo_images(p)
                db.add(p)
        db.commit()
        print("Seed selesai.")


if __name__ == "__main__":
    run()
