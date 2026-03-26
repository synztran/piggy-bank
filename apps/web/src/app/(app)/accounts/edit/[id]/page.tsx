"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { Landmark, CreditCard, Banknote, ArrowLeftRight, Save } from "lucide-react";

const accountTypes = [
  { id: "Debit", label: "Debit", icon: Landmark },
  { id: "Credit", label: "Credit", icon: CreditCard },
  { id: "Cash", label: "Cash", icon: Banknote },
  { id: "Transfer", label: "Transfer", icon: ArrowLeftRight },
];

export default function EditAccountPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [type, setType] = useState<"Debit" | "Credit" | "Cash" | "Transfer">("Debit");
  const [last4Digits, setLast4Digits] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const fetchAccount = useCallback(async () => {
    try {
      const res = await fetch(`/api/accounts/${id}`);
      if (res.ok) {
        const data = await res.json();
        const a = data.account;
        setName(a.name);
        setType(a.type);
        setLast4Digits(a.last4Digits || "");
      } else {
        router.push("/accounts");
      }
    } finally {
      setFetching(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên tài khoản");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          last4Digits: last4Digits || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Lưu thất bại");
        return;
      }

      router.push("/accounts");
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7dd3fc] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <AppHeader showBack backHref="/accounts" />
      <main className="pt-20 pb-28 px-5 max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#e0e8f0]">Chỉnh sửa tài khoản</h1>
          <p className="text-[#a0b4c4] text-sm mt-1">Cập nhật thông tin nguồn tiền.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#e0e8f0]">Tên nguồn tiền</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="vd. Tài khoản cá nhân"
              className="glass-input w-full py-3.5 px-4 rounded-xl text-[#e0e8f0] placeholder:text-[#4a6070]"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#e0e8f0]">Loại tài khoản</label>
            <div className="grid grid-cols-2 gap-3">
              {accountTypes.map(({ id: tId, label, icon: Icon }) => (
                <button
                  key={tId}
                  type="button"
                  onClick={() => setType(tId as typeof type)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-all active:scale-95 ${
                    type === tId
                      ? "border-[rgba(125,211,252,0.5)] bg-[rgba(125,211,252,0.1)] text-[#7dd3fc]"
                      : "border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.4)] text-[#a0b4c4]"
                  }`}
                >
                  <Icon size={24} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {(type === "Debit" || type === "Credit") && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#e0e8f0]">4 số cuối <span className="text-[#a0b4c4] font-normal">(không bắt buộc)</span></label>
              <input
                type="text"
                value={last4Digits}
                onChange={(e) => setLast4Digits(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="vd. 8821"
                className="glass-input w-full py-3 px-4 rounded-xl text-[#e0e8f0] placeholder:text-[#4a6070]"
                maxLength={4}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 rounded-full bg-[#7dd3fc] text-[#001f2e] font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#93d9fc] transition-colors active:scale-[0.98]"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-[#001f2e] border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Save size={18} />Lưu lại</>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-4 rounded-full glass-panel text-[#e0e8f0] font-bold text-sm uppercase tracking-wider hover:bg-[rgba(125,211,252,0.1)] transition-colors active:scale-[0.98]"
            >
              Huỷ
            </button>
          </div>
        </form>
      </main>
      <BottomNav />
    </div>
  );
}
