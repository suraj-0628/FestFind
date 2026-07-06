import { useState, useEffect } from "react";
import { adminApi } from "../adminApi";

export function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = () => adminApi.announcements().then(setAnnouncements).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) return;
    await adminApi.createAnnouncement(title, message);
    setTitle(""); setMessage("");
    refresh();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-xl font-bold">Announcements</h2>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">New Announcement</h3>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500"
        />
        <textarea
          placeholder="Message (shown on the site)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 resize-none"
        />
        <button
          onClick={handleCreate}
          disabled={!title.trim() || !message.trim()}
          className="px-4 py-2 bg-neon-blue text-black font-semibold rounded-lg text-sm disabled:opacity-40"
        >
          Create
        </button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-slate-400 text-sm">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="text-slate-500 text-sm">No announcements yet</div>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{a.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.is_active ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}`}>
                    {a.is_active ? "Active" : "Hidden"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{a.message}</p>
                <div className="text-xs text-slate-600 mt-1">{new Date(a.created_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => adminApi.toggleAnnouncement(a.id).then(refresh)} className="text-xs px-2 py-1 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded">
                  {a.is_active ? "Hide" : "Show"}
                </button>
                <button onClick={() => confirm("Delete?") && adminApi.deleteAnnouncement(a.id).then(refresh)} className="text-xs px-2 py-1 text-red-400 hover:bg-red-500/10 rounded">
                  Del
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
