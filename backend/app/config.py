from functools import cached_property

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "sqlite:///./dev.db"

    # Auth
    jwt_secret: str = "ganti-dengan-string-acak-yang-panjang"
    jwt_expire_minutes: int = 60 * 12
    admin_email: str = "admin@tokoku.id"
    admin_password: str = "admin12345"

    # Data toko awal (bisa diubah lewat dashboard admin)
    store_name: str = "Toko Kita"
    store_whatsapp: str = "6281234567890"
    store_description: str = "Produk lokal berkualitas, pesan langsung via WhatsApp."
    store_address: str = "Indonesia"

    # Web
    cors_origins: str = "http://localhost:5173"
    public_base_url: str = "http://localhost:8000"
    upload_dir: str = "uploads"
    max_upload_mb: int = 5

    # Cloudflare R2 (opsional — kalau kosong, gambar disimpan di disk lokal)
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket: str = ""
    r2_public_url: str = ""

    # AWS SQS (opsional — kalau kosong, notifikasi order dilewati)
    aws_region: str = "ap-southeast-1"
    sqs_queue_url: str = ""

    @cached_property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def r2_enabled(self) -> bool:
        return all(
            [self.r2_account_id, self.r2_access_key_id, self.r2_secret_access_key, self.r2_bucket, self.r2_public_url]
        )


settings = Settings()
