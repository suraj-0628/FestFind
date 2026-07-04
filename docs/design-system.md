# College Fest Hub — Design System

Design language for a student-focused event discovery platform. Dark theme, premium feel, content-first.

## Reference Systems

| System | What We Take |
|--------|-------------|
| Apple HIG | Spacing rhythm, typographic hierarchy, subtle shadows |
| Claude.ai | Restrained glassmorphism, content-first, clean surfaces |
| Google Maps | Exploration UX, map overlays, info panels |
| Airbnb | Card hierarchy, date formatting, filter patterns |
| Spotify | Discovery cards, gradient accents, section headers |
| Radix UI | Accessible primitives, focus states, keyboard nav |
| shadcn/ui | Tailwind component patterns, dark theme tokens |

## Design Tokens

### Color System

```
Background layers (darkest → lightest):
  --bg-base:     #0a0a0f     (page, deepest)
  --bg-surface:  #0f1117     (sidebar, panels)
  --bg-elevated: #1a1d27     (cards, modals)
  --bg-hover:    #22252f     (interactive states)
  --bg-active:   #2a2d3a     (pressed, selected)

Borders:
  --border-subtle:  rgba(255,255,255,0.06)
  --border-default: rgba(255,255,255,0.10)
  --border-strong:  rgba(255,255,255,0.16)
  --border-focus:   #00d4ff

Text:
  --text-primary:   #f1f5f9   (headings, primary)
  --text-secondary: #94a3b8   (body, descriptions)
  --text-tertiary:  #64748b   (labels, metadata)
  --text-disabled:  #475569   (unavailable)

Accent:
  --accent-blue:    #00d4ff   (interactive, links, focus)
  --accent-purple:  #8b5cf6   (categories, badges)
  --accent-green:   #22c55e   (ongoing, success)
  --accent-pink:    #f472b6   (upcoming, warnings)
  --accent-orange:  #f97316   (featured)
```

### Spacing (8px grid)

```
4px   = 0.5 unit  (tight gaps, icon padding)
8px   = 1 unit    (default gap)
12px  = 1.5 units (card padding small)
16px  = 2 units   (card padding, section gaps)
20px  = 2.5 units (panel padding)
24px  = 3 units   (section dividers)
32px  = 4 units   (major sections)
40px  = 5 units   (page margins)
48px  = 6 units   (hero spacing)
```

### Typography Scale

| Role | Size | Weight | Line Height | Use |
|------|------|--------|-------------|-----|
| Display | 24px | 700 | 1.2 | Page titles |
| Heading | 18px | 600 | 1.3 | Section headers |
| Subhead | 15px | 600 | 1.4 | Card titles |
| Body | 14px | 400 | 1.5 | Descriptions |
| Caption | 12px | 500 | 1.4 | Metadata, labels |
| Overline | 11px | 600 | 1.3 | Uppercase labels |
| Micro | 10px | 500 | 1.3 | Badges, counts |

