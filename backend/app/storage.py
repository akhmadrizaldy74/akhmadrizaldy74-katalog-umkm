"""Penyimpanan gambar produk.

Gambar selalu di-resize (maks 1200px) dan dikonversi ke WebP agar ringan.
Jika kredensial Cloudflare R2 diisi, file diunggah ke R2 (S3-compatible, gratis 10 GB).
Jika tidak, file disimpan di folder lokal dan disajikan oleh FastAPI di /uploads.
"""

import io
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

from app.config import settings

MAX_SIDE = 1200
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}


def compress_image(data: bytes) -> bytes:
    try:
        img = Image.open(io.BytesIO(data))
        fmt = img.format
        img = ImageOps.exif_transpose(img)
    except (UnidentifiedImageError, OSError):
        raise HTTPException(400, "File bukan gambar yang valid") from None
    if fmt not in ALLOWED_FORMATS:
        raise HTTPException(400, "Format gambar harus JPG, PNG, WEBP, atau GIF")
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
    img.thumbnail((MAX_SIDE, MAX_SIDE))
    out = io.BytesIO()
    img.save(out, format="WEBP", quality=80, method=6)
    return out.getvalue()


def _r2_client():
    import boto3

    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
    )


async def save_product_image(file: UploadFile) -> str:
    limit = settings.max_upload_mb * 1024 * 1024
    data = await file.read(limit + 1)
    if len(data) > limit:
        raise HTTPException(413, f"Ukuran gambar maksimal {settings.max_upload_mb} MB")

    return store_webp(compress_image(data))


def store_webp(webp: bytes) -> str:
    """Simpan gambar WebP (sudah dikompres) ke R2 atau disk lokal, kembalikan URL publiknya."""
    key = f"products/{uuid.uuid4().hex}.webp"

    if settings.r2_enabled:
        _r2_client().put_object(
            Bucket=settings.r2_bucket,
            Key=key,
            Body=webp,
            ContentType="image/webp",
            CacheControl="public, max-age=31536000, immutable",
        )
        return f"{settings.r2_public_url.rstrip('/')}/{key}"

    path = Path(settings.upload_dir) / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(webp)
    return f"{settings.public_base_url.rstrip('/')}/uploads/{key}"
