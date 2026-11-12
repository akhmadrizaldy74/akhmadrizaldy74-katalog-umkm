"""Isi data contoh untuk demo: `python -m app.seed`"""

from sqlalchemy import select

from app.database import SessionLocal
from app.main import init_db
from app.models import Category, Product
from app.utils import slugify

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


def run() -> None:
    init_db()
    with SessionLocal() as db:
        if db.scalar(select(Product).limit(1)):
            print("Data produk sudah ada, seed dilewati.")
            return
        for cat_name, items in DEMO.items():
            cat = Category(name=cat_name, slug=slugify(cat_name))
            db.add(cat)
            for name, price, stock, desc in items:
                db.add(Product(name=name, slug=slugify(name), price=price, stock=stock, description=desc, category=cat))
        db.commit()
        print("Seed selesai.")


if __name__ == "__main__":
    run()
