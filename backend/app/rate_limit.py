import time
from collections import defaultdict
from fastapi import HTTPException, Request


class RateLimiter:
    """Simple in-memory sliding window rate limiter."""

    def __init__(self):
        self._hits: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str, limit: int, window: int):
        """Raise 429 if `key` exceeds `limit` requests within `window` seconds."""
        now = time.time()
        self._hits[key] = [t for t in self._hits[key] if now - t < window]
        if not self._hits[key]:
            del self._hits[key]
            return
        if len(self._hits[key]) >= limit:
            raise HTTPException(429, "Too many requests. Try again later.")
        self._hits[key].append(now)


limiter = RateLimiter()


def rate_limit_auth(request: Request):
    """5 requests per minute per IP on login/register."""
    ip = request.client.host if request.client else "unknown"
    limiter.check(f"auth:{ip}", limit=5, window=60)


def rate_limit_events(request: Request):
    """10 requests per minute per IP on event creation."""
    ip = request.client.host if request.client else "unknown"
    limiter.check(f"events:{ip}", limit=10, window=60)


def rate_limit_upload(request: Request):
    """5 uploads per minute per IP."""
    ip = request.client.host if request.client else "unknown"
    limiter.check(f"upload:{ip}", limit=5, window=60)


def rate_limit_resolve(request: Request):
    """3 requests per minute per IP on resolve-link."""
    ip = request.client.host if request.client else "unknown"
    limiter.check(f"resolve:{ip}", limit=3, window=60)


def rate_limit_geocode(request: Request):
    """10 requests per minute per IP on geocode endpoints."""
    ip = request.client.host if request.client else "unknown"
    limiter.check(f"geocode:{ip}", limit=10, window=60)
