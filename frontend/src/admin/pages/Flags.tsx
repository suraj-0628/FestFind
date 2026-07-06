import { useState, useEffect } from "react";
import { adminApi } from "../adminApi";

export function AdminFlags() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => adminApi.flags().then(setFlags).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);

  const handleToggle = async (key: string, currentValue: boolean) => {
    await adminApi.updateFlag(key, !currentValue);
    refresh();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-xl font-bold">Feature Flags</h2>
      <p className="text-xs text-slate-500">Toggle features on/off for the public site.</p>

      {loading ? (
        <div className="text-slate-400 text-sm">Loading...</div>
      ) : flags.length === 0 ? (
        <div className="text-slate-500 text-sm">No feature flags configured</div>
      ) : (
        <div className="space-y-2">
          {flags.map((f) => (
            <div key={f.key} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{f.key}</div>
                {f.description && <div className="text-xs text-slate-500 mt-0.5">{f.description}</div>}
              </div>
              <button
                onClick={() => handleToggle(f.key, f.value)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  f.value ? "bg-green-500" : "bg-slate-600"
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  f.value ? "left-6" : "left-0.5"
                }`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
