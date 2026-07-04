interface Props {
  filters: { city: string; state: string; category: string; search: string };
  onChange: (filters: Props["filters"]) => void;
}

export function FilterBar({ filters, onChange }: Props) {
  const update = (key: keyof Props["filters"], value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap gap-3 rounded-xl glass-light p-4">
      <input
        type="text"
        placeholder="Search events..."
        value={filters.search}
        onChange={(e) => update("search", e.target.value)}
        className="flex-1 min-w-[200px] rounded-lg glass-light px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-neon-blue"
      />
      <input
        type="text"
        placeholder="City"
        value={filters.city}
        onChange={(e) => update("city", e.target.value)}
        className="w-36 rounded-lg glass-light px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-neon-blue"
      />
      <input
        type="text"
        placeholder="State"
        value={filters.state}
        onChange={(e) => update("state", e.target.value)}
        className="w-36 rounded-lg glass-light px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-neon-blue"
      />
      <input
        type="text"
        placeholder="Category"
        value={filters.category}
        onChange={(e) => update("category", e.target.value)}
        className="w-36 rounded-lg glass-light px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-neon-blue"
      />
    </div>
  );
}
