"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AtSign, Lock, Eye, EyeOff, User } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ background: "radial-gradient(circle at bottom left, rgba(61,32,96,0.2) 0%, #0a0e1a 50%, #0a0e1a 100%)" }}
    >
      <div className="fixed top-[-10%] right-[-5%] w-96 h-96 rounded-full pointer-events-none" style={{ background: "rgba(200,160,240,0.08)", filter: "blur(120px)" }} />
      <div className="fixed bottom-[-10%] left-[-5%] w-80 h-80 rounded-full pointer-events-none" style={{ background: "rgba(125,211,252,0.08)", filter: "blur(100px)" }} />

      <main className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 glass-panel rounded-full flex items-center justify-center text-3xl mb-5 border border-[rgba(200,160,240,0.3)]">
            ❄️
          </div>
          <h1 className="text-3xl font-extrabold text-[#e0e8f0] tracking-tight mb-2">
            Create Account
          </h1>
          <p className="text-[#a0b4c4] text-sm text-center">
            Join the vault. Your savings await.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#a0b4c4] ml-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-[rgba(200,160,240,0.6)]" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  className="glass-input w-full pl-11 pr-4 py-3.5 rounded-lg text-[#e0e8f0] placeholder:text-[rgba(160,180,196,0.4)]"
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#a0b4c4] ml-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <AtSign size={18} className="text-[rgba(125,211,252,0.6)]" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  className="glass-input w-full pl-11 pr-4 py-3.5 rounded-lg text-[#e0e8f0] placeholder:text-[rgba(160,180,196,0.4)]"
                  placeholder="e.g. SatoshiNakamoto"
                  autoComplete="username"
                  autoCapitalize="none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#a0b4c4] ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-[rgba(125,211,252,0.6)]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="glass-input w-full pl-11 pr-12 py-3.5 rounded-lg text-[#e0e8f0] placeholder:text-[rgba(160,180,196,0.4)]"
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[rgba(160,180,196,0.6)] hover:text-[#7dd3fc] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[rgba(200,160,240,0.2)] border border-[rgba(200,160,240,0.35)] hover:bg-[rgba(200,160,240,0.3)] active:scale-[0.98] py-4 rounded-lg text-[#c8a0f0] font-bold text-lg tracking-wide transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-[#c8a0f0] border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Freeze My Account ❄️"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#a0b4c4]">
              Already frozen?{" "}
              <Link
                href="/"
                className="text-[#7dd3fc] font-bold hover:underline underline-offset-4 decoration-2"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
