"use client";

import { formatCurrency } from "@/lib/utils";
import { ArrowLeftRight, Banknote, Landmark } from "lucide-react";
import { memo } from "react";

interface TransactionSummaryProps {
	totalSpent: number;
	totalIncome: number;
	totalTransactionsIn: number;
	totalTransactionsOut: number;
	total: number;
}

const MoneyCard = memo(function MoneyCard({
	totalSpent,
	totalIncome,
}: {
	totalSpent: number;
	totalIncome: number;
}) {
	return (
		<div className="glass-panel p-4 rounded-xl">
			<div className="flex items-center gap-2 text-glacier-primary">
				<Banknote size={14} />
				<span className="text-[10px] font-bold uppercase tracking-wider flex items-center">
					Tổng chi tiêu
				</span>
			</div>
			<div className="font-bold text-glacier-on-surface">
				<span className={`text-red-400 ${totalSpent >= totalIncome ? "text-sm" : "text-xs"}`}>{formatCurrency(totalSpent, false)}</span>&nbsp;/&nbsp;
				<span className={`text-emerald-400 ${totalIncome >= totalSpent ? "text-sm" : "text-xs"}`}>{formatCurrency(totalIncome, false)}</span>
			</div>
			<div className="text-[10px] text-glacier-on-surface-variant mt-1">Tháng này</div>
		</div>
	);
});

const TransactionCountCard = memo(function TransactionCountCard({
	totalIn,
	totalOut,
}: {
	totalIn: number;
	totalOut: number;
}) {
	return (
		<div className="glass-panel p-4 rounded-xl flex-1">
			<div className="flex items-center gap-2 text-glacier-tertiary">
				<ArrowLeftRight size={14} />
				<span className="text-[10px] font-bold uppercase tracking-wider">
				  Giao dịch
				</span>
			</div>
			<div className="font-bold text-glacier-on-surface">
				<span className="text-red-400 text-sm">{totalOut}</span>&nbsp;/&nbsp;
				<span className="text-emerald-400 text-sm">{totalIn}</span>
			</div>
			<div className="text-[10px] text-glacier-on-surface-variant mt-1">
				Tháng này
			</div>
		</div>
	);
});

const TransactionSummary = memo(function TransactionSummary({
	totalSpent,
	totalIncome,
	totalTransactionsIn,
	totalTransactionsOut,
	total,
}: TransactionSummaryProps) {
	return (
		<div
			className="flex items-center gap-2"
			// style={{
			// 	marginTop: "calc(env(safe-area-inset-top))",
			// }}
      >
			<MoneyCard totalSpent={totalSpent} totalIncome={totalIncome} />
			<TransactionCountCard totalIn={totalTransactionsIn} totalOut={totalTransactionsOut} />
		</div>
	);
});

export default TransactionSummary;
