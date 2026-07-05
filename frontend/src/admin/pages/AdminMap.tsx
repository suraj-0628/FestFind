import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { adminApi } from "../adminApi";

function esc(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

export function AdminMap({ token }: { token: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    mapInstance.current = map;

    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    adminApi.allEvents(token, 2000)
      .then((data) => setEvents(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) map.removeLayer(layer);
    });

    const filtered = filter
      ? events.filter((e) => {
          if (filter === "pending") return !e.is_approved;
          if (filter === "scraped") return e.is_scraped;
          if (filter === "user") return e.is_user_submitted;
          if (filter === "no-coords") return !e.latitude || !e.longitude;
          return true;
        })
      : events;

    filtered.forEach((e) => {
      if (!e.latitude || !e.longitude) return;
      const color = !e.is_approved ? "#eab308" : e.is_scraped ? "#00d4ff" : "#f472b6";
      L.circleMarker([e.latitude, e.longitude], {
        radius: 5,
        fillColor: color,
        color: color,
        weight: 1,
        fillOpacity: 0.7,
      })
        .bindPopup(`<b>${esc(e.title || "")}</b><br/>${esc(e.city || "")}, ${esc(e.state || "")}<br/>${esc(e.category || "")}`)
        .addTo(map);
    });
  }, [events, filter]);

  return (
    <div className="p-4 md:p-6 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold">
          Event Map
          {loading ? " (loading...)" : ` (${events.length} events)`}
          {events.filter((e) => !e.is_approved).length > 0 && (
            <span className="text-xs font-normal text-yellow-400 ml-2">
              {events.filter((e) => !e.is_approved).length} pending
            </span>
          )}
        </h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white [&>option]:bg-[#0d0d14] [&>option]:text-white"
        >
          <option value="">All</option>
          <option value="pending">Pending Review</option>
          <option value="scraped">Scraped</option>
          <option value="user">User Submitted</option>
          <option value="no-coords">Missing Coordinates</option>
        </select>
      </div>
      {error && <div className="text-red-400 text-sm bg-red-500/10 rounded-lg p-2">{error}</div>}
      <div ref={mapRef} className="flex-1 rounded-xl overflow-hidden min-h-[400px]" />
    </div>
  );
}
