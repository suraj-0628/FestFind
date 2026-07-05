import logging
import re
import time
from datetime import datetime

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
}
BASE = "https://www.knowafest.com"
RATE_LIMIT = 1.0  # seconds between requests

_session = requests.Session()
_session.headers.update(HEADERS)


def _get(url: str) -> str | None:
    try:
        r = _session.get(url, timeout=15)
        r.raise_for_status()
        return r.text
    except requests.RequestException as e:
        logger.warning("Failed: %s — %s", url, e)
        return None


def discover_states() -> list[dict]:
    """Hit /explore/state and extract state name + URL."""
    html = _get(f"{BASE}/explore/state")
    if not html:
        return []
    soup = BeautifulSoup(html, "lxml")
    states = []
    for a in soup.select('a[href*="/explore/state/"]'):
        href = a.get("href", "")
        if not href or href == "/explore/state":
            continue
        full = href if href.startswith("http") else BASE + href
        name = a.get_text(strip=True).replace("College Fests in ", "")
        states.append({"name": name, "url": full})
    # dedup by URL
    seen = set()
    unique = []
    for s in states:
        if s["url"] not in seen:
            seen.add(s["url"])
            unique.append(s)
    logger.info("Found %d states", len(unique))
    return unique


def discover_events_from_upcoming(url: str) -> list[dict]:
    """Parse the upcomingfests page (5 columns: start, title, category, venue+city, end)."""
    html = _get(url)
    if not html:
        return []
    time.sleep(RATE_LIMIT)

    soup = BeautifulSoup(html, "lxml")
    events = []

    for tr in soup.select("tr[onclick]"):
        onclick = tr.get("onclick", "")
        match = re.search(r"window\.open\('([^']+)'", onclick)
        if not match:
            continue
        href = match.group(1)
        if not href.startswith("http"):
            href = BASE + "/" + href.lstrip("./")

        tds = tr.select("td")
        if len(tds) < 4:
            continue

        start_str = tds[0].get_text(strip=True) if tds else ""
        title = tds[1].get_text(strip=True) if len(tds) > 1 else ""
        title = re.sub(r"View More$", "", title).strip()

        category = tds[2].get_text(strip=True) if len(tds) > 2 else ""
        venue_raw = tds[3].get_text(strip=True) if len(tds) > 3 else ""
        end_str = tds[4].get_text(strip=True) if len(tds) > 4 else ""

        # Parse venue: "Name,City,\n\t\t\t\t\t\tNA" or "Name,City"
        parts = [p.strip() for p in venue_raw.split(",") if p.strip() and p.strip() != "NA"]
        venue = parts[0] if parts else ""
        city = parts[1] if len(parts) > 1 else ""

        events.append({
            "title": title,
            "source_url": href,
            "start_str": start_str,
            "end_str": end_str,
            "category": category,
            "venue": venue,
            "city": city,
            "state": "",
        })

    logger.info("Upcomingfests: found %d events", len(events))
    return events


def discover_events_from_state(state_url: str, state_name: str) -> list[dict]:
    """Parse a state page and return event row data."""
    html = _get(state_url)
    if not html:
        return []
    time.sleep(RATE_LIMIT)

    soup = BeautifulSoup(html, "lxml")
    events = []

    for tr in soup.select("tr[onclick]"):
        onclick = tr.get("onclick", "")
        match = re.search(r"window\.open\('([^']+)'", onclick)
        if not match:
            continue
        href = match.group(1)
        if not href.startswith("http"):
            href = BASE + "/" + href.lstrip("./")

        tds = tr.select("td")
        if len(tds) < 2:
            continue

        start_str = tds[0].get_text(strip=True) if tds else ""
        title = tds[1].get_text(strip=True) if len(tds) > 1 else ""
        title = re.sub(r"View More$", "", title).strip()

        category = tds[2].get_text(strip=True) if len(tds) > 2 else ""
        venue = tds[3].get_text(strip=True) if len(tds) > 3 else ""
        city = tds[4].get_text(strip=True) if len(tds) > 4 else ""

        events.append({
            "title": title,
            "source_url": href,
            "start_str": start_str,
            "category": category,
            "venue": venue,
            "city": city,
            "state": state_name,
        })

    logger.info("State %s: found %d events", state_name, len(events))
    return events


