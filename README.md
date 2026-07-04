# FestFind

An interactive India map-based platform for discovering and hosting college events — fests, hackathons, workshops, conferences, and more. Built to replace text-heavy event listings with a visual, location-first experience.

## Features

- **3-level drill-down map** — India > State > City > Events with glowing markers and live status indicators
- **Event hosting** — Submit events with poster upload, registration URLs, deadlines, and map-based location pinning
- **Search & discover** — Location search, GPS-based "Locate Me", and nearby events sidebar
- **Online events section** — Filter by All / Live Now / Upcoming
- **Automated scraper** — Pulls events from Knowafest every 6 hours, geocodes venues, auto-categorizes
- **Mobile-first responsive design** — Split-view on mobile (map + event list)
- **Dark theme** with animated SVG branding

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Leaflet.js, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy, SQLite, APScheduler |
| Geocoding | Nominatim (OpenStreetMap) — free, no API key |
| Auth | Custom email/password with JWT, disposable email blocking |
| PWA | Service worker, manifest, offline tile caching |

## Project Structure

```
festfind/
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── components/    # UI components (IndiaMap, SubmitEvent, MapPicker, etc.)
│   │   ├── hooks/         # Custom hooks (useAuth, useEvents, useLocation, etc.)
│   │   ├── data/          # Static data (india-regions.ts)
│   │   ├── styles/        # Global CSS, animations
│   │   └── utils/         # API helpers, event status utils
│   └── public/            # PWA assets, service worker, sitemap
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── routers/       # API endpoints (events, auth, upload)
│   │   ├── scraper/       # Knowafest scraper, geocoder, scheduler
│   │   ├── models.py      # SQLAlchemy models
│   │   ├── schemas.py     # Pydantic schemas
│   │   ├── config.py      # Settings (env-based)
│   │   └── database.py    # DB engine + session
│   └── uploads/           # User-uploaded event images
└── docs/                  # Design docs, UX flows, marketing
```

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **Python 3.10+**
- **pip3** (or pip)

### 1. Clone the repository

```bash
git clone https://github.com/suraj-0628/FestFind.git
cd FestFind
```

### 2. Set up the backend

```bash
cd backend

# Create virtual environment (recommended)
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip3 install -r requirements.txt

# Copy environment file
cp ../.env.example .env
# Edit .env and set a secure JWT_SECRET

# Start the backend server
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend runs at `http://localhost:8000`. On first run it will:
- Create the SQLite database
- Run the event scraper (fetches events from Knowafest)
- Geocode venues via Nominatim

### 3. Set up the frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies `/api` requests to the backend.

### 4. Quick start (alternative)

```bash
chmod +x start.sh
./start.sh
```

This starts both backend (port 8000) and frontend (port 5173) in one terminal.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/` | List events (query: state, city, event_type, status, search) |
| GET | `/api/events/{id}` | Get event by ID |
| POST | `/api/events/` | Create event (auth required) |
| POST | `/api/upload/` | Upload event image (auth required) |
| GET | `/api/upload/{filename}` | Serve uploaded image |
| GET | `/api/events/reverse-geocode` | Reverse geocode lat/lng |
| POST | `/api/auth/register` | Register a new account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user (auth required) |

## Configuration

All configuration is via environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./collegefest.db` | Database connection string |
| `JWT_SECRET` | random | Secret key for JWT tokens |
| `JWT_EXPIRE_HOURS` | `72` | Token expiry time |
| `SCRAPER_RATE_LIMIT` | `1.0` | Seconds between scraper requests |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute.

## License

This project is open source. See the repository for license details.
