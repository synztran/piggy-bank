"use client";

import { formatCurrency } from "@/lib/utils";
import { Plus, RefreshCw } from "lucide-react";
import React from "react";

interface MemberBalance {
	name: string;
	balance: number;
	isCurrentUser: boolean;
}

interface HeroBalanceCardProps {
	totalBalance: number;
	memberBalances: MemberBalance[];
	loading: boolean;
	onUpdateBalance: () => void;
	onQuickPayment: () => void;
}

const HeroBalanceCard = React.memo(function HeroBalanceCard({
	totalBalance,
	memberBalances,
	loading,
	onUpdateBalance,
	onQuickPayment,
}: HeroBalanceCardProps) {
	return (
		<section className="relative group">
			<div
				className="absolute -inset-0.5 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"
				style={{
					background:
						"linear-gradient(135deg, rgba(125,211,252,0.2), rgba(200,160,240,0.2))",
				}}
			/>
			<div className="relative glass-panel-elevated p-4 rounded-xl shadow-[0_0_40px_rgba(125,211,252,0.1)] overflow-hidden">
				<div
					className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10"
					style={{
						background: "rgba(125,211,252,0.04)",
						filter: "blur(48px)",
					}}
				/>
				<div className="flex justify-between items-start mb-5">
					<div>
						<p className="text-[#a0b4c4] text-xs font-medium tracking-wide uppercase mb-1">
							Số Dư Của Tôi
						</p>
						{loading ? (
							<div className="h-10 w-40 bg-[rgba(125,211,252,0.1)] rounded animate-pulse" />
						) : (
							<h1 className="text-4xl font-extrabold text-[#e0e8f0] tracking-tight">
								{formatCurrency(totalBalance)}
							</h1>
						)}
					</div>
				</div>

				{!loading && memberBalances.length > 1 && (
					<div className="flex gap-2 mb-4">
						{memberBalances.map((m) => (
							<div
								key={m.name}
								className={`flex-1 rounded-xl px-3 py-2 border ${
									m.isCurrentUser
										? "border-[rgba(125,211,252,0.3)] bg-[rgba(125,211,252,0.07)]"
										: "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)]"
								}`}>
								<p className="text-[9px] font-bold uppercase tracking-wider text-[#a0b4c4] mb-0.5">
									{m.name.split(" ")[0]}
									{m.isCurrentUser && (
										<span className="ml-1 text-[#7dd3fc]">
											(tôi)
										</span>
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
						onClick={onUpdateBalance}
						className="flex-1 glass-panel hover:bg-[rgba(125,211,252,0.1)] text-[#7dd3fc] py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 border-[rgba(125,211,252,0.2)] text-xs">
						<RefreshCw size={16} />
						Cập nhật hạn mức
					</button>
					<button
						onClick={onQuickPayment}
						className="flex-1 border border-[rgba(125,211,252,0.3)] text-[#7dd3fc] py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-[rgba(125,211,252,0.15)]"
						style={{ background: "rgba(125,211,252,0.15)" }}>
						<Plus size={16} />
						Chi tiêu
					</button>
				</div>
			</div>
		</section>
	);
});

export default HeroBalanceCard;
