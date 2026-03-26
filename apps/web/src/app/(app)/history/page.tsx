"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Landmark,
  Users,
  ShoppingBag,
  Zap,
  Utensils,
  Plane,
  PlaySquare,
  CreditCard,
  Trash2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { gooeyToast } from "goey-toast";
import { formatCurrency, formatDateGroup } from "@/lib/utils";

interface Transaction {
  _id: string;
  description: string;
  amount: number;
  category: string;
  type: "expense" | "income";
  transactionDate: string;
  userName: string;
  isOwn: boolean;
  isRemove?: boolean;
  deletedByName?: string | null;
}

interface GroupedTransactions {
  label: string;
  transactions: Transaction[];
}

const categoryIcon: Record<string, React.ElementType> = {
  food: Utensils,
  dining: Utensils,
  travel: Plane,
  subscriptions: PlaySquare,
  retail: ShoppingBag,
  utilities: Zap,
  income: CreditCard,
  other: CreditCard,
};

const categoryColor: Record<string, string> = {
  food: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  dining: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  travel: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  subscriptions: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  retail: "text-[#7dd3fc] bg-[rgba(125,211,252,0.1)] border-[rgba(125,211,252,0.2)]",
  utilities: "text-[#c8a0f0] bg-purple-500/10 border-purple-500/20",
  income: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  other: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

function groupTransactions(transactions: Transaction[]): GroupedTransactions[] {
  const groups: Map<string, Transaction[]> = new Map();

  for (const tx of transactions) {
    const label = formatDateGroup(tx.transactionDate);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(tx);
  }

  return Array.from(groups.entries()).map(([label, txs]) => ({
    label,
    transactions: txs,
  }));
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeStart, setActiveStart] = useState("");
  const [activeEnd, setActiveEnd] = useState("");

  const isFiltered = !!(activeStart || activeEnd);

  const fetchTransactions = useCallback(async (pageNum = 1, append = false, from = activeStart, to = activeEnd) => {
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: "20" });
      if (from) params.set("startDate", from);
      if (to) params.set("endDate", to);
      const res = await fetch(`/api/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTotal(data.total);
        setHasMore(pageNum * 20 < data.total);
        if (append) {
          setTransactions((prev) => [...prev, ...data.transactions]);
        } else {
          setTransactions(data.transactions || []);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [activeStart, activeEnd]);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage, true);
  };

  const handleApplyFilter = () => {
    setActiveStart(startDate);
    setActiveEnd(endDate);
    setPage(1);
    setLoading(true);
    setShowFilter(false);
    fetchTransactions(1, false, startDate, endDate);
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    setActiveStart("");
    setActiveEnd("");
    setPage(1);
    setLoading(true);
    fetchTransactions(1, false, "", "");
  };

  const handleDelete = (id: string) => {
    setDeleting(id);

    const promise = fetch(`/api/transactions/${id}`, { method: "DELETE" }).then(
      async (res) => {
        if (!res.ok) throw new Error("failed");
        setTransactions((prev) =>
          prev.map((t) => t._id === id ? { ...t, isRemove: true } : t)
        );
        setTotal((prev) => prev - 1);
      }
    );

    promise.finally(() => setDeleting(null));

    gooeyToast.promise(promise, {
      loading: "Đang ẩn...",
      success: "Đã ẩn giao dịch",
      error: "Không thể ẩn",
      description: {
        success: "Giao dịch đã được ẩn khỏi số dư.",
        error: "Bạn chỉ có thể ẩn giao dịch của mình.",
      },
      action: {
        error: {
          label: "Thử lại",
          onClick: () => handleDelete(id),
        },
      },
    });
  };

  const groups = groupTransactions(transactions);

  const totalSpentThisMonth = transactions
    .filter((t) => t.type === "expense" && !t.isRemove)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-3xl font-extrabold text-[#e0e8f0] tracking-tight">
            Lịch sử
          </h2>
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isFiltered
                ? "bg-[rgba(125,211,252,0.15)] text-[#7dd3fc] border border-[rgba(125,211,252,0.3)]"
                : "bg-[rgba(125,211,252,0.06)] text-[#a0b4c4] border border-[rgba(125,211,252,0.1)]"
            }`}
          >
            <SlidersHorizontal size={13} />
            Lọc{isFiltered ? " (đang lọc)" : ""}
          </button>
        </div>
        <p className="text-[#a0b4c4] text-sm">
          Xem lại toàn bộ giao dịch của bạn.
        </p>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="glass-panel p-4 rounded-xl space-y-3 animate-in slide-in-from-top duration-200">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#a0b4c4]">Lọc theo ngày</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#a0b4c4] mb-1 block">Từ ngày</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="glass-input w-full py-2 px-3 rounded-lg text-[#e0e8f0] text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#a0b4c4] mb-1 block">Đến ngày</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="glass-input w-full py-2 px-3 rounded-lg text-[#e0e8f0] text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleApplyFilter}
              disabled={!startDate && !endDate}
              className="flex-1 py-2 rounded-lg bg-[#7dd3fc] text-[#001f2e] text-sm font-bold disabled:opacity-40"
            >
              Áp dụng
            </button>
            <button
              onClick={() => setShowFilter(false)}
              className="px-4 py-2 rounded-lg border border-[rgba(125,211,252,0.15)] text-[#a0b4c4] text-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Active filter badge */}
      {isFiltered && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[rgba(125,211,252,0.08)] border border-[rgba(125,211,252,0.2)]">
          <span className="text-xs text-[#7dd3fc] font-medium">
            {activeStart && activeEnd
              ? `${activeStart} → ${activeEnd}`
              : activeStart
              ? `Từ ${activeStart}`
              : `Đến ${activeEnd}`}
          </span>
          <button
            onClick={handleClearFilter}
            className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors"
          >
            <X size={11} />
            Xoá bộ lọc
          </button>
        </div>
      )}

      {/* Summary Bento */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-xl">
          <div className="flex items-center gap-2 text-[#7dd3fc] mb-2">
            <Landmark size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Tổng chi tiêu
            </span>
          </div>
          <div className="text-2xl font-bold text-[#e0e8f0]">
            {formatCurrency(totalSpentThisMonth)}
          </div>
          <div className="text-[10px] text-[#a0b4c4] mt-1">Tháng này</div>
        </div>
        <div className="glass-panel p-5 rounded-xl">
          <div className="flex items-center gap-2 text-[#c8a0f0] mb-2">
            <Users size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Tổng giao dịch
            </span>
          </div>
          <div className="text-2xl font-bold text-[#e0e8f0]">{total}</div>
          <div className="text-[10px] text-[#a0b4c4] mt-1">Tất cả thành viên</div>
        </div>
      </div>

      {/* Transactions */}
      <div className="space-y-6">
        {loading && (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-panel p-4 rounded-xl h-16 animate-pulse" />
          ))
        )}

        {!loading && transactions.length === 0 && (
          <div className="glass-panel p-8 rounded-xl text-center space-y-2">
            <p className="text-[#a0b4c4]">Chưa có giao dịch nào.</p>
            <p className="text-[#a0b4c4] text-sm">
              Dùng Thêm nhanh ở trang chủ để ghi lại giao dịch đầu tiên.
            </p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.label}>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">
              {group.label}
            </h3>
            <div className="space-y-3">
              {group.transactions.map((tx) => {
                const Icon = categoryIcon[tx.category] || ShoppingBag;
                const colorClass = categoryColor[tx.category] || categoryColor.other;

                return (
                  <div
                    key={tx._id}
                    className={`glass-panel p-4 rounded-xl flex items-center justify-between transition-colors group ${
                      tx.isRemove
                        ? "opacity-50"
                        : "hover:bg-[rgba(125,211,252,0.04)]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorClass}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className={`font-semibold text-sm ${
                          tx.isRemove ? "line-through text-slate-500" : "text-[#e0e8f0]"
                        }`}>
                          {tx.description}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-slate-500 capitalize">
                            {{


                            food: "Ăn uống",
                            dining: "Nhà hàng",
                            travel: "Du lịch",
                            subscriptions: "Đăng ký",
                            retail: "Mua sắm",
                            utilities: "Tiện ích",
                            income: "Thu nhập",
                            other: "Khác",
                            }[tx.category] || tx.category}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(125,211,252,0.08)] text-[#7dd3fc] border border-[rgba(125,211,252,0.15)]">
                            {tx.userName || "Ẩn danh"}
                          </span>
                          {tx.isRemove && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                              Đã xoá{tx.deletedByName ? ` bởi ${tx.deletedByName}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className={`font-bold text-base ${tx.type === "income" ? "text-emerald-400" : "text-[#e0e8f0]"}`}>
                          {tx.type === "income" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(tx.transactionDate).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      {tx.isOwn && !tx.isRemove && <button
                        onClick={() => handleDelete(tx._id)}
                        disabled={deleting === tx._id}
                        className=" group-hover:opacity-100 w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center transition-all hover:bg-red-500/20 ml-1"
                      >
                        {deleting === tx._id ? (
                          <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {hasMore && (
          <button
            onClick={handleLoadMore}
            className="w-full py-3 glass-panel rounded-xl text-[#7dd3fc] text-sm font-medium hover:bg-[rgba(125,211,252,0.1)] transition-colors"
          >
            Tải thêm
          </button>
        )}
      </div>
    </div>
  );
}
