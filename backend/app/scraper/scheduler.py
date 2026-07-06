import asyncio
import logging
import threading
import time
from datetime import datetime, timezone

from app.scraper.knowafest_scraper import (
    discover_states,
    discover_events_from_state,
    discover_events_from_upcoming,
    scrape_event_detail,
    _parse_date,
)
from app.database import SessionLocal
from app.models import Event

logger = logging.getLogger(__name__)

_scrape_lock = threading.Lock()

_scrape_status = {
    "last_run": None,
    "last_duration_sec": 0,
    "events_found": 0,
    "events_new": 0,
    "events_updated": 0,
    "events_skipped": 0,
    "errors": 0,
    "is_running": False,
    "history": [],
}


def get_scrape_status() -> dict:
    with _scrape_lock:
        return {**_scrape_status, "history": _scrape_status["history"][-10:]}


async def run_scrape_job():
    with _scrape_lock:
        if _scrape_status["is_running"]:
            logger.warning("Scrape already running, skipping")
            return
        _scrape_status["is_running"] = True
    start_time = time.time()
    logger.info("Starting scrape...")

    try:
        # Step 1: Get all states
        states = discover_states()
        if not states:
            logger.error("No states found, aborting")
            return

        # Step 2: For each state, discover events
        all_events = []
        seen_urls = set()
        for state in states:
            events = discover_events_from_state(state["url"], state["name"])
            for e in events:
                url = e.get("source_url", "")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    all_events.append(e)

        # Step 2b: Also scrape upcomingfests page
        upcoming_events = discover_events_from_upcoming("https://www.knowafest.com/explore/upcomingfests")
        for e in upcoming_events:
            url = e.get("source_url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_events.append(e)

        _scrape_status["events_found"] = len(all_events)
        logger.info("Discovered %d unique events across %d states + upcomingfests", len(all_events), len(states))

        # Step 3: For each event, visit detail page and store in DB
        db = SessionLocal()
        new_count = 0
        update_count = 0
        skip_count = 0
        error_count = 0
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        try:
            # Delete past scraped events
            past_deleted = db.query(Event).filter(
                Event.is_scraped == True,
                Event.end_date != None,
                Event.end_date < now,
            ).delete(synchronize_session=False)
            if past_deleted:
                logger.info("Deleted %d past events", past_deleted)

            # Dedup sets
            existing_urls = set()
            for (url,) in db.query(Event.source_url).filter(Event.source_url != None).all():
                if url:
                    existing_urls.add(url.replace("https://www.", "https://"))

            for evt in all_events:
                source_url = evt.get("source_url", "")
                if not source_url:
                    continue

                normalized_url = source_url.replace("https://www.", "https://")

                # Skip if already in DB
                if normalized_url in existing_urls:
                    skip_count += 1
                    continue

                # Fetch detail page
                detail = None
                try:
                    detail = scrape_event_detail(source_url)
                except Exception as e:
                    logger.warning("Detail failed for %s: %s", source_url, e)
                    error_count += 1

                # Build event data
                title = (detail or {}).get("title") or evt.get("title", "")
                if not title or title in ("404", "Not Found") or len(title) < 3:
                    skip_count += 1
                    continue

                description = (detail or {}).get("description", "")
                start_date = (detail or {}).get("start_date") or _parse_date(evt.get("start_str"))
                end_date = (detail or {}).get("end_date") or _parse_date(evt.get("end_str"))
                # Normalize date-only end_date to end of day so events stay ongoing all day
                if end_date and end_date.hour == 0 and end_date.minute == 0 and end_date.second == 0:
                    end_date = end_date.replace(hour=23, minute=59, second=59)
                venue = (detail or {}).get("venue") or evt.get("venue", "")
                city = (detail or {}).get("city") or evt.get("city", "")
                state_name = (detail or {}).get("state") or evt.get("state", "")
                latitude = (detail or {}).get("latitude")
                longitude = (detail or {}).get("longitude")
                category = (detail or {}).get("category") or evt.get("category", "")
                organizer = (detail or {}).get("organizer", "")
                image_url = (detail or {}).get("image_url", "")
                register_url = (detail or {}).get("event_url", source_url)

                # Skip ended events
                if end_date and end_date < now:
                    skip_count += 1
                    continue

                # Geocode if missing
                if not latitude and city:
                    _intl_coords = {
                        "tokyo": (35.6762, 139.6503), "new york": (40.7128, -74.0060),
                        "san diego": (32.7157, -117.1611), "los angeles": (34.0522, -118.2437),
                        "singapore": (1.3521, 103.8198), "osaka": (34.6937, 135.5023),
                        "paris": (48.8566, 2.3522), "rome": (41.9028, 12.4964),
                        "barcelona": (41.3874, 2.1686), "vienna": (48.2082, 16.3738),
                        "dubai": (25.2048, 55.2708), "bangkok": (13.7563, 100.5018),
                        "boston": (42.3601, -71.0589), "khet huai khwang": (13.7759, 100.5757),
                        "naritha": (13.7759, 100.5757), "karaikudi": (10.0732, 78.7671),
                        "thrissur": (10.5276, 76.2144), "chennai": (13.0827, 80.2707),
                        "coimbatore": (11.0168, 76.9558), "erode": (11.3410, 77.7172),
                        "hyderabad": (17.3850, 78.4867), "bengaluru": (12.9716, 77.5946),
                        "tiruchirappalli": (10.7905, 78.7047), "pondicherry": (11.9416, 79.8083),
                        "ahmedabad": (23.0225, 72.5714), "nashik": (19.9975, 73.7898),
                        "kopargaon": (19.7500, 74.4700), "khurda": (20.1822, 85.6180),
                        "mayiladuthurai": (11.1035, 79.6540), "singnapur": (19.7500, 74.4700),
                    }
                    city_key = city.lower().strip()
                    if city_key in _intl_coords:
                        latitude, longitude = _intl_coords[city_key]
                    else:
                        try:
                            from app.scraper.geocoder import geocode_venue
                            latitude, longitude = geocode_venue(venue, city, state_name)
                        except Exception:
                            pass

                # Auto-categorize
                if not category:
                    t = title.lower()
                    if any(w in t for w in ["hackathon", "hack"]):
                        category = "Hackathon"
                    elif any(w in t for w in ["workshop"]):
                        category = "Workshop"
                    elif any(w in t for w in ["conference", "international"]):
                        category = "Conference"
                    elif any(w in t for w in ["seminar", "symposium"]):
                        category = "Seminar"
                    elif any(w in t for w in ["fdp", "faculty development"]):
                        category = "FDP"
                    elif any(w in t for w in ["internship"]):
                        category = "Internship"
                    elif any(w in t for w in ["cultural", "fest"]):
                        category = "Cultural"
                    elif any(w in t for w in ["tech", "technical"]):
                        category = "Technical"

                # Auto-detect event_type
                _online_kw = ["online", "virtual", "webinar", "remote", "hybrid", "e-summit", "e-summit"]
                title_lower = (title or "").lower()
                venue_lower = (venue or "").lower()
                category_lower = (category or "").lower()
                is_online = any(kw in title_lower or kw in venue_lower or kw in category_lower for kw in _online_kw)

                event = Event(
                    title=title,
                    description=description or None,
                    event_url=register_url,
                    source_url=source_url,
                    start_date=start_date,
                    end_date=end_date,
                    venue=venue or None,
                    city=city or None,
                    state=state_name or None,
                    latitude=latitude if not is_online else None,
                    longitude=longitude if not is_online else None,
                    category=category or None,
                    organizer=organizer[:500] if organizer else None,
                    image_url=image_url[:1000] if image_url else None,
                    event_type="online" if is_online else "physical",
                    is_scraped=True,
                    is_user_submitted=False,
                    is_approved=True,
                )
                db.add(event)
                existing_urls.add(normalized_url)
                new_count += 1
                logger.info("Added: %s (%s)", title[:50], city)

            db.commit()

        except Exception as e:
            db.rollback()
            logger.error("DB error: %s", e)
            error_count += 1
        finally:
            db.close()

        duration = round(time.time() - start_time, 1)
        with _scrape_lock:
            _scrape_status["last_run"] = datetime.utcnow().isoformat()
            _scrape_status["last_duration_sec"] = duration
            _scrape_status["events_new"] = new_count
            _scrape_status["events_updated"] = update_count
            _scrape_status["events_skipped"] = skip_count
            _scrape_status["errors"] = error_count
            _scrape_status["history"].append({
                "time": datetime.utcnow().isoformat(),
                "found": len(all_events),
                "new": new_count,
                "skipped": skip_count,
                "errors": error_count,
                "duration_sec": duration,
            })

        logger.info(
            "Scrape done: %d found, %d new, %d skipped, %d errors (%.1fs)",
            len(all_events), new_count, skip_count, error_count, duration,
        )

    except Exception as e:
        logger.error("Scrape failed: %s", e)
        with _scrape_lock:
            _scrape_status["errors"] += 1
    finally:
        with _scrape_lock:
            _scrape_status["is_running"] = False


def start_scheduler():
    from apscheduler.schedulers.asyncio import AsyncIOScheduler

    scheduler = AsyncIOScheduler()
    scheduler.add_job(run_scrape_job, "interval", hours=6)
    scheduler.start()
    logger.info("Scraper scheduler started (every 6 hours)")

    if not _scrape_status["is_running"]:
        threading.Thread(target=lambda: asyncio.run(run_scrape_job()), daemon=True).start()

    return scheduler
