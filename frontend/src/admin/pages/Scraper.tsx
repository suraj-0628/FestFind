import { useState, useEffect } from "react";
import { adminApi } from "../adminApi";

export function AdminScraper() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const refresh = () => adminApi.scraperStatus().then(setStatus).finally(() => setLoading(false));

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, status?.is_running ? 5000 : 30000);
    return () => clearInterval(i);
  }, [status?.is_running]);

  const handleRun = async () => {
    setRunning(true);
    try {
      await adminApi.scraperRun();
      setTimeout(refresh, 2000);
    } catch (e: any) {
      alert(e.message);
    }
    setRunning(false);
  };

  if (loading) return <div className="p-6 text-slate-400">Loading...</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Scraper</h2>
        <button
          onClick={handleRun}
          disabled={running || status?.is_running}
          className="px-4 py-2 bg-neon-blue text-black font-semibold rounded-lg text-sm disabled:opacity-40 hover:bg-neon-blue/80 transition"
        >
          {running || status?.is_running ? "Running..." : "Run Now"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="Status" value={status?.is_running ? "Running" : "Idle"} color={status?.is_running ? "text-green-400" : "text-slate-400"} />
        <Card label="Last Run" value={status?.last_run ? new Date(status.last_run).toLocaleString() : "Never"} />
        <Card label="Duration" value={status?.last_duration_sec ? `${status.last_duration_sec}s` : "-"} />
        <Card label="Events Found" value={String(status?.events_found ?? 0)} />
        <Card label="New" value={String(status?.events_new ?? 0)} color="text-green-400" />
        <Card label="Skipped" value={String(status?.events_skipped ?? 0)} color="text-yellow-400" />
        <Card label="Errors" value={String(status?.errors ?? 0)} color={status?.errors > 0 ? "text-red-400" : "text-slate-400"} />
        <Card label="Updated" value={String(status?.events_updated ?? 0)} />
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3 text-slate-300">Recent History</h3>
        {status?.history?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-white/[0.06]">
                  <th className="text-left py-2 pr-4">Time</th>
                  <th className="text-left py-2 pr-4">Found</th>
                  <th className="text-left py-2 pr-4">New</th>
                  <th className="text-left py-2 pr-4">Skipped</th>
                  <th className="text-left py-2 pr-4">Errors</th>
                  <th className="text-left py-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {[...status.history].reverse().map((h: any, i: number) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    <td className="py-2 pr-4 text-slate-400">{new Date(h.time).toLocaleString()}</td>
                    <td className="py-2 pr-4">{h.found}</td>
                    <td className="py-2 pr-4 text-green-400">{h.new}</td>
                    <td className="py-2 pr-4 text-yellow-400">{h.skipped}</td>
                    <td className="py-2 pr-4 text-red-400">{h.errors}</td>
                    <td className="py-2">{h.duration_sec}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500">No scrape history yet</p>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
