"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import {
	CreditCard,
	FileQuestion,
	Plane,
	PlaySquare,
	ShoppingBag,
	Trash2,
	Utensils,
	Zap,
} from "lucide-react";
import React from "react";

export interface Transaction {
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
	paymentSourceName?: string | null;
}

interface TransactionItemProps {
	tx: Transaction;
	deleting: string | null;
	onDelete: (id: string) => void;
}

const categoryIcon: Record<string, React.ElementType> = {
	food: Utensils,
	dining: Utensils,
	travel: Plane,
	subscriptions: PlaySquare,
	retail: ShoppingBag,
	utilities: Zap,
	income: CreditCard,
	other: FileQuestion,
};

const categoryTextColor: Record<string, string> = {
	food: "text-orange-400",
	dining: "text-sky-400",
	travel: "text-sky-400",
	subscriptions: "text-slate-400",
	retail: "text-glacier-primary",
	utilities: "text-glacier-tertiary",
	income: "text-emerald-400",
	other: "text-red-200",
};

const categoryBgColor: Record<string, string> = {
	food: "bg-orange-500/10",
	dining: "bg-sky-500/10",
	travel: "bg-sky-500/10",
	subscriptions: "bg-slate-500/10",
	retail: "bg-[rgba(125,211,252,0.1)]",
	utilities: "bg-purple-500/10",
	income: "bg-emerald-500/10",
	other: "bg-red-200/10",
};

const categoryBorderColor: Record<string, string> = {
	food: "border-orange-500/20",
	dining: "border-sky-500/20",
	travel: "border-sky-500/20",
	subscriptions: "border-slate-500/20",
	retail: "border-[rgba(125,211,252,0.2)]",
	utilities: "border-purple-500/20",
	income: "border-emerald-500/20",
	other: "border-red-200/20",
};

const TransactionItem = React.memo(function TransactionItem({
	tx,
	deleting,
	onDelete,
}: TransactionItemProps) {
	const Icon = categoryIcon[tx.category] || ShoppingBag;
	const textColor = categoryTextColor[tx.category] || categoryTextColor.other;
	const bgColor = categoryBgColor[tx.category] || categoryBgColor.other;
	const borderColor = categoryBorderColor[tx.category] || categoryBorderColor.other;

	return (
		<div
			className={`relative glass-panel gap-4 py-2 pl-2 pr-4 rounded-xl flex items-center justify-between transition-colors group ${
				tx.isRemove ? "opacity-50" : "hover:bg-[rgba(125,211,252,0.04)]"
			}`}>
			<div className="flex items-center gap-2">
				<div
					className={`min-w-12 h-12 flex items-center justify-center ${textColor} ${borderColor}`}>
					<Icon size={28} />
				</div>
				<div className="space-y-1">
					<div className="flex items-center gap-2 flex-wrap">
						<span className="text-xs text-slate-500">
							{tx.description}
						</span>
					</div>
					<div className="flex items-center gap-1 font-semibold text-sm line-clamp-2">
						{tx.paymentSourceName && !tx.isRemove && (
							<span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-[rgba(125,211,252,0.06)] text-glacier-on-surface-variant border border-[rgba(125,211,252,0.12)]">
								{tx.paymentSourceName}
							</span>
						)}
						<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[rgba(125,211,252,0.08)] text-glacier-primary border border-[rgba(125,211,252,0.15)]">
							{tx.userName || "Ẩn danh"}
						</span>
						{tx.isRemove && (
							<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
								Đã xoá
							</span>
						)}
					</div>
				</div>
			</div>
			<div className="flex items-center gap-2 relative">
				<div className="text-right">
					<div
						className={`font-bold text-sm ${tx.type === "income" ? "text-emerald-400" : "text-red-500"}`}>
						{tx.type === "income" ? "+" : "-"}
						{formatCurrency(tx.amount)}
					</div>
					<div className="text-[10px] text-slate-500">
            {formatDate(tx.transactionDate)}
					</div>
				</div>
			</div>
			{tx.isOwn && !tx.isRemove ? (
				<div className="absolute -top-3 -right-2">
					<button
						onClick={() => onDelete(tx._id)}
						disabled={deleting === tx._id}
						className="group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-100 text-red-400 flex items-center justify-center transition-all hover:bg-red-500/20">
						{deleting === tx._id ? (
							<span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
						) : (
							<Trash2 size={14} />
						)}
					</button>
				</div>
			) : null}
		</div>
	);
});

export default TransactionItem;
