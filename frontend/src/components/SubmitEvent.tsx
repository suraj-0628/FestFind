import { useState, useRef, useEffect, useCallback } from "react";
import { createEvent, uploadImage, forwardGeocode } from "../utils/api";
import { Sparkles, Upload, X, MapPin } from "./Icons";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu & Kashmir","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

interface Props {
  onClose: () => void;
  onSubmitted?: () => void;
  token?: string;
}

function countWords(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

export function SubmitEvent({ onClose, onSubmitted, token }: Props) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    organizer: "",
    city: "",
    state: "",
    venue: "",
    category: "",
    start_date: "",
    end_date: "",
    event_url: "",
    image_url: "",
    contact: "",
    deadline: "",
    fee: "free",
    fee_amount: "",
    event_type: "physical",
  });
  const [pinLat, setPinLat] = useState<number | null>(null);
  const [pinLng, setPinLng] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewMapRef = useRef<HTMLDivElement>(null);
  const previewMapInstance = useRef<L.Map | null>(null);
  const previewMarker = useRef<L.Marker | null>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userPinnedRef = useRef(false);
  const [detectedAddr, setDetectedAddr] = useState("");
  const [locSearch, setLocSearch] = useState("");
  const [locResults, setLocResults] = useState<{ lat: number; lng: number; display: string }[]>([]);
  const [locSearching, setLocSearching] = useState(false);
  const [showLocResults, setShowLocResults] = useState(false);
  const [resolving, setResolving] = useState(false);

  const markTouched = (key: string) => setTouched((t) => ({ ...t, [key]: true }));
  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleMapsLink = async (url: string) => {
    if (!url.trim()) return;
    // Apple Maps — direct coordinate extraction
    if (url.includes("maps.apple.com")) {
      const m = url.match(/[?&](?:ll|q)=(-?\d+\.?\d+),(-?\d+\.?\d+)/);
      if (m) {
        const lat = parseFloat(m[1]);
        const lng = parseFloat(m[2]);
        setPinLat(lat);
        setPinLng(lng);
        userPinnedRef.current = true;
        try {
          const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { "User-Agent": "FestFind/1.0" } });
          const data = await rev.json();
          const addr = data.address || {};
          if (addr.city || addr.town || addr.village) update("city", addr.city || addr.town || addr.village);
          if (addr.state) update("state", addr.state);
          setDetectedAddr(data.display_name || "");
        } catch {}
        return;
      }
    }
    // Google Maps — resolve via backend headless browser
    if (url.includes("google.com/maps") || url.includes("maps.app.goo.gl") || url.includes("goo.gl/maps")) {
      setResolving(true);
      try {
        const res = await fetch(`/api/events/resolve-link?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (data.lat != null && data.lng != null) {
          setPinLat(data.lat);
          setPinLng(data.lng);
          userPinnedRef.current = true;
          try {
            const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${data.lat}&lon=${data.lng}&format=json`, { headers: { "User-Agent": "FestFind/1.0" } });
            const revData = await rev.json();
            const addr = revData.address || {};
            const city = addr.city || addr.town || addr.village || addr.county || "";
            const state = addr.state || "";
            if (city) update("city", city);
            if (state) update("state", state);
            setDetectedAddr(revData.display_name || "");
          } catch {}
        }
      } catch {}
      setResolving(false);
      return;
    }
    // Non-Maps URLs — direct extraction
    const patterns = [/@(-?\d+\.?\d*),(-?\d+\.?\d*)/, /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/, /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) {
        const lat = parseFloat(m[1]);
        const lng = parseFloat(m[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          setPinLat(lat);
          setPinLng(lng);
          userPinnedRef.current = true;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { "User-Agent": "FestFind/1.0" } });
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.county || "";
            const state = addr.state || "";
            if (city) update("city", city);
            if (state) update("state", state);
            setDetectedAddr(data.display_name || "");
          } catch {}
          return;
        }
      }
    }
  };

  const handleLocSearch = (value: string) => {
    setLocSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.trim().length < 3) { setLocResults([]); setShowLocResults(false); return; }
    searchTimerRef.current = setTimeout(async () => {
      setLocSearching(true);
      try {
        // Build smart query: if city is filled, append it for better results
        const cityState = [form.city, form.state, "India"].filter(Boolean).join(", ");
        const q = form.city ? `${value}, ${cityState}` : `${value}, India`;
        const nRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`, { headers: { "User-Agent": "FestFind/1.0" } });
        const data = await nRes.json();
        setLocResults(data.map((r: any) => ({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), display: r.display_name })));
        setShowLocResults(true);
      } catch {
        setLocResults([]);
      } finally {
        setLocSearching(false);
      }
    }, 400);
  };

  const selectLocResult = (r: { lat: number; lng: number; display: string }) => {
    setPinLat(r.lat);
    setPinLng(r.lng);
    userPinnedRef.current = true;
    setLocSearch(r.display.split(",").slice(0, 3).join(","));
    setShowLocResults(false);
    setLocResults([]);
  };

  // Auto-geocode when venue/city/state changes (debounced)
  const geocodeLocation = useCallback(async (venue: string, city: string, state: string) => {
    // Prefer venue+city for exact match, fallback to city+state
    const queries = [];
    if (venue && city) queries.push(`${venue}, ${city}, ${state || "India"}`);
    if (city) queries.push(state ? `${city}, ${state}, India` : `${city}, India`);
    if (venue) queries.push(`${venue}, India`);
    setGeocoding(true);
    try {
      for (const q of queries) {
        const result = await forwardGeocode(q);
        if (result.lat != null && result.lng != null) {
          setPinLat(result.lat);
          setPinLng(result.lng);
          return;
        }
      }
    } catch {
      // user can manually pick on map
    } finally {
      setGeocoding(false);
    }
  }, []);

  // Debounce geocoding on venue/city/state change (skipped when user explicitly pinned)
  useEffect(() => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    if (userPinnedRef.current || form.event_type !== "physical" || !form.city) return;
    geocodeTimer.current = setTimeout(() => geocodeLocation(form.venue, form.city, form.state), 800);
    return () => { if (geocodeTimer.current) clearTimeout(geocodeTimer.current); };
  }, [form.venue, form.city, form.state, form.event_type, geocodeLocation]);

  // Init/update preview map
  useEffect(() => {
    if (form.event_type !== "physical" || !previewMapRef.current) {
      previewMapInstance.current?.remove();
      previewMapInstance.current = null;
      return;
    }
    if (!previewMapInstance.current && previewMapRef.current) {
      const map = L.map(previewMapRef.current, {
        center: pinLat && pinLng ? [pinLat, pinLng] : [22.5, 82],
        zoom: pinLat && pinLng ? 14 : 5,
        scrollWheelZoom: true,
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      previewMapInstance.current = map;
    }
    return () => {
      previewMapInstance.current?.remove();
      previewMapInstance.current = null;
      previewMarker.current = null;
    };
  }, [form.event_type]);

  // Update marker on pin change
  useEffect(() => {
    const map = previewMapInstance.current;
    if (!map || !pinLat || !pinLng) {
      previewMarker.current?.remove();
      previewMarker.current = null;
      return;
    }
    const ll: L.LatLngTuple = [pinLat, pinLng];
    if (previewMarker.current) {
      previewMarker.current.setLatLng(ll);
    } else {
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:24px;height:24px;position:relative">
          <div style="position:absolute;inset:-3px;border-radius:50%;background:rgba(0,212,255,0.2);animation:mp-pulse 2s ease-in-out infinite"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:12px;height:12px;border-radius:50%;background:#00d4ff;border:2px solid #0a0a0f;box-shadow:0 0 12px rgba(0,212,255,0.8);z-index:1"></div>
        </div>
        <style>@keyframes mp-pulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(2.5);opacity:0}}</style>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      previewMarker.current = L.marker(ll, { icon, draggable: false }).addTo(map);
    }
    map.setView(ll, 14, { animate: true });
  }, [pinLat, pinLng]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      update("image_url", url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      update("image_url", url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.organizer || !form.category || !form.start_date || !form.end_date) return;
    if (form.event_type === "physical" && !pinLat) return;
    if (form.event_type === "physical" && !form.image_url) return;
    setSubmitting(true);
    setResult(null);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description || undefined,
        organizer: form.organizer,
        city: form.city || undefined,
        state: form.state || undefined,
        venue: form.venue || undefined,
        category: form.category,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : undefined,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : undefined,
        event_url: form.event_url || undefined,
        image_url: form.image_url || undefined,
        event_type: form.event_type,
        tags: [form.contact ? `contact:${form.contact}` : "", form.deadline ? `deadline:${form.deadline}` : "", form.fee === "paid" && form.fee_amount ? `fee:₹${form.fee_amount}` : form.fee === "free" ? "fee:free" : ""].filter(Boolean).join(",") || undefined,
      };

      if (form.event_type === "physical" && pinLat && pinLng) {
        payload.latitude = pinLat;
        payload.longitude = pinLng;
      }

      await createEvent(payload as Parameters<typeof createEvent>[0], token);
      setResult("success");
      onSubmitted?.();
    } catch {
      setResult("error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg glass-light border border-transparent px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-neon-blue transition min-h-[44px]";

  const wordCount = countWords(form.description);
  const descOver = wordCount > 500;

  const validRequired = form.title && form.organizer && form.category && form.start_date && form.end_date;
  const validPhysical = form.event_type === "physical" ? (pinLat && form.image_url) : true;
  const canSubmit = validRequired && validPhysical && !submitting && !descOver;

  if (result === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 sm:py-20 text-center px-4 safe-top">
        <div className="flex justify-center"><Sparkles size={48} className="text-neon-blue" /></div>
        <h2 className="text-xl font-bold text-white">Event Submitted!</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Your event is pending review. It will appear on the map once approved.
        </p>
        <button
          onClick={onClose}
          className="mt-4 rounded-lg bg-neon-blue px-6 py-3 text-sm font-semibold text-black hover:bg-neon-blue/80 transition min-h-[44px]"
        >
          Back to Map
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-10 safe-top">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Put Your Event on the Map</h2>
      <p className="text-xs sm:text-sm text-slate-400 mb-6 sm:mb-8">
        List your college fest, hackathon, workshop, or conference. It goes live after review.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
        <div>
          <label htmlFor="event-title" className="block text-xs text-slate-500 mb-1">Event Name *</label>
          <input
            id="event-title"
            required
            placeholder="Event Name"
            maxLength={120}
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            onBlur={() => markTouched("title")}
            className={inputClass}
          />
          {touched.title && !form.title && <p className="text-[10px] text-red-400 mt-0.5">Title is required</p>}
          <p className="text-[10px] text-slate-600 mt-0.5">{form.title.length}/120</p>
        </div>

        <div>
          <label htmlFor="event-organizer" className="block text-xs text-slate-500 mb-1">Organizer / College *</label>
          <input
            id="event-organizer"
            required
            placeholder="e.g. PSG College of Technology"
            value={form.organizer}
            onChange={(e) => update("organizer", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="event-contact" className="block text-xs text-slate-500 mb-1">Contact (email or phone)</label>
            <input
              id="event-contact"
              placeholder="organizer@email.com or +91 98765 43210"
              value={form.contact}
              onChange={(e) => update("contact", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="event-fee" className="block text-xs text-slate-500 mb-1">Entry Fee</label>
            <select
              id="event-fee"
              value={form.fee}
              onChange={(e) => update("fee", e.target.value)}
              className={inputClass}
            >
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {form.fee === "paid" && (
          <div>
            <label htmlFor="event-fee-amount" className="block text-xs text-slate-500 mb-1">Amount (INR)</label>
            <input
              id="event-fee-amount"
              type="number"
              placeholder="e.g. 500"
              value={form.fee_amount}
              onChange={(e) => update("fee_amount", e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label htmlFor="event-description" className="block text-xs text-slate-500 mb-1">Event Description</label>
          <textarea
            id="event-description"
            placeholder="Tell people what to expect..."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className={`${inputClass} ${descOver ? "border-red-500/50" : ""}`}
          />
          <p className={`text-[10px] mt-0.5 ${descOver ? "text-red-400" : "text-slate-600"}`}>{wordCount}/500 words</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="event-type" className="block text-xs text-slate-500 mb-1">Event Type</label>
            <select
              id="event-type"
              value={form.event_type}
              onChange={(e) => {
                update("event_type", e.target.value);
                if (e.target.value === "online") {
                  setPinLat(null);
                  setPinLng(null);
                }
              }}
              className={inputClass}
            >
              <option value="physical">Physical (In-Person)</option>
              <option value="online">Online (Virtual)</option>
            </select>
          </div>
          <div>
            <label htmlFor="event-category" className="block text-xs text-slate-500 mb-1">Category *</label>
            <select
              id="event-category"
              required
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className={inputClass}
            >
              <option value="">Select category</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Business">Business</option>
              <option value="Workshop">Workshop</option>
              <option value="Conference">Conference</option>
              <option value="Seminar">Seminar</option>
              <option value="FDP">FDP</option>
              <option value="Internship">Internship</option>
              <option value="Sports">Sports</option>
            </select>
          </div>
        </div>

        {/* Location: text fields for physical events */}
        {form.event_type === "physical" && (
          <div className="space-y-3">
            <label className="block text-xs text-slate-500 mb-1">
              Event Location * {geocoding && <span className="text-neon-blue">Looking up location...</span>}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label htmlFor="event-venue" className="block text-[10px] text-slate-600 mb-0.5">Venue / College</label>
                <input
                  id="event-venue"
                  placeholder="e.g. Main Auditorium"
                  value={form.venue}
                  onChange={(e) => update("venue", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="event-city" className="block text-[10px] text-slate-600 mb-0.5">City *</label>
                <input
                  id="event-city"
                  required
                  placeholder="e.g. Coimbatore"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="event-state" className="block text-[10px] text-slate-600 mb-0.5">State *</label>
                <select
                  id="event-state"
                  required
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select state</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="event-maps-link" className="block text-[10px] text-slate-600 mb-0.5">Google Maps Link</label>
              <input
                id="event-maps-link"
                placeholder="Paste any Google Maps link (short links work too)"
                onPaste={(e) => {
                  setTimeout(() => handleMapsLink(e.clipboardData.getData("text")), 0);
                }}
                onBlur={(e) => handleMapsLink(e.currentTarget.value)}
                className={inputClass}
              />
              {resolving && <p className="text-[10px] text-neon-blue mt-1">Resolving location link...</p>}
              {!resolving && detectedAddr && (
                <p className="text-[10px] text-green-400 mt-1">Location pinned successfully</p>
              )}
            </div>
            {pinLat && pinLng && (
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <MapPin size={10} className="text-neon-blue" />
                Pinned at {pinLat.toFixed(4)}, {pinLng.toFixed(4)}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!navigator.geolocation) return;
                  setGeocoding(true);
                  navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                      const { latitude: lat, longitude: lng } = pos.coords;
                      setPinLat(lat);
                      setPinLng(lng);
                      userPinnedRef.current = true;
                      // Reverse geocode to fill city/state and show detected address
                      try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { "User-Agent": "FestFind/1.0" } });
                        const data = await res.json();
                        const addr = data.address || {};
                        const city = addr.city || addr.town || addr.village || addr.county || "";
                        const state = addr.state || "";
                        const road = addr.road || addr.neighbourhood || addr.suburb || "";
                        if (city) update("city", city);
                        if (state) update("state", state);
                        if (road) update("venue", road);
                        setDetectedAddr(data.display_name || "");
                      } catch {}
                      setGeocoding(false);
                    },
                    () => { setGeocoding(false); },
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                }}
                disabled={geocoding}
                className="flex items-center gap-1.5 rounded-lg bg-neon-blue/10 border border-neon-blue/20 px-3 py-1.5 text-[11px] text-neon-blue hover:bg-neon-blue/20 transition disabled:opacity-50"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
                {geocoding ? "Locating..." : "Use my current location"}
              </button>
            </div>
            {detectedAddr && (
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Detected: <span className="text-slate-400">{detectedAddr.split(",").slice(0, 4).join(",")}</span>
                <span className="text-neon-blue ml-1">— search above to pin exact venue</span>
              </p>
            )}
            {/* Small preview map with search */}
            <div className="relative rounded-lg overflow-hidden border border-white/[0.08]">
              <div className="absolute top-2 left-2 right-2 z-[500]">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search venue or landmark..."
                    value={locSearch}
                    onChange={(e) => handleLocSearch(e.target.value)}
                    onFocus={() => locResults.length > 0 && setShowLocResults(true)}
                    onBlur={() => setTimeout(() => setShowLocResults(false), 200)}
                    className="w-full rounded-lg bg-[#0a0a0f]/90 backdrop-blur-sm border border-white/[0.08] px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-neon-blue/50 transition"
                  />
                  {locSearching && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <div className="w-3 h-3 border-2 border-slate-500 border-t-neon-blue rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {showLocResults && locResults.length > 0 && (
                  <div className="mt-1 rounded-lg bg-[#0a0a0f]/95 backdrop-blur-sm border border-white/[0.08] shadow-xl overflow-hidden max-h-36 overflow-y-auto">
                    {locResults.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => selectLocResult(r)}
                        className="w-full px-3 py-2 text-left text-[11px] text-slate-300 hover:bg-neon-blue/10 transition border-b border-white/[0.04] last:border-0"
                      >
                        {r.display}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div ref={previewMapRef} className="w-full h-[200px]" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="event-start" className="block text-xs text-slate-500 mb-1">Start Date *</label>
            <input
              id="event-start"
              type="datetime-local"
              required
              value={form.start_date}
              onChange={(e) => update("start_date", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="event-end" className="block text-xs text-slate-500 mb-1">End Date *</label>
            <input
              id="event-end"
              type="datetime-local"
              required
              value={form.end_date}
              onChange={(e) => update("end_date", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="event-deadline" className="block text-xs text-slate-500 mb-1">Registration Deadline</label>
            <input
              id="event-deadline"
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => update("deadline", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="event-url" className="block text-xs text-slate-500 mb-1">Registration URL</label>
            <input
              id="event-url"
              placeholder="https://..."
              value={form.event_url}
              onChange={(e) => update("event_url", e.target.value)}
              onBlur={() => markTouched("event_url")}
              className={inputClass}
            />
            {touched.event_url && form.event_url && !form.event_url.startsWith("http") && (
              <p className="text-[10px] text-red-400 mt-0.5">URL must start with http:// or https://</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">
            Event Poster {form.event_type === "physical" ? "* (for verification)" : ""}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
            id="event-image-upload"
          />
          {form.image_url ? (
            <div className="relative rounded-lg overflow-hidden border border-white/[0.08]">
              <img src={form.image_url} alt="Event poster" className="w-full h-40 object-cover" />
              <button
                type="button"
                onClick={() => update("image_url", "")}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="event-image-upload"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/[0.08] bg-white/[0.02] py-8 px-4 cursor-pointer hover:border-neon-blue/40 hover:bg-neon-blue/[0.03] transition ${uploading ? "pointer-events-none opacity-60" : ""}`}
            >
              <Upload size={24} className="text-slate-500" />
              <div className="text-center">
                <p className="text-sm text-slate-400">{uploading ? "Uploading..." : "Click or drag to upload"}</p>
                <p className="text-[10px] text-slate-600 mt-1">JPEG, PNG, WebP, or GIF — max 5MB</p>
              </div>
            </label>
          )}
          {uploadError && <p className="text-[10px] text-red-400 mt-1">{uploadError}</p>}
        </div>

        {result === "error" && (
          <p className="text-sm text-red-400" role="alert">Something went wrong. Please check your connection and try again.</p>
        )}

        {form.title && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">Preview</p>
            <div className="flex items-start gap-3">
              {form.image_url && form.image_url.startsWith("http") && (
                <img src={form.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{form.title}</p>
                {form.category && <span className="inline-block mt-1 text-[10px] font-semibold text-neon-blue bg-neon-blue/15 rounded-full px-2 py-0.5">{form.category}</span>}
                {form.start_date && <p className="text-[11px] text-slate-400 mt-1">{new Date(form.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}{form.end_date ? ` — ${new Date(form.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}</p>}
                {form.city && <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1"><MapPin size={10} /> {form.venue ? `${form.venue}, ` : ""}{form.city}{form.state ? `, ${form.state}` : ""}</p>}
                {form.fee === "paid" && form.fee_amount && <p className="text-[11px] text-slate-500 mt-0.5">Entry: ₹{form.fee_amount}</p>}
                {form.fee === "free" && <p className="text-[11px] text-green-400 mt-0.5">Free Entry</p>}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-neon-blue px-6 py-3 text-sm font-semibold text-black hover:bg-neon-blue/80 transition disabled:opacity-50 min-h-[44px]"
          >
            {submitting ? "Submitting..." : "Submit for Review"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-6 py-3 text-sm text-slate-400 hover:text-white hover:border-slate-500 transition min-h-[44px]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
