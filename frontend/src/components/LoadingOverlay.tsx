import { useEffect, useState } from "react";

interface Props {
  message: string;
}

const taglines = [
  "No more scrolling through boring event lists",
  "See everything on the map. Pick what excites you",
  "Every college fest. One interactive map",
  "Discover events the way they should be — visually",
  "Your next fest is just a tap away",
];

export function LoadingOverlay({ message }: Props) {
  const [visible, setVisible] = useState(true);
  const [taglineIdx, setTaglineIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTaglineIdx((i) => (i + 1) % taglines.length);
    }, 2400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!message || message === "") {
      setVisible(false);
    }
  }, [message]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0f] safe-top safe-bottom overflow-hidden"
      style={{ transition: "opacity 0.5s ease-out" }}
    >
      {/* Animated background dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-neon-emerald/10"
            style={{
              width: `${4 + Math.random() * 6}px`,
              height: `${4 + Math.random() * 6}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `floatDot ${6 + Math.random() * 8}s ease-in-out infinite ${Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Animated map markers dropping in */}
      <div className="relative mb-8 sm:mb-12">
        {/* Concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-32 sm:w-44 h-32 sm:h-44 rounded-full border border-neon-blue/10"
            style={{ animation: "pingRing 3s cubic-bezier(0, 0, 0.2, 1) infinite" }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-20 sm:w-28 h-20 sm:h-28 rounded-full border border-neon-blue/20"
            style={{ animation: "pingRing 3s cubic-bezier(0, 0, 0.2, 1) infinite 0.6s" }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-10 sm:w-14 h-10 sm:h-14 rounded-full border border-neon-blue/30"
            style={{ animation: "pingRing 3s cubic-bezier(0, 0, 0.2, 1) infinite 1.2s" }}
          />
        </div>

        {/* Center marker cluster */}
        <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
          {/* Marker 1 */}
          <div
            className="absolute"
            style={{
              animation: "dropBounce 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
              animationDelay: "0.2s",
              opacity: 0,
            }}
          >
            <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
              <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="#00d4ff" />
              <circle cx="14" cy="13" r="5" fill="#0a0a0f" />
            </svg>
          </div>
          {/* Marker 2 */}
          <div
            className="absolute"
            style={{
              animation: "dropBounce 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
              animationDelay: "0.5s",
              opacity: 0,
              transform: "translate(-16px, -8px)",
            }}
          >
            <svg width="20" height="26" viewBox="0 0 28 36" fill="none">
              <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="#00d4ff" />
              <circle cx="14" cy="13" r="5" fill="#0a0a0f" />
            </svg>
          </div>
          {/* Marker 3 */}
          <div
            className="absolute"
            style={{
              animation: "dropBounce 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
              animationDelay: "0.8s",
              opacity: 0,
              transform: "translate(14px, 6px)",
            }}
          >
            <svg width="18" height="24" viewBox="0 0 28 36" fill="none">
              <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="#f472b6" />
              <circle cx="14" cy="13" r="5" fill="#0a0a0f" />
            </svg>
          </div>
        </div>
      </div>

      {/* Brand */}
      <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">College Fest Hub</h1>

      {/* Rotating tagline */}
      <div className="h-5 sm:h-6 mb-6 sm:mb-8 px-6 text-center overflow-hidden">
        <p
          key={taglineIdx}
          className="text-xs sm:text-sm text-slate-400 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          {taglines[taglineIdx]}
        </p>
      </div>

      {/* Loading status */}
      {message && (
        <p className="text-[11px] text-slate-500 mb-6 min-h-[16px]">{message}</p>
      )}

      {/* Progress bar */}
      <div className="w-40 sm:w-48 h-0.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-neon-blue via-neon-emerald to-neon-blue"
          style={{
            animation: "progressSlide 1.5s ease-in-out infinite",
            width: "40%",
          }}
        />
      </div>

      <style>{`
        @keyframes pingRing {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes dropBounce {
          0% { opacity: 0; transform: translateY(-40px) scale(0.5); }
          60% { opacity: 1; transform: translateY(4px) scale(1.05); }
          80% { transform: translateY(-2px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes floatDot {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.3); opacity: 0.6; }
        }
        @keyframes progressSlide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
