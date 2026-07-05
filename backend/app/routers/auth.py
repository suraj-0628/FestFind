import hashlib
import hmac
import os
import re
import time
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User
from app.rate_limit import rate_limit_auth

router = APIRouter()

# In-memory token blacklist: {jti: expiry_timestamp}
_token_blacklist: dict[str, float] = {}


def _cleanup_blacklist():
    """Remove expired entries every call (cheap — set is tiny)."""
    now = time.time()
    expired = [k for k, v in _token_blacklist.items() if v < now]
    for k in expired:
        del _token_blacklist[k]


def _revoke_token(jti: str, expires_at: float):
    _token_blacklist[jti] = expires_at

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


def _hash_password(password: str, salt: str | None = None) -> str:
    if salt is None:
        salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return f"{salt}${hashed.hex()}"


def _verify_password(password: str, stored_hash: str) -> bool:
    salt, _ = stored_hash.split("$", 1)
    computed = _hash_password(password, salt)
    return hmac.compare_digest(computed, stored_hash)


def _is_valid_email(email: str) -> tuple[bool, str]:
    if not re.match(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", email):
        return False, "Invalid email format"
    domain = email.split("@")[1].lower()
    if domain in BLOCKED_DOMAINS:
        return False, "Disposable email addresses are not allowed"
    # Allow any .edu, .ac.in, .gov.in domain
    if domain.endswith((".edu", ".ac.in", ".gov.in", ".nic.in")):
        return True, ""
    if domain not in ALLOWED_EMAIL_DOMAINS:
        return False, f"Use a valid email provider (Gmail, Outlook, Yahoo, etc.)"
    return True, ""


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expire_hours),
        "iat": datetime.now(timezone.utc),
        "jti": os.urandom(8).hex(),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def get_current_user(authorization: str | None = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = authorization.split(" ", 1)[1]
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
def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
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
    return AuthResponse(
        token=token,
        user={"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin, "role": user.role},
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    rate_limit_auth(request)
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not _verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")

    token = create_token(user.id)
    return AuthResponse(
        token=token,
        user={"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin, "role": user.role},
    )


@router.get("/me", response_model=dict)
def get_me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin, "role": user.role}


@router.post("/logout")
def logout(authorization: str | None = Header(None)):
    """Revoke current token (in-memory blacklist)."""
    _cleanup_blacklist()
    if not authorization or not authorization.startswith("Bearer "):
        return {"ok": True}
    token = authorization.split(" ", 1)[1]
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
