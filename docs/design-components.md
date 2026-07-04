# Design Components — Reusable Patterns

Production-quality component patterns. Each component has a clear purpose, proper states, and accessible markup.

---

## Button

Primary interaction element. Three variants, consistent sizing.

```tsx
// Variants: solid (primary), outline (secondary), ghost (tertiary)
// Sizes: sm (32px), md (40px), lg (48px)

<button className="
  inline-flex items-center justify-center gap-2
  rounded-lg font-medium
  transition-all duration-150
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]

  /* Solid — primary actions */
  bg-[var(--accent-blue)] text-[var(--bg-base)]
  hover:brightness-110 active:scale-[0.98]

  /* Sizes */
  h-8 px-3 text-xs      /* sm */
  h-10 px-4 text-sm     /* md */
  h-12 px-6 text-base   /* lg */
">
  Label
</button>

// Outline — secondary actions
<button className="
  border border-[var(--border-default)]
  bg-transparent text-[var(--text-secondary)]
  hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]
  active:scale-[0.98]
">

// Ghost — tertiary, toolbar actions
<button className="
  bg-transparent text-[var(--text-secondary)]
  hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]
">
```

**Rules:**
- One primary button per section
- Destructive actions use `text-red-400 border-red-500/30 hover:bg-red-500/10`
- Loading state: replace text with spinner, keep same width
- Disabled: `opacity-50 pointer-events-none`
- Icon-only buttons: same height as text buttons, minimum 32x32

---

## Card

Content container. Three elevation levels.

```tsx
// Base card — events, listings
<div className="
  rounded-xl border border-[var(--border-subtle)]
  bg-[var(--bg-elevated)]
  p-4
  transition-all duration-150
  hover:border-[var(--border-default)]
  hover:shadow-md
  cursor-pointer
">

// Elevated card — modals, dialogs
<div className="
  rounded-2xl border border-[var(--border-default)]
  bg-[var(--bg-elevated)]
  shadow-lg
  p-6
">

// Inset card — nested content, stat blocks
<div className="
  rounded-lg
  bg-[var(--bg-surface)]
  p-3
">
```

**Rules:**
- Cards don't have hardcoded widths — they fill their container
- Internal spacing uses 16px (default) or 12px (compact)
- Interactive cards get hover border + shadow lift
- Non-interactive cards: no cursor, no hover effect

---

## Badge / Tag

Status indicators and category labels.

```tsx
// Status badge — ongoing, upcoming, past
<span className="
  inline-flex items-center gap-1.5
  rounded-full px-2.5 py-0.5
  text-[10px] font-semibold uppercase tracking-wide
  bg-green-500/15 text-green-400            /* ongoing */
  bg-pink-500/15 text-pink-400              /* upcoming */
  bg-slate-500/15 text-slate-400            /* past */
">

// Category tag — Technical, Cultural, etc.
<span className="
  inline-flex items-center
  rounded-full px-2 py-0.5
  text-[10px] font-medium
  bg-[var(--accent-purple)]/15 text-[var(--accent-purple)]
">
```

**Rules:**
- Maximum 2 badges per card row
- Badges are never clickable (use buttons for actions)
- Uppercase for status, sentence-case for categories

---

## Input / Search

Form controls with consistent states.

```tsx
// Text input
<input className="
  w-full rounded-lg
  border border-[var(--border-default)]
  bg-[var(--bg-surface)]
  px-3 py-2.5
  text-sm text-[var(--text-primary)]
  placeholder:text-[var(--text-tertiary)]
  outline-none
  transition-colors duration-150
  focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/30
  disabled:opacity-50 disabled:cursor-not-allowed
" />

// Search input with icon
<div className="relative">
  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
  <input className="
    w-full rounded-lg
    border border-[var(--border-default)]
    bg-[var(--bg-surface)]
    pl-9 pr-3 py-2.5
    text-sm text-[var(--text-primary)]
    placeholder:text-[var(--text-tertiary)]
    focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/30
  " />
</div>
```

**Rules:**
- Height: 40px (md) — matches button height
- Focus ring uses accent color with 30% opacity
- Error state: `border-red-500` with helper text below
- Never use floating labels — they break accessibility

---

## Stat Block

Compact data display.

```tsx
// Used in sidebar stats row
<div className="rounded-lg bg-[var(--bg-surface)] px-3 py-2.5 text-center">
  <div className="text-xl font-bold text-[var(--text-primary)]">
    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
    8
  </div>
  <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Total</div>
</div>
```

---

## Section Header

Consistent section dividers.

```tsx
<div className="mb-3">
  <h3 className="
    text-[11px] font-semibold uppercase tracking-wider
    text-[var(--text-tertiary)]
    flex items-center gap-1.5
  ">
    <span className="text-xs">🟢</span>
    Happening Now
  </h3>
</div>
```

**Rules:**
- Overline size (11px) always uppercase
- Optional leading icon for context
- 12px margin below header

