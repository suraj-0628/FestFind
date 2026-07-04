import logging
import time
from datetime import datetime, timezone

from app.scraper.knowafest_scraper import (
    discover_states,
    discover_events_from_state,
    scrape_event_detail,
    _parse_date,
)
from app.database import SessionLocal
from app.models import Event

logger = logging.getLogger(__name__)

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
    return {**_scrape_status, "history": _scrape_status["history"][-10:]}


async def run_scrape_job():
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

        _scrape_status["events_found"] = len(all_events)
        logger.info("Discovered %d unique events across %d states", len(all_events), len(states))

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
                existing_urls.add(url)

            for evt in all_events:
                source_url = evt.get("source_url", "")
                if not source_url:
                    continue

                # Skip if already in DB
                if source_url in existing_urls:
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
                end_date = (detail or {}).get("end_date")
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
                if not latitude and city and city.lower() not in (
                    "tokyo", "new york", "san diego", "los angeles", "singapore",
                    "osaka", "paris", "rome", "barcelona", "vienna", "dubai", "bangkok", "boston",
                ):
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
                    latitude=latitude,
                    longitude=longitude,
                    category=category or None,
                    organizer=organizer[:500] if organizer else None,
                    image_url=image_url[:1000] if image_url else None,
                    event_type="physical",
                    is_scraped=True,
                    is_user_submitted=False,
                    is_approved=True,
                )
                db.add(event)
                existing_urls.add(source_url)
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
        _scrape_status["errors"] += 1
    finally:
        _scrape_status["is_running"] = False


def start_scheduler():
    from apscheduler.schedulers.asyncio import AsyncIOScheduler

    scheduler = AsyncIOScheduler()
    scheduler.add_job(run_scrape_job, "interval", hours=6)
    scheduler.start()
    logger.info("Scraper scheduler started (every 6 hours)")
    return scheduler