Font: `Inter` (system fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`)

### Border Radius

```
4px   = badge, small button
8px   = input, default card
12px  = elevated card, modal
16px  = large card, featured
9999px = pill (tag, avatar)
```

### Shadows (dark theme)

```
sm:   0 1px 2px rgba(0,0,0,0.3)
md:   0 4px 12px rgba(0,0,0,0.4)
lg:   0 8px 24px rgba(0,0,0,0.5)
glow: 0 0 20px rgba(0,212,255,0.15)  (focus state only)
```

### Transitions

```
duration-fast:   150ms  (hover states, color changes)
duration-normal: 200ms  (transform, opacity)
duration-slow:   300ms  (layout shifts, expand/collapse)
easing:          cubic-bezier(0.4, 0, 0.2, 1)  (standard)
easing-bounce:   cubic-bezier(0.34, 1.56, 0.64, 1)  (micro-interactions)
```

## Principles

### 1. Content Hierarchy Over Decoration

Every pixel serves a purpose. Before adding any visual element, ask: "Does this help the user find or understand content?"

Bad: Gradient border around a card just for visual flair
Good: Subtle border that separates card from background

### 2. Restrained Glassmorphism

Glassmorphism (`backdrop-blur` + semi-transparent bg) is for floating overlays ONLY:
- Modals
- Tooltips
- Map controls
- Toasts

NEVER for:
- Content cards
- Sidebar panels
- Navigation bars (use solid bg)

### 3. Dark Theme Done Right

Dark backgrounds need:
- Elevated surfaces get lighter (`#0f1117` → `#1a1d27`)
- Borders become visible separators (`rgba(255,255,255,0.06)`)
- Text uses warm whites (`#f1f5f9` not `#ffffff`)
- Accents provide the only color contrast

### 4. Map as Companion, Not Canvas

The map is an exploration tool, not the UI. Always pair it with:
- A data sidebar that provides context
- Stats that answer "what am I looking at?"
- Clear interaction affordances

### 5. Mobile-First Responsive

- Sidebar collapses to bottom sheet on mobile
- Map takes full width on small screens
- Cards stack vertically below 768px
- Touch targets minimum 44x44px
- Safe area insets for notch/home-bar devices
- Bottom sheet with drag handle, 70vh max height
- Hamburger menu for navigation on mobile
- Map popups constrained to 80vw on mobile

#### Breakpoints

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| Mobile | <768px | Full-screen map, bottom sheet sidebar, hamburger nav |
| Tablet | 768-1023px | Side-by-side (380px sidebar + map) |
| Desktop | ≥1024px | Side-by-side with wider sidebar |

#### Touch Target Rules

- All interactive elements: min 44x44px
- Buttons: min-h-[44px] (Tailwind)
- Input fields: min-h-[44px]
- List items: min-h-[44px] with padding
- Close buttons: 40x40px minimum

#### Safe Area Handling

- `viewport-fit=cover` in meta tag
- `env(safe-area-inset-*)` via CSS custom properties
- `.safe-top`, `.safe-bottom`, `.safe-x` utility classes
- Applied to: header, bottom sheet, map controls, modals

## Icon System

### Rule: No Emojis

Never use emoji characters in the UI. They render inconsistently across platforms, look unprofessional, and break the dark theme. Use inline SVG icons instead.

### Icon Library

Custom SVG icons in `frontend/src/components/Icons.tsx`. Based on Lucide icon style (24x24 viewBox, 2px stroke, round linecap/linejoin).

| Icon | Component | Use |
|------|-----------|-----|
| MapPin | `<MapPin>` | Location, nearby, city markers |
| Search | `<Search>` | Search inputs, empty states |
| X | `<X>` | Close buttons |
| Globe | `<Globe>` | Online events, online tab |
| Edit | `<Edit>` | Host event, submit forms |
| Map | `<Map>` | Map tab |
| Calendar | `<Calendar>` | Date display in popups |
| Building | `<Building>` | Venue display in popups |
| Users | `<Users>` | Organizer display |
| Sparkles | `<Sparkles>` | Success states, featured |
| Circle | `<Circle>` | Status dots, ongoing |
| Compass | `<Compass>` | Upcoming, exploration |
| Crosshair | `<Crosshair>` | Locate me button |
| Navigation | `<Navigation>` | Directional indicators |
| ArrowRight | `<ArrowRight>` | CTAs, links |
| Star | `<Star>` | Ratings, highlights |
| Zap | `<Zap>` | Quick actions |

### Icon Styling

- Default color: `currentColor` (inherits text color)
- Accent color: `text-neon-blue` (#00d4ff)
- Muted: `text-slate-500` or `text-slate-600`
- Sizes: 10px (inline badges), 14px (buttons/inputs), 16px (nav), 18-20px (cards), 28-48px (empty states)

## Loading Screen

### Marketing-First Approach

The loading screen is a marketing opportunity, not just a spinner. It should:

1. **Show animated map markers** dropping into place (SVG, not emojis)
2. **Rotate marketing taglines** every 2.4 seconds
3. **Show a progress bar** with gradient animation
4. **Display floating background dots** for depth

### Taglines (rotating)

- "No more scrolling through boring event lists"
- "See everything on the map. Pick what excites you"
- "Every college fest. One interactive map"
- "Discover events the way they should be — visually"
- "Your next fest is just a tap away"

### Animations

- `pingRing` — Concentric rings expanding outward (3s loop)
- `dropBounce` — Markers falling into place with bounce (cubic-bezier 0.34, 1.56, 0.64, 1)
- `floatDot` — Background dots floating gently
- `progressSlide` — Gradient bar sliding across

## Anti-Patterns to Avoid

1. **Gradient noise** — Random gradient backgrounds. Use solid dark with subtle surface elevation instead.
2. **Glow spam** — Box-shadows and glows on everything. Reserve for focus states and key CTAs only.
3. **Floating labels** — Labels that move on focus. Use fixed labels or placeholder text.
4. **Skeleton loading** — Gray blocks that shift layout. Use same-size placeholders or spinners.
5. **Oversized text** — Hero text >32px. Keep headings ≤24px, let content breathe.
6. **Rainbow everything** — Multi-colored badges. Use 2-3 accent colors max per view.
7. **Fake depth** — 3D transforms on flat UI. Use elevation (shadow) instead.
8. **Auto-playing animations** — Anything that moves without user action. Animations should respond to interaction.
9. **Emoji icons** — Using Unicode emoji characters (📍🔍🎉) as UI icons. They render inconsistently across platforms, break the dark theme, and look unprofessional. Use inline SVG icons instead.
