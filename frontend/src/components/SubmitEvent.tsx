import { useState, useRef } from "react";
import { createEvent, uploadImage, reverseGeocode } from "../utils/api";
import { Sparkles, Upload, X, MapPin } from "./Icons";
import { MapPicker } from "./MapPicker";

const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu & Kashmir","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

interface Props {
  onClose: () => void;
  onSubmitted?: () => void;
  token?: string;
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

  const markTouched = (key: string) => setTouched((t) => ({ ...t, [key]: true }));

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handlePin = async (lat: number, lng: number) => {
    setPinLat(lat);
    setPinLng(lng);
    // Auto-fill city/state from reverse geocode
    if (!form.city || !form.state) {
      setGeocoding(true);
      try {
        const addr = await reverseGeocode(lat, lng);
        if (addr.city && !form.city) update("city", addr.city);
        if (addr.state && !form.state) update("state", addr.state);
        if (addr.venue && !form.venue) update("venue", addr.venue);
      } catch {
        // silently fail — user can fill manually
      } finally {
        setGeocoding(false);
      }
    }
  };

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
    if (!form.title) return;
    if (form.event_type === "physical" && !pinLat) return;
    setSubmitting(true);
    setResult(null);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description || undefined,
        organizer: form.organizer || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        venue: form.venue || undefined,
        category: form.category || undefined,
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
      setForm({ title: "", description: "", organizer: "", city: "", state: "", venue: "", category: "", start_date: "", end_date: "", event_url: "", image_url: "", contact: "", deadline: "", fee: "free", fee_amount: "", event_type: "physical" });
      setPinLat(null);
      setPinLng(null);
    } catch {
      setResult("error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg glass-light border border-transparent px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-neon-blue transition min-h-[44px]";

  if (result === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 sm:py-20 text-center px-4 safe-top">
        <div className="flex justify-center"><Sparkles size={48} className="text-neon-blue" /></div>
        <h2 className="text-xl font-bold text-white">Event Submitted!</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Your event is live on the map.
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
            placeholder="Event Name *"
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
          <label htmlFor="event-organizer" className="block text-xs text-slate-500 mb-1">Organizer / College</label>
          <input
            id="event-organizer"
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
            maxLength={500}
            rows={3}
            className={inputClass}
          />
          <p className="text-[10px] text-slate-600 mt-0.5">{form.description.length}/500</p>
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
            <label htmlFor="event-category" className="block text-xs text-slate-500 mb-1">Category</label>
            <select
              id="event-category"
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

        {/* Map picker for physical events */}
        {form.event_type === "physical" && (
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Event Location * {geocoding && <span className="text-neon-blue">Looking up address...</span>}
            </label>
            <MapPicker lat={pinLat} lng={pinLng} onPick={handlePin} autoSearchQuery={form.organizer} />
            {!pinLat && <p className="text-[10px] text-slate-600 mt-1">Click on the map to pin your event location</p>}
          </div>
        )}

        {/* Venue + city/state — shown when pin is dropped */}
        {form.event_type === "physical" && pinLat && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label htmlFor="event-venue" className="block text-xs text-slate-500 mb-1">Venue Name</label>
              <input
                id="event-venue"
                placeholder="e.g. Main Auditorium"
                value={form.venue}
                onChange={(e) => update("venue", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="event-city" className="block text-xs text-slate-500 mb-1">City</label>
              <input
                id="event-city"
                placeholder="City"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="event-state" className="block text-xs text-slate-500 mb-1">State</label>
              <select
                id="event-state"
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
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label htmlFor="event-start" className="block text-xs text-slate-500 mb-1">Start Date</label>
            <input
              id="event-start"
              type="datetime-local"
              value={form.start_date}
              onChange={(e) => update("start_date", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="event-end" className="block text-xs text-slate-500 mb-1">End Date</label>
            <input
              id="event-end"
              type="datetime-local"
              value={form.end_date}
              onChange={(e) => update("end_date", e.target.value)}
              className={inputClass}
            />
          </div>
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

        <div>
          <label className="block text-xs text-slate-500 mb-1">Event Poster</label>
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
            disabled={submitting || !form.title || (form.event_type === "physical" && !pinLat)}
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
