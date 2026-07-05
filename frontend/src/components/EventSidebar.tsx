import { useMemo, useState } from "react";
import { EventData, getEventStatus } from "../utils/api";
import { indianStates } from "../data/india-regions";
import { Search, X, MapPin, Circle, Compass, Compass as CompassIcon } from "./Icons";

interface Props {
  events: EventData[];
  loading: boolean;
  search: string;
  onSearchChange: (s: string) => void;
  onSelectEvent: (e: EventData) => void;
  selectedId: string | null;
  nearbyEvents?: EventData[];
}

export function EventSidebar({ events, loading, search, onSearchChange, onSelectEvent, selectedId, nearbyEvents }: Props) {
  const [upcomingExpanded, setUpcomingExpanded] = useState(false);
  const stats = useMemo(() => {
    const ongoing = events.filter((e) => getEventStatus(e) === "ongoing");
    const upcoming = events
      .filter((e) => getEventStatus(e) === "upcoming")
      .sort((a, b) => {
        const da = a.start_date ? new Date(a.start_date).getTime() : Infinity;
        const db = b.start_date ? new Date(b.start_date).getTime() : Infinity;
        return da - db;
      });
    const physical = events.filter((e) => e.event_type === "physical");
    return { total: events.length, ongoing, upcoming, physical };
  }, [events]);

  const byState = useMemo(() => {
    const map = new Map<string, EventData[]>();
    for (const e of events) {
      // Group Indian events by state, international events by city
      const isIntl = !e.state || e.state === "NA";
      const key = isIntl ? (e.city || "International") : e.state;
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [events]);

  const topStates = byState.slice(0, 10);

  const stateCoordMap = useMemo(() => {
    const m = new Map<string, { lat: number; lng: number }>();
    for (const s of indianStates) m.set(s.name, { lat: s.lat, lng: s.lng });
    return m;
  }, []);

  return (
    <div className="h-full flex flex-col glass-subtle border-r border-white/[0.06]">
      {/* Search */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3 shrink-0 safe-top">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"><Search size={14} /></span>
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search events"
            className="w-full rounded-xl glass-light px-9 pr-8 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-neon-blue transition min-h-[44px]"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 px-3 sm:px-4 pb-3 sm:pb-4 shrink-0">
        <StatCard label="Total" value={stats.total} color="text-white" />
        <StatCard label="Ongoing" value={stats.ongoing.length} color="text-green-400" dot="bg-green-500" />
        <StatCard label="Upcoming" value={stats.upcoming.length} color="text-pink-400" dot="bg-pink-400" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-4 space-y-4 sm:space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Nearby You */}
        {nearbyEvents && nearbyEvents.length > 0 && (
          <Section title="Nearby You" icon="pin" iconColor="text-green-400">
            {[...nearbyEvents]
              .sort((a, b) => {
                const da = a.start_date ? new Date(a.start_date).getTime() : Infinity;
                const db = b.start_date ? new Date(b.start_date).getTime() : Infinity;
                return da - db;
              })
              .map((e) => (
              <EventRow key={e.id} event={e} selected={e.id === selectedId} onClick={() => onSelectEvent(e)} />
            ))}
          </Section>
        )}

        {/* Happening Now */}
        {stats.ongoing.length > 0 && (
          <Section title="Happening Now" icon="circle" iconColor="text-green-400">
            {stats.ongoing.map((e) => (
              <EventRow key={e.id} event={e} selected={e.id === selectedId} onClick={() => onSelectEvent(e)} />
            ))}
          </Section>
        )}

        {/* Upcoming */}
        {stats.upcoming.length > 0 && (
          <Section title="Coming Up" icon="compass" iconColor="text-pink-400">
            {stats.upcoming.slice(0, upcomingExpanded ? stats.upcoming.length : 5).map((e) => (
              <UpcomingRow key={e.id} event={e} selected={e.id === selectedId} onClick={() => onSelectEvent(e)} />
            ))}
            {stats.upcoming.length > 5 && !upcomingExpanded && (
              <button
                onClick={() => setUpcomingExpanded(true)}
                className="text-[11px] text-neon-blue hover:text-neon-blue/80 pl-3 font-medium transition"
              >
                + {stats.upcoming.length - 5} more
              </button>
            )}
          </Section>
        )}

        {/* Explore by State / Location */}
        {topStates.length > 0 && (
          <Section title="Explore by Location" icon="pin" iconColor="text-neon-emerald">
            <div className="space-y-1">
              {topStates.map(([state, evts]) => {
                const coord = stateCoordMap.get(state) || (() => {
                  const e = evts.find((ev) => ev.latitude != null && ev.longitude != null);
                  return e ? { lat: e.latitude!, lng: e.longitude! } : null;
                })();
                const ongoing = evts.filter((e) => getEventStatus(e) === "ongoing").length;
                const upcoming = evts.filter((e) => getEventStatus(e) === "upcoming").length;
                return (
                  <button
                    key={state}
                    onClick={() => {
                      if (coord) {
                        window.dispatchEvent(
                          new CustomEvent("map-fly", { detail: { lat: coord.lat, lng: coord.lng, zoom: 8 } })
                        );
                      }
                    }}
                    className="flex items-center justify-between w-full rounded-lg px-2.5 sm:px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition group min-h-[44px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-md bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:text-white group-hover:border-neon-blue/30 transition">
                        {state.slice(0, 2).toUpperCase()}
                      </span>
                      <span>{state}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {ongoing > 0 && (
                        <span className="text-[10px] bg-green-500/20 text-green-400 rounded-full px-1.5 py-0.5">
                          {ongoing}
                        </span>
                      )}
                      {upcoming > 0 && (
                        <span className="text-[10px] bg-pink-400/20 text-pink-400 rounded-full px-1.5 py-0.5">
                          {upcoming}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-600">{evts.length}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* Empty state */}
        {!loading && events.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            <div className="flex justify-center mb-2"><Search size={28} className="text-slate-600" /></div>
            <p>No events found</p>
            {search && <p className="mt-1 text-xs">Try a different search term</p>}
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-slate-500 text-sm" role="status" aria-live="polite">
            <p className="animate-pulse">Loading events...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, iconColor, children }: { title: string; icon: string; iconColor?: string; children: React.ReactNode }) {
  const iconMap: Record<string, React.ReactNode> = {
    pin: <MapPin size={10} className={iconColor} />,
    circle: <Circle size={8} className={iconColor} />,
    compass: <Compass size={10} className={iconColor} />,
  };
  return (
    <div>
      <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {iconMap[icon]} {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function StatCard({ label, value, color, dot }: { label: string; value: number; color: string; dot?: string }) {
  return (
    <div className="rounded-xl glass-light glass-glow px-2 sm:px-3 py-2.5 sm:py-3 text-center">
      <div className={`text-lg sm:text-xl font-bold ${color}`}>
        {dot && <span className={`inline-block w-2 h-2 rounded-full ${dot} mr-1 sm:mr-1.5 animate-pulse`} />}
        {value}
      </div>
      <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function EventRow({ event, selected, onClick }: { event: EventData; selected: boolean; onClick: () => void }) {
  const status = getEventStatus(event);
  const dateStr = event.start_date
    ? new Date(event.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : "TBD";

  const statusDot: Record<string, string> = {
    ongoing: "bg-green-500",
    upcoming: "bg-pink-400",
    past: "bg-slate-500",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg px-2.5 sm:px-3 py-2.5 transition border min-h-[44px] ${
        selected
          ? "bg-slate-800 border-neon-blue/40 shadow-sm shadow-neon-blue/10"
          : "bg-transparent border-transparent hover:bg-slate-800/50"
      }`}
    >
      <div className="flex items-start gap-2 sm:gap-2.5">
        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${statusDot[status]}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{event.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-400">{dateStr}</span>
            {event.city && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-[11px] text-slate-500 truncate">{event.city}</span>
              </>
            )}
          </div>
          {event.category && (
            <span className="inline-block mt-1 rounded-full bg-neon-emerald/15 px-2 py-0.5 text-[9px] text-neon-emerald">
              {event.category}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function UpcomingRow({ event, selected, onClick }: { event: EventData; selected: boolean; onClick: () => void }) {
  const startDate = event.start_date ? new Date(event.start_date) : null;
  const endDate = event.end_date ? new Date(event.end_date) : null;

  const dateDisplay = startDate
    ? endDate && endDate.getTime() !== startDate.getTime()
      ? `${startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
      : startDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
    : "TBD";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg px-2.5 sm:px-3 py-2.5 sm:py-3 transition border min-h-[44px] ${
        selected
          ? "bg-slate-800 border-neon-blue/40 shadow-sm shadow-neon-blue/10"
          : "bg-transparent border-transparent hover:bg-slate-800/50"
      }`}
    >
      <div className="flex items-start gap-2 sm:gap-2.5">
        <div className="mt-0.5 shrink-0 w-9 h-9 rounded-lg bg-pink-400/10 border border-pink-400/20 flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold text-pink-400 leading-none">
            {startDate ? startDate.toLocaleDateString("en-IN", { month: "short" }).toUpperCase() : "—"}
          </span>
          <span className="text-sm font-bold text-pink-300 leading-none mt-0.5">
            {startDate ? startDate.getDate() : "—"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{event.title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{dateDisplay}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {event.city && <Tag text={event.city} />}
            {event.state && <Tag text={event.state} />}
            {event.category && <Tag text={event.category} accent />}
          </div>
        </div>
      </div>
    </button>
  );
}

function Tag({ text, accent }: { text: string; accent?: boolean }) {
  return (
    <span
      className={`text-[9px] rounded-full px-1.5 py-0.5 ${
        accent ? "bg-neon-emerald/15 text-neon-emerald" : "bg-slate-800/80 text-slate-500"
      }`}
    >
      {text}
    </span>
  );
}
