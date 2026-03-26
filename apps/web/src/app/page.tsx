"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AtSign, Lock, Eye, EyeOff, Key } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";

function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Đăng nhập thất bại");
        return;
      }

      // Save user info in context + sessionStorage
      login(data.user);
      router.push("/dashboard");
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ background: "radial-gradient(circle at top right, rgba(14,77,110,0.2) 0%, #0a0e1a 50%, #0a0e1a 100%)" }}
    >
      {/* Ambient glows */}
      <div className="fixed top-[-10%] right-[-5%] w-96 h-96 rounded-full pointer-events-none" style={{ background: "rgba(125,211,252,0.08)", filter: "blur(120px)" }} />
      <div className="fixed bottom-[-10%] left-[-5%] w-80 h-80 rounded-full pointer-events-none" style={{ background: "rgba(200,160,240,0.08)", filter: "blur(100px)" }} />

      <main className="w-full max-w-md z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-28 h-28 mb-6">
            <div className="absolute inset-0 rounded-full" style={{ background: "rgba(125,211,252,0.15)", filter: "blur(24px)" }} />
            <div className="relative w-full h-full glass-panel rounded-full flex items-center justify-center text-5xl border border-[rgba(125,211,252,0.2)] shadow-[0_0_30px_rgba(125,211,252,0.15)]">
              🐷
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#c8a0f0] rounded-full flex items-center justify-center shadow-lg">
              <Key size={18} className="text-[#1a002e]" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-[#e0e8f0] tracking-tight mb-2">
            HaJia Pay
          </h1>
          <p className="text-[#a0b4c4] font-medium text-center px-8">
            Tiết kiệm của bạn sẽ không bao giờ tan chảy.{" "}
            <br />
            <span className="text-[#7dd3fc] italic">Chào mừng trở lại, Người chi tiêu!</span>
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-xl shadow-2xl relative overflow-hidden">
          <div className="absolute -top-full left-[-100%] w-[200%] h-[200%] pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)" }} />
          <form onSubmit={handleSubmit} className="space-y-6 relative">
            {/* Username */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#a0b4c4] ml-1">
                Tên đăng nhập
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
                  placeholder="vd. NguyenVanA"
                  autoComplete="username"
                  autoCapitalize="none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-sm font-semibold text-[#a0b4c4]">
                  Mật khẩu
                </label>
                {/* <button type="button" className="text-xs font-bold text-[#7dd3fc] hover:text-[#c8eaff] transition-colors">
                  Forgot it again?
                </button> */}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-[rgba(125,211,252,0.6)]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="glass-input w-full pl-11 pr-12 py-3.5 rounded-lg text-[#e0e8f0] placeholder:text-[rgba(160,180,196,0.4)]"
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[rgba(125,211,252,0.15)] border border-[rgba(125,211,252,0.35)] hover:bg-[rgba(125,211,252,0.25)] active:scale-[0.98] py-4 rounded-lg text-[#7dd3fc] font-bold text-lg tracking-wide transition-all shadow-[0_0_20px_rgba(125,211,252,0.1)] hover:shadow-[0_0_30px_rgba(125,211,252,0.2)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-[#7dd3fc] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Mở khoá
                    <Key size={20} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* <div className="mt-8 text-center">
            <p className="text-sm text-[#a0b4c4]">
              New to the freezer?{" "}
              <Link
                href="/register"
                className="text-[#c8a0f0] font-bold hover:underline underline-offset-4 decoration-2"
              >
                Create Account
              </Link>
            </p>
          </div> */}
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
