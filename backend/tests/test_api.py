import io
from urllib.parse import unquote

from PIL import Image

ORDER = {
    "customer_name": "Budi",
    "customer_phone": "0812-3456-7890",
    "customer_address": "Jl. Merdeka No. 1, Bandung",
    "note": "Tolong dibungkus rapi",
}


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_login_wrong_password(client):
    r = client.post("/api/auth/login", json={"email": "admin@tokoku.id", "password": "salah"})
    assert r.status_code == 401


def test_admin_endpoints_require_token(client):
    assert client.post("/api/products", json={"name": "X", "price": 1, "stock": 1}).status_code == 401
    assert client.get("/api/orders").status_code == 401
    assert client.get("/api/admin/stats").status_code == 401


def test_store_public_and_update(client, admin_headers):
    assert client.get("/api/store").json()["name"]
    r = client.put(
        "/api/store",
        json={"name": "Dapur Bu Sri", "whatsapp": "+62 811-1111-2222", "description": "", "address": ""},
        headers=admin_headers,
    )
    assert r.status_code == 200
    assert r.json()["whatsapp"] == "6281111112222"


def test_product_listing_and_search(client, admin_headers, product):
    hidden = client.post(
        "/api/products",
        json={"name": "Produk Draft", "price": 1000, "stock": 1, "is_active": False},
        headers=admin_headers,
    ).json()

    public = client.get("/api/products").json()
    assert [p["id"] for p in public["items"]] == [product["id"]]
    assert client.get("/api/products", params={"q": "balado"}).json()["total"] == 1
    assert client.get("/api/products", params={"category": "makanan"}).json()["total"] == 1
    assert client.get(f"/api/products/{hidden['slug']}").status_code == 404

    with_hidden = client.get("/api/products", params={"include_inactive": True}, headers=admin_headers).json()
    assert with_hidden["total"] == 2


def test_slug_is_unique(client, admin_headers, product):
    r = client.post("/api/products", json={"name": "Keripik Balado", "price": 1, "stock": 1}, headers=admin_headers)
    assert r.json()["slug"] == "keripik-balado-2"


def test_create_order_uses_db_price_and_decrements_stock(client, product):
    r = client.post("/api/orders", json={**ORDER, "items": [{"product_id": product["id"], "quantity": 3}]})
    assert r.status_code == 201
    data = r.json()
    assert data["order"]["total"] == 45000
    assert data["order"]["customer_phone"] == "6281234567890"
    assert data["order"]["code"].startswith("ORD-")

    msg = unquote(data["whatsapp_url"])
    assert data["whatsapp_url"].startswith("https://wa.me/62")
    assert "Keripik Balado x3 = Rp45.000" in msg
    assert data["order"]["code"] in msg

    assert client.get(f"/api/products/{product['slug']}").json()["stock"] == 7


def test_duplicate_items_are_merged(client, product):
    items = [{"product_id": product["id"], "quantity": 2}, {"product_id": product["id"], "quantity": 1}]
    order = client.post("/api/orders", json={**ORDER, "items": items}).json()["order"]
    assert len(order["items"]) == 1 and order["items"][0]["quantity"] == 3


def test_order_rejects_insufficient_stock(client, product):
    r = client.post("/api/orders", json={**ORDER, "items": [{"product_id": product["id"], "quantity": 11}]})
    assert r.status_code == 400
    assert "tidak cukup" in r.json()["detail"]
    assert client.get(f"/api/products/{product['slug']}").json()["stock"] == 10


def test_order_rejects_invalid_phone(client, product):
    r = client.post(
        "/api/orders",
        json={**ORDER, "customer_phone": "12345", "items": [{"product_id": product["id"], "quantity": 1}]},
    )
    assert r.status_code == 422


def test_cancel_order_restores_stock_and_stats(client, admin_headers, product):
    order = client.post("/api/orders", json={**ORDER, "items": [{"product_id": product["id"], "quantity": 4}]}).json()[
        "order"
    ]
    r = client.patch(f"/api/orders/{order['id']}/status", json={"status": "confirmed"}, headers=admin_headers)
    assert r.json()["status"] == "confirmed"

    stats = client.get("/api/admin/stats", headers=admin_headers).json()
    assert stats["revenue"] == 60000
    assert stats["top_products"][0] == {"product_name": "Keripik Balado", "quantity": 4}

    client.patch(f"/api/orders/{order['id']}/status", json={"status": "cancelled"}, headers=admin_headers)
    assert client.get(f"/api/products/{product['slug']}").json()["stock"] == 10

    r = client.patch(f"/api/orders/{order['id']}/status", json={"status": "done"}, headers=admin_headers)
    assert r.status_code == 400


def test_image_upload_is_converted_to_webp(client, admin_headers, product):
    buf = io.BytesIO()
    Image.new("RGB", (3000, 2000), "orange").save(buf, format="JPEG")
    r = client.post(
        f"/api/products/{product['id']}/image",
        files={"file": ("foto.jpg", buf.getvalue(), "image/jpeg")},
        headers=admin_headers,
    )
    assert r.status_code == 200
    url = r.json()["image_url"]
    assert url.endswith(".webp")

    img = client.get(url.replace("http://localhost:8000", ""))
    assert img.status_code == 200
    assert max(Image.open(io.BytesIO(img.content)).size) == 1200


def test_image_upload_rejects_non_image(client, admin_headers, product):
    r = client.post(
        f"/api/products/{product['id']}/image",
        files={"file": ("x.jpg", b"bukan gambar", "image/jpeg")},
        headers=admin_headers,
    )
    assert r.status_code == 400
