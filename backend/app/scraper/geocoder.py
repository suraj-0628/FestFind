"""Geocode event venues using Nominatim (OpenStreetMap) — free, no API key."""
import json
import logging
import time
from pathlib import Path

import requests

logger = logging.getLogger(__name__)

_session = requests.Session()
_session.headers.update({"User-Agent": "CollegeFestHub/1.0 (contact@collegefesthub.com)"})

_CACHE_PATH = Path(__file__).parent.parent.parent / "geocode_cache.json"
_geocache: dict[str, tuple[float, float]] = {}


def _load_cache():
    global _geocache
    if _geocache:
        return
    try:
        if _CACHE_PATH.exists():
            raw = json.loads(_CACHE_PATH.read_text())
            _geocache = {k: (v[0], v[1]) for k, v in raw.items()}
            logger.info("Loaded %d geocache entries", len(_geocache))
    except Exception:
        _geocache = {}


def _save_cache():
    try:
        _CACHE_PATH.write_text(json.dumps(_geocache))
    except Exception as e:
        logger.warning("Failed to save geocache: %s", e)


def _clean_venue(venue: str) -> str:
    """Remove noisy parts from venue names."""
    if not venue:
        return ""
    for noise in ["Pvt Ltd", "Private Limited", "India", "National", "International"]:
        venue = venue.replace(noise, "")
    return venue.strip().strip(",").strip()


def _nominatim_query(q: str) -> tuple[float | None, float | None]:
    """Single Nominatim query with retry on rate limit."""
    for attempt in range(3):
        try:
            r = _session.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": q, "format": "json", "limit": 1, "countrycodes": "in"},
                timeout=10,
            )
            if r.status_code == 429:
                wait = 5 * (attempt + 1)
                logger.warning("Rate limited, waiting %ds...", wait)
                time.sleep(wait)
                continue
            results = r.json()
            if results:
                return float(results[0]["lat"]), float(results[0]["lon"])
            return None, None
        except (json.JSONDecodeError, requests.RequestException) as e:
            logger.warning("Geocode attempt %d failed for '%s': %s", attempt + 1, q[:40], e)
            time.sleep(3 * (attempt + 1))
    return None, None


def geocode_venue(venue: str, city: str, state: str) -> tuple[float | None, float | None]:
    """Geocode using venue + city + state. Returns (lat, lng) or (None, None)."""
    _load_cache()

    v = _clean_venue(venue)
    venue_query = f"{v}, {city}, {state or 'India'}" if v and city else None

    # Check cache for venue-specific query only
    if venue_query and venue_query in _geocache:
        lat, lng = _geocache[venue_query]
        logger.info("Geocache hit: '%s' -> %.6f, %.6f", venue_query[:60], lat, lng)
        return lat, lng

    # Try venue-specific first
    if venue_query:
        lat, lng = _nominatim_query(venue_query)
        if lat and lng:
            logger.info("Geocoded '%s' -> %.6f, %.6f", venue_query[:60], lat, lng)
            _geocache[venue_query] = (lat, lng)
            _save_cache()
            return lat, lng
        time.sleep(2.5)

    # Fallback to city-level — don't cache these (they cause clustering)
    if city and state:
        lat, lng = _nominatim_query(f"{city}, {state}")
        if lat and lng:
            logger.info("Geocoded city fallback '%s' -> %.6f, %.6f", city, lat, lng)
            return lat, lng
        time.sleep(1.5)

    if city:
        lat, lng = _nominatim_query(f"{city}, India")
        if lat and lng:
            logger.info("Geocoded city fallback '%s' -> %.6f, %.6f", city, lat, lng)
            return lat, lng

    return None, None


def reverse_geocode(lat: float, lng: float) -> dict | None:
    """Reverse geocode coordinates to get address details."""
    for attempt in range(3):
        try:
            r = _session.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"lat": lat, "lon": lng, "format": "json", "addressdetails": 1, "countrycodes": "in"},
                timeout=10,
            )
            if r.status_code == 429:
                wait = 5 * (attempt + 1)
                logger.warning("Rate limited, waiting %ds...", wait)
                time.sleep(wait)
                continue
            data = r.json()
            if "address" in data:
                addr = data["address"]
                return {
                    "venue": data.get("name", ""),
                    "city": addr.get("city") or addr.get("town") or addr.get("village") or addr.get("municipality", ""),
                    "state": addr.get("state", ""),
                    "display": data.get("display_name", ""),
                }
            return None
        except (json.JSONDecodeError, requests.RequestException) as e:
            logger.warning("Reverse geocode failed: %s", e)
            time.sleep(3 * (attempt + 1))
    return None
