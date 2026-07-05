import { useState, useEffect, useRef } from "react";
import { adminApi } from "../adminApi";

function parseTag(tags: string | null, key: string): string {
  if (!tags) return "";
  for (const part of tags.split(",")) {
    const [k, ...rest] = part.split(":");
    if (k === key) return rest.join(":");
  }
  return "";
}

export function AdminEvents({ token, isUserSubmitted }: { token: string; isUserSubmitted?: boolean }) {
  const [events, setEvents] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [posterEvent, setPosterEvent] = useState<any>(null);
  const pageSize = 20;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      adminApi.events(token, page, filter, debouncedSearch, 20, isUserSubmitted),
      adminApi.eventCount(token, filter, isUserSubmitted),
    ]).then(([e, c]) => { setEvents(e); setTotal(c.total); setSelected(new Set()); }).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [token, page, filter, debouncedSearch]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === events.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(events.map((e) => e.id)));
    }
  };

  const handleBulk = async (action: "approve" | "reject" | "delete") => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (action === "delete" && !confirm(`Delete ${ids.length} events?`)) return;
    if (action === "reject" && !confirm(`Reject ${ids.length} events?`)) return;
    setBulkLoading(true);
    try {
      if (action === "approve") await adminApi.bulkApprove(token, ids);
      if (action === "reject") await adminApi.bulkReject(token, ids);
      if (action === "delete") await adminApi.bulkDelete(token, ids);
      refresh();
    } catch (e: any) {
      alert(e.message || "Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExport = () => adminApi.exportEvents(token);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold">Events ({total})</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white [&>option]:bg-[#0d0d14] [&>option]:text-white"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 w-40"
          />
          <button onClick={handleExport} className="px-3 py-2 text-sm bg-white/[0.04] hover:bg-white/[0.06] rounded-lg text-slate-300">
            Export CSV
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 bg-neon-blue/10 border border-neon-blue/20 rounded-lg p-3">
          <span className="text-sm text-neon-blue">{selected.size} selected</span>
          <button onClick={() => handleBulk("approve")} className="text-xs px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30">Approve</button>
          <button onClick={() => handleBulk("reject")} className="text-xs px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30">Reject</button>
          <button onClick={() => handleBulk("delete")} className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">Delete</button>
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-sm">Loading...</div>
      ) : (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-white/[0.06]">
                  <th className="p-3 w-8">
                    <input type="checkbox" checked={selected.size === events.length && events.length > 0} onChange={selectAll} className="rounded" />
                  </th>
                  <th className="text-left p-3">Title</th>
                  {isUserSubmitted && <th className="text-left p-3 hidden lg:table-cell">Contact</th>}
                  <th className="text-left p-3 hidden md:table-cell">City</th>
                  <th className="text-left p-3 hidden md:table-cell">Category</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="p-3">
                      <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} className="rounded" />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {e.image_url && (
                          isUserSubmitted ? (
                            <button onClick={() => setPosterEvent(e)} className="shrink-0 group">
                              <img src={e.image_url} alt="" className="w-10 h-10 rounded object-cover border border-white/[0.08] group-hover:border-neon-blue/50 transition" onError={(ev) => { (ev.target as HTMLImageElement).style.display = "none"; }} />
                            </button>
                          ) : (
                            <img src={e.image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0 border border-white/[0.08]" onError={(ev) => { (ev.target as HTMLImageElement).style.display = "none"; }} />
                          )
                        )}
                        <div className="min-w-0">
                          <div className="max-w-[200px] md:max-w-[300px] truncate font-medium">{e.title}</div>
                          {e.organizer && <div className="text-xs text-slate-500 truncate">{e.organizer}</div>}
                        </div>
                      </div>
                    </td>
                    {isUserSubmitted && (
                      <td className="p-3 hidden lg:table-cell">
                        <span className="text-xs text-slate-400">{parseTag(e.tags, "contact") || "-"}</span>
                      </td>
                    )}
                    <td className="p-3 text-slate-400 hidden md:table-cell">{e.city || "-"}</td>
                    <td className="p-3 text-slate-400 hidden md:table-cell">{e.category || "-"}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        e.is_approved
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {e.is_approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        {!e.is_approved && (
                          <button onClick={() => adminApi.approveEvent(token, e.id).then(refresh)} className="text-xs px-2 py-1 text-green-400 hover:bg-green-500/10 rounded">Approve</button>
                        )}
                        {e.is_approved && (
                          <button onClick={() => adminApi.rejectEvent(token, e.id).then(refresh)} className="text-xs px-2 py-1 text-yellow-400 hover:bg-yellow-500/10 rounded">Reject</button>
                        )}
                        <button onClick={() => confirm(`Delete "${e.title}"?`) && adminApi.deleteEvent(token, e.id).then(refresh)} className="text-xs px-2 py-1 text-red-400 hover:bg-red-500/10 rounded">Del</button>
                        {e.source_url && (
                          <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 text-slate-500 hover:text-white rounded">Link</a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm rounded-lg bg-white/[0.04] hover:bg-white/[0.06] disabled:opacity-30">Prev</button>
        <span className="text-sm text-slate-400">Page {page}</span>
        <button disabled={events.length < pageSize} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm rounded-lg bg-white/[0.04] hover:bg-white/[0.06] disabled:opacity-30">Next</button>
      </div>

      {posterEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPosterEvent(null)}>
          <div className="relative max-w-2xl w-full bg-[#0d0d14] rounded-xl border border-white/[0.08] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPosterEvent(null)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition text-white text-sm">✕</button>
            <img src={posterEvent.image_url} alt={posterEvent.title} className="w-full max-h-[70vh] object-contain bg-black" />
            <div className="p-4">
              <h3 className="text-sm font-bold text-white">{posterEvent.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{posterEvent.organizer}{posterEvent.city ? ` — ${posterEvent.city}` : ""}</p>
              {posterEvent.description && <p className="text-xs text-slate-500 mt-2 line-clamp-3">{posterEvent.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
