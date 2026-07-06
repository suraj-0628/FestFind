import { useEffect, useRef, useCallback, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { EventData, getEventStatus } from "../utils/api";
import { indianStates, type StateData, type CityData } from "../data/india-regions";
import { StateDropdown } from "./StateDropdown";

const darkTile = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const attr = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, &copy; CARTO';
const indiaCenter: [number, number] = [22.5, 82.0];

function statusColor(status: string): string {
  if (status === "ongoing") return "#22c55e";
  if (status === "upcoming") return "#f472b6";
  return "#64748b";
}

function statusGlow(status: string): string {
  if (status === "ongoing") return "rgba(34,197,94,0.6)";
  if (status === "upcoming") return "rgba(244,114,182,0.5)";
  return "rgba(100,116,139,0.2)";
}

function stateIcon(count: number): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:48px;height:48px;border-radius:50%;background:rgba(0,212,255,0.9);border:3px solid rgba(10,10,15,0.9);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;box-shadow:0 0 20px rgba(0,212,255,0.6),0 0 40px rgba(0,212,255,0.3);cursor:pointer;transition:transform .2s,box-shadow .2s" onmouseenter="this.style.transform='scale(1.15)'" onmouseleave="this.style.transform='scale(1)'">${count}</div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

function glowingMarker(status: string, size: number = 18): L.DivIcon {
  const color = statusColor(status);
  const glow = statusGlow(status);
  const pulseAnim = status === "ongoing"
    ? "animation:ongoingPulse 2s ease-in-out infinite;"
    : status === "upcoming"
    ? "animation:upcomingGlow 3s ease-in-out infinite;"
    : "";
  const ringSize = size + 16;

  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:${ringSize}px;height:${ringSize}px;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;width:${ringSize}px;height:${ringSize}px;border-radius:50%;border:2px solid ${color};opacity:0.3;${pulseAnim}"></div>
        <div style="width:${size}px;height:${size}px;border-radius:50%;background:radial-gradient(circle,${color} 0%,${glow} 70%,transparent 100%);border:2px solid rgba(10,10,15,0.9);box-shadow:0 0 12px ${glow},0 0 24px ${glow};cursor:pointer;${pulseAnim}"></div>
      </div>`,
    iconSize: [ringSize, ringSize],
    iconAnchor: [ringSize / 2, ringSize / 2],
  });
}

function clusterMarker(count: number): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;width:44px;height:44px;border-radius:50%;border:2px solid rgba(0,212,255,0.5);animation:ongoingPulse 2s ease-in-out infinite"></div>
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,rgba(0,212,255,0.9),rgba(59,130,246,0.9));border:2px solid rgba(10,10,15,0.9);box-shadow:0 0 16px rgba(0,212,255,0.5),0 0 32px rgba(0,212,255,0.3);cursor:pointer;display:flex;align-items:center;justify-content:center">
          <span style="font-size:13px;font-weight:700;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.5)">${count}</span>
        </div>
      </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function userLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(59,130,246,0.15);border:2px solid rgba(59,130,246,0.4);animation:userPulse 2s ease-in-out infinite"></div>
        <div style="width:16px;height:16px;border-radius:50%;background:radial-gradient(circle,#3b82f6 0%,rgba(59,130,246,0.6) 60%,transparent 100%);border:3px solid #fff;box-shadow:0 0 16px rgba(59,130,246,0.8),0 0 32px rgba(59,130,246,0.4)"></div>
      </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function labelIcon(name: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="font-size:11px;font-weight:600;color:#e2e8f0;text-shadow:0 0 8px #0a0a0f,0 0 16px #0a0a0f;white-space:nowrap;pointer-events:none">${name}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, -16],
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

const SAFE_URL_RE = /^https?:\/\//i;

function eventPopup(e: EventData, status: string): string {
  const c = statusColor(status);
  const d = e.start_date
    ? new Date(e.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "TBD";
  const end = e.end_date
    ? new Date(e.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";
  const dateRange = end && end !== d ? `${d} — ${end}` : d;
  const safeUrl = e.event_url && SAFE_URL_RE.test(e.event_url) ? e.event_url : "";

  return `<div style="min-width:240px;max-width:280px;font-family:Inter,system-ui,sans-serif">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <div style="width:10px;height:10px;border-radius:50%;background:${c};box-shadow:0 0 8px ${c};flex-shrink:0"></div>
      <span style="font-size:10px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:0.5px">${status}</span>
    </div>
    <h3 style="margin:0 0 8px;font-size:15px;font-weight:700;color:#f1f5f9;line-height:1.3">${escapeHtml(e.title)}</h3>
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#94a3b8">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg> ${escapeHtml(dateRange)}
      </div>
      ${e.venue ? `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#94a3b8">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/></svg> ${escapeHtml(e.venue)}
      </div>` : ""}
      ${e.city ? `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#94a3b8">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> ${escapeHtml(e.city)}${e.state ? ", " + escapeHtml(e.state) : ""}
      </div>` : ""}
      ${e.organizer ? `<div style="display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:#e2e8f0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> ${escapeHtml(e.organizer.length > 40 ? e.organizer.slice(0, 40) + "..." : e.organizer)}
      </div>` : ""}
    </div>
    ${e.category ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">
      ${e.category.split(",").slice(0, 3).map((c) => `<span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600;background:rgba(0,212,255,0.2);color:#67e8f9">${escapeHtml(c.trim())}</span>`).join("")}
    </div>` : ""}
    <div style="display:flex;gap:6px;margin-top:8px">
      ${safeUrl ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener" style="flex:1;text-align:center;padding:6px 12px;border-radius:8px;font-size:11px;font-weight:600;color:#0a0a0f;background:linear-gradient(135deg,#00d4ff,#00d4ff);text-decoration:none;transition:opacity .2s" onmouseenter="this.style.opacity='0.9'" onmouseleave="this.style.opacity='1'">Register Now →</a>` : ""}
    </div>
  </div>`;
}

function statePopup(name: string, ongoing: number, upcoming: number): string {
  return `<div style="text-align:center;min-width:140px;font-family:Inter,system-ui,sans-serif">
    <div style="font-size:15px;font-weight:700;color:#67e8f9;margin-bottom:8px">${escapeHtml(name)}</div>
    <div style="display:flex;justify-content:center;gap:12px;margin-bottom:6px">
      ${ongoing > 0 ? `<div style="text-align:center"><div style="font-size:18px;font-weight:700;color:#22c55e">${ongoing}</div><div style="font-size:10px;color:#64748b">Ongoing</div></div>` : ""}
      ${upcoming > 0 ? `<div style="text-align:center"><div style="font-size:18px;font-weight:700;color:#f472b6">${upcoming}</div><div style="font-size:10px;color:#64748b">Upcoming</div></div>` : ""}
    </div>
    <div style="font-size:10px;color:#64748b;margin-top:4px">Click to explore events →</div>
  </div>`;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function groupByVenue(events: EventData[], stateLat: number, stateLng: number): { lat: number; lng: number; events: EventData[] }[] {
  const placed: { lat: number; lng: number; events: EventData[] }[] = [];

  for (const e of events) {
    const lat = e.latitude ?? stateLat + (Math.random() - 0.5) * 0.5;
    const lng = e.longitude ?? stateLng + (Math.random() - 0.5) * 0.5;

    // Try to find an existing group within ~500m
    let found = false;
    for (const group of placed) {
      if (haversineDistance(lat, lng, group.lat, group.lng) < 0.5) {
        group.events.push(e);
        found = true;
        break;
      }
    }
    if (!found) {
      placed.push({ lat, lng, events: [e] });
    }
  }
  return placed;
}

function multiEventPopup(groups: { venue: string; events: EventData[] }[], venueName: string): string {
  const rows = groups.flatMap((g) =>
    g.events.map((e) => {
      const st = getEventStatus(e);
      const c = statusColor(st);
      const d = e.start_date
        ? new Date(e.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
        : "TBD";
      return `<div style="display:flex;align-items:start;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
        <div style="width:8px;height:8px;border-radius:50%;background:${c};box-shadow:0 0 6px ${c};margin-top:5px;flex-shrink:0"></div>
        <div style="min-width:0;flex:1">
          <div style="font-size:13px;font-weight:600;color:#f1f5f9;line-height:1.3">${escapeHtml(e.title)}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px">${d}${e.category ? " · " + escapeHtml(e.category.split(",")[0].trim()) : ""}</div>
          ${e.event_url ? `<a href="${escapeHtml(e.event_url)}" target="_blank" rel="noopener" style="display:inline-block;margin-top:4px;font-size:10px;font-weight:600;color:#00d4ff">Register →</a>` : ""}
        </div>
      </div>`;
    })
  );

  return `<div style="min-width:220px;max-width:280px;font-family:Inter,system-ui,sans-serif">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.08)">
      <div style="width:8px;height:8px;border-radius:50%;background:#00d4ff;box-shadow:0 0 8px rgba(0,212,255,0.6)"></div>
      <span style="font-size:13px;font-weight:700;color:#67e8f9">${escapeHtml(venueName)}</span>
      <span style="margin-left:auto;font-size:10px;color:#64748b;background:rgba(0,212,255,0.15);padding:2px 6px;border-radius:99px">${groups.reduce((n, g) => n + g.events.length, 0)} events</span>
    </div>
    <div style="max-height:300px;overflow-y:auto">${rows.join("")}</div>
  </div>`;
}

interface Props {
  events: EventData[];
  onSelect: (e: EventData | null) => void;
  selectedId: string | null;
  onMapMove?: () => void;
  onMapIdle?: () => void;
  userLocation?: { lat: number; lng: number; city: string; state: string } | null;
  nearbyEvents?: EventData[];
}

export function IndiaMap({ events, onSelect, selectedId, onMapMove, onMapIdle, userLocation, nearbyEvents }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const dynLayer = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const drillRef = useRef<"india" | "state" | "city">("india");
  const stateDataRef = useRef<StateData | null>(null);
  const [drillLevel, setDrillLevel] = useState<"india" | "state" | "city">("india");
  const [currentStateName, setCurrentStateName] = useState<string | null>(null);
  const [mapMoved, setMapMoved] = useState(false);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const evtsRef = useRef(events);
  evtsRef.current = events;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onMapMoveRef = useRef(onMapMove);
  onMapMoveRef.current = onMapMove;
  const userLocRef = useRef(userLocation);
  userLocRef.current = userLocation;
  const nearbyRef = useRef(nearbyEvents);
  nearbyRef.current = nearbyEvents;

  const clearDyn = useCallback(() => {
    if (dynLayer.current) { dynLayer.current.remove(); dynLayer.current = null; }
  }, []);

  const setDrill = useCallback((level: "india" | "state" | "city") => {
    drillRef.current = level;
    setDrillLevel(level);
  }, []);

  const phys = useCallback((pred: (e: EventData) => boolean) => {
    return evtsRef.current.filter((e) => e.event_type === "physical" && pred(e));
  }, []);

  const goIndia = useCallback(() => {
    const m = map.current;
    if (!m) return;
    clearDyn();
    setDrill("india");
    setCurrentStateName(null);
    stateDataRef.current = null;
    m.flyTo(indiaCenter, 5, { duration: 0.8 });

    const layer = L.layerGroup().addTo(m);
    dynLayer.current = layer;

    for (const state of indianStates) {
      const stateEvents = phys((e) => e.state === state.name);
      if (stateEvents.length === 0) continue;
      const ongoing = stateEvents.filter((e) => getEventStatus(e) === "ongoing").length;
      const upcoming = stateEvents.filter((e) => getEventStatus(e) === "upcoming").length;
      const cnt = stateEvents.length;
      const mk = L.marker([state.lat, state.lng], { icon: stateIcon(cnt) }).addTo(layer);
      mk.bindPopup(statePopup(state.name, ongoing, upcoming), { maxWidth: 280 });
      mk.on("click", () => goStateRef.current(state));
      const lb = L.marker([state.lat, state.lng + 1.2], { icon: labelIcon(state.name) }).addTo(layer);
      lb.on("click", () => goStateRef.current(state));
    }

    // International events — pin at their lat/lng
    const intlEvents = evtsRef.current.filter((e) => e.latitude != null && e.longitude != null && (!e.state || e.state === "NA"));
    for (const e of intlEvents) {
      const st = getEventStatus(e);
      const mk = L.marker([e.latitude!, e.longitude!], { icon: glowingMarker(st) }).addTo(layer);
      mk.bindPopup(eventPopup(e, st), { maxWidth: 280 });
      mk.on("click", () => onSelectRef.current(e));
    }

    if (userLocRef.current) {
      const um = L.marker([userLocRef.current.lat, userLocRef.current.lng], { icon: userLocationIcon() }).addTo(layer);
      um.bindTooltip("You are here", { permanent: false, direction: "top", offset: [0, -16] });
      userMarkerRef.current = um;
    }
  }, [clearDyn, phys]);

  const goState = useCallback((state: StateData) => {
    const m = map.current;
    if (!m) return;
    clearDyn();
    setDrill("state");
    setCurrentStateName(state.name);
    stateDataRef.current = state;
    const layer = L.layerGroup().addTo(m);
    dynLayer.current = layer;

    const stateEvents = phys((e) => e.state === state.name);
    const groups = groupByVenue(stateEvents, state.lat, state.lng);

    const bounds: L.LatLngExpression[] = [];

    for (const group of groups) {
      const { lat, lng, events: evts } = group;
      bounds.push([lat, lng]);

      if (evts.length === 1) {
        const e = evts[0];
        const st = getEventStatus(e);
        const mk = L.marker([lat, lng], { icon: glowingMarker(st) }).addTo(layer);
        mk.bindPopup(eventPopup(e, st), { maxWidth: 300 });
        mk.on("click", () => onSelectRef.current(e));

        if (e.venue) {
          const vlb = L.marker([lat + 0.0008, lng], {
            icon: L.divIcon({
              className: "",
              html: `<div style="font-size:10px;font-weight:600;color:#cbd5e1;text-shadow:0 0 6px #0a0a0f;white-space:nowrap;pointer-events:none;opacity:0.8">${e.venue}</div>`,
              iconSize: [0, 0],
              iconAnchor: [0, -12],
            }),
          }).addTo(layer);
        }
      } else {
        const venueName = evts[0].venue || evts[0].city || state.name;
        const mk = L.marker([lat, lng], { icon: clusterMarker(evts.length) }).addTo(layer);

        const groupedByVenue: { venue: string; events: EventData[] }[] = [];
        for (const e of evts) {
          const v = e.venue || "Unknown";
          const existing = groupedByVenue.find((g) => g.venue === v);
          if (existing) existing.events.push(e);
          else groupedByVenue.push({ venue: v, events: [e] });
        }

        mk.bindPopup(multiEventPopup(groupedByVenue, venueName), { maxWidth: 320, maxHeight: 350 });
        mk.on("click", () => onSelectRef.current(evts[0]));

        const vlb = L.marker([lat + 0.0008, lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="font-size:10px;font-weight:600;color:#94a3b8;text-shadow:0 0 6px #0a0a0f;white-space:nowrap;pointer-events:none;opacity:0.9">${venueName}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, -12],
          }),
        }).addTo(layer);
      }
    }

    if (userLocRef.current) {
      const um = L.marker([userLocRef.current.lat, userLocRef.current.lng], { icon: userLocationIcon() }).addTo(layer);
      um.bindTooltip("You are here", { permanent: false, direction: "top", offset: [0, -16] });
      userMarkerRef.current = um;
      bounds.push([userLocRef.current.lat, userLocRef.current.lng]);
    }

    if (bounds.length > 0) {
      const b = L.latLngBounds(bounds);
      m.fitBounds(b, { padding: [40, 40], maxZoom: 9, duration: 0.8 });
    } else {
      m.flyTo([state.lat, state.lng], 7, { duration: 0.8 });
    }
  }, [clearDyn, phys]);

  const goCity = useCallback((city: CityData, state: StateData, evts: EventData[]) => {
    const m = map.current;
    if (!m) return;
    clearDyn();
    setDrill("city");
    const layer = L.layerGroup().addTo(m);
    dynLayer.current = layer;

    const groups = groupByVenue(evts, city.lat, city.lng);

    const bounds: L.LatLngExpression[] = [];

    for (const group of groups) {
      const { lat, lng, events: gEvts } = group;
      bounds.push([lat, lng]);

      if (gEvts.length === 1) {
        const e = gEvts[0];
        const st = getEventStatus(e);
        const mk = L.marker([lat, lng], { icon: glowingMarker(st, 22) }).addTo(layer);
        mk.bindPopup(eventPopup(e, st), { maxWidth: 300 });
        mk.on("click", () => onSelectRef.current(e));

        if (e.venue) {
          const vlb = L.marker([lat + 0.0008, lng], {
            icon: L.divIcon({
              className: "",
              html: `<div style="font-size:10px;font-weight:600;color:#cbd5e1;text-shadow:0 0 6px #0a0a0f;white-space:nowrap;pointer-events:none;opacity:0.8">${e.venue}</div>`,
              iconSize: [0, 0],
              iconAnchor: [0, -12],
            }),
          }).addTo(layer);
        }
      } else {
        const venueName = gEvts[0].venue || gEvts[0].city || city.name;
        const mk = L.marker([lat, lng], { icon: clusterMarker(gEvts.length) }).addTo(layer);

        const groupedByVenue: { venue: string; events: EventData[] }[] = [];
        for (const e of gEvts) {
          const v = e.venue || "Unknown";
          const existing = groupedByVenue.find((g) => g.venue === v);
          if (existing) existing.events.push(e);
          else groupedByVenue.push({ venue: v, events: [e] });
        }

        mk.bindPopup(multiEventPopup(groupedByVenue, venueName), { maxWidth: 320, maxHeight: 350 });
        mk.on("click", () => onSelectRef.current(gEvts[0]));

        const vlb = L.marker([lat + 0.0008, lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="font-size:10px;font-weight:600;color:#94a3b8;text-shadow:0 0 6px #0a0a0f;white-space:nowrap;pointer-events:none;opacity:0.9">${venueName}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, -12],
          }),
        }).addTo(layer);
      }
    }

    if (userLocRef.current) {
      const um = L.marker([userLocRef.current.lat, userLocRef.current.lng], { icon: userLocationIcon() }).addTo(layer);
      um.bindTooltip("You are here", { permanent: false, direction: "top", offset: [0, -16] });
      userMarkerRef.current = um;
      bounds.push([userLocRef.current.lat, userLocRef.current.lng]);
    }

    if (bounds.length > 0) {
      const b = L.latLngBounds(bounds);
      m.fitBounds(b, { padding: [50, 50], maxZoom: 14, duration: 0.8 });
    } else {
      m.flyTo([city.lat, city.lng], 12, { duration: 0.8 });
    }
  }, [clearDyn]);

  const goIndiaRef = useRef(goIndia);
  goIndiaRef.current = goIndia;
  const goStateRef = useRef(goState);
  goStateRef.current = goState;
  const goCityRef = useRef(goCity);
  goCityRef.current = goCity;

  const clearMapMoved = useCallback(() => {
    setMapMoved(false);
    onMapMoveRef.current?.();
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "map-styles";
    style.textContent = `
      @keyframes ongoingPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.25)}}
      @keyframes upcomingGlow{0%,100%{opacity:0.8;transform:scale(1)}50%{opacity:0.5;transform:scale(1.15)}}
      @keyframes userPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:0.4}}
      @keyframes fadeInScale{from{opacity:0;transform:scale(0.3)}to{opacity:1;transform:scale(1)}}
      .leaflet-control-zoom a{background:#1e293b!important;color:#e2e8f0!important;border-color:#334155!important}
      .leaflet-control-zoom{border:none!important}
      .leaflet-popup-content-wrapper{background:rgba(15,23,42,0.95)!important;color:#e2e8f0!important;border-radius:14px!important;box-shadow:0 8px 32px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,0.08)!important;backdrop-filter:blur(20px)!important;max-width:min(320px,80vw)!important}
      .leaflet-popup-tip{background:rgba(15,23,42,0.95)!important;box-shadow:none!important}
      .leaflet-popup-content{margin:14px!important;font-family:Inter,system-ui,sans-serif!important;line-height:1.5!important;max-width:min(290px,72vw)!important}
      .leaflet-popup-close-button{color:#64748b!important;font-size:18px!important;width:32px!important;height:32px!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:6px!important}
      .leaflet-popup-close-button:hover{color:#e2e8f0!important;background:rgba(255,255,255,0.06)!important}
      @media(max-width:640px){.leaflet-popup-content{font-size:13px!important}}
      .leaflet-marker-icon{transition:opacity .3s ease}
    `;
    document.head.appendChild(style);

    const m = L.map(mapRef.current!, {
      center: indiaCenter,
      zoom: 5,
      zoomControl: window.innerWidth >= 768,
      attributionControl: false,
      minZoom: 3,
      maxZoom: 16,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 1.0,
      worldCopyJump: false,
      scrollWheelZoom: true,
      touchZoom: true,
      bounceAtZoomLimits: true,
    });
    L.tileLayer(darkTile, { attribution: attr }).addTo(m);

    m.on("moveend", () => {
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      moveTimerRef.current = setTimeout(() => setMapMoved(true), 500);
    });

    map.current = m;
    return () => { m.remove(); map.current = null; style.remove(); };
  }, []);

  useEffect(() => {
    if (drillRef.current === "india") goIndiaRef.current();
  }, [events]);

  useEffect(() => {
    if (selectedId) {
      const e = events.find((ev) => ev.id === selectedId);
      if (e?.latitude && e?.longitude) {
        const m = map.current;
        if (!m) return;
        // Remove old selected marker
        if (selectedMarkerRef.current) {
          m.removeLayer(selectedMarkerRef.current);
          selectedMarkerRef.current = null;
        }
        // Drop a prominent marker for the selected event
        const st = getEventStatus(e);
        const mk = L.marker([e.latitude, e.longitude], { icon: glowingMarker(st, 24) }).addTo(m);
        mk.bindPopup(eventPopup(e, st), { maxWidth: 300 });
        selectedMarkerRef.current = mk;
        m.flyTo([e.latitude, e.longitude], 12, { duration: 0.8 });
      }
    } else if (selectedMarkerRef.current) {
      map.current?.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }
  }, [selectedId, events]);

  useEffect(() => {
    const handler = (ev: CustomEvent<{ lat: number; lng: number; zoom?: number }>) => {
      const m = map.current;
      if (!m) return;
      clearDyn();
      setDrill("india");
      stateDataRef.current = null;
      m.flyTo([ev.detail.lat, ev.detail.lng], ev.detail.zoom || 8, { duration: 0.8 });
    };
    window.addEventListener("map-fly", handler as EventListener);
    return () => window.removeEventListener("map-fly", handler as EventListener);
  }, [clearDyn]);

  useEffect(() => {
    const handler = (ev: CustomEvent<{ lat: number; lng: number; city: string; state: string }>) => {
      const m = map.current;
      if (!m) return;

      const { lat, lng, city, state: stateName } = ev.detail;
      clearDyn();
      setDrill("india");
      stateDataRef.current = null;

      // Just fly directly to the user's location at a reasonable zoom
      m.flyTo([lat, lng], 8, { duration: 1.2 });

      // If we know the state, load the state view after a short delay
      if (stateName) {
        const targetState = indianStates.find((s) => s.name === stateName);
        if (targetState) {
          setTimeout(() => {
            goStateRef.current(targetState);
          }, 1500);
        }
      }
    };
    window.addEventListener("map-fly-sequence", handler as unknown as EventListener);
    return () => window.removeEventListener("map-fly-sequence", handler as unknown as EventListener);
  }, [clearDyn]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} role="application" aria-label="Interactive map of India" />
      <div style={{ position: "absolute", top: 12, left: 52, zIndex: 1000 }}>
        <StateDropdown
          events={events}
          currentState={currentStateName}
          onSelect={(name) => {
            const state = indianStates.find((s) => s.name === name);
            if (state) goStateRef.current(state);
          }}
          onBackToIndia={() => goIndiaRef.current()}
        />
      </div>
      {/* Zoom out button */}
      <button
        onClick={() => {
          if (drillLevel === "city" && stateDataRef.current) {
            goStateRef.current(stateDataRef.current);
          } else if (drillLevel === "state") {
            goIndiaRef.current();
          }
        }}
        aria-label={drillLevel === "city" ? "Back to state view" : drillLevel === "state" ? "Back to India view" : "At top level"}
        aria-disabled={drillLevel === "india"}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1000,
          width: 44,
          height: 44,
          borderRadius: 10,
          background: drillLevel !== "india" ? "rgba(15,23,42,0.9)" : "rgba(15,23,42,0.4)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: drillLevel !== "india" ? "#e2e8f0" : "#475569",
          fontSize: 18,
          fontWeight: 700,
          cursor: drillLevel !== "india" ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
          opacity: drillLevel !== "india" ? 1 : 0.4,
        }}
        title={drillLevel === "city" ? "Back to state" : drillLevel === "state" ? "Back to India" : "At top level"}
      >
        −
      </button>
    </div>
  );
}
