import os
import tempfile

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["UPLOAD_DIR"] = tempfile.mkdtemp()
os.environ["SQS_QUEUE_URL"] = ""
os.environ["R2_ACCOUNT_ID"] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.config import settings  # noqa: E402
from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(engine)
    with TestClient(app) as c:  # lifespan -> init_db()
        yield c


@pytest.fixture()
def admin_headers(client):
    r = client.post("/api/auth/login", json={"email": settings.admin_email, "password": settings.admin_password})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture()
def product(client, admin_headers):
    cat = client.post("/api/categories", json={"name": "Makanan"}, headers=admin_headers).json()
    r = client.post(
        "/api/products",
        json={"name": "Keripik Balado", "price": 15000, "stock": 10, "category_id": cat["id"]},
        headers=admin_headers,
    )
    assert r.status_code == 201
    return r.json()
