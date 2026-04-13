"use client";

import { gooeyToast } from "goey-toast";
import {
	ArrowRight,
	Car,
	FileQuestion,
	ShoppingBag,
	Utensils,
	X,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface QuickPaymentModalProps {
	isOpen: boolean;
	accounts: Array<{
		id: string;
		name: string;
		type: string;
		debt?: number;
		balance?: number;
	}>;
	onClose: () => void;
	onSuccess: () => void;
}

const categories = [
	{ id: "utilities", label: "Tiện ích", icon: Zap },
	{ id: "retail", label: "Mua sắm", icon: ShoppingBag },
	{ id: "dining", label: "Nhà hàng", icon: Utensils },
	{ id: "other", label: "Khác", icon: FileQuestion },
	{ id: "travel", label: "Du lịch", icon: Car },
];

export default function QuickPaymentModal({
	isOpen,
	accounts,
	onClose,
	onSuccess,
}: QuickPaymentModalProps) {
	const [amount, setAmount] = useState("");
	const [category, setCategory] = useState("utilities");
	const [note, setNote] = useState("");
	const [paymentSourceId, setPaymentSourceId] = useState(
		accounts[0]?.id || "",
	);
	const [txType, setTxType] = useState<"expense" | "income">("expense");
	const [debtAction, setDebtAction] = useState<"none" | "charge" | "payment">(
		"none",
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);

	// iOS: keyboard is already open (triggered by hidden input in parent on the same gesture).
	// requestAnimationFrame runs before paint, still within the keyboard-open window.
	useEffect(() => {
		let raf: number;
		const id = setTimeout(() => {
			raf = requestAnimationFrame(() => inputRef.current?.focus());
		}, 50);
		return () => {
			clearTimeout(id);
			cancelAnimationFrame(raf);
		};
	}, []);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	const displayAmount = amount ? parseFloat(amount) : 0;

	const handleConfirm = async () => {
		const parsed = parseFloat(amount);
		if (isNaN(parsed) || parsed <= 0) {
			setError("Vui lòng nhập số tiền hợp lệ");
			return;
		}

		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/transactions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					description:
						note ||
						categories.find((c) => c.id === category)?.label ||
						category,
					amount: parsed,
					category,
					type: txType,
					paymentSourceId: paymentSourceId || undefined,
					debtAction: debtAction === "none" ? undefined : debtAction,
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				const msg = data.error || "Xử lý giao dịch thất bại";
				setError(msg);
				gooeyToast.error("Thất bại", { description: msg });
				return;
			}

			gooeyToast.success("Giao dịch đã lưu", {
				description: `${txType === "income" ? "+" : "-"}${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(parsed)}`,
			});
			onSuccess();
			router.refresh();
			onClose();
		} catch {
			const msg = "Lỗi kết nối. Vui lòng thử lại.";
			setError(msg);
			gooeyToast.error("Lỗi kết nối", { description: msg });
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			{/* Backdrop */}
			<div
				className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
				onClick={onClose}
			/>

			{/* Drawer — always rendered, slides in/out via top */}
			<div
				className={`fixed left-0 right-0 bottom-0 z-60 glass-panel-elevated rounded-t-2xl max-h-[80vh] flex flex-col transition-[top] duration-400 ease-in-out ${isOpen ? "top-[25vh]" : "top-[100vh]"}`}>
				<div className="overflow-y-auto flex-1 p-6 pb-4">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-2xl font-bold text-[#e0e8f0]">
							Thêm nhanh
						</h2>
						<button
							onClick={onClose}
							className="w-10 h-10 rounded-full bg-[rgba(125,211,252,0.1)] flex items-center justify-center text-[#a0b4c4] hover:text-[#e0e8f0] transition-colors">
							<X size={18} />
						</button>
					</div>

					{/* Amount Display */}
					<div className="text-center mb-6">
						<p className="text-[10px] font-bold uppercase tracking-widest text-[#a0b4c4] mb-2">
							Nhập số tiền
						</p>
						<div className="relative">
							<span className="text-5xl font-extrabold text-[#7dd3fc]">
								{new Intl.NumberFormat("vi-VN", {
									style: "currency",
									currency: "VND",
									maximumFractionDigits: 0,
								}).format(displayAmount)}
							</span>
						</div>
						<input
							ref={inputRef}
							type="number"
							value={amount}
							onChange={(e) => {
								setAmount(e.target.value);
								setError("");
							}}
							className="glass-input w-full mt-4 py-3 px-4 rounded-xl text-center text-[#e0e8f0] text-xl font-bold placeholder:text-[#4a6070]"
							placeholder="0"
							min="0"
							step="1000"
							inputMode="numeric"
							autoFocus
						/>
					</div>

					{/* Transaction Type */}
					<div className="mb-5">
						<label className="text-xs font-semibold text-[#a0b4c4] mb-2 block">
							Loại
						</label>
						<div className="flex gap-3">
							<button
								onClick={() => setTxType("expense")}
								className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-95 ${
									txType === "expense"
										? "border-red-400/50 bg-red-500/10 text-red-400"
										: "border-[rgba(125,211,252,0.1)] text-[#a0b4c4]"
								}`}>
								Chi tiêu
							</button>
							<button
								onClick={() => setTxType("income")}
								className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-95 ${
									txType === "income"
										? "border-emerald-400/50 bg-emerald-500/10 text-emerald-400"
										: "border-[rgba(125,211,252,0.1)] text-[#a0b4c4]"
								}`}>
								Thu nhập
							</button>
						</div>
					</div>

					{/* Account Selector */}
					<div className="mb-5 relative">
						<label className="text-xs font-semibold text-[#a0b4c4] mb-2 block">
							Nguồn thanh toán
						</label>
						{accounts.length === 0 ? (
							<div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
								<span className="text-yellow-400 text-sm">
									⚠
								</span>
								<p className="text-yellow-400 text-sm font-medium">
									Bạn chưa có nguồn thanh toán nào. Vui lòng
									thêm tài khoản trước.
								</p>
							</div>
						) : (
							<>
								<select
									value={paymentSourceId}
									onChange={(e) =>
										setPaymentSourceId(e.target.value)
									}
									className="select select-accent glass-input w-full py-3 px-4 rounded-xl text-[#e0e8f0]">
									<option value="">
										-- Chọn nguồn thanh toán --
									</option>
									{accounts.map((a) => (
										<option key={a.id} value={a.id}>
											{a.name} ({a.type})
										</option>
									))}
								</select>
								{!paymentSourceId && (
									<p className="text-yellow-400 text-xs mt-1.5">
										⚠ Vui lòng chọn nguồn thanh toán
									</p>
								)}
							</>
						)}
						{paymentSourceId &&
							(() => {
								const selected = accounts.find(
									(a) => a.id === paymentSourceId,
								);
								if (!selected) return null;
								return (
									<div className="absolute right-0 -bottom-6">
										{selected.type === "Credit" ? (
											<div className="space-x-1">
												<span className="text-xs">
													Dư nợ:
												</span>
												<span className="text-xs font-semibold text-red-400">
													{new Intl.NumberFormat(
														"vi-VN",
														{
															style: "currency",
															currency: "VND",
															maximumFractionDigits: 0,
														},
													).format(
														Number(
															selected.debt || 0,
														),
													)}
												</span>
											</div>
										) : null}

										{/* {(selected.type === "Debit" ||
										selected.type === "Credit") && (
										<>
											<label className="text-xs font-semibold text-[#a0b4c4] mb-2 block">
												Điều chỉnh nợ
											</label>
											<div className="flex gap-2">
												<button
													type="button"
													onClick={() =>
														setDebtAction("none")
													}
													className={`flex-1 py-2 rounded-xl text-sm font-semibold ${debtAction === "none" ? "bg-[rgba(125,211,252,0.12)] text-[#7dd3fc]" : "text-[#a0b4c4]"}`}>
													Không thay đổi
												</button>
												<button
													type="button"
													onClick={() =>
														setDebtAction("charge")
													}
													className={`flex-1 py-2 rounded-xl text-sm font-semibold ${debtAction === "charge" ? "bg-[rgba(125,211,252,0.12)] text-red-400" : "text-[#a0b4c4]"}`}>
													Tăng nợ (ghi nợ)
												</button>
												<button
													type="button"
													onClick={() =>
														setDebtAction("payment")
													}
													className={`flex-1 py-2 rounded-xl text-sm font-semibold ${debtAction === "payment" ? "bg-[rgba(125,211,252,0.12)] text-emerald-400" : "text-[#a0b4c4]"}`}>
													Giảm nợ (thanh toán)
												</button>
											</div>
										</>
									)} */}
									</div>
								);
							})()}
					</div>

					{/* Category */}
					<div className="mb-5">
						<div className="flex justify-between items-center mb-3">
							<p className="text-sm font-medium text-[#e0e8f0]">
								Danh mục
							</p>
							{/* <button className="text-[#7dd3fc] text-xs font-medium">Xem tất cả</button> */}
						</div>
						<div className="flex gap-3">
							{categories.map(({ id, label, icon: Icon }) => (
								<button
									key={id}
									onClick={() => setCategory(id)}
									className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border transition-all active:scale-95 ${
										category === id
											? "border-[rgba(125,211,252,0.5)] bg-[rgba(125,211,252,0.1)] text-[#7dd3fc]"
											: "border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.4)] text-[#a0b4c4]"
									}`}>
									<Icon size={20} />
									<span className="text-[9px] font-bold uppercase tracking-wide">
										{label}
									</span>
								</button>
							))}
						</div>
					</div>

					{/* Note */}
					<div className="mb-5">
						<input
							type="text"
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder="Ghi chú (tuỳ chọn) — Dùng để làm gì?"
							className="glass-input w-full py-3 px-4 rounded-xl text-[#e0e8f0] placeholder:text-[#4a6070] text-sm"
							maxLength={200}
						/>
					</div>

					{error && (
						<p className="text-red-400 text-sm mb-4">{error}</p>
					)}

					{/* Confirm */}
					<button
						onClick={handleConfirm}
						disabled={
							loading ||
							!amount ||
							!paymentSourceId ||
							accounts.length === 0
						}
						className="w-full py-4 rounded-full bg-[#7dd3fc] text-[#001f2e] font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#93d9fc] transition-colors active:scale-[0.98]">
						Xác nhận
						{!loading && <ArrowRight size={20} />}
					</button>
				</div>
			</div>
		</>
	);
}
