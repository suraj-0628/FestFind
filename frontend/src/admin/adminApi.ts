const API = "/api/admin";

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function req(path: string, token: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, { ...opts, headers: authHeaders(token) });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = text ? JSON.parse(text) : { detail: res.statusText };
    throw new Error(err.detail || "Request failed");
  }
  if (res.headers.get("content-type")?.includes("text/csv")) {
    return res.blob();
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const adminApi = {
  overview: (t: string) => req("/overview", t),
  scraperStatus: (t: string) => req("/scraper/status", t),
  scraperRun: (t: string) => req("/scraper/run", t, { method: "POST" }),

  users: (t: string, p = 1, s = "", sz = 20) =>
    req(`/users?page=${p}&page_size=${sz}&search=${encodeURIComponent(s)}`, t),
  userCount: (t: string) => req("/users/count", t),
  toggleAdmin: (t: string, id: string) => req(`/users/${id}/admin`, t, { method: "PUT" }),
  toggleActive: (t: string, id: string) => req(`/users/${id}/active`, t, { method: "PUT" }),
  deleteUser: (t: string, id: string) => req(`/users/${id}`, t, { method: "DELETE" }),

  events: (t: string, p = 1, status = "", s = "", sz = 20) =>
    req(`/events?page=${p}&page_size=${sz}&status=${status}&search=${encodeURIComponent(s)}`, t),
  allEvents: (t: string, limit = 500) => req(`/events/all?limit=${limit}`, t),
  eventCount: (t: string, status = "") => req(`/events/count?status=${status}`, t),
  approveEvent: (t: string, id: string) => req(`/events/${id}/approve`, t, { method: "PUT" }),
  rejectEvent: (t: string, id: string) => req(`/events/${id}/reject`, t, { method: "PUT" }),
  deleteEvent: (t: string, id: string) => req(`/events/${id}`, t, { method: "DELETE" }),
  bulkApprove: (t: string, ids: string[]) => req("/events/bulk-approve", t, { method: "PUT", body: JSON.stringify(ids) }),
  bulkReject: (t: string, ids: string[]) => req("/events/bulk-reject", t, { method: "PUT", body: JSON.stringify(ids) }),
  bulkDelete: (t: string, ids: string[]) => req("/events/bulk-delete", t, { method: "DELETE", body: JSON.stringify(ids) }),

  announcements: (t: string) => req("/announcements", t),
  createAnnouncement: (t: string, title: string, message: string) =>
    req("/announcements", t, { method: "POST", body: JSON.stringify({ title, message }) }),
  toggleAnnouncement: (t: string, id: string) => req(`/announcements/${id}/toggle`, t, { method: "PUT" }),
  deleteAnnouncement: (t: string, id: string) => req(`/announcements/${id}`, t, { method: "DELETE" }),

  flags: (t: string) => req("/flags", t),
  updateFlag: (t: string, key: string, value: boolean) =>
    req(`/flags/${key}`, t, { method: "PUT", body: JSON.stringify({ value }) }),

  systemHealth: (t: string) => req("/system/health", t),
  systemLogs: (t: string, lines = 100) => req(`/system/logs?lines=${lines}`, t),

  exportEvents: async (t: string) => {
    const res = await fetch(`${API}/export/events`, { headers: authHeaders(t) });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "festfind_events.csv"; a.click();
    URL.revokeObjectURL(url);
  },
  exportUsers: async (t: string) => {
    const res = await fetch(`${API}/export/users`, { headers: authHeaders(t) });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "festfind_users.csv"; a.click();
    URL.revokeObjectURL(url);
  },
};
