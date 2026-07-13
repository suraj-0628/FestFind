import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def migrate():
    """Add missing columns to existing tables. SQLAlchemy create_all doesn't alter existing tables."""
    from app.models import User, Event, Announcement, FeatureFlag
    models = [("users", User), ("events", Event), ("announcements", Announcement), ("feature_flags", FeatureFlag)]
    for table, model in models:
        try:
            missing = _get_missing_columns(table, [c.name for c in model.__table__.columns])
        except Exception:
            continue
        for col in missing:
            col_type = _type_for_column(model, col)
            if col_type:
                with engine.connect() as conn:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                    conn.commit()
                    logger.info("Added missing column: %s.%s (%s)", table, col, col_type)


def _get_missing_columns(table: str, model_cols: list[str]) -> list[str]:
    with engine.connect() as conn:
        existing = [row[1] for row in conn.execute(text(f"PRAGMA table_info({table})")).fetchall()]
    return [c for c in model_cols if c not in existing]


def _type_for_column(model, col_name: str) -> str | None:
    col = getattr(model, col_name, None)
    if col is None:
        return None
    dtype = type(col.type).__name__
    length = getattr(col.type, "length", None)
    if dtype == "String" and length:
        return f"VARCHAR({length})"
    mapping = {
        "String": "VARCHAR(200)", "Text": "TEXT", "Boolean": "BOOLEAN DEFAULT 0",
        "DateTime": "DATETIME", "Float": "FLOAT", "Integer": "INTEGER",
    }
    return mapping.get(dtype)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
