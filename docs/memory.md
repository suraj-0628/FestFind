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
- Location picker: Google Maps link paste only (MapPicker removed, no map click/drag)
- Apple Maps direct extraction (`?ll=lat,lng`), Google Maps via headless Chromium resolver
- Text-based location fields: venue, city (text input), state (dropdown)
- Auto-geocoding on venue/city/state change (debounced 800ms), skipped when user pins via Maps link
- `userPinnedRef` prevents auto-geocode from overwriting user-pinned coords
- Image upload: JPEG/PNG/WebP/GIF, max 5MB, saved to `backend/uploads/`, requires auth token
- SubmitEvent stores contact/deadline/fee in `tags` field (no schema change)
- State name standardization: "Jammu & Kashmir" matches `india-regions.ts` format
- Required fields: title, organizer, category, start/end dates, city/state/poster (physical only)
- 500-word description limit with live word count
- Event type toggle: physical (coords + poster required) / online (no coords)
- Preview section shows live form state
- Registration URL validation (must start with http/https)
- Registration deadline and entry fee fields

### Phase 6: Auth System
- User model: id, email, name, password_hash, created_at
- `POST /api/auth/register` with email validation (blocks disposable domains, allows edu/gmail/outlook)
- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- JWT tokens: HS256, 72hr expiry, `Authorization: Bearer` header, `jti` claim for revocation
- Password: PBKDF2-HMAC-SHA256 with per-user random salt, min 8 chars
- AuthContext: sessionStorage token, auto-validation on load
- Token revocation: in-memory blacklist (set of `jti` claims, auto-cleanup on expiry)
- Host tab always says "Host" — user discovers login requirement by clicking
- Auto-transition to host page after login

### Phase 7: Security Hardening (Current)
- 10 security fixes implemented:
  1. Command injection in `/resolve-link` — URL allowlist (google.com/maps, maps.app.goo.gl, goo.gl/maps)
  2. JWT secret — `sys.exit(1)` at startup if `JWT_SECRET` not set (was regenerating on restart)
  3. Rate limiting — in-memory sliding window: auth 5/min, events 10/min, upload 5/min, resolve 3/min
  4. Path traversal in image serving — regex validates filename is `32-hex.ext`
  5. File content validation — magic bytes checked on upload, not trusting Content-Type header
  6. Stored XSS — HTML strip + entity decode on all event string fields
  7. Feature flags endpoint — requires admin auth
  8. Token storage — localStorage → sessionStorage
  9. Password policy — min 6 → min 8 chars
  10. Token revocation — in-memory blacklist + `/api/auth/logout` endpoint
- CORS: restricted from `*` to specific localhost origins
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
- Google Maps link for location picker (replaced MapPicker)
- tags field for contact/deadline/fee
- PBKDF2 password hashing
- JWT with PyJWT
- Host tab always says "Host"
- Auto-transition after login
- sessionStorage over localStorage for tokens
- Password min 8 chars
- Token revocation via in-memory jti blacklist
- Rate limiting: in-memory sliding window (no new deps)
- XSS: strip HTML tags + unescape entities on input
- File upload: magic bytes validation (don't trust Content-Type)
- Image serving: regex-validated filenames only

## Running State
- Frontend: port 5173 (`--host 0.0.0.0`)
- Backend: port 8000 (`python3 -m uvicorn`)
- E2E: 48/48 passing
- Scraper: 113 events in DB (98 physical, 15 online)
- Service worker: skips on localhost
- `email_validator` NOT installed — use plain `str` not `EmailStr`
- Rate limits: auth 5/min, events 10/min, upload 5/min, resolve 3/min per IP
- Playwright installed for Google Maps link resolver
- JWT secret: required env var, server exits if missing
- Token blacklist: in-memory, auto-cleanup on expiry
