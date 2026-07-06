# Python / FastAPI Rules

## API Design
- Use async/await for all endpoint handlers
- Return consistent response format
- Use Pydantic schemas for request/response validation
- Implement proper HTTP status codes

## File Organization
```
backend/
├── app/
│   ├── routers/      # API endpoint handlers
│   ├── scraper/      # Background scrapers
│   ├── models.py     # SQLAlchemy models
│   ├── schemas.py    # Pydantic schemas
│   ├── config.py     # Environment settings
│   └── database.py   # DB engine + session
```

## Database
- Use SQLAlchemy ORM for queries
- Always use parameterized queries
- Implement proper session management
- Use migrations for schema changes

## Error Handling
- Raise HTTPException with proper status codes
- Log detailed errors server-side
- Return user-friendly messages client-side
- Never expose internal errors to users

## Security
- Validate all input with Pydantic
- Use JWT for authentication
- Implement rate limiting
- Block disposable email addresses

## Testing
- Write tests for all endpoints
- Use pytest fixtures for database setup
- Mock external services (Nominatim, scraper sources)
- Aim for 80%+ coverage
