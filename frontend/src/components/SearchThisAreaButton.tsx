import { Search } from "./Icons";

interface Props {
  visible: boolean;
  onClick: () => void;
}

export function SearchThisAreaButton({ visible, onClick }: Props) {
  if (!visible) return null;

  return (
    <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-10 safe-top">
      <button
        onClick={onClick}
        className="flex items-center gap-2 rounded-xl glass-map glass-glow px-4 sm:px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all animate-in slide-in-from-top-2 fade-in duration-200 min-h-[44px]"
      >
        <Search size={14} className="text-neon-blue" />
        <span>Search this area</span>
      </button>
    </div>
  );
}
