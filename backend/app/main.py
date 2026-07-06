import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import engine, Base
from app.routers import events
from app.routers import upload
from app.routers import auth
from app.routers import admin

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    from app.scraper.scheduler import start_scheduler
    scheduler = start_scheduler()

    yield

    scheduler.shutdown()


app = FastAPI(title="College Fest Hub", version="0.1.0", lifespan=lifespan)

# CORS
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else [
    "http://localhost:5173", "http://localhost:5176",
    "http://127.0.0.1:5173", "http://127.0.0.1:5176",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security headers + CSRF check
@app.middleware("http")
async def security_headers(request, call_next):
    # CSRF: reject state-changing requests without Origin or Referer matching allowed origins
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        origin = request.headers.get("origin", "")
        referer = request.headers.get("referer", "")
        if origin and not any(origin.startswith(o) for o in ALLOWED_ORIGINS):
            from fastapi.responses import JSONResponse
            return JSONResponse({"detail": "Invalid origin"}, status_code=403)
        if referer and not any(referer.startswith(o) for o in ALLOWED_ORIGINS):
            from fastapi.responses import JSONResponse
            return JSONResponse({"detail": "Invalid referer"}, status_code=403)

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https://*.basemaps.cartocdn.com https://*.openstreetmap.org https://*.tile.openstreetmap.org data: blob:; connect-src 'self' https://nominatim.openstreetmap.org https://ip-api.com; font-src 'self' https://*.basemaps.cartocdn.com"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self)"
    return response


app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}

# Serve frontend static files in production
STATIC_DIR = Path(__file__).parent.parent / "static"
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))
