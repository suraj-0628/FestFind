import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { adminApi } from "./adminApi";
import { AdminOverview } from "./pages/Overview";
import { AdminScraper } from "./pages/Scraper";
import { AdminUsers } from "./pages/Users";
import { AdminEvents } from "./pages/Events";
import { AdminHealth } from "./pages/Health";
import { AdminAnnouncements } from "./pages/Announcements";
import { AdminFlags } from "./pages/Flags";
import { AdminMap } from "./pages/AdminMap";

type Page = "overview" | "scraper" | "users" | "events" | "submissions" | "health" | "announcements" | "flags" | "map";

const NAV = [
  { id: "overview" as Page, label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { id: "scraper" as Page, label: "Scraper", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
  { id: "events" as Page, label: "Events", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id: "submissions" as Page, label: "Submissions", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "users" as Page, label: "Team", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { id: "health" as Page, label: "System", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { id: "announcements" as Page, label: "Banner", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
  { id: "flags" as Page, label: "Flags", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" },
  { id: "map" as Page, label: "Map", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
];

export function AdminApp() {
  const { user, token, logout, loading, login } = useAuth();
  const [page, setPage] = useState<Page>("overview");
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#0a0a0f] text-white">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError("");
      setLoginLoading(true);
      try {
        await login(loginEmail, loginPass);
      } catch (err: any) {
        setLoginError(err.message || "Login failed");
      }
      setLoginLoading(false);
    };

    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#0a0a0f] text-white">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 p-6">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold"><span className="text-neon-blue">Fest</span>Find Admin</h1>
          </div>
          {loginError && <div className="text-red-400 text-xs text-center bg-red-500/10 rounded-lg p-2">{loginError}</div>}
          <input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPass}
            onChange={(e) => setLoginPass(e.target.value)}
            required
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-2.5 bg-neon-blue text-black font-semibold rounded-lg text-sm disabled:opacity-50"
          >
            {loginLoading ? "Logging in..." : "Login"}
          </button>
          <div className="text-center">
            <a href="/" className="text-xs text-slate-500 hover:text-white">Back to FestFind</a>
          </div>
        </form>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#0a0a0f] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-4">Admin access required for {user.email}</p>
          <button onClick={logout} className="text-neon-blue hover:underline text-sm mr-4">Login as different user</button>
          <a href="/" className="text-slate-500 hover:text-white text-sm">Go back to FestFind</a>
        </div>
      </div>
    );
  }

  const handleNav = (p: Page) => {
    setPage(p);
    setSidebarOpen(false);
  };

  return (
    <div className="h-[100dvh] flex bg-[#0a0a0f] text-white overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#0d0d14] border-r border-white/[0.06] flex flex-col shrink-0 transition-transform`}>
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-neon-blue">Fest</span>Find <span className="text-xs font-normal text-slate-500">Admin</span>
            </h1>
            <a href="/" className="text-xs text-slate-500 hover:text-white">Site</a>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => handleNav(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                page === n.id
                  ? "bg-neon-blue/10 text-neon-blue"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={n.icon} />
              </svg>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/[0.06]">
          <div className="text-xs text-slate-500 mb-2 truncate">{user.name}</div>
          <button onClick={logout} className="w-full text-left text-xs text-slate-400 hover:text-white transition px-1">
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 p-3 border-b border-white/[0.06]">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-white/[0.06]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-sm font-bold"><span className="text-neon-blue">Fest</span>Find Admin</h1>
        </div>

        <main className="flex-1 overflow-y-auto">
          {page === "overview" && <AdminOverview token={token!} />}
          {page === "scraper" && <AdminScraper token={token!} />}
          {page === "events" && <AdminEvents token={token!} />}
          {page === "submissions" && <AdminEvents token={token!} isUserSubmitted={true} />}
          {page === "users" && <AdminUsers token={token!} />}
          {page === "health" && <AdminHealth token={token!} />}
          {page === "announcements" && <AdminAnnouncements token={token!} />}
          {page === "flags" && <AdminFlags token={token!} />}
          {page === "map" && <AdminMap token={token!} />}
        </main>
      </div>
    </div>
  );
}
