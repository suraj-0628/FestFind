import csv
import io
import os
import time
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db, engine
from app.models import User, Event, Announcement, FeatureFlag
from app.routers.auth import get_admin_user
from app.scraper.scheduler import get_scrape_status, run_scrape_job, _scrape_status

router = APIRouter()


class AnnouncementCreate(BaseModel):
    title: str
    message: str


class AnnouncementOut(BaseModel):
    id: str
    title: str
    message: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class FeatureFlagUpdate(BaseModel):
    value: bool


class FeatureFlagOut(BaseModel):
    id: str
    key: str
    value: bool
    description: str | None = None
    updated_at: datetime

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    is_admin: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class EventAdminOut(BaseModel):
    id: str
    title: str
    description: str | None = None
    event_url: str | None = None
    source_url: str | None = None
    image_url: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    venue: str | None = None
    city: str | None = None
    state: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    category: str | None = None
    organizer: str | None = None
    event_type: str = "physical"
    is_scraped: bool = True
    is_user_submitted: bool = False
    is_approved: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


# ── Dashboard Overview ──────────────────────────────────────────────

@router.get("/overview")
def admin_overview(user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    total_events = db.query(func.count(Event.id)).scalar()
    approved_events = db.query(func.count(Event.id)).filter(Event.is_approved == True).scalar()
    pending_events = db.query(func.count(Event.id)).filter(Event.is_approved == False).scalar()
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    ongoing_events = db.query(func.count(Event.id)).filter(
        Event.start_date <= now,
        (Event.end_date >= now) | (Event.end_date == None),
        Event.is_approved == True,
    ).scalar()
    upcoming_events = db.query(func.count(Event.id)).filter(
        Event.start_date > now,
        Event.is_approved == True,
    ).scalar()
    scraped_events = db.query(func.count(Event.id)).filter(Event.is_scraped == True).scalar()
    user_submitted = db.query(func.count(Event.id)).filter(Event.is_user_submitted == True).scalar()

    geocoded = db.query(func.count(Event.id)).filter(
        Event.latitude != None, Event.longitude != None
    ).scalar()

    states_count = db.query(func.count(func.distinct(Event.state))).scalar()
    cities_count = db.query(func.count(func.distinct(Event.city))).scalar()
    categories = db.query(Event.category, func.count(Event.id)).filter(
        Event.category != None, Event.is_approved == True
    ).group_by(Event.category).order_by(func.count(Event.id).desc()).limit(10).all()

    states = db.query(Event.state, func.count(Event.id)).filter(
        Event.state != None, Event.is_approved == True
    ).group_by(Event.state).order_by(func.count(Event.id).desc()).limit(10).all()

    recent_users_7d = db.query(func.count(User.id)).filter(
        User.created_at >= now - timedelta(days=7)
    ).scalar()

    return {
        "events": {
            "total": total_events,
            "approved": approved_events,
            "pending": pending_events,
            "ongoing": ongoing_events,
            "upcoming": upcoming_events,
            "scraped": scraped_events,
            "user_submitted": user_submitted,
            "geocoded": geocoded,
        },
        "users": {
            "total": total_users,
            "active": active_users,
            "recent_7d": recent_users_7d,
        },
        "coverage": {
            "states": states_count,
            "cities": cities_count,
            "geocoded_pct": round(geocoded / max(total_events, 1) * 100, 1),
        },
        "top_categories": [{"name": c[0], "count": c[1]} for c in categories],
        "top_states": [{"name": s[0], "count": s[1]} for s in states],
    }


# ── Scraper Management ──────────────────────────────────────────────

@router.get("/scraper/status")
def scraper_status(user: User = Depends(get_admin_user)):
    return get_scrape_status()


@router.post("/scraper/run")
async def scraper_run(user: User = Depends(get_admin_user)):
    if _scrape_status["is_running"]:
        raise HTTPException(409, "Scrape already running")
    import asyncio
    asyncio.create_task(run_scrape_job())
    return {"message": "Scrape job started"}


# ── User Management ─────────────────────────────────────────────────

@router.get("/users", response_model=list[UserOut])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )
    return query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()


