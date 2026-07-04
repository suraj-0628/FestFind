import { useMemo } from "react";
import { EventData, getEventStatus } from "../utils/api";
import { Search, X, Circle, Compass } from "./Icons";

interface Props {
  events: EventData[];
  loading: boolean;
  search: string;
  onSearchChange: (s: string) => void;
  onSelectEvent: (e: EventData) => void;
  selectedId: string | null;
}

export function MobileEventList({ events, loading, search, onSearchChange, onSelectEvent, selectedId }: Props) {
  const stats = useMemo(() => {
    const ongoing = events.filter((e) => getEventStatus(e) === "ongoing");
    const upcoming = events.filter((e) => getEventStatus(e) === "upcoming");
    return { total: events.length, ongoing, upcoming };
  }, [events]);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Search bar */}
      <div className="px-3 pt-2.5 pb-2 shrink-0 border-b border-white/[0.06]">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"><Search size={13} /></span>
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search events"
            className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] pl-8 pr-8 py-2 text-[13px] text-white placeholder-slate-500 outline-none focus:border-neon-blue transition"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white min-w-[28px] min-h-[28px] flex items-center justify-center"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Stats pills */}
      <div className="flex gap-1.5 px-3 py-2 shrink-0">
        <span className="text-[11px] font-semibold text-white bg-white/[0.08] rounded-full px-2.5 py-1">
          {stats.total} events
        </span>
        {stats.ongoing.length > 0 && (
          <span className="text-[11px] font-semibold text-green-400 bg-green-500/15 rounded-full px-2.5 py-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {stats.ongoing.length} live
          </span>
        )}
        {stats.upcoming.length > 0 && (
          <span className="text-[11px] font-semibold text-pink-400 bg-pink-400/15 rounded-full px-2.5 py-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
            {stats.upcoming.length} soon
          </span>
        )}
      </div>

      {/* Scrollable event list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800" style={{ WebkitOverflowScrolling: "touch" }}>
        {loading && (
          <div className="text-center py-8 text-slate-500 text-xs" role="status" aria-live="polite">
            <p className="animate-pulse">Loading events...</p>
          </div>
        )}

        {!loading && events.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs">
            <p>No events found</p>
            {search && <p className="mt-1 text-slate-600">Try a different search term</p>}
          </div>
        )}

        {/* Ongoing events */}
        {stats.ongoing.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Circle size={7} className="text-green-400" />
              <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">Happening Now</span>
            </div>
            {stats.ongoing.map((e) => (
              <MobileEventRow key={e.id} event={e} selected={e.id === selectedId} onClick={() => onSelectEvent(e)} />
            ))}
          </div>
        )}

        {/* Upcoming events */}
        {stats.upcoming.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 mt-2">
              <Compass size={9} className="text-pink-400" />
              <span className="text-[10px] font-semibold text-pink-400 uppercase tracking-wider">Coming Up</span>
            </div>
            {stats.upcoming.map((e) => (
              <MobileEventRow key={e.id} event={e} selected={e.id === selectedId} onClick={() => onSelectEvent(e)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MobileEventRow({ event, selected, onClick }: { event: EventData; selected: boolean; onClick: () => void }) {
  const status = getEventStatus(event);
  const dateStr = event.start_date
    ? new Date(event.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : "TBD";

  const statusColor: Record<string, string> = {
    ongoing: "bg-green-500",
    upcoming: "bg-pink-400",
    past: "bg-slate-500",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg px-2.5 py-2 transition border ${
        selected
          ? "bg-slate-800/80 border-neon-blue/30"
          : "bg-transparent border-transparent active:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${statusColor[status]}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-white truncate leading-tight">{event.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-slate-400">{dateStr}</span>
            {event.city && (
              <>
                <span className="text-slate-600 text-[10px]">·</span>
                <span className="text-[10px] text-slate-500 truncate">{event.city}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
