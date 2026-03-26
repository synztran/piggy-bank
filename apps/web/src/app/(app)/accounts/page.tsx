"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Banknote,
  Landmark,
  CreditCard,
  ArrowLeftRight,
  MoreVertical,
  Settings,
  PlusCircle,
  Trash2,
} from "lucide-react";

interface PaymentSource {
  id: string;
  name: string;
  type: "Debit" | "Credit" | "Cash" | "Transfer";
  last4Digits?: string;
}

const accountIcon = {
  Cash: Banknote,
  Debit: Landmark,
  Credit: CreditCard,
  Transfer: ArrowLeftRight,
};

const accountIconColor = {
  Cash: "text-[#7dd3fc] bg-[rgba(125,211,252,0.1)] border-[rgba(125,211,252,0.2)]",
  Debit: "text-[#c8a0f0] bg-[rgba(200,160,240,0.1)] border-[rgba(200,160,240,0.2)]",
  Credit: "text-[#7dd3fc] bg-[rgba(125,211,252,0.08)] border-[rgba(125,211,252,0.3)]",
  Transfer: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<PaymentSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleDelete = async (id: string) => {
    if (!confirm("Xoá nguồn thanh toán này?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setDeleting(null);
      setActiveMenu(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-[#e0e8f0] tracking-tight">
            Tài khoản
          </h2>
          <p className="text-[#a0b4c4] text-sm mt-1">
            Quản lý nguồn tiền của bạn
          </p>
        </div>
        <Link
          href="/accounts/add"
          className="bg-[rgba(125,211,252,0.1)] border border-[rgba(125,211,252,0.2)] text-[#7dd3fc] px-4 py-2 rounded-xl flex items-center gap-2 font-medium active:scale-95 transition-all hover:bg-[rgba(125,211,252,0.2)] text-sm"
        >
          <Plus size={18} />
          Thêm mới
        </Link>
      </div>

      {/* Account Cards */}
      <div className="space-y-4">
        {loading &&
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="glass-panel p-6 rounded-xl h-32 animate-pulse" />
          ))
        }

        {!loading && accounts.length === 0 && (
          <div className="glass-panel p-8 rounded-xl text-center space-y-3">
            <p className="text-[#a0b4c4]">Chưa có tài khoản nào.</p>
            <Link
              href="/accounts/add"
              className="inline-flex items-center gap-2 text-[#7dd3fc] font-medium text-sm hover:underline"
            >
              <Plus size={16} />
              Thêm tài khoản đầu tiên
            </Link>
          </div>
        )}

        {accounts.map((account) => {
          const Icon = accountIcon[account.type] || Banknote;
          const iconClass = accountIconColor[account.type] || accountIconColor.Cash;

          return (
            <div
              key={account.id}
              className="glass-panel p-6 rounded-xl relative overflow-hidden group"
            >
              {/* no gradient dot pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:opacity-150"
                style={{ background: "rgba(125,211,252,0.05)" }}
              />
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${iconClass}`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#e0e8f0]">{account.name}</h3>
                    <p className="text-xs text-[#a0b4c4]">
                      {account.type}
                      {account.last4Digits ? ` •••• ${account.last4Digits}` : ""}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === account.id ? null : account.id)}
                    className="text-[#a0b4c4] hover:text-[#7dd3fc] transition-colors p-1"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {activeMenu === account.id && (
                    <div className="absolute right-0 top-8 w-36 glass-panel-elevated rounded-xl overflow-hidden z-20 shadow-xl">
                      <button
                        onClick={() => router.push(`/accounts/edit/${account.id}`)}
                        className="w-full px-4 py-3 text-left text-[#e0e8f0] text-sm hover:bg-[rgba(125,211,252,0.1)] flex items-center gap-2 transition-colors"
                      >
                        <Settings size={14} />
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        disabled={deleting === account.id}
                        className="w-full px-4 py-3 text-left text-red-400 text-sm hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={14} />
                        Xoá
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 relative z-10">
                <p className="text-[10px] text-[#a0b4c4] uppercase tracking-widest font-medium mb-1">
                  Loại nguồn tiền
                </p>
                <p className="text-lg font-semibold text-[#e0e8f0]">{account.type}</p>
              </div>
            </div>
          );
        })}

        {/* Add another */}
        <Link
          href="/accounts/add"
          className="w-full p-8 border-2 border-dashed border-[rgba(125,211,252,0.1)] rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[rgba(125,211,252,0.04)] transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
            <PlusCircle size={22} className="text-slate-400" />
          </div>
          <span className="text-sm font-medium text-slate-400">
            Kết nối nguồn khác
          </span>
        </Link>
      </div>

      {/* Backdrop for menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}
