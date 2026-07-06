# Coding Style Rules

## General Principles
- Prefer immutable updates over mutating shared state
- Create new objects instead of modifying existing ones
- Many small files over few large ones (200-400 lines typical, 800 max)
- Organize by feature/domain, not by type
- High cohesion, low coupling

## Code Quality
- Functions should be small (<50 lines)
- Files should be focused (<800 lines)
- No deep nesting (>4 levels)
- Use descriptive, readable identifiers
- Handle errors at every level
- Never silently swallow errors

## Documentation
- No emojis in code or UI (use SVG icons instead)
- Write clear, concise comments for complex logic
- Keep README and docs up to date

## Ponytail Principles
- Use native browser APIs first
- Avoid unnecessary dependencies
- Write minimal, focused code
