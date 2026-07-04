import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, MapPin } from "./Icons";

const darkTile = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const indiaCenter: [number, number] = [22.5, 82.0];

function pinIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:32px;height:32px;position:relative">
      <div style="position:absolute;inset:-4px;border-radius:50%;background:rgba(0,212,255,0.2);animation:mp-pulse 2s ease-in-out infinite"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:16px;height:16px;border-radius:50%;background:#00d4ff;border:3px solid #0a0a0f;box-shadow:0 0 16px rgba(0,212,255,0.8),0 0 32px rgba(0,212,255,0.3);z-index:1"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-8px);width:2px;height:8px;background:linear-gradient(to bottom,rgba(0,212,255,0.8),transparent);border-radius:1px;z-index:0"></div>
    </div>
    <style>@keyframes mp-pulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(2.5);opacity:0}}</style>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface Props {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
  autoSearchQuery?: string;
}

export function MapPicker({ lat, lng, onPick, autoSearchQuery }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [pickedAddress, setPickedAddress] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const placePin = (map: L.Map, newLat: number, newLng: number, animate = true) => {
    const ll: L.LatLngTuple = [newLat, newLng];
    if (markerRef.current) {
      markerRef.current.setLatLng(ll);
    } else {
      markerRef.current = L.marker(ll, { icon: pinIcon(), draggable: true }).addTo(map);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current?.getLatLng();
        if (pos) {
          onPick(pos.lat, pos.lng);
          reverseLookup(pos.lat, pos.lng);
        }
      });
    }
    if (animate) map.setView(ll, 16, { animate: true });
    onPick(newLat, newLng);
    reverseLookup(newLat, newLng);
  };

  const reverseLookup = async (rLat: number, rLng: number) => {
    try {
      const res = await fetch(`/api/events/reverse-geocode?lat=${rLat}&lng=${rLng}`);
      const data: { display?: string } = await res.json();
      setPickedAddress(data.display || `${rLat.toFixed(5)}, ${rLng.toFixed(5)}`);
    } catch {
      setPickedAddress(`${rLat.toFixed(5)}, ${rLng.toFixed(5)}`);
    }
  };

  // Init map + detect location
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    const map = L.map(mapRef.current, {
      center: indiaCenter,
      zoom: 5,
      scrollWheelZoom: true,
      touchZoom: true,
      zoomControl: false,
      doubleClickZoom: false,
    });

    L.tileLayer(darkTile, { maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      placePin(map, e.latlng.lat, e.latlng.lng);
      setQuery("");
      setShowResults(false);
    });

    leafletRef.current = map;

    // Detect user location and zoom in
    const stored = localStorage.getItem("cfh_location");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.lat && data.lng) {
          map.setView([data.lat, data.lng], 14, { animate: true });
          return;
        }
      } catch {}
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 14, { animate: true });
        },
        () => {
          fetch("https://ip-api.com/json/?fields=lat,lon", { signal: AbortSignal.timeout(5000) })
            .then((r) => r.json())
            .then((d) => {
              if (d.lat && d.lon) map.setView([d.lat, d.lon], 12, { animate: true });
            })
            .catch(() => {});
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    }

    return () => {
      map.remove();
      leafletRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync external lat/lng
  useEffect(() => {
    const map = leafletRef.current;
    if (!map || !lat || !lng) return;
    placePin(map, lat, lng, false);
    map.setView([lat, lng], 16, { animate: true });
  }, [lat, lng]);

  // Auto-search from organizer field
  useEffect(() => {
    if (autoSearchTimerRef.current) clearTimeout(autoSearchTimerRef.current);
    if (!autoSearchQuery || autoSearchQuery.trim().length < 3) return;

    autoSearchTimerRef.current = setTimeout(async () => {
      const q = autoSearchQuery.trim();
      const queries = [`${q}, India`, q];
      for (const searchQ of queries) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQ)}&format=json&limit=1`,
            { headers: { "User-Agent": "FestFind/1.0" } }
          );
          const data = await res.json();
          if (data.length > 0) {
            const r = data[0];
            const rLat = parseFloat(r.lat);
            const rLng = parseFloat(r.lon);
            const map = leafletRef.current;
            if (map) {
              placePin(map, rLat, rLng);
              setPickedAddress(r.display_name.split(",").slice(0, 3).join(","));
            }
            return;
          }
        } catch {
          // try next query
        }
      }
    }, 800);
    return () => {
      if (autoSearchTimerRef.current) clearTimeout(autoSearchTimerRef.current);
    };
  }, [autoSearchQuery]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value + ", India")}&format=json&limit=5`,
          { headers: { "User-Agent": "FestFind/1.0" } }
        );
        const data = await res.json();
        setResults(data);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const selectResult = (r: SearchResult) => {
    const map = leafletRef.current;
    if (!map) return;
    const rLat = parseFloat(r.lat);
    const rLng = parseFloat(r.lon);
    placePin(map, rLat, rLng);
    setQuery(r.display_name.split(",").slice(0, 3).join(","));
    setShowResults(false);
    setResults([]);
  };

  const handleClear = () => {
    setPickedAddress("");
    setQuery("");
    markerRef.current?.remove();
    markerRef.current = null;
    onPick(0, 0);
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-white/[0.08]">
      {/* Search */}
      <div className="absolute top-2 left-2 right-2 z-[500]">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search venue, college, or city..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="w-full rounded-lg bg-[#0a0a0f]/90 backdrop-blur-sm border border-white/[0.08] pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-neon-blue/50 transition"
          />
          {searching && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-slate-500 border-t-neon-blue rounded-full animate-spin" />
            </div>
          )}
        </div>

        {showResults && (
          <div className="mt-1 rounded-lg bg-[#0a0a0f]/95 backdrop-blur-sm border border-white/[0.08] shadow-xl overflow-hidden max-h-48 overflow-y-auto">
            {results.length === 0 && !searching ? (
              <div className="px-3 py-3 text-[11px] text-slate-500 text-center">Not found — tap on the map to drop a pin</div>
            ) : (
              results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={() => selectResult(r)}
                  className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-neon-blue/10 transition border-b border-white/[0.04] last:border-0"
                >
                  {r.display_name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Map */}
      <div ref={mapRef} className="w-full h-[300px]" />

      {/* Bottom bar */}
      <div className="px-3 py-2 flex items-center justify-between bg-white/[0.02]">
        {pickedAddress ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin size={12} className="text-neon-blue shrink-0" />
            <span className="text-[11px] text-slate-300 truncate">{pickedAddress}</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500">Search or tap on the map to pin location</span>
        )}
        {pickedAddress && (
          <button type="button" onClick={handleClear} className="text-[11px] text-slate-500 hover:text-white transition shrink-0 ml-2">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
