const API = "/api/admin";

async function req(path: string, opts?: RequestInit) {
  const headers: Record<string, string> = { ...(opts?.headers as Record<string, string> || {}) };
  if (opts?.body && typeof opts.body === "string") {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API}${path}`, { ...opts, headers, credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = res.statusText;
    try { detail = text ? JSON.parse(text).detail || detail : detail; } catch {}
    throw new Error(detail || "Request failed");
  }
  if (res.headers.get("content-type")?.includes("text/csv")) {
    return res.blob();
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const adminApi = {
  overview: () => req("/overview"),
  scraperStatus: () => req("/scraper/status"),
  scraperRun: () => req("/scraper/run", { method: "POST" }),

  users: (p = 1, s = "", sz = 20) =>
    req(`/users?page=${p}&page_size=${sz}&search=${encodeURIComponent(s)}`),
  userCount: () => req("/users/count"),
  toggleAdmin: (id: string) => req(`/users/${id}/admin`, { method: "PUT" }),
  toggleActive: (id: string) => req(`/users/${id}/active`, { method: "PUT" }),
  deleteUser: (id: string) => req(`/users/${id}`, { method: "DELETE" }),
  searchUsers: (q: string) => req(`/users/search?q=${encodeURIComponent(q)}`),
  promoteUser: (id: string, role: string) => req(`/users/${id}/promote`, { method: "PUT", body: JSON.stringify({ role }) }),
  setRole: (id: string, role: string) => req(`/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  createTeamMember: (name: string, email: string, password: string, role: string) =>
    req("/users/create", { method: "POST", body: JSON.stringify({ name, email, password, role }) }),

  events: (p = 1, status = "", s = "", sz = 20, isUserSubmitted?: boolean) => {
    let url = `/events?page=${p}&page_size=${sz}&status=${status}&search=${encodeURIComponent(s)}`;
    if (isUserSubmitted !== undefined) url += `&is_user_submitted=${isUserSubmitted}`;
    return req(url);
  },
  allEvents: (limit = 500) => req(`/events/all?limit=${limit}`),
  eventCount: (status = "", isUserSubmitted?: boolean) => {
    let url = `/events/count?status=${status}`;
    if (isUserSubmitted !== undefined) url += `&is_user_submitted=${isUserSubmitted}`;
    return req(url);
  },
  approveEvent: (id: string) => req(`/events/${id}/approve`, { method: "PUT" }),
  rejectEvent: (id: string) => req(`/events/${id}/reject`, { method: "PUT" }),
  deleteEvent: (id: string) => req(`/events/${id}`, { method: "DELETE" }),
  bulkApprove: (ids: string[]) => req("/events/bulk-approve", { method: "PUT", body: JSON.stringify(ids) }),
  bulkReject: (ids: string[]) => req("/events/bulk-reject", { method: "PUT", body: JSON.stringify(ids) }),
  bulkDelete: (ids: string[]) => req("/events/bulk-delete", { method: "POST", body: JSON.stringify(ids) }),

  announcements: () => req("/announcements"),
  createAnnouncement: (title: string, message: string) =>
    req("/announcements", { method: "POST", body: JSON.stringify({ title, message }) }),
  toggleAnnouncement: (id: string) => req(`/announcements/${id}/toggle`, { method: "PUT" }),
  deleteAnnouncement: (id: string) => req(`/announcements/${id}`, { method: "DELETE" }),

  flags: () => req("/flags"),
  updateFlag: (key: string, value: boolean) =>
    req(`/flags/${key}`, { method: "PUT", body: JSON.stringify({ value }) }),

  systemHealth: () => req("/system/health"),
  systemLogs: (lines = 100) => req(`/system/logs?lines=${lines}`),

  exportEvents: async () => {
    const res = await fetch(`${API}/export/events`, { credentials: "include" });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "festfind_events.csv"; a.click();
    URL.revokeObjectURL(url);
  },
  exportUsers: async () => {
    const res = await fetch(`${API}/export/users`, { credentials: "include" });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "festfind_users.csv"; a.click();
    URL.revokeObjectURL(url);
  },
};
