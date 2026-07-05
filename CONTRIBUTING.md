# Contributing to FestFind

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

1. Fork the repository
2. Clone your fork
3. Follow the [README setup instructions](README.md#getting-started)
4. Create a branch for your change:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Project Conventions

### Code Style

- **Frontend**: TypeScript, React functional components, Tailwind CSS for styling
- **Backend**: Python, FastAPI, SQLAlchemy, Pydantic schemas
- No emojis in code or UI (use SVG icons instead)

### Commit Messages

Use clear, descriptive commit messages:

```
Add event search filter
Fix mobile sidebar overflow
Update scraper to handle new Knowafest layout
```

### Branch Naming

- `feature/` — new features
- `fix/` — bug fixes
- `docs/` — documentation changes

## How to Contribute

### Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS info (for frontend issues)

### Suggesting Features

Open an issue describing:
- What you want to add
- Why it would be useful
- How you envision it working

### Submitting Code

1. Make your changes
2. Test that the app runs correctly
3. Ensure no sensitive data (API keys, secrets) is committed
4. Push your branch and open a Pull Request
5. Describe what your PR does and why

### What to Work On

Check the [Issues](https://github.com/suraj-0628/FestFind/issues) page for open tasks, or pick from:

- Bug fixes
- UI/UX improvements
- Mobile responsiveness improvements
- Scraper reliability improvements
- Test coverage
- Documentation

## Key Files to Know

| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | Main app layout, routing, auth gating |
| `frontend/src/components/IndiaMap.tsx` | Map with markers and clustering |
| `frontend/src/components/SubmitEvent.tsx` | Event submission form (Google Maps link location) |
| `frontend/src/hooks/useAuth.tsx` | Auth context with token management |
| `backend/app/routers/events.py` | Event CRUD API, geocoding, Maps link resolver |
| `backend/app/routers/auth.py` | Authentication endpoints (register, login, logout, me) |
| `backend/app/routers/upload.py` | Image upload/serve with validation |
| `backend/app/rate_limit.py` | In-memory sliding window rate limiter |
| `backend/app/scraper/knowafest_scraper.py` | Event scraper |
| `backend/app/scraper/scheduler.py` | APScheduler, event storage, auto-detect online/physical |

## Questions?

Open an issue if you have questions about contributing.
