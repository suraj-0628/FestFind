"""Geocode event venues using Nominatim (OpenStreetMap) — free, no API key."""
import json
import logging
import time

import requests

logger = logging.getLogger(__name__)

_session = requests.Session()
_session.headers.update({"User-Agent": "CollegeFestHub/1.0 (contact@collegefesthub.com)"})


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
    queries = []
    v = _clean_venue(venue)
    if v and city:
        queries.append(f"{v}, {city}, {state or 'India'}")
    if city and state:
        queries.append(f"{city}, {state}")
    if city:
        queries.append(f"{city}, India")

    for q in queries:
        lat, lng = _nominatim_query(q)
        if lat and lng:
            logger.info("Geocoded '%s' -> %.6f, %.6f", q[:60], lat, lng)
            return lat, lng
        time.sleep(1.5)

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