@router.get("/users/count")
def user_count(user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return {"total": db.query(func.count(User.id)).scalar()}


@router.put("/users/{user_id}/admin")
def toggle_admin(user_id: str, user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    if user_id == user.id:
        raise HTTPException(400, "Cannot change your own admin status")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User not found")
    target.is_admin = not target.is_admin
    db.commit()
    return {"is_admin": target.is_admin}


@router.put("/users/{user_id}/active")
def toggle_active(user_id: str, user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    if user_id == user.id:
        raise HTTPException(400, "Cannot deactivate yourself")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User not found")
    target.is_active = not target.is_active
    db.commit()
    return {"is_active": target.is_active}


@router.delete("/users/{user_id}")
def delete_user(user_id: str, user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    if user_id == user.id:
        raise HTTPException(400, "Cannot delete yourself")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User not found")
    db.delete(target)
    db.commit()
    return {"message": "User deleted"}


# ── Event Moderation ────────────────────────────────────────────────

@router.get("/events/all")
def admin_all_events(
    limit: int = Query(500, ge=1, le=2000),
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    events = db.query(Event).order_by(Event.created_at.desc()).limit(limit).all()
    return [
        {
            "id": e.id, "title": e.title, "city": e.city, "state": e.state,
            "latitude": e.latitude, "longitude": e.longitude,
            "category": e.category, "organizer": e.organizer,
            "event_type": e.event_type, "is_scraped": e.is_scraped,
            "is_user_submitted": e.is_user_submitted, "is_approved": e.is_approved,
            "start_date": e.start_date.isoformat() if e.start_date else None,
            "end_date": e.end_date.isoformat() if e.end_date else None,
            "venue": e.venue, "source_url": e.source_url,
        }
        for e in events
    ]


@router.get("/events", response_model=list[EventAdminOut])
def admin_list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    search: str | None = None,
    event_type: str | None = None,
    category: str | None = None,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    query = db.query(Event)
    if status == "pending":
        query = query.filter(Event.is_approved == False)
    elif status == "approved":
        query = query.filter(Event.is_approved == True)
    if search:
        query = query.filter(Event.title.ilike(f"%{search}%"))
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if category:
        query = query.filter(Event.category.ilike(f"%{category}%"))
    return query.order_by(Event.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()


@router.get("/events/count")
def admin_event_count(
    status: str | None = None,
    user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    query = db.query(func.count(Event.id))
    if status == "pending":
        query = query.filter(Event.is_approved == False)
    elif status == "approved":
        query = query.filter(Event.is_approved == True)
    return {"total": query.scalar()}


@router.put("/events/{event_id}/approve")
def approve_event(event_id: str, user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")
    event.is_approved = True
    db.commit()
    return {"message": "Event approved"}


@router.put("/events/{event_id}/reject")
def reject_event(event_id: str, user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")
    event.is_approved = False
    db.commit()
    return {"message": "Event rejected"}


@router.delete("/events/{event_id}")
def delete_event(event_id: str, user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")
    db.delete(event)
    db.commit()
    return {"message": "Event deleted"}


@router.put("/events/bulk-approve")
def bulk_approve(event_ids: list[str], user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    count = db.query(Event).filter(Event.id.in_(event_ids)).update({Event.is_approved: True}, synchronize_session=False)
    db.commit()
    return {"message": f"{count} events approved"}


@router.put("/events/bulk-reject")
def bulk_reject(event_ids: list[str], user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    count = db.query(Event).filter(Event.id.in_(event_ids)).update({Event.is_approved: False}, synchronize_session=False)
    db.commit()
    return {"message": f"{count} events rejected"}


@router.delete("/events/bulk-delete")
def bulk_delete(event_ids: list[str], user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    count = db.query(Event).filter(Event.id.in_(event_ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"{count} events deleted"}


# ── CSV Export ──────────────────────────────────────────────────────

@router.get("/export/events")
def export_events_csv(user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    events = db.query(Event).order_by(Event.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "title", "description", "event_url", "source_url",
        "start_date", "end_date", "venue", "city", "state",
        "latitude", "longitude", "category", "organizer",
        "event_type", "is_scraped", "is_user_submitted", "is_approved", "created_at",
    ])
    for e in events:
        writer.writerow([
            e.id, e.title, e.description or "", e.event_url or "", e.source_url or "",
            e.start_date or "", e.end_date or "", e.venue or "", e.city or "", e.state or "",
            e.latitude or "", e.longitude or "", e.category or "", e.organizer or "",
            e.event_type, e.is_scraped, e.is_user_submitted, e.is_approved, e.created_at,
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=festfind_events.csv"},
    )


@router.get("/export/users")
def export_users_csv(user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "email", "name", "is_admin", "is_active", "created_at"])
    for u in users:
        writer.writerow([u.id, u.email, u.name, u.is_admin, u.is_active, u.created_at])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=festfind_users.csv"},
    )


# ── System Health ───────────────────────────────────────────────────

@router.get("/system/health")
def system_health(user: User = Depends(get_admin_user)):
    db_path = settings.database_url.replace("sqlite:///", "")
    db_size = 0
    if os.path.exists(db_path):
        db_size = os.path.getsize(db_path)

    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    upload_count = 0
    upload_size = 0
    if os.path.exists(upload_dir):
        for f in os.listdir(upload_dir):
            if f != ".gitkeep":
                fp = os.path.join(upload_dir, f)
                if os.path.isfile(fp):
                    upload_count += 1
                    upload_size += os.path.getsize(fp)

    with engine.connect() as conn:
        tables = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall()
        row_counts = {}
        for (table,) in tables:
            try:
                count = conn.execute(text(f"SELECT COUNT(*) FROM [{table}]")).scalar()
                row_counts[table] = count
            except Exception:
                pass

    return {
        "database": {
            "size_bytes": db_size,
            "size_mb": round(db_size / 1024 / 1024, 2),
            "tables": row_counts,
        },
        "uploads": {
            "count": upload_count,
            "size_bytes": upload_size,
            "size_mb": round(upload_size / 1024 / 1024, 2),
        },
    }


@router.get("/system/logs")
def system_logs(
    lines: int = Query(100, ge=10, le=500),
    user: User = Depends(get_admin_user),
):
    log_file = "/tmp/backend.log"
    if not os.path.exists(log_file):
        return {"logs": [], "message": "No log file found"}
    try:
        with open(log_file, "r") as f:
            all_lines = f.readlines()
            recent = all_lines[-lines:]
            return {"logs": [l.rstrip() for l in recent]}
    except Exception as e:
        return {"logs": [], "error": str(e)}


# ── Announcements ───────────────────────────────────────────────────

@router.get("/announcements", response_model=list[AnnouncementOut])
def list_announcements(user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return db.query(Announcement).order_by(Announcement.created_at.desc()).all()


@router.post("/announcements", response_model=AnnouncementOut)
def create_announcement(req: AnnouncementCreate, user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    ann = Announcement(title=req.title, message=req.message)
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann


@router.put("/announcements/{ann_id}/toggle")
def toggle_announcement(ann_id: str, user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(404, "Announcement not found")
    ann.is_active = not ann.is_active
    db.commit()
    return {"is_active": ann.is_active}


@router.delete("/announcements/{ann_id}")
def delete_announcement(ann_id: str, user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(404, "Announcement not found")
    db.delete(ann)
    db.commit()
    return {"message": "Announcement deleted"}


# ── Feature Flags ───────────────────────────────────────────────────

@router.get("/flags", response_model=list[FeatureFlagOut])
def list_flags(user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return db.query(FeatureFlag).order_by(FeatureFlag.key).all()


@router.put("/flags/{key}")
def update_flag(key: str, req: FeatureFlagUpdate, user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    flag = db.query(FeatureFlag).filter(FeatureFlag.key == key).first()
    if not flag:
        raise HTTPException(404, "Feature flag not found")
    flag.value = req.value
    db.commit()
    return {"key": flag.key, "value": flag.value}


# ── Public endpoints (no auth) ─────────────────────────────────────

@router.get("/public/announcements")
def public_announcements(db: Session = Depends(get_db)):
    return db.query(Announcement).filter(Announcement.is_active == True).order_by(Announcement.created_at.desc()).all()


@router.get("/public/flags")
def public_flags(user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    flags = db.query(FeatureFlag).all()
    return {f.key: f.value for f in flags}
