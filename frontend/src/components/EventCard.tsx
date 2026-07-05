import { EventData, getEventStatus } from "../utils/api";

interface Props {
  event: EventData;
  onClick?: () => void;
}

export function EventCard({ event, onClick }: Props) {
  const status = getEventStatus(event);
  const dateStr = event.start_date
    ? new Date(event.start_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "TBD";

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    ongoing: { bg: "bg-green-500/20", text: "text-green-400", label: "Ongoing" },
    upcoming: { bg: "bg-pink-500/20", text: "text-pink-400", label: "Upcoming" },
    past: { bg: "bg-slate-500/20", text: "text-slate-400", label: "Past" },
  };
  const s = statusColors[status];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}
      className="group cursor-pointer rounded-xl glass-light glass-glow p-4 transition-all hover:shadow-lg hover:shadow-neon-blue/10 focus-visible:outline-2 focus-visible:outline-neon-blue focus-visible:outline-offset-2"
    >
      {event.image_url && (
        <img
          src={event.image_url}
          alt={event.title}
          className="mb-3 h-32 w-full rounded-lg object-cover"
        />
      )}
      <div className="flex items-center gap-2 mb-1">
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>
          {s.label}
        </span>
        {event.event_type === "online" && (
          <span className="inline-block rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
            Online
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-white line-clamp-2">{event.title}</h3>
      <p className="mt-1 text-xs text-neon-blue">{dateStr}</p>
      {event.city && (
        <p className="mt-1 text-xs text-slate-400">
          {event.city}{event.state ? `, ${event.state}` : ""}
        </p>
      )}
      {event.category && (
        <span className="mt-2 inline-block rounded-full bg-neon-emerald/20 px-2 py-0.5 text-[10px] text-neon-emerald">
          {event.category}
        </span>
      )}
      {event.event_url && (
        <a
          href={event.event_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-3 block w-full text-center rounded-lg bg-neon-blue/10 border border-neon-blue/30 px-3 py-2 text-xs font-semibold text-neon-blue transition hover:bg-neon-blue hover:text-black"
        >
          Reg Now
        </a>
      )}
    </div>
  );
}
