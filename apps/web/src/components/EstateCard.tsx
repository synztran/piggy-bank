"use client";

import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";

interface EstateItem {
	_id: string;
	type: "gold" | "stock" | "keyboard";
	name: string;
	boughtAt: string;
	price: number;
	currentPrice?: number;
	source: string;
	quantityUnit?: string;
	quantity?: number;
}

interface EstateGroup {
	type: string;
	label: string;
	items: EstateItem[];
	boughtPrice: number;
	currentPrice: number;
	totalQuantity: string;
}

interface EstateCardProps {
	group: EstateGroup;
	showValues: boolean;
	onClick: () => void;
}

const typeIcons: Record<string, string> = {
	gold: "/icons/golds.png",
	stock: "/icons/stocks.png",
	keyboard: "/icons/keyboards.png",
};

const typeGradients: Record<string, string> = {
	gold: "bg-gradient-to-br from-[#3a2a0a] via-[#5a4a1a] to-[#8a7a2a]",
	stock: "bg-gradient-to-br from-[#0a3a1a] via-[#1a5a3a] to-[#2a7a5a]",
	keyboard: "bg-gradient-to-br from-[#2a0a3a] via-[#4a1a5a] to-[#6a2a7a]",
};

export default function EstateCard({
	group,
	showValues,
	onClick,
}: EstateCardProps) {
	const percentage =
		group.boughtPrice > 0
			? ((group.currentPrice - group.boughtPrice) / group.boughtPrice) *
				100
			: 0;

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 20, scale: 0.97 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -10, scale: 0.97 }}
			transition={{ type: "spring", stiffness: 300, damping: 25 }}
			onClick={onClick}
			className={`glass-panel rounded-xl p-5 flex flex-col gap-4 hover:border-primary/50 transition-colors group cursor-pointer ${typeGradients[group.type] || ""}`}>
			<div className="flex justify-between items-start">
				<div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
					<Image
						src={typeIcons[group.type] || "/icons/golds.png"}
						alt=""
						width={24}
						height={24}
						unoptimized
					/>
				</div>
				{group.boughtPrice > 0 && (
					<div
						className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
							percentage >= 0
								? "text-income bg-income/10"
								: "text-expense bg-expense/10"
						}`}>
						<span>{percentage >= 0 ? "↑" : "↓"}</span>
						{Math.abs(percentage).toFixed(1)}%
					</div>
				)}
			</div>
			<div className="space-y-1">
				<p className="text-xs text-glacier-on-surface-variant">
					{showValues ? group.totalQuantity : "••••••"}
				</p>
				<div className="relative">
					{group.boughtPrice > 0 && (
						<p className="text-sm text-glacier-on-surface-variant">
							{showValues ? totalPrice(group) : "••••••"}
						</p>
					)}
				</div>
			</div>
		</motion.div>
	);
}

const totalPrice = (group: EstateGroup) => {
	switch (group.type) {
		case "keyboard":
			return null;
		case "stock": {
			return null;
		}
		default: {
			return formatCurrency(group.boughtPrice);
		}
	}
};
