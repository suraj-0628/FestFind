import { useState, useEffect } from "react";
import { adminApi } from "../adminApi";

export function AdminHealth({ token }: { token: string }) {
  const [health, setHealth] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [logLines, setLogLines] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.systemHealth(token),
      adminApi.systemLogs(token, logLines),
    ]).then(([h, l]) => { setHealth(h); setLogs(l.logs || []); }).finally(() => setLoading(false));
  }, [token, logLines]);

  if (loading) return <div className="p-6 text-slate-400">Loading...</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-xl font-bold">System Health</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="DB Size" value={health?.database?.size_mb ? `${health.database.size_mb} MB` : "-"} />
        <Card label="Uploads" value={String(health?.uploads?.count ?? 0)} />
        <Card label="Upload Size" value={health?.uploads?.size_mb ? `${health.uploads.size_mb} MB` : "0 MB"} />
        <Card label="Tables" value={String(Object.keys(health?.database?.tables || {}).length)} />
      </div>

      {health?.database?.tables && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3 text-slate-300">Database Tables</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(health.database.tables).map(([table, count]) => (
              <div key={table} className="bg-white/[0.02] rounded-lg p-3">
                <div className="text-xs text-slate-500">{table}</div>
                <div className="text-lg font-bold">{String(count)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">Logs</h3>
          <select
            value={logLines}
            onChange={(e) => setLogLines(Number(e.target.value))}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white [&>option]:bg-[#0d0d14] [&>option]:text-white"
          >
            <option value={50}>50 lines</option>
            <option value={100}>100 lines</option>
            <option value={200}>200 lines</option>
            <option value={500}>500 lines</option>
          </select>
        </div>
        <div className="bg-black/40 rounded-lg p-3 max-h-[400px] overflow-y-auto font-mono text-xs leading-relaxed">
          {logs.length > 0 ? (
            logs.map((line, i) => (
              <div key={i} className={`${
                line.includes("ERROR") ? "text-red-400" :
                line.includes("WARNING") ? "text-yellow-400" :
                line.includes("INFO") ? "text-slate-400" : "text-slate-500"
              }`}>
                {line}
              </div>
            ))
          ) : (
            <div className="text-slate-500">No logs available</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
