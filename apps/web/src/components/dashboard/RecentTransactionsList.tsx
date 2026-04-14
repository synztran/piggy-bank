"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import {
	FileQuestion,
	Plane,
	PlaySquare,
	ShoppingBag,
	Utensils,
	Zap,
} from "lucide-react";
import Link from "next/link";
import React from "react";

interface Transaction {
	_id: string;
	description: string;
	amount: number;
	category: string;
	type: "expense" | "income";
	transactionDate: string;
}

interface RecentTransactionsListProps {
	transactions: Transaction[];
	loading: boolean;
}

const categoryIcon: Record<string, React.ElementType> = {
	food: Utensils,
	dining: Utensils,
	travel: Plane,
	subscriptions: PlaySquare,
	retail: ShoppingBag,
	utilities: Zap,
	other: FileQuestion,
};

const categoryColor: Record<string, string> = {
	food: "text-orange-400",
	dining: "text-sky-400",
	travel: "text-sky-400",
	subscriptions: "text-purple-400",
	retail: "text-emerald-400",
	utilities: "text-yellow-400",
	other: "text-red-200",
};

const categoryBg: Record<string, string> = {
	food: "bg-orange-500/10 border-orange-500/20",
	dining: "bg-sky-500/10 border-sky-500/20",
	travel: "bg-sky-500/10 border-sky-500/20",
	subscriptions: "bg-purple-500/10 border-purple-500/20",
	retail: "bg-emerald-500/10 border-emerald-500/20",
	utilities: "bg-yellow-500/10 border-yellow-500/20",
	income: "bg-emerald-500/10 border-emerald-500/20",
	other: "bg-red-200/10 border-red-200/20",
};

const categoryLabel: Record<string, string> = {
	food: "Ăn uống",
	dining: "Nhà hàng",
	travel: "Du lịch",
	subscriptions: "Đăng ký",
	retail: "Mua sắm",
	utilities: "Tiện ích",
	income: "Thu nhập",
	other: "Khác",
};

const RecentTransactionsList = React.memo(function RecentTransactionsList({
	transactions,
	loading,
}: RecentTransactionsListProps) {
	return (
		<section className="space-y-4">
			<div className="flex justify-between items-end">
				<h2 className="text-xl font-bold text-[#e0e8f0] tracking-tight">
					Giao dịch gần đây
				</h2>
				<Link
					href="/history"
					className="text-[#7dd3fc] text-sm font-medium hover:underline">
					Xem tất cả
				</Link>
			</div>

			<div className="space-y-3">
				{loading &&
					Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className="glass-panel p-4 rounded-xl animate-pulse h-16"
						/>
					))}
				{!loading && transactions.length === 0 && (
					<div className="glass-panel p-5 rounded-xl text-center text-[#a0b4c4] text-sm">
						Chưa có giao dịch nào.
					</div>
				)}
				{!loading &&
					transactions.map((tx) => {
						const Icon = categoryIcon[tx.category] || ShoppingBag;
						const bgClass =
							categoryBg[tx.category] ||
							"bg-slate-500/10 border-slate-500/20";
						const textColor =
							categoryColor[tx.category] || "text-slate-400";
						return (
							<div
								key={tx._id}
								className="glass-panel p-3 rounded-xl flex items-center justify-between hover:bg-[rgba(125,211,252,0.04)] transition-colors">
								<div className="flex items-center gap-4">
									<div
										className={`min-w-10 h-10 rounded-xl flex items-center justify-center border ${bgClass} ${textColor}`}>
										<Icon size={20} />
									</div>
									<div>
										<p className="text-[#e0e8f0] font-semibold text-sm line-clamp-2">
											{tx.description}
										</p>
										<p className="text-[10px] text-[#a0b4c4] capitalize line-clamp-1">
											{formatDate(tx.transactionDate)} ·{" "}
											{categoryLabel[tx.category] ||
												tx.category}
										</p>
									</div>
								</div>
								<span
									className={`font-bold text-sm ${tx.type === "income" ? "text-emerald-400" : "text-red-500"}`}>
									{tx.type === "income" ? "+" : "-"}
									{formatCurrency(tx.amount)}
								</span>
							</div>
						);
					})}
			</div>
		</section>
	);
});

export default RecentTransactionsList;
