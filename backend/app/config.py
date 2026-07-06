import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./collegefest.db"
    scraper_rate_limit: float = 1.0
    scraper_base_url: str = "https://knowafest.com"
    scraper_page_delay: float = 0.5
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 72

    class Config:
        env_file = ".env"


settings = Settings()

if not settings.jwt_secret:
    settings.jwt_secret = os.environ.get("JWT_SECRET", "")


def require_jwt_secret():
    """Call once at startup to fail fast if JWT_SECRET is missing."""
    if not settings.jwt_secret:
        import sys
        print("FATAL: JWT_SECRET not set in environment/.env. Tokens will not work.", file=sys.stderr)
        sys.exit(1)
