"use client";

import { dueStatusLabel, type CreditDebtInfo } from "@/lib/debt";
import { formatCurrency } from "@/lib/utils";
import { CalendarClock, CreditCard, Plus } from "lucide-react";
import Link from "next/link";

interface DebtSectionProps {
	debts: CreditDebtInfo[];
	totalDebt: number;
	loading: boolean;
	onPay: (debt: CreditDebtInfo) => void;
}

function dueTone(debt: CreditDebtInfo): string {
	switch (debt.status) {
		case "overdue":
			return "text-red-400";
		case "due-today":
		case "due-soon":
		case "no-due-date":
			return "text-orange-300";
		case "paid":
			return "text-emerald-400";
		default:
			return "text-glacier-on-surface-variant";
	}
}

export default function DebtSection({
	debts,
	totalDebt,
	loading,
	onPay,
}: DebtSectionProps) {
	if (loading) {
		return (
			<div className="glass-panel p-4 rounded-xl space-y-3">
				<div className="h-4 w-28 rounded bg-white/5 animate-pulse" />
				<div className="h-16 rounded-xl bg-white/5 animate-pulse" />
			</div>
		);
	}

	if (debts.length === 0) {
		return (
			<section className="glass-panel p-4 rounded-xl">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<CreditCard
							size={18}
							className="text-glacier-on-surface-variant"
						/>
						<div>
							<p className="text-sm font-semibold text-glacier-on-surface">
								Tín dụng/Khoản nợ
							</p>
							<p className="text-xs text-glacier-on-surface-variant">
								Thiết lập thẻ tín dụng
							</p>
						</div>
					</div>
					<Link
						href="/accounts/add"
						className="flex items-center gap-1 rounded-full border border-[rgba(125,211,252,0.2)] bg-[rgba(125,211,252,0.08)] px-3 py-1.5 text-xs font-semibold text-glacier-primary active:scale-95">
						<Plus size={14} />
						Thêm thẻ
					</Link>
				</div>
			</section>
		);
	}

	return (
		<section className="glass-panel p-4 rounded-xl space-y-3">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-sm font-semibold text-glacier-on-surface">
						Tín dụng/Khoản nợ
					</p>
				</div>
				<div className="text-right">
					<p className="text-[10px] font-bold uppercase tracking-widest text-glacier-on-surface-variant">
						Tổng dư nợ
					</p>
					<p
						className={`text-lg font-bold ${totalDebt > 0 ? "text-red-400" : "text-emerald-400"}`}>
						{formatCurrency(totalDebt)}
					</p>
				</div>
			</div>

			<div className="space-y-2">
				{debts.map((debt) => (
					<div
						key={debt.id}
						className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] px-3 py-2.5">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<div className="flex items-center gap-1.5">
									<CreditCard
										size={15}
										className="shrink-0 text-glacier-primary"
									/>
									<p className="truncate text-sm font-semibold text-glacier-on-surface">
										{debt.name}
									</p>
									{debt.lastFourDigits && (
										<span className="shrink-0 text-[11px] text-glacier-on-surface-variant">
											•••• {debt.lastFourDigits}
										</span>
									)}
								</div>
								<div
									className={`mt-0.5 flex items-center gap-1 text-[11px] ${dueTone(debt)}`}>
									<CalendarClock size={12} />
									<span>{dueStatusLabel(debt)}</span>
								</div>
								{debt.status === "no-due-date" && (
									<Link
										href={`/accounts/edit/${debt.id}`}
										className="mt-1 inline-block text-[11px] font-semibold text-glacier-primary hover:underline">
										Thiết lập hạn trả →
									</Link>
								)}
							</div>

							<div className="shrink-0 text-right">
								<p
									className={`text-sm font-bold ${debt.debt > 0 ? "text-red-400" : "text-emerald-400"}`}>
									{formatCurrency(debt.debt)}
								</p>
								{debt.debt > 0 && (
									<button
										onClick={() => onPay(debt)}
										className="mt-1 rounded-md bg-white px-[0.825rem] py-[0.275rem] text-[11px] font-bold text-black transition-all active:scale-95">
										Trả nợ
									</button>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
