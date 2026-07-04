from datetime import datetime

from pydantic import BaseModel


class EventOut(BaseModel):
    id: str
    title: str
    description: str | None = None
    event_url: str | None = None
    source_url: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    venue: str | None = None
    city: str | None = None
    state: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    category: str | None = None
    tags: str | None = None
    organizer: str | None = None
    image_url: str | None = None
    poster_url: str | None = None
    event_type: str = "physical"
    is_scraped: bool = True
    is_user_submitted: bool = False
    is_approved: bool = True

    class Config:
        from_attributes = True


class EventCreate(BaseModel):
    title: str
    description: str | None = None
    event_url: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    venue: str | None = None
    city: str | None = None
    state: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    category: str | None = None
    tags: str | None = None
    organizer: str | None = None
    image_url: str | None = None
    poster_url: str | None = None
    event_type: str = "physical"


class EventList(BaseModel):
    items: list[EventOut]
    total: int
    page: int
    page_size: int
