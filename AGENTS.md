# FestFind — Agent Instructions

## Project Overview
FestFind is an interactive India map-based platform for discovering and hosting college events. Built with React 18 + TypeScript frontend and Python FastAPI backend.

## Core Principles

1. **Security-First** — Never hardcode secrets; validate all inputs
2. **Test-Driven** — Write tests before implementation
3. **Immutability** — Create new objects, never mutate
4. **Minimal Code** — Use native APIs first, avoid unnecessary dependencies

## Available Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| code-reviewer | Code quality review | After writing/modifying code |
| security-reviewer | Vulnerability scanning | Before commits, auth code |
| tdd-guide | Test-driven development | New features, bug fixes |

## Project Structure

```
frontend/          React + TypeScript + Vite + Tailwind
├── src/
│   ├── components/    UI components (IndiaMap, SubmitEvent, etc.)
│   ├── hooks/         Custom hooks (useAuth, useEvents, etc.)
│   ├── data/          Static data (india-regions.ts)
│   └── utils/         API helpers, utilities

backend/           Python FastAPI + SQLAlchemy + SQLite
├── app/
│   ├── routers/       API endpoints (events, auth, upload)
│   ├── scraper/       Knowafest scraper, geocoder
│   ├── models.py      SQLAlchemy models
│   ├── schemas.py     Pydantic schemas
│   └── config.py      Environment settings
```

## Workflow

1. **Plan** — Understand requirements before coding
2. **TDD** — Write tests first, implement, refactor
3. **Review** — Run security and code review agents
4. **Commit** — Use conventional commits format

## Code Style

### Frontend (TypeScript/React)
- Functional components with hooks
- Tailwind CSS for styling
- No emojis in code/UI
- TypeScript strict mode

### Backend (Python/FastAPI)
- Async/await for endpoints
- Pydantic schemas for validation
- SQLAlchemy for database
- Environment variables for config

## Security Checklist

Before any commit:
- [ ] No hardcoded secrets
- [ ] All inputs validated
- [ ] SQL injection prevented
- [ ] XSS protection enabled
- [ ] Auth verified

## Commands

```bash
# Start development
./start.sh

# Frontend only
cd frontend && npm run dev

# Backend only
cd backend && python3 -m uvicorn app.main:app --reload

# Run tests
cd frontend && npm test
cd backend && pytest
```

## Required Reading — BEFORE Making Any Changes

**Read these files first** to understand project history, decisions, and conventions:

| File | What it contains |
|------|-----------------|
| `docs/memory.md` | Project timeline, key decisions, running state, ground rules |
| `docs/WORKFLOW.md` | Working style, decision patterns, anti-patterns, ECC evaluation |
| `CONTRIBUTING.md` | Contribution rules, git conventions, no-commit-without-consent |
| `docs/design-system.md` | Brand colors, fonts, spacing, component patterns |
| `docs/design-components.md` | Component-level design decisions |
| `docs/design-interactions.md` | Interaction patterns, animations, UX flows |
| `docs/UX-USER-FLOWS.md` | User journeys through the app |
| `docs/MARKETING.md` | Marketing strategy, landing page plan |
| `.env.example` | Required environment variables |

**Why:** Without reading these, you will re-decide solved problems, break existing conventions, or repeat work already done. The project has specific decisions (no emojis, SVG icons only, sidebar-driven UX, single-source scraper) that must be respected.

## AI Agent Standard

- Using **Ponytail** — minimal code, YAGNI, native APIs first
- Installed as npm plugin: `@dietrichgebert/ponytail` in root `package.json`
- Config: `opencode.json` at project root
- If adding ECC later: `npm install ecc-universal` → `ecc init` (see `docs/WORKFLOW.md` for triggers)
