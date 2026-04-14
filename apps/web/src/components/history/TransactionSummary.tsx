"use client";

import { formatCurrency } from "@/lib/utils";
import { Landmark, Users } from "lucide-react";
import { memo } from "react";

interface TransactionSummaryProps {
	totalSpent: number;
	total: number;
}

const TransactionSummary = memo(function TransactionSummary({
	totalSpent,
	total,
}: TransactionSummaryProps) {
	return (
		<div className="grid grid-cols-2 gap-4">
			<div className="glass-panel p-4 rounded-xl">
				<div className="flex items-center gap-2 text-[#7dd3fc] mb-2">
					<Landmark size={14} />
					<span className="text-[10px] font-bold uppercase tracking-wider">
						Tổng chi tiêu
					</span>
				</div>
				<div className="text-xl font-bold text-[#e0e8f0]">
					{formatCurrency(totalSpent)}
				</div>
				<div className="text-xs text-[#a0b4c4] mt-1">Tháng này</div>
			</div>
			<div className="glass-panel p-4 rounded-xl">
				<div className="flex items-center gap-2 text-[#c8a0f0] mb-2">
					<Users size={14} />
					<span className="text-[10px] font-bold uppercase tracking-wider">
						Tổng giao dịch
					</span>
				</div>
				<div className="text-xl font-bold text-[#e0e8f0]">{total}</div>
				<div className="text-xs text-[#a0b4c4] mt-1">
					Tất cả thành viên
				</div>
			</div>
		</div>
	);
});

export default TransactionSummary;
