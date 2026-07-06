import os
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from fastapi.responses import FileResponse

from app.routers.auth import get_current_user
from app.models import User
from app.rate_limit import rate_limit_upload

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG": "image/png",
    b"RIFF": "image/webp",
    b"GIF87a": "image/gif",
    b"GIF89a": "image/gif",
}
# ponytail: RIFF alone is too loose — verify WEBP at offset 8
RIFF_MIN_LEN = 12
MAX_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/")
async def upload_image(request: Request, file: UploadFile = File(...), user: User = Depends(get_current_user)):
    rate_limit_upload(request)
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, WebP, and GIF images are allowed")

    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(400, "Image must be under 5MB")

    # Validate magic bytes — don't trust Content-Type header
    detected = None
    for magic, mime in MAGIC_BYTES.items():
        if data[:len(magic)] == magic:
            if magic == b"RIFF":
                if len(data) >= RIFF_MIN_LEN and data[8:12] == b"WEBP":
                    detected = mime
                else:
                    continue
            else:
                detected = mime
            break
    if not detected or detected not in ALLOWED_TYPES:
        raise HTTPException(400, "File content does not match an allowed image type")

    ext = detected.split("/")[-1]
    if ext == "jpeg":
        ext = "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        f.write(data)

    return {"url": f"/api/upload/{filename}", "filename": filename}


@router.get("/{filename}")
async def serve_image(filename: str):
    # Prevent path traversal: only allow simple filenames in uploads/
    import re
    if not re.match(r"^[a-f0-9]{32}\.(jpg|jpeg|png|webp|gif)$", filename):
        raise HTTPException(400, "Invalid filename")
    path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(404, "File not found")
    return FileResponse(path)
