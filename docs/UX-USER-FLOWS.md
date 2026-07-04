# FestFind — User Flows & UX Test Plan

## Flow 1: First Visit (Mobile)

### Steps
1. User opens FestFind on phone browser
2. Page loads → dark map of India with blue state dots (only states with events)
3. Browser asks for location permission
4. **If allowed:** Map flies to user's city, green "Live" and pink "Soon" counts appear at top-left
5. **If denied:** Map stays at India level, user can browse manually
6. FestFind logo + icon-only tab bar visible in header
7. Mobile event list shows below the map (draggable divider)

### Expected
- Logo: blue pin icon + "FestFind" in Space Grotesk
- Header: logo left, icon tabs right (Map/Online/Host)
- Map: CartoDB dark tiles, blue state dots with event counts
- Live/Soon legend: green dot + "Live", pink dot + "Soon" at top-left
- LocateMe button: bottom-right
- Event list: search bar, stats pills, scrollable events grouped by status

---

## Flow 2: First Visit (Desktop)

### Steps
1. User opens FestFind on desktop browser
2. Sidebar (380px) on left with search, stats, event sections
3. Map on right with state dots
4. Desktop legend at bottom-left: Ongoing/Upcoming/Past dots + nearby events

### Expected
- Sidebar shows: Total/Ongoing/Upcoming stat cards
- "Nearby You" section (if location available, events within 150km)
- "Happening Now" section (ongoing events)
- "Coming Up" section (upcoming events, 5 shown + "+N more")
- "Explore by State" section (top 10 states)
- LocateMe button bottom-right on map

---

## Flow 3: Drill Into a State

### Steps
1. User taps/clicks a blue state dot on India map
2. Map zooms into state with smooth animation
3. Venue markers appear: single events = green/pink dots, clusters = blue circle with count
4. Venue labels shown above markers
5. StateDropdown updates to show state name

### Expected
- State dots with counts only show for states with events
- Single-event venues: green (ongoing) or pink (upcoming) glowing dots
- Multi-event venues: blue cluster marker with count
- Cluster click shows scrollable popup with all events at that venue
- Each event in popup has title, date, category, "Register" link
- "Back to India" available in StateDropdown

---

## Flow 4: Select Event from Mobile List

### Steps
1. User scrolls event list in bottom panel
2. Taps an event row
3. Map flies to event coordinates at zoom 12
4. A prominent glowing marker (24px) drops at the event location
5. Event popup opens with full details
6. Selected row highlighted in the list

### Expected
- Works even if event is in a different state than currently viewed
- Marker is larger than normal (24px vs 18px)
- Popup shows: title, status, date, venue, city+state, organizer, categories, "Register Now" link
- Deselecting (tap again or tap elsewhere) removes the marker

---

## Flow 5: Search Events

### Steps
1. User types in search bar (mobile list or desktop sidebar)
2. Events filter in real-time (debounced)
3. Map updates to show only matching events
4. List updates to show only matching events

### Expected
- Clear button (X) appears when text is entered
- Clearing search shows all events again
- Empty results: "No events found" + "Try a different search term"
- Search filters by event title (server-side)

---

## Flow 6: Locate Me

### Steps
1. User taps "Locate Me" button (bottom-right)
2. If permission not yet asked: browser prompts
3. If granted: map flies to precise location, blue user dot appears
4. If denied: button still works, no error shown
5. User dot persists across drill levels

### Expected
- Button always visible (z-1000)
- High accuracy mode enabled
- User dot: blue with white border + pulse animation
- Tooltip: "You are here"

---

## Flow 7: Online Events

### Steps
1. User taps "Online" tab (or Globe icon on mobile)
2. Online events page loads with grid of event cards
3. Filter tabs: All / Live Now / Upcoming
4. User can click filter to narrow results

### Expected
- Grid: 1 col mobile, 2 col tablet, 3 col desktop
- Each card: image (if available), status badge, title, date, organizer, categories
- Filter counts shown in parentheses
- Loading state: "Loading online events..."
- Empty state: Globe icon + "No online events found"

---

## Flow 8: Host Event

### Steps
1. User taps "Host" tab (or Edit icon on mobile)
2. Form appears with fields
3. User fills title (required), other fields optional
4. Selects event type (Physical/Online)
5. Physical shows: city, state, venue fields
6. Clicks "Submit for Review"
7. Success message appears

### Expected
- Title field is required (submit disabled without it)
- Submit button shows "Submitting..." during request
- Success: "Event Submitted! Your event has been submitted and will go live after review."
- "Back to Map" button returns to map tab
- Error: "Something went wrong. Please check your connection and try again."
- Cancel button returns to map tab without submitting

---

## Flow 9: State Dropdown Navigation

### Steps
1. User taps state name in dropdown (or "India" if no state selected)
2. Dropdown opens with list of states
3. Each state shows: abbreviation badge, name, ongoing count (green), upcoming count (pink)
4. User taps a state → map flies to it
5. "Back to India" option available when in a state

### Expected
- Dropdown scrolls if many states
- States sorted by event count (most events first)
- Active state highlighted
- Click outside closes dropdown
- Zero-event states show "—" dash

---

## Flow 10: Map Drag & Search This Area

### Steps
1. User drags/pans the map
2. "Search this area" button appears at top-center
3. User clicks it
4. Map reloads events for the new viewport area

### Expected
- Button slides in with animation
- After clicking, button disappears
- Events in viewport update

---

## Flow 11: Mobile Split Resize

### Steps
1. User drags the divider bar between map and list
2. Dragging down: map grows, list shrinks
3. Dragging up: list grows, map shrinks
4. Range: 25% to 80%

### Expected
- Grab cursor on desktop, grab on mobile
- Smooth resize during drag
- Divider has visual handle (10px wide bar)
- Minimum heights respected

---

## Flow 12: Event Status Lifecycle

### Status Logic
- **Ongoing**: start_date <= now AND end_date >= now (same-day events: end extended to 23:59:59)
- **Upcoming**: start_date > now
- **Past**: end_date < now

### Visual Indicators
- **Ongoing**: Green dot, "Live" pill, pulse animation
- **Upcoming**: Pink dot, "Soon" pill, glow animation
- **Past**: Gray dot, no animation
