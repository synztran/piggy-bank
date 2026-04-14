"use client";

import { formatCurrency } from "@/lib/utils";
import {
	FileQuestion,
	Plane,
	PlaySquare,
	ShoppingBag,
	Utensils,
	Zap,
} from "lucide-react";
import React from "react";

interface SpendingItem {
	category: string;
	amount: number;
	percentage: number;
}

interface SpendingInsightsProps {
	spending: SpendingItem[];
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

const categoryBarColor: Record<string, string> = {
	food: "bg-orange-400",
	dining: "bg-sky-400",
	travel: "bg-sky-400",
	subscriptions: "bg-purple-400",
	retail: "bg-emerald-400",
	utilities: "bg-yellow-400",
	other: "bg-red-200",
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

const SpendingInsights = React.memo(function SpendingInsights({
	spending,
}: SpendingInsightsProps) {
	const topSpending = spending
		.filter((s) => s.category !== "income")
		.sort((a, b) => b.amount - a.amount)
		.slice(0, 2);

	const subscriptions = spending.find((s) => s.category === "subscriptions");

	return (
		<section className="space-y-4">
			<h2 className="text-xl font-bold text-[#e0e8f0] tracking-tight">
				Phân tích chi tiêu
			</h2>

			<div className="grid grid-cols-2 gap-4">
				{topSpending.length === 0 && (
					<div className="col-span-2 glass-panel p-5 rounded-xl text-center text-[#a0b4c4] text-sm">
						Chưa có dữ liệu chi tiêu. Hãy thêm giao dịch đầu tiên!
					</div>
				)}
				{topSpending.map((item) => {
					const Icon = categoryIcon[item.category] || ShoppingBag;
					const textColor =
						categoryColor[item.category] || "text-slate-400";
					const barColor =
						categoryBarColor[item.category] || "bg-slate-400";
					const bgClass =
						categoryBg[item.category] ||
						"bg-slate-500/10 border-slate-500/20";
					return (
						<div
							key={item.category}
							className="glass-panel p-5 rounded-xl flex flex-col justify-between min-h-[140px] hover:border-[rgba(125,211,252,0.3)] transition-colors">
							<div className="flex justify-between items-start">
								<div
									className={`p-2 rounded-lg border ${bgClass} ${textColor}`}>
									<Icon size={20} />
								</div>
								<span className="text-xs font-medium text-[#a0b4c4]">
									{item.percentage}%
								</span>
							</div>
							<div>
								<p className="text-[#a0b4c4] text-sm">
									<span className="capitalize">
										{categoryLabel[item.category] ||
											item.category}
									</span>
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

			{subscriptions && (
				<div className="glass-panel p-5 rounded-xl flex items-center justify-between hover:border-[rgba(125,211,252,0.3)] transition-colors">
					<div className="flex items-center gap-4">
						<div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
							<PlaySquare size={22} />
						</div>
						<div>
							<p className="text-[#a0b4c4] text-sm">
								Đăng ký dịch vụ
							</p>
							<p className="text-lg font-bold text-[#e0e8f0]">
								{formatCurrency(subscriptions.amount)}{" "}
								<span className="text-xs font-normal text-[#a0b4c4]">
									/tháng
								</span>
							</p>
						</div>
					</div>
				</div>
			)}
		</section>
	);
});

export default SpendingInsights;
