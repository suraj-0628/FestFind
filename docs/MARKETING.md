# FestFind — Marketing & SEO Strategy

## Brand

- **Name:** FestFind
- **Tagline:** Discover Events Across India
- **Color:** Cyan blue (#00d4ff) on dark (#0a0a0f)
- **Font:** Space Grotesk
- **Logo:** Location pin with glowing dot — mirrors the map markers users interact with

---

## Target Audience

1. **College students** — looking for fests, hackathons, workshops, cultural events
2. **Developers** — hackathons, tech meetups, conferences
3. **Organizers** — colleges, companies hosting events, want free listings
4. **Faculty** — FDPs, seminars, conferences

---

## Marketing Channels

### 1. Organic Search (SEO)
**Priority: High — free, compounds over time**

### 2. College WhatsApp/Telegram Groups
- Share event links directly where students already are
- Create "FestFind Updates" broadcast list

### 3. Instagram/X (Twitter)
- Post upcoming events daily
- Reels: "Events happening this weekend in [city]"
- Thread: "Top 10 hackathons this month"

### 4. Reddit
- r/IndianStudents, r/developersIndia, r/college
- Share as "I built a map to find college events"

### 5. Product Hunt / Hacker News
- Launch post: "FestFind — a map-first way to discover college events in India"

### 6. College Tech Fest Partnerships
- Partner with major fests (Techkriti, E-Summit, etc.)
- Offer free "Featured Event" listings

---

## SEO Strategy

### Phase 1: Technical SEO (Now)

**Meta Tags (per page):**
```html
<title>FestFind — Discover Hackathons, Workshops & College Events Across India</title>
<meta name="description" content="Find ongoing and upcoming hackathons, workshops, cultural fests, and technical events near you. Map-based discovery for college events across India." />
<meta name="keywords" content="college events, hackathons India, tech fests, workshops, seminars, upcoming events, campus events" />

<!-- Open Graph -->
<meta property="og:title" content="FestFind — Discover Events Across India" />
<meta property="og:description" content="Map-based discovery for hackathons, workshops, and college events across India." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://festfind.in" />
<meta property="og:image" content="https://festfind.in/og-image.png" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="FestFind — Discover Events Across India" />
<meta name="twitter:description" content="Map-based discovery for hackathons, workshops, and college events across India." />
```

**Structured Data (JSON-LD):**
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "FestFind",
  "url": "https://festfind.in",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://festfind.in/?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

**Event Schema (for each event page):**
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Event Title",
  "startDate": "2026-08-15",
  "endDate": "2026-08-16",
  "location": {
    "@type": "Place",
    "name": "Venue Name",
    "address": { "@type": "PostalAddress", "addressLocality": "Chennai", "addressRegion": "Tamil Nadu" }
  },
  "organizer": { "@type": "Organization", "name": "Organizer Name" }
}
```

**Sitemap:** Generate `/sitemap.xml` from event data

**Robots.txt:** Allow all, point to sitemap

### Phase 2: Content SEO (Month 1-2)

Create server-rendered landing pages (or pre-rendered HTML):

| Page | Target Keyword | Example Title |
|------|---------------|---------------|
| `/events/hackathons-india` | hackathons in india | "Upcoming Hackathons in India 2026 — FestFind" |
| `/events/chennai` | events in chennai | "Events in Chennai This Week — FestFind" |
| `/events/tamil-nadu` | tamil nadu college events | "College Events in Tamil Nadu — FestFind" |
| `/events/workshops` | technical workshops india | "Technical Workshops Near You — FestFind" |
| `/events/cultural-fests` | college cultural fest | "College Cultural Fests 2026 — FestFind" |

Each page: 300-500 word intro + event listing + internal links

### Phase 3: Off-Page SEO (Month 2-3)

- **Backlinks:** Get listed on college websites, event aggregators
- **Google Search Console:** Submit sitemap, monitor indexing
- **Bing Webmaster Tools:** Submit sitemap
- **Local SEO:** "events near me" targeting

### Phase 4: Growth (Month 3+)

- **Event-specific pages:** `/event/{slug}` with full details, schema markup
- **City landing pages:** Auto-generated from event data
- **Blog:** "Top 10 Hackathons in [Month]", "Best College Fests in [State]"
- **Email digest:** Weekly "Events near you" email

---

## Metrics to Track

| Metric | Tool | Target |
|--------|------|--------|
| Organic traffic | Google Analytics | 10K/month by month 6 |
| Indexed pages | Search Console | 500+ pages |
| Keyword rankings | Ahrefs/SEMrush | Top 10 for "hackathons india" |
| Domain authority | Ahrefs | DA 20+ by year 1 |
| Event submissions | Internal | 500+ events/month |

---

## Quick Wins (Do Now)

1. Add meta tags to `index.html`
2. Create `robots.txt`
3. Create `sitemap.xml` generator
4. Add JSON-LD structured data
5. Set up Google Search Console
6. Submit to Bing Webmaster Tools
