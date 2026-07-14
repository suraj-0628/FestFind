import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { fetchEvent, getEventStatus, type EventData } from "../utils/api";
import { ArrowLeft, Calendar, MapPin, Users, ArrowRight } from "../components/Icons";

const SITE = "https://festfind.live";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchEvent(id)
      .then(setEvent)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-slate-400">Event not found.</p>
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-neon-blue hover:underline">
          <ArrowLeft /> Back to map
        </Link>
      </div>
    );
  }

  const status = getEventStatus(event);
  const statusLabel = status === "ongoing" ? "Ongoing" : status === "upcoming" ? "Upcoming" : "Past";
  const startDate = event.start_date ? new Date(event.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null;
  const endDate = event.end_date ? new Date(event.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null;
  const dateRange = startDate && endDate && startDate !== endDate ? `${startDate} — ${endDate}` : startDate;
  const isOnline = event.event_type === "online";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || undefined,
    startDate: event.start_date || undefined,
    endDate: event.end_date || undefined,
    location: isOnline ? undefined : {
      "@type": "Place",
      name: event.venue || event.city || "",
      address: {
        "@type": "PostalAddress",
        addressLocality: event.city || "",
        addressRegion: event.state || "",
        addressCountry: "IN",
      },
    },
    organizer: event.organizer ? { "@type": "Organization", name: event.organizer } : undefined,
    eventAttendanceMode: isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    image: event.image_url || event.poster_url || undefined,
    url: `${SITE}/event/${event.id}`,
  };

  return (
    <>
      <Helmet>
        <title>{event.title} | FestFind</title>
        <meta name="description" content={`${event.description?.slice(0, 150) || event.title} — ${dateRange || "Date TBD"}${event.city ? ` in ${event.city}` : ""}`} />
        <link rel="canonical" href={`${SITE}/event/${event.id}`} />
        <meta property="og:type" content="event" />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={event.description?.slice(0, 200) || event.title} />
        <meta property="og:url" content={`${SITE}/event/${event.id}`} />
        <meta property="og:image" content={event.image_url || event.poster_url || `${SITE}/og-default.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={event.description?.slice(0, 200) || event.title} />
        <meta name="twitter:image" content={event.image_url || event.poster_url || `${SITE}/og-default.png`} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-neon-blue transition-colors">
          <ArrowLeft /> Back to map
        </Link>

        {event.image_url && (
          <img src={event.image_url} alt={event.title} className="mb-6 h-64 w-full rounded-xl object-cover" loading="lazy" />
        )}

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${status === "ongoing" ? "bg-green-500/20 text-green-400" : status === "upcoming" ? "bg-pink-500/20 text-pink-400" : "bg-slate-500/20 text-slate-400"}`}>
            {statusLabel}
          </span>
          {isOnline && (
            <span className="inline-block rounded-full bg-blue-500/20 px-2.5 py-1 text-xs font-semibold text-blue-400">Online</span>
          )}
          {event.category && (
            <span className="inline-block rounded-full bg-neon-emerald/20 px-2.5 py-1 text-xs font-semibold text-neon-emerald">{event.category}</span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">{event.title}</h1>

        <div className="space-y-3 mb-6 text-sm text-slate-300">
          {dateRange && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-neon-blue shrink-0" />
              <span>{dateRange}</span>
            </div>
          )}
          {(event.city || event.venue) && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-neon-blue shrink-0" />
              <span>{[event.venue, event.city, event.state].filter(Boolean).join(", ")}</span>
            </div>
          )}
          {event.organizer && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-neon-blue shrink-0" />
              <span>{event.organizer}</span>
            </div>
          )}
          {event.tags && (
            <div className="flex items-center gap-2">
              <span className="text-neon-blue text-sm font-medium">Tags:</span>
              <span className="text-slate-400">{event.tags}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="glass-light rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-white mb-2">About this event</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{event.description}</p>
          </div>
        )}

        {event.event_url && (
          <a
            href={/^(https?:\/\/|mailto:)/.test(event.event_url) ? event.event_url : "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-neon-blue px-6 py-3 text-sm font-semibold text-black transition hover:bg-neon-blue/90"
          >
            Register <ArrowRight className="h-4 w-4" />
          </a>
        )}
      </div>
    </>
  );
}
