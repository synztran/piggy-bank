"use client";

import type { CreditDebtInfo } from "@/lib/debt";
import { formatCurrency } from "@/lib/utils";
import { gooeyToast } from "goey-toast";
import { CalendarDays, CheckCircle, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface PaymentSource {
	id: string;
	name: string;
	type: "Debit" | "Credit" | "Cash" | "Transfer";
	balance?: number;
}

interface DebtPaymentModalProps {
	isOpen: boolean;
	debts: CreditDebtInfo[];
	accounts: PaymentSource[];
	initialDebtId?: string | null;
	onClose: () => void;
	onSuccess: () => void;
}

function todayInputValue(): string {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${now.getFullYear()}-${month}-${day}`;
}

export default function DebtPaymentModal({
	isOpen,
	debts,
	accounts,
	initialDebtId,
	onClose,
	onSuccess,
}: DebtPaymentModalProps) {
	const [targetId, setTargetId] = useState("");
	const [fundingId, setFundingId] = useState("");
	const [amount, setAmount] = useState("");
	const [transactionDate, setTransactionDate] = useState(
		todayInputValue,
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const fundingAccounts = useMemo(
		() => accounts.filter((account) => account.type !== "Credit"),
		[accounts],
	);

	const target = debts.find((debt) => debt.id === targetId);
	const funding = fundingAccounts.find((account) => account.id === fundingId);

	const delta = parseFloat(amount) || 0;
	const debtAfter = target ? Math.max(0, target.debt - delta) : 0;
	const fundingAfter = funding
		? Number(funding.balance || 0) - delta
		: 0;

	useEffect(() => {
		if (!isOpen) return;

		const initial =
			debts.find((debt) => debt.id === initialDebtId) ??
			debts.find((debt) => debt.debt > 0) ??
			debts[0];

		setTargetId(initial?.id ?? "");
		setAmount(initial && initial.debt > 0 ? String(initial.debt) : "");
		setFundingId(fundingAccounts[0]?.id ?? "");
		setTransactionDate(todayInputValue());
		setError("");
	}, [isOpen, initialDebtId, debts, fundingAccounts]);

	useEffect(() => {
		if (!isOpen) return;

		const prevent = (event: TouchEvent | WheelEvent) => {
			const element = event.target as HTMLElement;
			if (
				element.closest("select") ||
				element.closest("input") ||
				element.closest("textarea")
			) {
				return;
			}
			event.preventDefault();
		};

		document.addEventListener("touchmove", prevent, { passive: false });
		document.addEventListener("wheel", prevent, { passive: false });
		return () => {
			document.removeEventListener("touchmove", prevent);
			document.removeEventListener("wheel", prevent);
		};
	}, [isOpen]);

	const handleClose = useCallback(() => {
		if (loading) return;
		onClose();
	}, [loading, onClose]);

	const handleSubmit = async () => {
		if (!target) {
			setError("Vui lòng chọn thẻ cần trả nợ");
			return;
		}
		if (!funding) {
			setError("Vui lòng chọn tài khoản nguồn");
			return;
		}
		if (!Number.isFinite(delta) || delta <= 0) {
			setError("Vui lòng nhập số tiền hợp lệ");
			return;
		}
		if (delta > target.debt) {
			setError("Số tiền vượt quá dư nợ hiện tại");
			return;
		}

		setLoading(true);
		setError("");
		try {
			const description = `Thanh toán nợ • ${target.name}`;

			const res = await fetch("/api/transactions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					description,
					amount: delta,
					type: "expense",
					category: "other",
					paymentSourceId: funding.id,
					debtTargetId: target.id,
					debtAction: "payment",
					transactionDate,
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				const message = data.error || "Thanh toán nợ thất bại";
				setError(message);
				gooeyToast.error("Thanh toán thất bại", {
					description: message,
				});
				return;
			}

			gooeyToast.success("Đã thanh toán nợ", {
				description: `${formatCurrency(delta)} • ${target.name}`,
			});
			onSuccess();
			onClose();
		} catch {
			const message = "Lỗi kết nối. Vui lòng thử lại.";
			setError(message);
			gooeyToast.error("Lỗi kết nối", { description: message });
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<div
				className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
				onClick={handleClose}
			/>

			<div
				className={`fixed bottom-0 left-0 right-0 z-60 glass-panel-elevated rounded-t-3xl px-6 pt-4 pb-10 animate-in slide-in-from-bottom duration-300 transition-[bottom] ease-in-out max-h-[90vh] overflow-y-auto ${isOpen ? "bottom-0" : "bottom-[-100vh]"}`}>
				<div className="w-10 h-1 bg-[rgba(125,211,252,0.2)] rounded-full mx-auto mb-5" />

				<div className="flex items-start justify-between gap-4 mb-5">
					<div>
						<h2 className="text-2xl font-bold text-glacier-on-surface">
							Thanh toán nợ
						</h2>
						<p className="text-sm text-glacier-on-surface-variant mt-1">
							Trả nợ thẻ tín dụng từ tài khoản nguồn
						</p>
					</div>
					<button
						onClick={handleClose}
						className="w-9 h-9 shrink-0 rounded-full bg-[rgba(125,211,252,0.1)] flex items-center justify-center text-glacier-on-surface-variant hover:text-glacier-on-surface transition-colors">
						<X size={16} />
					</button>
				</div>

				<div className="space-y-4">
					<div>
						<p className="text-[10px] font-bold uppercase tracking-widest text-glacier-on-surface-variant mb-2">
							Thẻ/Khoản nợ cần trả
						</p>
						<select
							value={targetId}
							onChange={(e) => {
								setTargetId(e.target.value);
								setError("");
							}}
							className="w-full rounded-xl border border-[rgba(125,211,252,0.2)] bg-glacier-surface px-4 py-3 text-glacier-on-surface text-sm focus:border-glacier-primary focus:outline-none">
							{debts.length === 0 && (
								<option value="">Chưa có thẻ tín dụng</option>
							)}
							{debts.map((debt) => (
								<option
									key={debt.id}
									value={debt.id}
									className="bg-glacier-surface">
									{debt.name} · {formatCurrency(debt.debt)}
								</option>
							))}
						</select>
					</div>

					<div>
						<p className="text-[10px] font-bold uppercase tracking-widest text-glacier-on-surface-variant mb-2">
							Trả từ tài khoản
						</p>
						{fundingAccounts.length === 0 ? (
							<p className="text-sm text-red-400">
								Bạn cần thêm tài khoản Debit/Cash/Transfer để
								trả nợ.
							</p>
						) : (
							<select
								value={fundingId}
								onChange={(e) => {
									setFundingId(e.target.value);
									setError("");
								}}
								className="w-full rounded-xl border border-[rgba(125,211,252,0.2)] bg-glacier-surface px-4 py-3 text-glacier-on-surface text-sm focus:border-glacier-primary focus:outline-none">
								{fundingAccounts.map((account) => (
									<option
										key={account.id}
										value={account.id}
										className="bg-glacier-surface">
										{account.name} ·{" "}
										{formatCurrency(
											Number(account.balance || 0),
										)}
									</option>
								))}
							</select>
						)}
					</div>

					<div className="relative">
						<input
							type="number"
							value={amount}
							onChange={(e) => {
								setAmount(e.target.value);
								setError("");
							}}
							placeholder="0"
							className="glass-input w-full pl-4 pr-12 py-4 rounded-xl text-glacier-on-surface text-2xl font-bold placeholder:text-[#4a6070]"
							min="0"
							step="1000"
							inputMode="numeric"
						/>
						<span className="absolute right-4 top-1/2 -translate-y-1/2 text-glacier-on-surface-variant font-bold text-base">
							₫
						</span>
						{target && target.debt > 0 && (
							<button
								type="button"
								onClick={() =>
									setAmount(String(target.debt))
								}
								className="mt-2 text-xs font-semibold text-glacier-primary hover:underline">
								Trả toàn bộ {formatCurrency(target.debt)}
							</button>
						)}
					</div>

					<div className="grid grid-cols-2 gap-2">
						<div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] px-3 py-2">
							<p className="text-[10px] uppercase tracking-wider text-glacier-on-surface-variant">
								Dư nợ sau trả
							</p>
							<p className="text-sm font-bold text-glacier-on-surface">
								{formatCurrency(debtAfter)}
							</p>
						</div>
						<div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] px-3 py-2">
							<p className="text-[10px] uppercase tracking-wider text-glacier-on-surface-variant">
								Số dư nguồn sau trừ
							</p>
							<p
								className={`text-sm font-bold ${fundingAfter < 0 ? "text-red-400" : "text-glacier-on-surface"}`}>
								{formatCurrency(fundingAfter)}
							</p>
						</div>
					</div>

					{fundingAfter < 0 && (
						<p className="text-xs text-orange-300">
							Số dư tài khoản nguồn sẽ âm sau giao dịch này.
						</p>
					)}

					<div className="w-full min-w-0 max-w-full overflow-hidden">
						<p className="text-[10px] font-bold uppercase tracking-widest text-glacier-on-surface-variant mb-2 flex items-center gap-1">
							<CalendarDays size={12} />
							Ngày trả
						</p>
						<input
							type="date"
							value={transactionDate}
							max={todayInputValue()}
							onChange={(e) =>
								setTransactionDate(e.target.value)
							}
							style={{
								minWidth: 0,
								width: "100%",
								maxWidth: "100%",
							}}
							className="glass-input block w-full min-w-0 max-w-full appearance-none box-border py-3 px-3 rounded-xl text-glacier-on-surface text-sm [&::-webkit-date-and-time-value]:text-left"
						/>
					</div>

					{error && (
						<p className="text-sm text-red-400">{error}</p>
					)}

					<button
						onClick={handleSubmit}
						disabled={
							loading ||
							!target ||
							!funding ||
							delta <= 0 ||
							delta > (target?.debt ?? 0)
						}
						className="w-full py-4 rounded-full bg-glacier-primary text-[#001f2e] font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#93d9fc] transition-colors active:scale-[0.98]">
						{loading ? (
							<span className="inline-block w-5 h-5 border-2 border-[#001f2e] border-t-transparent rounded-full animate-spin" />
						) : (
							<>
								<CheckCircle size={20} />
								Xác nhận trả nợ
							</>
						)}
					</button>
				</div>
			</div>
		</>
	);
}
