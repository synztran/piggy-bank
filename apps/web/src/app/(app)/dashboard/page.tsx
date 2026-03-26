"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Plus, TrendingUp, Utensils, Plane, PlaySquare, ShoppingBag, Zap } from "lucide-react";
import UpdateBalanceDrawer from "@/components/UpdateBalanceDrawer";
import QuickPaymentModal from "@/components/QuickPaymentModal";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

interface PaymentSource {
  id: string;
  name: string;
  type: "Debit" | "Credit" | "Cash" | "Transfer";
  last4Digits?: string;
}

interface SpendingItem {
  category: string;
  amount: number;
  percentage: number;
}

interface Transaction {
  _id: string;
  description: string;
  amount: number;
  category: string;
  type: "expense" | "income";
  transactionDate: string;
}

interface Summary {
  totalBalance: number;
  totalSpentThisMonth: number;
  spending: SpendingItem[];
  recentTransactions: Transaction[];
  accountCount: number;
  memberBalances: { name: string; balance: number; isCurrentUser: boolean }[];
}

const categoryIcon: Record<string, React.ElementType> = {
  food: Utensils,
  dining: Utensils,
  travel: Plane,
  subscriptions: PlaySquare,
  retail: ShoppingBag,
  utilities: Zap,
};

const categoryColor: Record<string, string> = {
  food: "text-orange-400",
  dining: "text-sky-400",
  travel: "text-sky-400",
  subscriptions: "text-purple-400",
  retail: "text-emerald-400",
  utilities: "text-yellow-400",
};

const categoryBg: Record<string, string> = {
  food: "bg-orange-500/10 border-orange-500/20",
  dining: "bg-sky-500/10 border-sky-500/20",
  travel: "bg-sky-500/10 border-sky-500/20",
  subscriptions: "bg-purple-500/10 border-purple-500/20",
  retail: "bg-emerald-500/10 border-emerald-500/20",
  utilities: "bg-yellow-500/10 border-yellow-500/20",
  income: "bg-emerald-500/10 border-emerald-500/20",
  other: "bg-slate-500/10 border-slate-500/20",
};

