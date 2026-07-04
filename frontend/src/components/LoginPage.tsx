import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { FestFindLogo } from "./Icons";

type Mode = "login" | "register";

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg glass-light border border-transparent px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-neon-blue transition min-h-[44px]";

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 bg-[#0a0a0f]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <FestFindLogo size={48} />
          <h1 className="text-2xl font-bold text-white mt-4">
            {mode === "login" ? "Sign in to continue" : "Join FestFind"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {mode === "login" ? "List your college events on the map" : "Create an account to start hosting events"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "register" && (
            <input
              type="text"
              placeholder="Your name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-neon-blue px-6 py-3 text-sm font-semibold text-black hover:bg-neon-blue/80 transition disabled:opacity-50 min-h-[44px]"
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button onClick={() => { setMode("register"); setError(""); }} className="text-neon-blue hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => { setMode("login"); setError(""); }} className="text-neon-blue hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
