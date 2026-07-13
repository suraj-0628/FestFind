import hashlib
import hmac
import json
import os
import re
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Header, Request, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User
from app.rate_limit import rate_limit_auth

TOKEN_COOKIE = "ff_token"

router = APIRouter()

# Token blacklist with file persistence: {jti: expiry_timestamp}
_token_blacklist: dict[str, float] = {}
_BLACKLIST_FILE = Path(__file__).parent.parent.parent / "token_blacklist.json"


def _load_blacklist():
    global _token_blacklist
    try:
        if _BLACKLIST_FILE.exists():
            raw = json.loads(_BLACKLIST_FILE.read_text())
            _token_blacklist = {k: float(v) for k, v in raw.items()}
    except Exception:
        pass


def _save_blacklist():
    try:
        _BLACKLIST_FILE.write_text(json.dumps(_token_blacklist))
    except Exception:
        pass


def _cleanup_blacklist():
    """Remove expired entries every call (cheap — set is tiny)."""
    now = time.time()
    expired = [k for k, v in _token_blacklist.items() if v < now]
    for k in expired:
        del _token_blacklist[k]
    if expired:
        _save_blacklist()


def _revoke_token(jti: str, expires_at: float):
    _token_blacklist[jti] = expires_at
    _save_blacklist()


_load_blacklist()


def _set_token_cookie(response: Response, token: str):
    response.set_cookie(
        TOKEN_COOKIE, token,
        max_age=settings.jwt_expire_hours * 3600,
        httponly=True, samesite="lax", secure=True, path="/",
    )


def _clear_token_cookie(response: Response):
    response.delete_cookie(TOKEN_COOKIE, path="/")

# Domains allowed for registration
ALLOWED_EMAIL_DOMAINS = {
    "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com",
    "yahoo.com", "yahoo.co.in", "icloud.com", "me.com", "mac.com",
    "protonmail.com", "proton.me", "zoho.com", "yandex.com",
    "rediffmail.com", "mail.com", "aol.com", "edu", "ac.in",
    "gov.in", "nic.in",
}

# Block known throwaway / temporary email domains
BLOCKED_DOMAINS = {
    "tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com",
    "yopmail.com", "trashmail.com", "sharklasers.com", "guerrillamailblock.com",
    "grr.la", "dispostable.com", "temp-mail.org", "fakeinbox.com",
    "tempail.com", "tempr.email", "discard.email", "discardmail.com",
    "maildrop.cc", "getnada.com", "emailondeck.com", "33mail.com",
    "mytemp.email", "mohmal.com", "tmpmail.net", "tmpmail.org",
}


_LEGACY_ITERATIONS = 100_000
_CURRENT_ITERATIONS = 600_000


def _hash_password(password: str, salt: str | None = None, iterations: int = _CURRENT_ITERATIONS) -> str:
    if salt is None:
        salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), iterations)
    return f"{salt}${hashed.hex()}"


def _verify_password(password: str, stored_hash: str) -> tuple[bool, bool]:
    """Returns (valid, needs_rehash)."""
    try:
        salt, _ = stored_hash.split("$", 1)
    except ValueError:
        return False, False
    # Try current iterations first
    computed = _hash_password(password, salt, _CURRENT_ITERATIONS)
    if hmac.compare_digest(computed, stored_hash):
        return True, False
    # Try legacy iterations
    computed_legacy = _hash_password(password, salt, _LEGACY_ITERATIONS)
    if hmac.compare_digest(computed_legacy, stored_hash):
        return True, True  # valid but needs rehash
    return False, False


def _is_valid_email(email: str) -> tuple[bool, str]:
    if not re.match(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", email):
        return False, "Invalid email format"
    domain = email.split("@")[1].lower()
    if domain in BLOCKED_DOMAINS:
        return False, "Disposable email addresses are not allowed"
    return True, ""


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expire_hours),
        "iat": datetime.now(timezone.utc),
        "jti": os.urandom(8).hex(),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def get_current_user(
    authorization: str | None = Header(None),
    ff_token: str | None = Cookie(None),
    db: Session = Depends(get_db),
) -> User:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    elif ff_token:
        token = ff_token

    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        jti = payload.get("jti")
        if not user_id:
            raise HTTPException(401, "Invalid token")
        if jti and jti in _token_blacklist:
            raise HTTPException(401, "Token revoked")
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(401, "User not found")
    if not user.is_active:
        raise HTTPException(403, "Account is deactivated")
    return user


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    rate_limit_auth(request)
    if len(req.name.strip()) < 2:
        raise HTTPException(400, "Name must be at least 2 characters")
    if len(req.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")

    valid, msg = _is_valid_email(req.email.lower())
    if not valid:
        raise HTTPException(400, msg)

    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(400, "An account with this email already exists")

    user = User(
        email=req.email.lower(),
        name=req.name.strip(),
        password_hash=_hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id)
    _set_token_cookie(response, token)
    return AuthResponse(
        token=token,
        user={"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin, "role": user.role},
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    rate_limit_auth(request)
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(401, "Invalid email or password")
    valid, needs_rehash = _verify_password(req.password, user.password_hash)
    if not valid:
        raise HTTPException(401, "Invalid email or password")
    if needs_rehash:
        user.password_hash = _hash_password(req.password)
        db.commit()

    token = create_token(user.id)
    _set_token_cookie(response, token)
    return AuthResponse(
        token=token,
        user={"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin, "role": user.role},
    )


@router.get("/me", response_model=dict)
def get_me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin, "role": user.role}


@router.post("/logout")
def logout(response: Response, authorization: str | None = Header(None), ff_token: str | None = Cookie(None)):
    """Revoke current token (in-memory blacklist) and clear cookie."""
    _cleanup_blacklist()
    _clear_token_cookie(response)
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    elif ff_token:
        token = ff_token
    if token:
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm], options={"verify_exp": False})
            jti = payload.get("jti")
            exp = payload.get("exp", 0)
            if jti:
                _revoke_token(jti, exp)
        except jwt.InvalidTokenError:
            pass
    return {"ok": True}


def get_admin_user(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(403, "Admin access required")
    if not user.is_active:
        raise HTTPException(403, "Account is deactivated")
    return user


def get_maintainer_user(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("admin", "maintainer"):
        raise HTTPException(403, "Admin or maintainer access required")
    if not user.is_active:
        raise HTTPException(403, "Account is deactivated")
    return user
