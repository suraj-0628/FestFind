import { useState, useEffect } from "react";
import { adminApi } from "../adminApi";

export function AdminUsers({ token }: { token: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      adminApi.users(token, page, search),
      adminApi.userCount(token),
    ]).then(([u, c]) => { setUsers(u); setTotal(c.total); }).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [token, page, search]);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Users ({total})</h2>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 w-48"
        />
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Loading...</div>
      ) : (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-white/[0.06]">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Joined</th>
                  <th className="text-left p-3">Admin</th>
                  <th className="text-left p-3">Active</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3 text-slate-400">{u.email}</td>
                    <td className="p-3 text-slate-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_admin ? "bg-neon-blue/20 text-neon-blue" : "bg-white/[0.04] text-slate-500"}`}>
                        {u.is_admin ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {u.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <ActionBtn label="Admin" onClick={() => adminApi.toggleAdmin(token, u.id).then(refresh)} />
                        <ActionBtn label={u.is_active ? "Disable" : "Enable"} onClick={() => adminApi.toggleActive(token, u.id).then(refresh)} />
                        <ActionBtn label="Delete" danger onClick={() => confirm(`Delete ${u.name}?`) && adminApi.deleteUser(token, u.id).then(refresh)} />
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
        <button disabled={users.length < 20} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm rounded-lg bg-white/[0.04] hover:bg-white/[0.06] disabled:opacity-30">Next</button>
      </div>
    </div>
  );
}

function ActionBtn({ label, onClick, danger }: { label: string; onClick?: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2 py-1 rounded transition ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
