import { useState, useRef, useEffect, useMemo } from "react";
import { indianStates } from "../data/india-regions";
import { EventData, getEventStatus } from "../utils/api";
import { MapPin } from "./Icons";

interface Props {
  events: EventData[];
  currentState: string | null;
  onSelect: (stateName: string) => void;
  onBackToIndia: () => void;
}

export function StateDropdown({ events, currentState, onSelect, onBackToIndia }: Props) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const stateStats = useMemo(() => {
    const stats = new Map<string, { ongoing: number; upcoming: number; total: number }>();
    for (const e of events) {
      if (e.event_type !== "physical" || !e.state) continue;
      const s = getEventStatus(e);
      const entry = stats.get(e.state) || { ongoing: 0, upcoming: 0, total: 0 };
      entry.total++;
      if (s === "ongoing") entry.ongoing++;
      if (s === "upcoming") entry.upcoming++;
      stats.set(e.state, entry);
    }
    return stats;
  }, [events]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const sortedStates = useMemo(() => {
    return indianStates
      .map((s) => ({
        ...s,
        stats: stateStats.get(s.name) || { ongoing: 0, upcoming: 0, total: 0 },
      }))
      .sort((a, b) => b.stats.total - a.stats.total);
  }, [stateStats]);

  const activeState = currentState
    ? sortedStates.find((s) => s.name === currentState)
    : null;

  return (
    <div ref={dropdownRef} className="relative" style={{ zIndex: 1001 }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all min-h-[36px] text-sm"
        style={{
          background: "rgba(15,23,42,0.85)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#e2e8f0",
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {activeState ? (
          <>
            <span className="font-semibold">{activeState.name}</span>
            {activeState.stats.ongoing > 0 && (
              <span className="text-[10px] bg-green-500/20 text-green-400 rounded-full px-1.5 py-0.5 font-semibold">
                {activeState.stats.ongoing} live
              </span>
            )}
            {activeState.stats.upcoming > 0 && (
              <span className="text-[10px] bg-pink-400/20 text-pink-400 rounded-full px-1.5 py-0.5 font-semibold">
                {activeState.stats.upcoming} soon
              </span>
            )}
          </>
        ) : (
          <span className="font-semibold">India</span>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: "transform 200ms ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>

      {/* Dropdown panel */}
      <div
        className="absolute top-full left-0 mt-1 w-72 rounded-xl overflow-hidden transition-all duration-200 origin-top"
        style={{
          background: "rgba(15,23,23,0.95)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scaleY(1)" : "translateY(-8px) scaleY(0.95)",
          pointerEvents: open ? "auto" : "none",
        }}
        role="listbox"
        aria-label="Select a state"
      >
        {/* Back to India option */}
        {!currentState && (
          <div className="px-3 py-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold border-b border-white/[0.06]">
            All States
          </div>
        )}
        {currentState && (
          <button
            onClick={() => { onBackToIndia(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.06] transition text-sm text-slate-400 hover:text-white border-b border-white/[0.06]"
            role="option"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
            </svg>
            <span>Back to India</span>
          </button>
        )}

        {/* State list */}
        <div className="max-h-64 overflow-y-auto">
          {sortedStates.map((state) => {
            const isActive = state.name === currentState;
            return (
              <button
                key={state.name}
                onClick={() => { onSelect(state.name); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition text-sm ${
                  isActive
                    ? "bg-neon-blue/10 text-white"
                    : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                }`}
                role="option"
                aria-selected={isActive}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold ${
                    isActive ? "bg-neon-blue/20 text-neon-blue" : "bg-slate-800/60 text-slate-500"
                  }`}>
                    {state.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-medium">{state.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {state.stats.ongoing > 0 && (
                    <span className="text-[10px] bg-green-500/20 text-green-400 rounded-full px-1.5 py-0.5 font-semibold">
                      {state.stats.ongoing}
                    </span>
                  )}
                  {state.stats.upcoming > 0 && (
                    <span className="text-[10px] bg-pink-400/20 text-pink-400 rounded-full px-1.5 py-0.5 font-semibold">
                      {state.stats.upcoming}
                    </span>
                  )}
                  {state.stats.total === 0 && (
                    <span className="text-[10px] text-slate-600">—</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
