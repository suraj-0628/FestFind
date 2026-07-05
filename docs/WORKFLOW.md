# Workflow & Decision-Making Guide

A project-independent guide to how we work, make decisions, and ship software. Apply this to any project.

---

## AI Agent Standard: Ponytail

We use [Ponytail](https://github.com/DietrichGebert/ponytail) as our AI coding skill set, installed as an npm plugin (`@dietrichgebert/ponytail`).

**Config:** `opencode.json` at project root auto-loads the plugin.

**Active rules:**

- **YAGNI** — Don't build what isn't needed now
- **Reuse first** — Check if the codebase already has what's needed
- **Stdlib first** — Use standard library before custom code
- **Native features** — `<input type="date">` over a date picker lib
- **No new deps** — Unless a few lines can't do it
- **One line over fifty** — Shortest working code wins
- **Deletion over addition** — Remove, don't add
- **Fewest files** — Shortest working diff wins

**Intensity levels:** `lite` | `full` (default) | `ultra`

Switch with `/ponytail <level>` or say "stop ponytail" to disable.

---

## Core Rules

### 1. No Commits Without Consent
Never `git commit` or `git push` without explicit user approval. Ask first. Always.

### 2. Ask Before Building
When the user describes a feature, discuss approach, scope, and tradeoffs before writing code. Don't assume — confirm.

### 3. Test Before Claiming Done
After building anything, run it yourself. Verify APIs with curl, check the frontend loads, confirm the feature works end-to-end. Don't say "done" until you've tested it.

### 4. Fix What You Break
If you introduce a bug, fix it immediately. Don't move on to new work while something is broken.

---

## How We Work

### Session Flow
1. **Understand** — Read existing code before making changes. Know the codebase.
2. **Plan** — Use todo lists for multi-step work. Break large tasks into small ones.
3. **Build** — Edit files, run commands, build features.
4. **Test** — Verify everything works. Run lint, typecheck, manual tests.
5. **Report** — Tell the user what was done, what was found, what needs attention.
6. **Wait for approval** — Don't commit/push without explicit consent.

### Problem Solving
- **Search first** — Use grep, glob, read files to understand before guessing.
- **Check logs** — When something fails, read the actual error. Don't speculate.
- **Minimal changes** — Fix the root cause, not the symptom. Don't over-engineer.
- **One thing at a time** — Finish one task before starting another.

---

## Decision-Making Patterns

### When There Are Multiple Options
1. List the options with pros/cons
2. Recommend one with reasoning
3. Ask the user to choose
4. Save the decision in the project's memory/design docs

### Common Tradeoffs We Make

| Decision | Default Choice | Why |
|----------|---------------|-----|
| Simplicity vs Features | Ship the core first, add later | Avoids scope creep (YAGNI) |
| New dependency vs DIY | Check if platform already does it first (Ponytail) | Fewer deps, smaller bundle, less breakage |
| Hardcode vs Config | Config for things that change, hardcode for constants | Balance flexibility vs complexity |
| Frontend vs Backend logic | Backend when possible | Frontend can be bypassed, backend is authoritative |
| CSS framework vs custom | Existing framework (Tailwind) | Consistency, speed |
| Database choice | SQLite for small projects, PostgreSQL for scale | Simplicity first |
| Auth approach | JWT for APIs, session for web apps | Stateless scales better |
| Error handling | Fail loudly in dev, gracefully in prod | Debug fast, user-safe |
| Component vs native element | Native first (Ponytail) | `<input type="date">` beats flatpickr |

### When User Disagrees
- Follow the user's preference. They own the project.
- Document the choice and reasoning in the project docs.
- Don't argue — adapt.

---

## Code Style

### General
- No emojis in code or UI (unless user explicitly wants them)
- No comments unless explaining non-obvious logic
- No dead code — delete what's unused
- No console.log in production code

### Frontend
- React functional components + TypeScript
- Tailwind CSS for styling
- Custom hooks for shared logic
- SVG icons only (not emoji, not icon libraries unless already in project)
- Dark theme by default

### Backend
- Python with type hints
- FastAPI for APIs
- SQLAlchemy for ORM
- Pydantic for validation
- Endpoints return proper HTTP status codes

### Git
- Descriptive commit messages (what, not how)
- One logical change per commit
- No secrets, tokens, or credentials in commits
- .gitignore covers all generated files, databases, uploads

---

## Testing Approach

### What to Test
1. **API endpoints** — curl with valid/invalid data, check status codes and response shape
2. **Frontend pages** — verify they load (200), components render, no JS errors
3. **Auth flow** — register, login, access protected routes, token expiry
4. **Edge cases** — empty inputs, wrong credentials, missing fields
5. **Integration** — frontend calls backend through proxy, data flows correctly

### How to Test
- Use curl for API testing (faster than browser devtools)
- Check TypeScript compilation (`npx tsc --noEmit`)
- Verify both servers are running before testing
- Check browser console for runtime errors
- Test with multiple user roles (admin vs regular)

### Before Pushing
- No sensitive data in code
- TypeScript compiles cleanly
- Backend starts without errors
- Frontend loads without crashes
- Core features work end-to-end

---

## Communication

### Status Updates
- Be concise — what was done, what works, what's broken
- Show actual data, not just "it works"
- If something fails, show the error

### When Things Go Wrong
- Read the error message first
- Check the logs
- Identify the root cause before attempting a fix
- Explain what went wrong and how you fixed it

### Scope Management
- If a task is large, break it into phases
- Ship the minimum viable version first
- Add polish and extras after the core works
- Always ask before expanding scope

---

## Project Memory

Every project should maintain:
- **memory.md** — Timeline of major work, key decisions, running state
- **design docs** — Architecture decisions, patterns chosen and why
- **decision log** — When we chose X over Y, and why

This prevents re-deciding the same things and helps onboard new contributors.

---

## Anti-Patterns to Avoid

- Saying "done" without testing
- Committing without user approval
- Adding dependencies without checking if they're needed
- Making large changes without explaining what changed
- Ignoring existing code patterns
- Over-engineering simple features
- Leaving broken things while building new features
- Hardcoding secrets or API keys
- Assuming the user's intent — ask instead

---

## ECC — When to Add

Evaluated [ECC](https://github.com/affaan-m/ECC). Not installed — Ponytail covers our needs. Add ECC later if:

| Trigger | Why |
|---------|-----|
| Multi-harness team (Claude + Codex + Cursor) | ECC unifies configs/skills across harnesses |
| Advanced security audit before production launch | AgentShield scans for injection, secrets, prompt leaks |
| AI costs hitting $100+/month | Token optimization and model routing reduce spend |
| Cross-session memory persistence needed | ECC's hooks save/load context across sessions automatically |
| Production app handling real users/payments | Security scanning catches auth/data issues |

**Install path:** `npm install ecc-universal` → `ecc init` → keep Ponytail for code quality, add ECC for security/scaling.

**Don't add ECC:** College fest site, solo dev, Ponytail handles everything we need.
