import uuid
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Event, User
from app.schemas import EventCreate, EventList, EventOut
from app.scraper.scheduler import get_scrape_status
from app.routers.auth import get_current_user

router = APIRouter()


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
        query = query.filter(Event.title.ilike(f"%{search}%"))
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
def create_event(event: EventCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = event.model_dump()
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
def api_reverse_geocode(lat: float, lng: float):
    from app.scraper.geocoder import reverse_geocode as _reverse_geocode
    result = _reverse_geocode(lat, lng)
    if not result:
        return {"venue": "", "city": "", "state": "", "display": ""}
    return result


@router.get("/geocode")
def api_geocode(q: str):
    """Forward geocode a location string (city, venue, etc.) via Nominatim."""
    import urllib.parse
    import json
    import urllib.request
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(q)}&format=json&limit=1"
        req = urllib.request.Request(url, headers={"User-Agent": "FestFind/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            if data:
                return {"lat": float(data[0]["lat"]), "lng": float(data[0]["lon"]), "display": data[0].get("display_name", q)}
    except Exception:
        pass
    return {"lat": None, "lng": None, "display": ""}


@router.get("/resolve-link")
def api_resolve_link(url: str):
    """Resolve a Google Maps short link to exact coordinates using headless browser."""
    import subprocess
    import json
    import re
    import os

    script = os.path.join(os.path.dirname(__file__), "..", "scraper", "resolve_maps.mjs")
    try:
        result = subprocess.run(
            ["node", script, url],
            capture_output=True, text=True, timeout=30,
        )
        data = json.loads(result.stdout.strip())
        final_url = data.get("url", url)
        # Extract @lat,lng from the resolved URL
        m = re.search(r"@(-?\d+\.?\d+),(-?\d+\.?\d+)", final_url)
        if m:
            return {"url": final_url, "lat": float(m.group(1)), "lng": float(m.group(2))}
        # Fallback: !3d!4d pattern
        m = re.search(r"!3d(-?\d+\.?\d+)!4d(-?\d+\.?\d+)", final_url)
        if m:
            return {"url": final_url, "lat": float(m.group(1)), "lng": float(m.group(2))}
        return {"url": final_url, "lat": None, "lng": None}
    except Exception:
        return {"url": url, "lat": None, "lng": None}


@router.get("/scrape/status")
def scrape_status():
    return get_scrape_status()


@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")
    return event
