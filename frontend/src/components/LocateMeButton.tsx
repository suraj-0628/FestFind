import { Crosshair } from "./Icons";

interface Props {
  onClick: () => void;
}

export function LocateMeButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-3 right-3 z-[1000] flex items-center gap-2 rounded-xl glass-map glass-glow px-3 py-2.5 text-sm font-medium text-white shadow-lg transition-all min-h-[44px]"
    >
      <Crosshair size={16} className="text-neon-blue" />
      <span>Locate Me</span>
    </button>
  );
}
