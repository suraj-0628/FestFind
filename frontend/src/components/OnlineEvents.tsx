import { useEffect, useState } from "react";
import { EventData, fetchEvents, getEventStatus } from "../utils/api";
import { EventCard } from "./EventCard";
import { Globe } from "./Icons";

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

  const ongoing = events.filter((e) => getEventStatus(e) === "ongoing").length;
  const upcoming = events.filter((e) => getEventStatus(e) === "upcoming").length;

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
            {f === "ongoing" && `Live Now (${ongoing})`}
            {f === "upcoming" && `Upcoming (${upcoming})`}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
