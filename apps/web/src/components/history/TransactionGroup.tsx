"use client";

import TransactionItem, { Transaction } from "@/components/TransactionItem";
import { memo } from "react";

interface TransactionGroupProps {
	label: string;
	transactions: Transaction[];
	deleting: string | null;
	onDelete: (id: string) => void;
}

const TransactionGroup = memo(function TransactionGroup({
	label,
	transactions,
	deleting,
	onDelete,
}: TransactionGroupProps) {
	return (
		<div>
			<h3 className="sticky top-0 z-10 text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1 py-1 bg-glacier-bg/80 backdrop-blur-sm">
				{label}
			</h3>
			<div className="space-y-3">
				{transactions.map((tx) => (
					<TransactionItem
						key={tx._id}
						tx={tx}
						deleting={deleting}
						onDelete={onDelete}
					/>
				))}
			</div>
		</div>
	);
});

export default TransactionGroup;