---

## List Item / Row

Interactive list elements.

```tsx
// Event row — clickable, selected state
<button className="
  w-full text-left
  rounded-lg px-3 py-2.5
  transition-all duration-150
  border
  hover:bg-[var(--bg-hover)]
  data-[selected]:bg-[var(--bg-active)] data-[selected]:border-[var(--accent-blue)]/40
  border-transparent
">
  <div className="flex items-start gap-2.5">
    <span className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-green-500" />
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-[var(--text-primary)] truncate">Event Name</p>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[11px] text-[var(--text-secondary)]">3 Jul</span>
        <span className="text-[var(--text-tertiary)]">·</span>
        <span className="text-[11px] text-[var(--text-tertiary)]">Bangalore</span>
      </div>
    </div>
  </div>
</button>
```

**Rules:**
- Truncate long text with `truncate` (single line) or `line-clamp-2` (max 2 lines)
- Status dot precedes content
- Selected state uses ring, not background color change alone
- Minimum touch target: 44px height

---

## Modal / Dialog

Overlay with glassmorphism backdrop.

```tsx
// Backdrop
<div className="fixed inset-0 z-50 flex items-center justify-center
  bg-black/60 backdrop-blur-sm
  animate-in fade-in duration-200
">

// Dialog
<div className="
  w-full max-w-lg
  rounded-2xl border border-[var(--border-default)]
  bg-[var(--bg-elevated)]
  shadow-2xl
  animate-in zoom-in-95 fade-in duration-200
">

// Header
<div className="flex items-center justify-between p-6 pb-0">
  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Title</h2>
  <button className="w-8 h-8 rounded-full flex items-center justify-center
    text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]
    transition-colors duration-150">
    ✕
  </button>
</div>

// Body
<div className="p-6">{children}</div>
```

**Rules:**
- Max width 568px (max-w-lg)
- Close button top-right, 32x32px
- Escape key closes, clicking backdrop closes
- Focus trap: first interactive element auto-focused
- Scroll body if content overflows, not the backdrop

---

## Tooltip / Popover

Contextual information on hover/focus.

```tsx
// Tooltip — simple text
<div className="
  rounded-lg px-2.5 py-1.5
  bg-[var(--bg-elevated)] border border-[var(--border-default)]
  text-xs text-[var(--text-primary)]
  shadow-md
  animate-in fade-in zoom-in-95 duration-150
">
  Tooltip text
</div>

// Popover — rich content (map popups)
<div className="
  max-w-[220px] rounded-xl
  bg-[var(--bg-elevated)] border border-[var(--border-default)]
  shadow-xl
  p-3
">
  {content}
</div>
```

---

## Tab Bar

Navigation with consistent states.

```tsx
<nav className="flex items-center gap-1">
  {tabs.map(tab => (
    <button
      key={tab.id}
      className={`
        rounded-lg px-4 py-1.5 text-xs font-semibold
        transition-all duration-150
        ${active
          ? 'bg-[var(--accent-blue)] text-[var(--bg-base)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
        }
      `}
    >
      {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
      {tab.label}
    </button>
  ))}
</nav>
```

---

## Skeleton / Loading

Content-aware loading states.

```tsx
// Text skeleton
<div className="h-4 w-3/4 rounded bg-[var(--bg-hover)] animate-pulse" />

// Card skeleton
<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
  <div className="h-32 rounded-lg bg-[var(--bg-hover)] animate-pulse mb-3" />
  <div className="h-4 w-1/2 rounded bg-[var(--bg-hover)] animate-pulse mb-2" />
  <div className="h-3 w-3/4 rounded bg-[var(--bg-hover)] animate-pulse" />
</div>
```

**Rules:**
- Pulse animation, not shimmer (simpler, more accessible)
- Skeleton shape matches content shape
- Never use skeleton for the entire page — show structure immediately

---

## Avatar / Icon

Consistent iconography.

```tsx
// State icon (map markers)
<div className="w-10 h-10 rounded-full
  flex items-center justify-center
  bg-[var(--accent-purple)]/20
  text-sm font-bold text-[var(--accent-purple)]
">
  8
</div>

// Status dot
<span className="w-2.5 h-2.5 rounded-full bg-green-500" />
```

**Rules:**
- Icons are 16px (inline), 20px (button), 24px (standalone)
- Use emoji sparingly — only for status indicators, not decorative
- Icon buttons always have visible label for accessibility

---

## Spacing Cheat Sheet

```
Card internal padding:     16px (p-4)
Card gap between items:    8px  (space-y-2)
Section margin:            24px (space-y-6 / mb-6)
Sidebar padding:           16px horizontal (px-4)
Header padding:            16px vertical (py-4)
Modal padding:             24px (p-6)
Button horizontal padding: 16px (px-4) for md size
Input padding:             12px horizontal (px-3)
List item padding:         12px horizontal (px-3), 10px vertical (py-2.5)
```