def scrape_event_detail(url: str) -> dict | None:
    """Visit event detail page, extract JSON-LD and Register Now link."""
    html = _get(url)
    if not html:
        return None
    time.sleep(RATE_LIMIT)

    soup = BeautifulSoup(html, "lxml")
    result = {}

    # Try JSON-LD first
    script = soup.select_one('script[type="application/ld+json"]')
    if script:
        try:
            import json
            data = json.loads(script.string)
            if isinstance(data, dict) and data.get("@type") == "Event":
                result = _parse_jsonld(data)
        except (json.JSONDecodeError, AttributeError):
            pass

    # Extract "Register Now" link — the actual registration URL, not knowafest
    register_url = None
    for a in soup.select("a[href]"):
        text = a.get_text(strip=True).lower()
        href = a.get("href", "")
        if ("register" in text or "apply" in text or "register now" in text) and href and "knowafest" not in href:
            register_url = href
            break

    if register_url:
        result["event_url"] = register_url

    return result if result else None


def _parse_jsonld(data: dict) -> dict:
    result = {
        "title": data.get("name", ""),
        "description": data.get("description", ""),
        "start_date": _parse_date(data.get("startDate")),
        "end_date": _parse_date(data.get("endDate")),
    }

    # Image
    img = data.get("image")
    if isinstance(img, str):
        result["image_url"] = img
    elif isinstance(img, dict):
        result["image_url"] = img.get("url")

    # Location
    loc = data.get("location", {})
    if isinstance(loc, dict):
        result["venue"] = loc.get("name", "")
        addr = loc.get("address", {})
        if isinstance(addr, dict):
            result["city"] = addr.get("addressLocality", "")
            result["state"] = addr.get("addressRegion", "")
            geo = addr.get("geo", {})
            if isinstance(geo, dict):
                result["latitude"] = _to_float(geo.get("latitude"))
                result["longitude"] = _to_float(geo.get("longitude"))
    elif isinstance(loc, list):
        for item in loc:
            if isinstance(item, dict) and item.get("@type") == "Place":
                result["venue"] = item.get("name", "")
                addr = item.get("address", {})
                if isinstance(addr, dict):
                    result["city"] = addr.get("addressLocality", "")
                    result["state"] = addr.get("addressRegion", "")
                    geo = addr.get("geo", {})
                    if isinstance(geo, dict):
                        result["latitude"] = _to_float(geo.get("latitude"))
                        result["longitude"] = _to_float(geo.get("longitude"))
                break

    # Organizer
    org = data.get("organizer")
    if isinstance(org, dict):
        result["organizer"] = org.get("name", "")
    elif isinstance(org, str):
        result["organizer"] = org

    # Category
    cat = data.get("keywords", "") or data.get("category", "")
    if isinstance(cat, list):
        cat = ", ".join(cat)
    result["category"] = cat[:200] if cat else ""

    # Registration URL from JSON-LD
    event_url = data.get("url")
    if event_url and "knowafest" not in event_url:
        result["event_url"] = event_url

    return result


def _parse_date(s: str) -> datetime | None:
    if not s:
        return None
    s = s.strip()
    # Date-only: normalize to end of day so single-day events stay ongoing the full day
    if re.match(r"^\d{4}-\d{2}-\d{2}$", s):
        return datetime.strptime(s, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%S",
                "%d/%m/%Y", "%B %d, %Y", "%d %b %Y", "%d %B %Y"):
        try:
            return datetime.strptime(s, fmt)
        except (ValueError, AttributeError):
            continue
    return None


def _to_float(val) -> float | None:
    try:
        return float(val) if val else None
    except (ValueError, TypeError):
        return None
