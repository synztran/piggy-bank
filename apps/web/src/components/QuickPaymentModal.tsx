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
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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

function SwipeToConfirm({
	onConfirm,
	disabled,
  txType
}: {
	onConfirm: () => void;
	disabled: boolean;
  txType: "expense" | "income";
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const x = useMotionValue(0);
	const [containerWidth, setContainerWidth] = useState(0);
	const thumbSize = 48;
	const threshold = 0.85;

	useEffect(() => {
		if (containerRef.current) {
			setContainerWidth(containerRef.current.offsetWidth);
		}
	}, []);

	const maxDrag = containerWidth - thumbSize - 8;
	const bgOpacity = useTransform(x, [0, maxDrag], [0, 1]);
	const textOpacity = useTransform(x, [0, maxDrag * 0.5], [1, 0]);

	const handleDragEnd = () => {
		if (disabled) return;
		const current = x.get();
		if (current >= maxDrag * threshold) {
			onConfirm();
		}
		x.set(0);
	};

	return (
		<div ref={containerRef} className="absolute inset-0 flex items-center">
			{/* Background fill */}
			<motion.div
				className="absolute inset-0 rounded-full bg-glacier-primary"
				style={{ opacity: bgOpacity }}
			/>
			{/* Label */}
			<motion.span
				className="absolute inset-0 flex items-center justify-center text-sm font-bold text-glacier-primary pointer-events-none"
				style={{ opacity: textOpacity }}>
				Vuốt để xác nhận {txType === "expense" ? "chi tiêu" : "thu nhập"} →
			</motion.span>
			{/* Draggable thumb */}
			<motion.div
				drag="x"
				dragConstraints={{ left: 0, right: maxDrag }}
				dragElastic={0}
				dragMomentum={false}
				onDragEnd={handleDragEnd}
				style={{ x }}
				className={`relative z-10 ml-1 w-12 h-12 rounded-full bg-glacier-primary flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
				<ArrowRight size={22} className="text-[#001f2e]" />
			</motion.div>
		</div>
	);
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
	const defaultTransactionDate = () => new Date().toISOString().slice(0, 10);
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
	const [transactionDate, setTransactionDate] = useState(
		defaultTransactionDate,
	);
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);

	const resetForm = useCallback(() => {
		setAmount("");
		setCategory("utilities");
		setNote("");
		setPaymentSourceId(accounts[0]?.id || "");
		setTxType("expense");
		setDebtAction("none");
		setError("");
		setTransactionDate(defaultTransactionDate());
	}, [accounts]);

	const handleClose = useCallback(() => {
		resetForm();
		onClose();
	}, [onClose, resetForm]);

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
		if (accounts) {
			setPaymentSourceId(accounts[0]?.id || "");
		}
	}, [accounts]);

	useEffect(() => {
		if (!isOpen) {
			resetForm();
		}
	}, [isOpen, resetForm]);

	useEffect(() => {
		if (!isOpen) return;
		const prevent = (e: TouchEvent | WheelEvent) => e.preventDefault();
		document.addEventListener("touchmove", prevent, { passive: false });
		document.addEventListener("wheel", prevent, { passive: false });
		return () => {
			document.removeEventListener("touchmove", prevent);
			document.removeEventListener("wheel", prevent);
		};
	}, [isOpen]);

	const displayAmount = amount ? parseFloat(amount) : 0;

	const handleConfirm = useCallback(async () => {
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
					transactionDate: transactionDate || undefined,
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
			resetForm();
			onSuccess();
			router.refresh();
			handleClose();
		} catch {
			const msg = "Lỗi kết nối. Vui lòng thử lại.";
			setError(msg);
			gooeyToast.error("Lỗi kết nối", { description: msg });
		} finally {
			setLoading(false);
		}
	}, [
		amount,
		category,
		note,
		txType,
		paymentSourceId,
		debtAction,
		transactionDate,
		resetForm,
		handleClose,
		onSuccess,
		router,
	]);

	return (
		<>
			{/* Backdrop */}
			<div
				className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
				onClick={handleClose}
			/>

			{/* Drawer — always rendered, slides in/out via top */}
			<div
				className={`fixed mb-0 left-0 right-0 z-60 glass-panel-elevated rounded-t-3xl px-6 pt-4 pb-10 animate-in slide-in-from-bottom duration-300 transition-[bottom] ease-in-out max-h-[80vh] ${isOpen ? "bottom-0" : "bottom-[-100vh]"}`}>
				{/* Handle */}
				<div className="w-10 h-1 bg-[rgba(125,211,252,0.2)] rounded-full mx-auto mb-4" />
				<div className="overflow-y-auto">
					{/* Amount Display */}
					<div className="text-center mb-4">
						<div className="mb-4">
						<div className="flex items-center justify-center gap-4">
							<button
								onClick={() => setTxType("expense")}
								className={`text-lg font-semibold transition-all active:scale-95 ${
									txType === "expense"
										? "border-red-400/50 text-red-400"
										: "border-[rgba(125,211,252,0.1)] text-glacier-on-surface-variant"
								}`}>
								Chi tiền
							</button>
							<button
								onClick={() => setTxType("income")}
								className={`text-lg font-semibold transition-all active:scale-95 ${
									txType === "income"
										? "border-emerald-400/50 text-emerald-400"
										: "border-[rgba(125,211,252,0.1)] text-glacier-on-surface-variant"
								}`}>
								Thu tiền
							</button>
						</div>
					</div>

						<div className="relative">
							<span className="text-3xl font-extrabold text-[#7dd3fc]">
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
							className="glass-input w-full mt-2 py-2 px-4 rounded-xl text-center text-glacier-on-surface text-xl font-bold placeholder:text-glacier-on-surface-variant"
							placeholder="0"
							min="0"
							step="1000"
							inputMode="numeric"
							autoFocus
						/>
					</div>

					{/* Transaction Type */}
					{/* <div className="mb-4">
						<label className="text-xs font-semibold text-glacier-on-surface-variant mb-2 block">
							Loại giao dịch
						</label>
						<div className="flex gap-3">
							<button
								onClick={() => setTxType("expense")}
								className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
									txType === "expense"
										? "border-red-400/50 bg-red-500/10 text-red-400"
										: "border-[rgba(125,211,252,0.1)] text-glacier-on-surface-variant"
								}`}>
								Chi tiêu
							</button>
							<button
								onClick={() => setTxType("income")}
								className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
									txType === "income"
										? "border-emerald-400/50 bg-emerald-500/10 text-emerald-400"
										: "border-[rgba(125,211,252,0.1)] text-glacier-on-surface-variant"
								}`}>
								Thu nhập
							</button>
						</div>
					</div> */}

					{/* Account Selector */}
					<div className="flex items-center gap-4 mb-6 relative">
						{/* Date */}
						<div className="clear-both w-full">
							<label className="text-xs font-semibold text-[#a0b4c4] mb-2 block">
								Ngày giao dịch
							</label>
							<input
								type="date"
								value={transactionDate}
								max={new Date().toISOString().slice(0, 10)}
								onChange={(e) =>
									setTransactionDate(e.target.value)
								}
								className="glass-input w-full max-w-max py-2 px-4 rounded-xl text-glacier-on-surface text-sm min-h-9.75"
							/>
						</div>
						<div className="clear-both w-full">
							<label className="text-xs font-semibold text-[#a0b4c4] mb-2 block">
								Nguồn thanh toán
							</label>
							{accounts.length === 0 ? (
								<div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2">
									<span className="text-yellow-400 text-sm">
										⚠
									</span>
									<p className="text-yellow-400 text-sm font-medium">
										Bạn chưa có nguồn thanh toán nào. Vui
										lòng thêm tài khoản trước.
									</p>
								</div>
							) : (
								<>
									<select
										value={paymentSourceId}
										onChange={(e) =>
											setPaymentSourceId(e.target.value)
										}
										className="select select-accent glass-input w-full py-2 px-4 rounded-xl text-glacier-on-surface text-sm">
										<option value="">
											- Chọn nguồn tiền -
										</option>
										{accounts.map((a) => (
											<option key={a.id} value={a.id}>
												{a.name} ({a.type})
											</option>
										))}
									</select>
									{!paymentSourceId && (
										<p className="text-yellow-400 text-xs mt-1.5">
											⚠ Vui lòng chọn nguồn tiền
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
																selected.debt ||
																	0,
															),
														)}
													</span>
												</div>
											) : null}
										</div>
									);
								})()}
						</div>
					</div>

					{/* Category */}
					<div className="mb-4">
						<div className="flex justify-between items-center mb-2">
							<p className="text-xs font-semibold text-[#a0b4c4]">
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
											? "border-[rgba(125,211,252,0.5)] bg-[rgba(125,211,252,0.1)] text-glacier-primary"
											: "border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.4)] text-glacier-on-surface"
									}`}>
									<Icon size={16} />
									<span className="text-[8px] font-bold uppercase tracking-wide">
										{label}
									</span>
								</button>
							))}
						</div>
					</div>

					{/* Note */}
					<div className="mb-4">
						<input
							type="text"
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder="Ghi chú (tuỳ chọn) — Dùng để làm gì?"
							className="glass-input w-full py-3 px-4 rounded-xl text-glacier-on-surface placeholder:text-glacier-on-surface text-sm"
							maxLength={200}
						/>
					</div>

					{error && (
						<p className="text-red-400 text-sm mb-4">{error}</p>
					)}

					{/* Swipe to Confirm */}
					<div className="relative w-full h-14 rounded-full bg-[rgba(125,211,252,0.1)] border border-[rgba(125,211,252,0.2)] overflow-hidden">
						<SwipeToConfirm
							onConfirm={handleConfirm}
							disabled={
								loading ||
								!amount ||
								!paymentSourceId ||
								accounts.length === 0
							}
              txType={txType}
						/>
					</div>
				</div>
			</div>
		</>
	);
}
