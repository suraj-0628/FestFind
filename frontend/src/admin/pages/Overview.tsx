import { useState, useEffect } from "react";
import { adminApi } from "../adminApi";

export function AdminOverview({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.overview(token).then(setData).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="p-6 text-slate-400">Loading...</div>;
  if (!data) return <div className="p-6 text-red-400">Failed to load</div>;

  const cards = [
    { label: "Total Events", value: data.events.total, color: "text-white" },
    { label: "Approved", value: data.events.approved, color: "text-green-400" },
    { label: "Pending Review", value: data.events.pending, color: "text-yellow-400" },
    { label: "Ongoing", value: data.events.ongoing, color: "text-green-500" },
    { label: "Upcoming", value: data.events.upcoming, color: "text-pink-400" },
    { label: "Total Users", value: data.users.total, color: "text-neon-blue" },
    { label: "New (7d)", value: data.users.recent_7d, color: "text-cyan-400" },
    { label: "Geocoded", value: `${data.coverage.geocoded_pct}%`, color: "text-purple-400" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-1">{c.label}</div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3 text-slate-300">Top Categories</h3>
          <div className="space-y-2">
            {data.top_categories.map((c: any) => (
              <div key={c.name} className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{c.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neon-blue rounded-full"
                      style={{ width: `${(c.count / data.events.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right">{c.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3 text-slate-300">Top States</h3>
          <div className="space-y-2">
            {data.top_states.map((s: any) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{s.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pink-400 rounded-full"
                      style={{ width: `${(s.count / data.events.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right">{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
          <div className="text-xs text-slate-500 mb-1">States Covered</div>
          <div className="text-xl font-bold text-white">{data.coverage.states}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
          <div className="text-xs text-slate-500 mb-1">Cities Covered</div>
          <div className="text-xl font-bold text-white">{data.coverage.cities}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
          <div className="text-xs text-slate-500 mb-1">Scraped Events</div>
          <div className="text-xl font-bold text-white">{data.events.scraped}</div>
        </div>
      </div>
    </div>
  );
}
