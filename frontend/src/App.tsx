import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation as useRouterLocation } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { IndiaMap } from "./components/IndiaMap";
import { EventSidebar } from "./components/EventSidebar";
import { MobileEventList } from "./components/MobileEventList";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { LocateMeButton } from "./components/LocateMeButton";
import { useEvents } from "./hooks/useEvents";
import { useLocation } from "./hooks/useLocation";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { EventData } from "./utils/api";
import { Map, Globe, Edit, MapPin, FestFindWordmark } from "./components/Icons";

const OnlineEvents = lazy(() => import("./components/OnlineEvents"));
const SubmitEvent = lazy(() => import("./components/SubmitEvent"));
const LoginPage = lazy(() => import("./components/LoginPage"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));

const SITE = "https://festfind.live";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

function AppContent() {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [mobileSplit, setMobileSplit] = useState(55);
  const [refreshKey, setRefreshKey] = useState(0);
  const dragRef = useRef<{ startY: number; startSplit: number } | null>(null);
  const navigate = useNavigate();

  const loc = useLocation();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const routerLoc = useRouterLocation();
  const isMapPage = routerLoc.pathname === "/";

  const eventFilters = useMemo(() => {
    const f: { event_type: string; search?: string; refreshKey?: number } = { event_type: "physical", refreshKey };
    if (search) f.search = search;
    return f;
  }, [search, refreshKey]);

  const { events, loading, error } = useEvents(eventFilters);
  const domesticEvents = useMemo(() => events.filter((e) => e.state && e.state !== "NA"), [events]);

  const nearbyEvents = useMemo(() => {
    if (!loc.lat || !loc.lng || loc.status !== "ready") return [];
    return domesticEvents
      .filter((e) => e.latitude != null && e.longitude != null)
      .map((e) => ({
        event: e,
        dist: haversineKm(loc.lat, loc.lng, e.latitude!, e.longitude!),
      }))
      .filter((x) => x.dist <= 150)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 10)
      .map((x) => x.event);
  }, [domesticEvents, loc.lat, loc.lng, loc.status]);

  const userLocObj = useMemo(() => {
    if (loc.status !== "ready" || !loc.lat) return null;
    return { lat: loc.lat, lng: loc.lng, city: loc.city, state: loc.state };
  }, [loc.status, loc.lat, loc.lng, loc.city, loc.state]);

  const handleLocateMe = useCallback(() => { loc.locateMe(); }, [loc]);
  const handleSelectEvent = useCallback((e: EventData | null) => { setSelectedEvent(e); }, []);

  const handleDragStart = useCallback((e: React.TouchEvent) => {
    dragRef.current = { startY: e.touches[0].clientY, startSplit: mobileSplit };
  }, [mobileSplit]);

  const handleDragMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current) return;
    const dy = e.touches[0].clientY - dragRef.current.startY;
    const delta = (dy / window.innerHeight) * 100;
    setMobileSplit(Math.min(80, Math.max(25, dragRef.current.startSplit + delta)));
  }, []);

  const handleDragEnd = useCallback(() => { dragRef.current = null; }, []);

  const handleSelectCard = useCallback((e: EventData) => {
    navigate(`/event/${e.id}`);
  }, [navigate]);

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#0a0a0f] overflow-hidden">
      <Helmet>
        <title>FestFind — Discover College Events Across India</title>
        <meta name="description" content="India's interactive map platform for discovering and hosting college festivals, tech events, and cultural fests." />
        <link rel="canonical" href={SITE} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="FestFind — Discover College Events Across India" />
        <meta property="og:description" content="Explore ongoing, upcoming, and past college events on an interactive India map." />
        <meta property="og:url" content={SITE} />
        <meta property="og:image" content={`${SITE}/og-default.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FestFind — Discover College Events Across India" />
        <meta name="twitter:image" content={`${SITE}/og-default.png`} />
      </Helmet>

      {/* Header */}
      <header className="border-b border-white/[0.08] glass z-20 shrink-0 safe-top">
        <div className="flex items-center justify-between px-4 sm:px-6 pt-3 pb-2.5 sm:pt-4 sm:pb-3 gap-3 sm:gap-4">
          <div className="flex items-center shrink-0">
            <NavLink to="/">
              <FestFindWordmark />
            </NavLink>
          </div>

          <nav aria-label="Main navigation" className="flex items-center gap-2">
            <div role="tablist" className="flex items-center gap-0.5 sm:gap-1">
              {([
                { to: "/", Icon: Map, fullLabel: "Map" },
                { to: "/online", Icon: Globe, fullLabel: "Online" },
                { to: "/submit", Icon: Edit, fullLabel: "Host" },
              ]).map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.to === "/"}
                  onClick={(e) => {
                    if (t.to === "/submit" && !user) {
                      e.preventDefault();
                      navigate("/login");
                    }
                  }}
                  className={({ isActive }) =>
                    `rounded-lg px-2 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold transition min-h-[44px] flex items-center gap-1 sm:gap-1.5 ${
                      isActive
                        ? "bg-neon-blue text-black"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`
                  }
                >
                  <t.Icon size={14} />
                  <span className="hidden sm:inline">{t.fullLabel}</span>
                </NavLink>
              ))}
            </div>
            {user && (
              <div className="flex items-center gap-2 ml-1 pl-2 border-l border-white/[0.08]">
                <span className="text-[11px] text-slate-400 hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                <button onClick={logout} className="text-[11px] text-slate-500 hover:text-white transition">Logout</button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex overflow-hidden">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/event/:id" element={<EventDetailPage />} />
            <Route path="/online" element={<OnlineEvents />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/submit" element={user ? <SubmitEvent onClose={() => navigate("/")} onSubmitted={() => { setRefreshKey((k) => k + 1); navigate("/"); }} /> : <Navigate to="/login" replace />} />
            <Route path="/" element={
              isMapPage ? (
                <>
                  {/* Desktop: sidebar + map */}
                  {isDesktop && (
                    <div className="flex-1 flex overflow-hidden relative">
                      <div className="w-[380px] shrink-0 overflow-hidden" role="complementary" aria-label="Events sidebar">
                        {error ? (
                          <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
                            <p className="text-sm text-red-400">{error}</p>
                            <button onClick={() => window.location.reload()} className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700 transition min-h-[44px]">Retry</button>
                          </div>
                        ) : (
                          <EventSidebar
                            events={domesticEvents}
                            loading={loading}
                            search={search}
                            onSearchChange={setSearch}
                            onSelectEvent={handleSelectCard}
                            selectedId={selectedEvent?.id ?? null}
                            nearbyEvents={nearbyEvents}
                          />
                        )}
                      </div>
                      <div className="flex-1 relative">
                        <IndiaMap
                          events={events}
                          onSelect={handleSelectEvent}
                          selectedId={selectedEvent?.id ?? null}
                          userLocation={userLocObj}
                          nearbyEvents={nearbyEvents}
                        />
                        <LocateMeButton onClick={handleLocateMe} />
                        <div className="absolute bottom-16 left-4 z-10 rounded-xl glass-map px-3 py-2 flex flex-col gap-1.5 text-[10px]">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />Ongoing</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-400 shadow-[0_0_6px_rgba(244,114,182,0.6)]" />Upcoming</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" />Past</span>
                          </div>
                          {nearbyEvents.length > 0 && (
                            <div className="border-t border-white/[0.06] pt-1.5">
                              <div className="text-blue-400 font-semibold mb-0.5 text-[10px] flex items-center gap-1"><MapPin size={10} className="text-blue-400" /> Nearby You</div>
                              {nearbyEvents.slice(0, 3).map((e) => (
                                <button key={e.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/[0.04] rounded px-1 py-0.5 -mx-1 w-full text-left" onClick={() => handleSelectCard(e)}>
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${e.start_date && new Date(e.start_date) <= new Date() ? "bg-green-500" : "bg-pink-400"}`} />
                                  <span className="text-slate-300 truncate text-[10px]">{e.title}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mobile: map + list */}
                  {!isDesktop && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="relative" style={{ height: `${mobileSplit}%` }}>
                        <IndiaMap
                          events={events}
                          onSelect={handleSelectEvent}
                          selectedId={selectedEvent?.id ?? null}
                          userLocation={userLocObj}
                          nearbyEvents={nearbyEvents}
                        />
                        <LocateMeButton onClick={handleLocateMe} />
                        <div className="absolute top-2 left-2 z-[1000] rounded-lg glass-map px-2 py-1 flex items-center gap-2 text-[9px]">
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Live</span>
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-pink-400" />Soon</span>
                        </div>
                      </div>
                      <div
                        className="relative h-3 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 touch-none z-20 bg-[#0a0a0f]"
                        onTouchStart={handleDragStart}
                        onTouchMove={handleDragMove}
                        onTouchEnd={handleDragEnd}
                        onMouseDown={(e) => {
                          const start = { startY: e.clientY, startSplit: mobileSplit };
                          const onMove = (ev: MouseEvent) => {
                            const dy = ev.clientY - start.startY;
                            setMobileSplit(Math.min(80, Math.max(25, start.startSplit + (dy / window.innerHeight) * 100)));
                          };
                          const onUp = () => {
                            document.removeEventListener("mousemove", onMove);
                            document.removeEventListener("mouseup", onUp);
                          };
                          document.addEventListener("mousemove", onMove);
                          document.addEventListener("mouseup", onUp);
                        }}
                      >
                        <div className="w-10 h-1 rounded-full bg-slate-600" />
                      </div>
                      <div className="flex-1 min-h-0 overflow-hidden">
                        {error ? (
                          <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
                            <p className="text-sm text-red-400">{error}</p>
                            <button onClick={() => window.location.reload()} className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white min-h-[44px]">Retry</button>
                          </div>
                        ) : (
                          <MobileEventList
                            events={domesticEvents}
                            loading={loading}
                            search={search}
                            onSearchChange={setSearch}
                            onSelectEvent={handleSelectCard}
                            selectedId={selectedEvent?.id ?? null}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : null
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
