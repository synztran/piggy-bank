"use client";

import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import { useMemo } from "react";
import TypeBadge from "./TypeBadge";

interface EstateItem {
	_id: string;
	type: "gold" | "stock" | "keyboard";
	name: string;
	boughtAt: string;
	price: number;
	source: string;
	quantityUnit?: string;
	quantity?: number;
}

interface EstateSummaryCardProps {
	estates: EstateItem[];
	showValues: boolean;
}

const typeLabel: Record<string, string> = {
	gold: "Vàng",
	stock: "Cổ phiếu",
	keyboard: "Bàn phím",
};

const typeIcons: Record<string, string> = {
	gold: "/icons/golds.png",
	stock: "/icons/stocks.png",
	keyboard: "/icons/keyboards.png",
};

export default function EstateSummaryCard({
	estates,
	showValues,
}: EstateSummaryCardProps) {
	const totalsByType = useMemo(() => {
		const map: Record<string, number> = {};
		for (const e of estates) {
			map[e.type] = (map[e.type] || 0) + e.price;
		}
		return map;
	}, [estates]);

	const goldDetail = useMemo(() => {
		let totalChi = 0;
		for (const e of estates) {
			if (e.type !== "gold" || e.quantity == null) continue;
			if (e.quantityUnit === "lượng") {
				totalChi += e.quantity * 10;
			} else {
				totalChi += e.quantity;
			}
		}
		if (totalChi === 0) return null;
		const luong = Math.floor(totalChi / 10);
		const chi = Math.round((totalChi % 10) * 100) / 100;
		return `${luong} lượng ${chi} chỉ`;
	}, [estates]);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="glass-panel p-4 rounded-xl">
			<div className="flex items-center justify-between">
				<span className="text-sm text-glacier-on-surface-variant">
					Tổng giá trị
				</span>
				<span className="text-xl font-bold text-glacier-on-surface">
					{showValues
						? formatCurrency(
								Object.values(totalsByType).reduce(
									(a, b) => a + b,
									0,
								),
							)
						: "••••••"}
				</span>
			</div>
			<div className="space-y-2 pt-2 border-t border-white/10 sr-only">
				{Object.entries(totalsByType).map(([type, total]) => {
					const detail = type === "gold" ? goldDetail : null;
					return (
						<div
							key={type}
							className="flex items-center justify-between">
							<div>
								<div className="flex items-center gap-1">
									<Image
										src={
											typeIcons[type] ||
											"/icons/golds.png"
										}
										alt=""
										width={18}
										height={18}
										unoptimized
									/>
									<TypeBadge
										type={type}
										label={typeLabel[type] || type}
									/>
								</div>

								{detail && (
									<p className="text-xs text-glacier-on-surface-variant mt-0.5">
										{showValues ? detail : "••••••"}
									</p>
								)}
							</div>
							<p className="text-sm font-semibold text-glacier-on-surface">
								{showValues ? formatCurrency(total) : "••••••"}
							</p>
						</div>
					);
				})}
			</div>
		</motion.div>
	);
}
