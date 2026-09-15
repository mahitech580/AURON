"""
AURON API Gateway Settings.

Centralized application configuration loaded from environment variables.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration."""

    app_name: str = "AURON"
    app_env: str = "development"
    app_version: str = "0.1.0"

    api_gateway_host: str = "127.0.0.1"
    api_gateway_port: int = 8000

    product_service_host: str = "127.0.0.1"
    product_service_port: int = 8001

    postgres_host: str = "127.0.0.1"
    postgres_port: int = 5432
    postgres_db: str = "auron"
    postgres_user: str = "auron"
    postgres_password: str = "change-me"

    database_url: str = (
        "postgresql://auron:change-me@127.0.0.1:5432/auron"
    )

    redis_host: str = "127.0.0.1"
    redis_port: int = 6379
    redis_db: int = 0

    redis_url: str = "redis://127.0.0.1:6379/0"

    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30

    frontend_host: str = "127.0.0.1"
    frontend_port: int = 5500

    cors_origins: str = (
        "http://127.0.0.1:5500,"
        "http://localhost:5500"
    )

    log_level: str = "INFO"

    auron_demo_mode: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()


settings = get_settings()
