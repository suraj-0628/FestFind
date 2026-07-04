# FestFind - Development Memory

## Project Overview
Interactive India map-based platform for discovering and hosting college events. Replaces text-heavy listings with a visual, location-first experience.

## Timeline of Major Work

### Phase 1: Core Platform
- Built FastAPI backend with SQLite + SQLAlchemy
- Created React + Vite + TypeScript frontend
- Implemented 3-level drill-down map: India → State → City → Events
- Leaflet.js used directly (react-leaflet v5 crashes with context API error)
- Tab navigation: Map | Online Events | Host Event
- Online Events section with All/Live Now/Upcoming filters
- Event submission form with 10+ enhancements
- E2E tests: 48/48 passing via Playwright

### Phase 2: Map & UX
- Sidebar-driven UX: 380px sidebar + flexible map
- Mobile split-view (map + event list, not bottom sheet)
- `dispatchEvent` for Leaflet markers (Playwright `.click()` doesn't trigger Leaflet handlers)
- Map responds to sidebar via custom events (`map-fly`, `map-fly-sequence`)
- StateDropdown replaced breadcrumbs with animated dropdown
- IP geolocation as primary fallback (`ip-api.com` free API)
- No blocking modals/overlays — map loads immediately
- JS-based rendering over CSS hidden (`useMediaQuery` hook)

### Phase 3: Scraper & Data
- Single source scraper (Knowafest state pages only — user rejected multi-source)
- `event_url` = registration URL, `source_url` = knowafest detail page
- Scraper integrated into server startup via APScheduler (every 6 hours)
- CARTO `dark_all` tiles with all labels
- Nominatim for geocoding (free, no API key, ~1 req/sec)
- Venue clustering at 500m radius
- Single-day events extend to 23:59:59
- Ongoing = green, cluster dots = blue
- 173+ events in DB, geocoded, with real registration links

### Phase 4: Branding & Design
- Logo: animated pin with CSS keyframes (`.ff-pulse-ring`, `.ff-dot-breathe`)
- Brand colors: #00d4ff (cyan), #22c55e (green), #f472b6 (pink) — purple removed
- Font: Sora for logo wordmark and body
- Icon system: custom SVG in Icons.tsx (Lucide-style, 24x24, 2px stroke, round caps)
- No emojis anywhere — SVG icons only (emojis look "AI-generated")
- Design follows Apple HIG, Claude.ai, Google Maps, Airbnb, Spotify patterns

### Phase 5: Event Submission
- MapPicker: search-first UX with Nominatim, click/tap fallback
- Auto-detects user location on load (browser geolocation → IP fallback → localStorage)
- Google Maps link field for coordinate extraction
- `_extract_coords_from_maps_url()` parses `@lat,lng`, `?q=lat,lng`, `?ll=lat,lng`
- Nominatim fallback geocoding when no lat/lng provided
- Image upload: JPEG/PNG/WebP/GIF, max 5MB, saved to `backend/uploads/`
- SubmitEvent stores contact/deadline/fee in `tags` field (no schema change)
- State name standardization: "Jammu & Kashmir" matches `india-regions.ts` format

### Phase 6: Auth System
- User model: id, email, name, password_hash, created_at
- `POST /api/auth/register` with email validation (blocks disposable domains, allows edu/gmail/outlook)
- `POST /api/auth/login`, `GET /api/auth/me`
- JWT tokens: HS256, 72hr expiry, `Authorization: Bearer` header
- Password: PBKDF2-HMAC-SHA256 with per-user random salt
- AuthContext: localStorage token, auto-validation on load
- Host tab always says "Host" — user discovers login requirement by clicking
- Auto-transition to host page after login

### Phase 7: Pre-Push Cleanup (Current)
- JWT secret: no longer hardcoded, generates random secret per startup
- Password hashing: SHA-256 + static salt → PBKDF2 + per-user random salt
- CORS: restricted from `*` to specific localhost origins
- Docker credentials: env var references with `.env` requirement
- Dead files removed: india-states.geojson, india-states-geojson.ts, college_fest.db
- Unused npm deps removed: three, @react-three/*, react-leaflet, @types/geojson
- Unused pip dep removed: alembic
- `.gitignore` expanded: `*.db`, `backend/uploads/`, `.vite/`, OS/IDE files
- `start.sh` fixed: hardcoded paths → `$SCRIPT_DIR`
- Design docs moved to `docs/`
- Created README.md, CONTRIBUTING.md, .env.example

## Key Decisions Log
- Leaflet.js directly — react-leaflet v5 crashes
- Sidebar-driven UX — not bottom sheet
- `dispatchEvent` for markers — Playwright compat
- No emojis — SVG icons only
- StateDropdown over breadcrumbs
- IP geolocation as primary fallback
- Single source scraper (user explicit)
- No blocking modals
- JS rendering over CSS hidden
- CARTO dark_all tiles
- Nominatim for geocoding
- Venue clustering at 500m
- Single-day events extend to 23:59:59
- Ongoing green, cluster blue
- Logo animated pin with CSS
- Brand: cyan + green + pink
- Sora font
- Custom SVG icons
- MapPicker for event location
- Google Maps link for coords
- tags field for contact/deadline/fee
- PBKDF2 password hashing
- JWT with PyJWT
- Host tab always says "Host"
- Auto-transition after login

## Running State
- Frontend: port 5173 (`--host 0.0.0.0`)
- Backend: port 8000 (`python3 -m uvicorn`)
- E2E: 48/48 passing
- Scraper: 173+ events in DB
- Service worker: skips on localhost
- `email_validator` NOT installed — use plain `str` not `EmailStr`
