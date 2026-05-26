"use client";

import { formatCurrency } from "@/lib/utils";
import { Eye, EyeOff, Plus, RefreshCw } from "lucide-react";
import React, { use, useEffect, useState } from "react";

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
	const [showTotalBalance, setShowTotalBalance] = useState(false);
	const [hiddenMembers, setHiddenMembers] = useState<Set<string>>(
		new Set(memberBalances.map((m) => m.name)),
	);

	const toggleMemberBalance = (name: string) => {
		setHiddenMembers((prev) => {
			const next = new Set(prev);
			if (next.has(name)) next.delete(name);
			else next.add(name);
			return next;
		});
	};

  useEffect(() => {
    setHiddenMembers(new Set(memberBalances.map((m) => m.name)));
  }, [memberBalances]);

	return (
		<section className="relative group">
			<div
				className="absolute -inset-0.5 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"
			/>
			<div className="relative py-4 overflow-hidden">
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
								<div className="flex items-center justify-between">
									<p className="text-[10px] font-bold uppercase tracking-wider text-glacier-on-surface-variant">
										{m.name.split(" ")[0]}
										{m.isCurrentUser && (
											<span className="ml-1 text-glacier-primary">
												(tôi)
											</span>
										)}
									</p>
									<button
										onClick={() => toggleMemberBalance(m.name)}
										className="text-glacier-on-surface-variant hover:text-glacier-on-surface transition-colors">
										{hiddenMembers.has(m.name) ? <EyeOff size={16} /> : <Eye size={16} />}
									</button>
								</div>
								<p className="text-sm font-bold text-glacier-on-surface">
									{hiddenMembers.has(m.name) ? "••••••" : formatCurrency(m.balance)}
								</p>
							</div>
						))}
					</div>
				)}
				<div className="flex justify-between items-start mb-5">
					<div>
						<p className="text-glacier-on-surface-variant font-medium tracking-wide text-lg">
							Số dư
						</p>
						{loading ? (
							<div className="h-10 w-40 bg-[rgba(125,211,252,0.1)] rounded animate-pulse" />
						) : (
							<h1 className="text-5xl font-extrabold text-glacier-on-surface tracking-tight">
								{showTotalBalance ? formatCurrency(totalBalance) : "••••••"}
							</h1>
						)}
					</div>
					<button
						onClick={() => setShowTotalBalance(!showTotalBalance)}
						className="p-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-glacier-on-surface-variant hover:text-glacier-on-surface transition-colors">
						{showTotalBalance ? <Eye size={16} /> : <EyeOff size={16} />}
					</button>
				</div>

				<div className="flex items-center gap-2">
          <button
						onClick={onQuickPayment}
						className="max-w-max px-3 py-1.5 rounded-full font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 text-black bg-white"
						>
						<Plus size={20} className="rounded-full bg-black p-0.5 text-glacier-on-surface" />
						Chi tiêu
					</button>
					<button
						onClick={onUpdateBalance}
						className="max-w-max text-glacier-on-surface px-3 py-1.5 rounded-full font-semibold transition-all active:scale-95 bg-[rgba(125,211,252,0.1)]">
						Cập nhật
					</button>
				</div>
			</div>
		</section>
	);
});

export default HeroBalanceCard;
