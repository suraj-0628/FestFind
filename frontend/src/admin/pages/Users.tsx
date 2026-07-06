import { useState, useEffect, useRef } from "react";
import { adminApi } from "../adminApi";

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPass, setFormPass] = useState("");
  const [formRole, setFormRole] = useState("maintainer");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
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
      adminApi.users(page, debouncedSearch),
      adminApi.userCount(),
    ]).then(([u, c]) => { setUsers(u); setTotal(c.total); }).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [page, debouncedSearch]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setCreating(true);
    try {
      await adminApi.createTeamMember(formName, formEmail, formPass, formRole);
      setShowForm(false);
      setFormName(""); setFormEmail(""); setFormPass(""); setFormRole("maintainer");
      refresh();
    } catch (err: any) {
      setFormError(err.message || "Failed");
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    adminApi.setRole(userId, newRole)
      .then(refresh)
      .catch((e: any) => alert(e.message || "Failed"));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Team</h2>
          <p className="text-xs text-slate-500 mt-1">Manage admins and maintainers</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 text-sm bg-neon-blue text-black font-semibold rounded-lg hover:bg-neon-blue/80 transition">
          {showForm ? "Cancel" : "Add Member"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">New team member</h3>
          {formError && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2">{formError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setFormRole("admin")} className={`text-xs px-3 py-1.5 rounded-lg transition ${formRole === "admin" ? "bg-neon-blue/20 text-neon-blue" : "bg-white/[0.04] text-slate-400 hover:text-white"}`}>Admin</button>
            <button type="button" onClick={() => setFormRole("maintainer")} className={`text-xs px-3 py-1.5 rounded-lg transition ${formRole === "maintainer" ? "bg-neon-blue/20 text-neon-blue" : "bg-white/[0.04] text-slate-400 hover:text-white"}`}>Maintainer</button>
          </div>
          <p className="text-[10px] text-slate-600">
            {formRole === "admin" ? "Full access to all dashboard features" : "Access to Submissions only"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Name" required minLength={2} value={formName} onChange={(e) => setFormName(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500" />
            <input type="email" placeholder="Email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500" />
          </div>
          <input type="password" placeholder="Password (min 8 chars)" required minLength={8} value={formPass} onChange={(e) => setFormPass(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500" />
          <button type="submit" disabled={creating} className="px-4 py-2 text-sm bg-neon-blue text-black font-semibold rounded-lg hover:bg-neon-blue/80 transition disabled:opacity-50">
            {creating ? "Creating..." : "Create Account"}
          </button>
        </form>
      )}

      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-slate-300">Current team ({total})</h3>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Joined</th>
                  <th className="text-left p-3">Active</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3 text-slate-400">{u.email}</td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-xs text-white [&>option]:bg-[#0d0d14] [&>option]:text-white"
                      >
                        <option value="admin">Admin</option>
                        <option value="maintainer">Maintainer</option>
                        <option value="user">Remove</option>
                      </select>
                    </td>
                    <td className="p-3 text-slate-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {u.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <ActionBtn label={u.is_active ? "Disable" : "Enable"} onClick={() => adminApi.toggleActive(u.id).then(refresh).catch((e: any) => alert(e.message || "Failed"))} />
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-500 text-sm">No team members yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm rounded-lg bg-white/[0.04] hover:bg-white/[0.06] disabled:opacity-30">Prev</button>
        <span className="text-sm text-slate-400">Page {page}</span>
        <button disabled={users.length < pageSize} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm rounded-lg bg-white/[0.04] hover:bg-white/[0.06] disabled:opacity-30">Next</button>
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
