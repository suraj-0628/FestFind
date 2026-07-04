const API_BASE = "/api/events";
const UPLOAD_BASE = "/api/upload";
const AUTH_BASE = "/api/auth";

export interface EventData {
  id: string;
  title: string;
  description: string | null;
  event_url: string | null;
  source_url: string | null;
  start_date: string | null;
  end_date: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string | null;
  tags: string | null;
  organizer: string | null;
  image_url: string | null;
  poster_url: string | null;
  event_type: "physical" | "online";
  is_scraped: boolean;
  is_user_submitted: boolean;
  is_approved: boolean;
}

export interface EventListResponse {
  items: EventData[];
  total: number;
  page: number;
  page_size: number;
}

export async function fetchEvents(params?: {
  page?: number;
  page_size?: number;
  city?: string;
  state?: string;
  category?: string;
  event_type?: string;
  status?: string;
  search?: string;
}): Promise<EventListResponse> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  if (params?.city) sp.set("city", params.city);
  if (params?.state) sp.set("state", params.state);
  if (params?.category) sp.set("category", params.category);
  if (params?.event_type) sp.set("event_type", params.event_type);
  if (params?.status) sp.set("status", params.status);
  if (params?.search) sp.set("search", params.search);

  const url = `${API_BASE}/?${sp.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch events");
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) throw new Error("Unexpected response format");
  return res.json();
}

export async function createEvent(data: {
  title: string;
  description?: string;
  event_url?: string;
  start_date?: string;
  end_date?: string;
  venue?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  tags?: string;
  organizer?: string;
  image_url?: string;
  event_type?: string;
}, token?: string): Promise<EventData> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(API_BASE + "/", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create event");
  return res.json();
}

export function getEventStatus(e: EventData): "ongoing" | "upcoming" | "past" {
  const now = new Date();
  if (!e.start_date) return "upcoming";
  const start = new Date(e.start_date);
  const end = e.end_date ? new Date(e.end_date) : null;
  if (end) {
    const dayMs = 86400000;
    if (start.getTime() === end.getTime()) {
      end.setTime(end.getTime() + dayMs - 1);
    }
  }
  if (start <= now && (!end || end >= now)) return "ongoing";
  if (start > now) return "upcoming";
  return "past";
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(UPLOAD_BASE + "/", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  const data = await res.json();
  return data.url;
}

export async function reverseGeocode(lat: number, lng: number): Promise<{ venue: string; city: string; state: string; display: string }> {
  const res = await fetch(`${API_BASE}/reverse-geocode?lat=${lat}&lng=${lng}`);
  if (!res.ok) throw new Error("Reverse geocode failed");
  return res.json();
}

export async function authRegister(name: string, email: string, password: string): Promise<{ token: string; user: { id: string; email: string; name: string; is_admin?: boolean } }> {
  const res = await fetch(`${AUTH_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Registration failed");
  return data;
}

export async function authLogin(email: string, password: string): Promise<{ token: string; user: { id: string; email: string; name: string; is_admin?: boolean } }> {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Login failed");
  return data;
}

export async function authMe(token: string): Promise<{ id: string; email: string; name: string; is_admin?: boolean }> {
  const res = await fetch(`${AUTH_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}
