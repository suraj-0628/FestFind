import uuid
import re
import html
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Event, User
from app.schemas import EventCreate, EventList, EventOut
from app.scraper.scheduler import get_scrape_status
from app.routers.auth import get_current_user
from app.rate_limit import rate_limit_events, rate_limit_resolve, rate_limit_geocode

router = APIRouter()

_XSS_STRIP = re.compile(r"<[^>]*>")


def _sanitize(s: str | None) -> str | None:
    """Strip HTML tags and decode entities from user input."""
    if s is None:
        return None
    s = _XSS_STRIP.sub("", s)
    s = html.unescape(s)
    return s.strip()[:2000]


def _extract_coords_from_maps_url(url: str) -> tuple[float | None, float | None]:
    """Extract latitude/longitude from a Google Maps URL."""
    if not url:
        return None, None
    m = re.search(r"@(-?\d+\.?\d*),(-?\d+\.?\d*)", url)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r"[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)", url)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r"[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)", url)
    if m:
        return float(m.group(1)), float(m.group(2))
    return None, None


@router.get("/", response_model=EventList)
def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=500),
    city: str | None = None,
    state: str | None = None,
    category: str | None = None,
    event_type: str | None = None,
    status: str | None = None,
    search: str | None = None,
    include_past: bool = False,
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    query = db.query(Event).filter(Event.is_approved == True)

    if not include_past:
        query = query.filter(
            (Event.end_date >= now) | (Event.end_date == None)
        )

    if city:
        query = query.filter(Event.city.ilike(f"%{city}%"))
    if state:
        query = query.filter(Event.state.ilike(f"%{state}%"))
    if category:
        query = query.filter(Event.category.ilike(f"%{category}%"))
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if search:
        query = query.filter(
            (Event.title.ilike(f"%{search}%"))
            | (Event.venue.ilike(f"%{search}%"))
            | (Event.organizer.ilike(f"%{search}%"))
            | (Event.city.ilike(f"%{search}%"))
        )
    if status:
        if status == "ongoing":
            query = query.filter(
                Event.start_date <= now,
                (Event.end_date >= now) | (Event.end_date == None),
            )
        elif status == "upcoming":
            query = query.filter(Event.start_date > now)
        elif status == "past":
            query = query.filter(Event.end_date < now, Event.end_date != None)

    total = query.count()
    items = (
        query.order_by(Event.start_date.desc().nullslast())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return EventList(items=items, total=total, page=page, page_size=page_size)


@router.post("/", response_model=EventOut)
def create_event(event: EventCreate, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rate_limit_events(request)
    data = event.model_dump()
    # Sanitize all string fields to prevent stored XSS
    for key in ("title", "description", "organizer", "venue", "city", "state", "category", "event_url", "tags"):
        if key in data and isinstance(data[key], str):
            data[key] = _sanitize(data[key])
    if data.get("venue") and not data.get("latitude"):
        lat, lng = _extract_coords_from_maps_url(data["venue"])
        if lat is not None:
            data["latitude"] = lat
            data["longitude"] = lng
    if not data.get("latitude") and data.get("city"):
        from app.scraper.geocoder import geocode_venue
        lat, lng = geocode_venue(data.get("venue", ""), data["city"], data.get("state", ""))
        if lat is not None:
            data["latitude"] = lat
            data["longitude"] = lng
    db_event = Event(
        **data,
        source_url=f"submit:{uuid.uuid4()}",
        is_scraped=False,
        is_user_submitted=True,
        is_approved=False,
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


@router.get("/reverse-geocode")
def api_reverse_geocode(lat: float, lng: float, request: Request):
    rate_limit_geocode(request)
    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        raise HTTPException(400, "Invalid coordinates")
    from app.scraper.geocoder import reverse_geocode as _reverse_geocode
    result = _reverse_geocode(lat, lng)
    if not result:
        return {"venue": "", "city": "", "state": "", "display": ""}
    return result


@router.get("/geocode")
async def api_geocode(q: str, request: Request):
    """Forward geocode a location string (city, venue, etc.) via Nominatim."""
    rate_limit_geocode(request)
    if len(q) > 200:
        raise HTTPException(400, "Query too long")
    import asyncio
    import urllib.parse
    import json
    import urllib.request

    def _do_geocode():
        try:
            url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(q)}&format=json&limit=1"
            req = urllib.request.Request(url, headers={"User-Agent": "FestFind/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                return json.loads(resp.read())
        except Exception:
            return []

    data = await asyncio.to_thread(_do_geocode)
    if data:
        return {"lat": float(data[0]["lat"]), "lng": float(data[0]["lon"]), "display": data[0].get("display_name", q)}
    return {"lat": None, "lng": None, "display": ""}


@router.get("/resolve-link")
def api_resolve_link(url: str, request: Request, user: User = Depends(get_current_user)):
    """Resolve a Google Maps short link to exact coordinates using headless browser."""
    rate_limit_resolve(request)
    import subprocess
    import json
    import re
    import os

    # Sanitize: only allow Google Maps / goo.gl URLs
    allowed = re.compile(r"^https://(www\.google\.com/maps|maps\.app\.goo\.gl|goo\.gl/maps)")
    if not allowed.match(url):
        return {"url": url, "lat": None, "lng": None, "error": "Only Google Maps links are accepted"}

    # Cache to avoid spawning Playwright for the same URL twice
    if not hasattr(api_resolve_link, "_cache"):
        api_resolve_link._cache = {}
    cache = api_resolve_link._cache
    if url in cache:
        return cache[url]

    script = os.path.join(os.path.dirname(__file__), "..", "scraper", "resolve_maps.mjs")
    try:
        result = subprocess.run(
            ["node", script, url],
            capture_output=True, text=True, timeout=30,
        )
        data = json.loads(result.stdout.strip())
        final_url = data.get("url", url)
        m = re.search(r"@(-?\d+\.?\d+),(-?\d+\.?\d+)", final_url)
        if m:
            resp = {"url": final_url, "lat": float(m.group(1)), "lng": float(m.group(2))}
            cache[url] = resp
            return resp
        m = re.search(r"!3d(-?\d+\.?\d+)!4d(-?\d+\.?\d+)", final_url)
        if m:
            resp = {"url": final_url, "lat": float(m.group(1)), "lng": float(m.group(2))}
            cache[url] = resp
            return resp
        resp = {"url": final_url, "lat": None, "lng": None}
        cache[url] = resp
        return resp
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("resolve-link failed for %s: %s", url, e)
        resp = {"url": url, "lat": None, "lng": None}
        cache[url] = resp
        return resp


@router.get("/scrape/status")
def scrape_status():
    return get_scrape_status()


@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")
    return event
