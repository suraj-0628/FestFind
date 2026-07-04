# Design Interactions — Animation & Micro-Interactions

Motion principles for College Fest Hub. Every animation has a purpose: communicate state, guide attention, or confirm action.

---

## Core Principles

1. **Purpose over decoration** — Animations communicate state changes, not visual flair
2. **Fast by default** — 150-200ms for most interactions, 300ms max for layout shifts
3. **Responsive to user** — Animations trigger on user action, never auto-play
4. **Reduced motion** — Respect `prefers-reduced-motion`, disable non-essential animations

---

## Timing Functions

```
ease-standard:    cubic-bezier(0.4, 0, 0.2, 1)    — default for most transitions
ease-decelerate:  cubic-bezier(0, 0, 0.2, 1)       — elements entering view
ease-accelerate:  cubic-bezier(0.4, 0, 1, 1)       — elements leaving view
ease-bounce:      cubic-bezier(0.34, 1.56, 0.64, 1) — playful micro-interactions
ease-spring:      cubic-bezier(0.175, 0.885, 0.32, 1.275) — map fly-to
```

---

## Interaction Catalog

### Hover States (150ms)

```css
/* Button hover */
transition: background-color 150ms ease-standard, color 150ms ease-standard;

/* Card hover — subtle border + shadow lift */
transition: border-color 150ms ease-standard, box-shadow 150ms ease-standard;
:hover {
  border-color: rgba(255, 255, 255, 0.10);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Link hover — underline or color change */
transition: color 150ms ease-standard;
```

### Press / Active States (100ms)

```css
/* Button press — subtle scale */
:active {
  transform: scale(0.98);
  transition: transform 100ms ease-standard;
}

/* Map marker press */
:active {
  transform: scale(0.9);
  transition: transform 100ms ease-bounce;
}
```

### Focus States (150ms)

```css
/* Focus ring — always visible for keyboard, hidden for mouse */
:focus-visible {
  outline: 2px solid var(--accent-blue);
  outline-offset: 2px;
  transition: outline-color 150ms ease-standard;
}

/* Focus ring on dark backgrounds uses glow */
:focus-visible {
  box-shadow: 0 0 0 2px var(--bg-base), 0 0 0 4px var(--accent-blue);
}
```

### Enter / Appear (200-300ms)

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fadeIn 200ms ease-decelerate;

/* Slide up + fade (cards, list items) */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
animation: slideUp 250ms ease-decelerate;

/* Scale in (modals, tooltips) */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
animation: scaleIn 200ms ease-decelerate;

/* Staggered list items — 50ms delay per item */
.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 50ms; }
.list-item:nth-child(3) { animation-delay: 100ms; }
```

### Exit / Disappear (150-200ms)

```css
/* Faster than enter — user initiated the dismiss */
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
animation: fadeOut 150ms ease-accelerate;

/* Scale out (modals closing) */
@keyframes scaleOut {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.95); }
}
animation: scaleOut 150ms ease-accelerate;
```

### Map Fly-To (Premium Experience)

```css
/* 3-stage zoom: India → State → City */
/* Each stage: 1.0-1.2s with ease-spring */
/* Total duration: ~3.5s */

/* Stage timing */
flyTo(state):  duration: 1.2s;  easing: cubic-bezier(0.175, 0.885, 0.32, 1.275);
flyTo(city):   duration: 1.0s;  easing: cubic-bezier(0.175, 0.885, 0.32, 1.275);
flyTo(zoom):   duration: 1.2s;  easing: cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* Marker fade-in after fly completes */
@keyframes markerPop {
  from { opacity: 0; transform: scale(0.3); }
  to { opacity: 1; transform: scale(1); }
}
animation: markerPop 400ms ease-bounce;
```

### Loading Animations

```css
/* Pulse — breathing effect for live indicators */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}
animation: pulse 2s ease-in-out infinite;

/* Bounce dots — loading indicators */
@keyframes dotBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
  40% { transform: scale(1.2); opacity: 1; }
}
animation: dotBounce 1.4s ease-in-out infinite;

/* Radar — map exploration indicator */
@keyframes radarExpand {
  0% { transform: scale(0.3); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}
animation: radarExpand 3s ease-out infinite;
```

---

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

All animations must degrade gracefully. The reduced motion preference means:
- Replace `flyTo` with instant `setView`
- Replace fade/slide with instant appear
- Remove infinite animations (pulse, radar)
- Keep functional transitions (focus ring)

---

## Transition Classes (Tailwind)

```js
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
      },
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'decelerate': 'cubic-bezier(0, 0, 0.2, 1)',
        'accelerate': 'cubic-bezier(0.4, 0, 1, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  },
};
```

Usage:
```tsx
<button className="transition-all duration-150 ease-standard hover:bg-[var(--bg-hover)]" />
<div className="transition-transform duration-200 ease-bounce active:scale-[0.98]" />
```

---

## Performance Rules

1. **Only animate `transform` and `opacity`** — GPU-accelerated, no layout recalc
2. **Never animate `width`, `height`, `top`, `left`** — triggers layout, causes jank
3. **Use `will-change` sparingly** — only for known animations, remove after
4. **Batch DOM reads/writes** — don't read layout between animations
5. **Max 3 concurrent animations** — more causes frame drops on mobile
6. **Test on throttled CPU** — Chrome DevTools → Performance → 4x slowdown