const categoryBarColor: Record<string, string> = {
  food: "bg-orange-400",
  dining: "bg-sky-400",
  travel: "bg-sky-400",
  subscriptions: "bg-purple-400",
  retail: "bg-emerald-400",
  utilities: "bg-yellow-400",
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [accounts, setAccounts] = useState<PaymentSource[]>([]);
  const [showUpdateBalance, setShowUpdateBalance] = useState(false);
  const [showQuickPayment, setShowQuickPayment] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, accountsRes] = await Promise.all([
        fetch("/api/summary"),
        fetch("/api/accounts"),
      ]);
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data.accounts || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const topSpending = summary?.spending
    ?.filter((s) => s.category !== "income")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 2) ?? [];

  return (
    <div className="space-y-6">
      {/* Hero Balance Card */}
      <section className="relative group">
        <div
          className="absolute -inset-0.5 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"
          style={{ background: "linear-gradient(135deg, rgba(125,211,252,0.2), rgba(200,160,240,0.2))" }}
        />
        <div className="relative glass-panel-elevated p-4 rounded-xl shadow-[0_0_40px_rgba(125,211,252,0.1)] overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10" style={{ background: "rgba(125,211,252,0.04)", filter: "blur(48px)" }} />
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="text-[#a0b4c4] text-xs font-medium tracking-wide uppercase mb-1">
                Số Dư Của Tôi
              </p>
              {loading ? (
                <div className="h-10 w-40 bg-[rgba(125,211,252,0.1)] rounded animate-pulse" />
              ) : (
                <h1 className="text-4xl font-extrabold text-[#e0e8f0] tracking-tight">
                  {formatCurrency(summary?.totalBalance ?? 0)}
                </h1>
              )}
            </div>
            {/* <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
              <TrendingUp size={14} />
              +2.4%
            </div> */}
          </div>

          {/* Member balances */}
          {!loading && (summary?.memberBalances?.length ?? 0) > 1 && (
            <div className="flex gap-2 mb-4">
              {summary!.memberBalances.map((m) => (
                <div
                  key={m.name}
                  className={`flex-1 rounded-xl px-3 py-2 border ${
                    m.isCurrentUser
                      ? "border-[rgba(125,211,252,0.3)] bg-[rgba(125,211,252,0.07)]"
                      : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)]"
                  }`}
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#a0b4c4] mb-0.5">
                    {m.name.split(" ")[0]}
                    {m.isCurrentUser && (
                      <span className="ml-1 text-[#7dd3fc]">(tôi)</span>
                    )}
                  </p>
                  <p className="text-sm font-bold text-[#e0e8f0]">
                    {formatCurrency(m.balance)}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setShowUpdateBalance(true)}
              className="flex-1 glass-panel hover:bg-[rgba(125,211,252,0.1)] text-[#7dd3fc] py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 border-[rgba(125,211,252,0.2)] text-xs"
            >
              <RefreshCw size={16} />
              Cập nhật hạn mức
            </button>
            <button
              onClick={() => setShowQuickPayment(true)}
              className="flex-1 border border-[rgba(125,211,252,0.3)] text-[#7dd3fc] py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-[rgba(125,211,252,0.15)]"
              style={{ background: "rgba(125,211,252,0.15)" }}
            >
              <Plus size={16} />
              Chi tiêu
            </button>
          </div>
        </div>
      </section>

      {/* Spending Insights */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold text-[#e0e8f0] tracking-tight">
            Phân tích chi tiêu
          </h2>
          {/* <button className="text-[#7dd3fc] text-sm font-medium hover:underline">
            Xem tất cả
          </button> */}
        </div>

        {/* Top 2 categories */}
        <div className="grid grid-cols-2 gap-4">
          {topSpending.length === 0 && !loading && (
            <div className="col-span-2 glass-panel p-5 rounded-xl text-center text-[#a0b4c4] text-sm">
              Chưa có dữ liệu chi tiêu. Hãy thêm giao dịch đầu tiên!
            </div>
          )}
          {topSpending.map((item) => {
            const Icon = categoryIcon[item.category] || ShoppingBag;
            const textColor = categoryColor[item.category] || "text-slate-400";
            const barColor = categoryBarColor[item.category] || "bg-slate-400";
            const bgClass = categoryBg[item.category] || "bg-slate-500/10 border-slate-500/20";
            return (
              <div
                key={item.category}
                className="glass-panel p-5 rounded-xl flex flex-col justify-between min-h-[140px] hover:border-[rgba(125,211,252,0.3)] transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className={`p-2 rounded-lg border ${bgClass} ${textColor}`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-xs font-medium text-[#a0b4c4]">
                    {item.percentage}%
                  </span>
                </div>
                <div>
                  <p className="text-[#a0b4c4] text-sm">
                  <span className="capitalize">{{
                    food: "Ăn uống",
                    dining: "Nhà hàng",
                    travel: "Du lịch",
                    subscriptions: "Đăng ký",
                    retail: "Mua sắm",
                    utilities: "Tiện ích",
                    income: "Thu nhập",
                    other: "Khác",
                  }[item.category] || item.category}</span>
                </p>
                  <p className="text-lg font-bold text-[#e0e8f0]">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`${barColor} h-full rounded-full`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Subscriptions summary */}
        {summary?.spending.find((s) => s.category === "subscriptions") && (
          <div className="glass-panel p-5 rounded-xl flex items-center justify-between hover:border-[rgba(125,211,252,0.3)] transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                <PlaySquare size={22} />
              </div>
              <div>
                <p className="text-[#a0b4c4] text-sm">Đăng ký dịch vụ</p>
                <p className="text-lg font-bold text-[#e0e8f0]">
                  {formatCurrency(
                    summary.spending.find((s) => s.category === "subscriptions")
                      ?.amount ?? 0
                  )}{" "}
                  <span className="text-xs font-normal text-[#a0b4c4]">/tháng</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* APY Banner */}
        {/* <div
          className="relative overflow-hidden rounded-xl p-5 min-h-[120px] flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #0e4d6e 0%, #141c2e 60%, #0a0e1a 100%)" }}
        >
          <div>
            <h3 className="text-xl font-bold text-[#e0e8f0]">
              Lãi suất lên đến 4.5%/năm
            </h3>
            <p className="text-[#a0b4c4] text-sm mt-1">
              Trên số dư nhàn rỗi của bạn.
            </p>
          </div>
          <button className="bg-[#7dd3fc] text-[#001f2e] font-bold px-5 py-3 rounded-2xl text-sm hover:bg-[#93d9fc] transition-colors active:scale-95 ml-4 shrink-0">
            Bắt đầu tiết kiệm
          </button>
        </div> */}
      </section>

      {/* Recent Transactions */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold text-[#e0e8f0] tracking-tight">
            Giao dịch gần đây
          </h2>
          <Link href="/history" className="text-[#7dd3fc] text-sm font-medium hover:underline">
            Xem tất cả
          </Link>
        </div>

        <div className="space-y-3">
          {loading && (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-panel p-4 rounded-xl animate-pulse h-16" />
            ))
          )}
          {!loading && summary?.recentTransactions.length === 0 && (
            <div className="glass-panel p-5 rounded-xl text-center text-[#a0b4c4] text-sm">
              Chưa có giao dịch nào.
            </div>
          )}
          {!loading && summary?.recentTransactions.map((tx) => {
            const Icon = categoryIcon[tx.category] || ShoppingBag;
            const bgClass = categoryBg[tx.category] || "bg-slate-500/10 border-slate-500/20";
            const textColor = categoryColor[tx.category] || "text-slate-400";
            return (
              <div
                key={tx._id}
                className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-[rgba(125,211,252,0.04)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${bgClass} ${textColor}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-[#e0e8f0] font-semibold text-sm">
                      {tx.description}
                    </p>
                    <p className="text-[10px] text-[#a0b4c4] mt-0.5 capitalize">
                      {formatDate(tx.transactionDate)} · {{
                        food: "Ăn uống",
                        dining: "Nhà hàng",
                        travel: "Du lịch",
                        subscriptions: "Đăng ký",
                        retail: "Mua sắm",
                        utilities: "Tiện ích",
                        income: "Thu nhập",
                        other: "Khác",
                      }[tx.category] || tx.category}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-bold text-base ${tx.type === "income" ? "text-emerald-400" : "text-[#e0e8f0]"}`}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modals */}
      {showUpdateBalance && (
        <UpdateBalanceDrawer
          currentBalance={summary?.totalBalance ?? 0}
          onClose={() => setShowUpdateBalance(false)}
          onUpdated={fetchData}
        />
      )}

      {showQuickPayment && (
        <QuickPaymentModal
          accounts={accounts}
          onClose={() => setShowQuickPayment(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
