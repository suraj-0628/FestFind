import { useEffect, useState } from "react";
import { EventData, fetchEvents, getEventStatus } from "../utils/api";
import { EventCard } from "./EventCard";
import { Globe } from "./Icons";

function Countdown({ date }: { date: string }) {
  const [diff, setDiff] = useState("");

  useEffect(() => {
    const tick = () => {
      const ms = new Date(date).getTime() - Date.now();
      if (ms <= 0) { setDiff("Starting now"); return; }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      if (d > 0) setDiff(`${d}d ${h}h`);
      else if (h > 0) setDiff(`${h}h ${m}m`);
      else setDiff(`${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [date]);

  return <span>{diff}</span>;
}

export function OnlineEvents() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "ongoing" | "upcoming">("all");

  useEffect(() => {
    setLoading(true);
    fetchEvents({ event_type: "online", page_size: 50 })
      .then((data) => setEvents(data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all"
      ? events
      : events.filter((e) => getEventStatus(e) === filter);

  const ongoing = events.filter((e) => getEventStatus(e) === "ongoing");
  const upcoming = events.filter((e) => getEventStatus(e) === "upcoming");

  const hero =
    filter === "all"
      ? ongoing[0] || upcoming[0]
      : filtered[0];

  const rest =
    filter === "all"
      ? events.filter((e) => e !== hero)
      : filtered.slice(1);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10 safe-top">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Online Events</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Virtual workshops, webinars, and competitions you can attend from anywhere
          </p>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3 mb-5 sm:mb-6 overflow-x-auto scrollbar-thin pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {(["all", "ongoing", "upcoming"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 sm:px-4 py-2 text-xs font-semibold transition whitespace-nowrap min-h-[44px] ${
              filter === f
                ? "bg-neon-blue text-black"
                : "glass-light text-slate-400 hover:text-white hover:border-neon-blue/30"
            }`}
          >
            {f === "all" && `All (${events.length})`}
            {f === "ongoing" && `Live Now (${ongoing.length})`}
            {f === "upcoming" && `Upcoming (${upcoming.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm" role="status" aria-live="polite">Loading online events...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 sm:py-20">
          <div className="flex justify-center mb-3"><Globe size={40} className="text-slate-600" /></div>
          <p className="text-slate-400 text-sm">No online events {filter !== "all" ? `(${filter})` : ""} found</p>
        </div>
      ) : (
        <>
          {hero && (
            <div className="relative mb-6 sm:mb-8 overflow-hidden rounded-2xl glass-light glass-glow group">
              {hero.image_url && (
                <div className="absolute inset-0">
                  <img src={hero.image_url} alt="" className="h-full w-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d14] via-[#0d0d14]/80 to-transparent" />
                </div>
              )}
              {!hero.image_url && (
                <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/10 via-transparent to-pink-500/10" />
              )}
              <div className="relative p-5 sm:p-8 flex flex-col justify-end min-h-[220px] sm:min-h-[280px]">
                <div className="flex items-center gap-2 mb-3">
                  {getEventStatus(hero) === "ongoing" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-1 text-[11px] font-bold text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                      Live Now
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/20 px-2.5 py-1 text-[11px] font-bold text-pink-400">
                      Upcoming
                    </span>
                  )}
                  <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-[11px] font-bold text-blue-400">
                    Online
                  </span>
                  {hero.category && (
                    <span className="rounded-full bg-neon-emerald/20 px-2.5 py-1 text-[11px] font-bold text-neon-emerald">
                      {hero.category}
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-white leading-tight mb-2">
                  {hero.title}
                </h3>
                {hero.description && (
                  <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 max-w-2xl mb-3">
                    {hero.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  {hero.start_date && (
                    <span>{new Date(hero.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  )}
                  {getEventStatus(hero) === "upcoming" && hero.start_date && (
                    <span className="text-neon-blue font-semibold">
                      Starts in <Countdown date={hero.start_date} />
                    </span>
                  )}
                </div>
                {hero.event_url && (
                  <a
                    href={hero.event_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-neon-blue px-5 py-2.5 text-sm font-bold text-black transition hover:bg-neon-blue/90 hover:shadow-lg hover:shadow-neon-blue/20 w-fit"
                  >
                    Register Now
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {rest.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
