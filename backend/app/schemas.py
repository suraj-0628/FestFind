from datetime import datetime

from pydantic import BaseModel, Field


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
    title: str = Field(..., min_length=3, max_length=500)
    description: str | None = Field(None, max_length=5000)
    event_url: str | None = Field(None, max_length=1000)
    start_date: datetime | None = None
    end_date: datetime | None = None
    venue: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=200)
    state: str | None = Field(None, max_length=200)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    category: str | None = Field(None, max_length=200)
    tags: str | None = Field(None, max_length=1000)
    organizer: str | None = Field(None, max_length=500)
    image_url: str | None = Field(None, max_length=1000)
    poster_url: str | None = Field(None, max_length=1000)
    event_type: str = Field("physical", pattern="^(physical|online)$")


class EventList(BaseModel):
    items: list[EventOut]
    total: int
    page: int
    page_size: int
