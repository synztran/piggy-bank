"use client";

import { gooeyToast } from "goey-toast";
import {
	ArrowRight,
	Car,
	Delete,
	FileQuestion,
	ShoppingBag,
	Utensils,
	X,
	Zap,
} from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Account = {
	id: string;
	name: string;
	type: string;
	debt?: number;
	balance?: number;
};

interface QuickPaymentModalProps {
	isOpen: boolean;
	accounts: Account[];
	onClose: () => void;
	onSuccess: () => void;
}

function PaymentSourceSelect({
	accounts,
	value,
	onChange,
	label,
}: {
	accounts: Account[];
	value: string;
	onChange: (id: string) => void;
	label?: string;
}) {
	const selected = accounts.find((a) => a.id === value);

	if (accounts.length === 0) {
		return (
			<div>
				{label && (
					<div className="text-[10px] font-semibold text-glacier-on-surface-variant mb-2 block">
						{label}
					</div>
				)}
				<div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2">
					<span className="text-yellow-400 text-sm">⚠</span>
					<p className="text-yellow-400 text-xs font-medium">
						Chưa có nguồn tiền. Vui lòng thêm mới tài khoản.
					</p>
				</div>
			</div>
		);
	}

	return (
		<>
      <div className="flex items-end justify-between mb-0.5">
        <span className="text-[10px] text-glacier-on-surface-variant">
          {label}
        </span>
        {selected?.type === "Credit" && (
          <div className="space-x-1 max-h-max text-[10px]">
            <span className="">Dư nợ:</span>
            <span className="font-semibold text-red-400">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0,
              }).format(Number(selected.debt || 0))}
            </span>
          </div>
        )}
        {!value && (
          <span className="text-yellow-400 text-[10px]">
            ⚠ Chưa có nguồn tiền
          </span>
        )}
      </div>
			<div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="select select-accent glass-input w-full py-2 px-4 rounded-xl text-glacier-on-surface text-sm">
          <option value="">- Chọn nguồn tiền -</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.type})
            </option>
          ))}
        </select>
			</div>
		</>
	);
}

function DatePicker({
	value,
	onChange,
	label,
}: {
	value: string;
	onChange: (date: string) => void;
	label?: string;
}) {
	return (
		<>
      <div className="flex items-end justify-between mb-0.5">
        {label && (
          <label className="text-[10px] text-glacier-on-surface-variant">
            {label}
          </label>
        )}
      </div>
			<input
				type="date"
				value={value}
				max={new Date().toISOString().slice(0, 10)}
				onChange={(e) => onChange(e.target.value)}
				className="glass-input w-full max-w-max py-2 px-4 rounded-xl text-glacier-on-surface text-sm min-h-9.75"
			/>
		</>
	);
}

type TxType = "expense" | "income";

function TxTypeToggle({
	txType,
	onChange,
}: {
	txType: TxType;
	onChange: (type: TxType) => void;
}) {
	return (
		<div className="relative flex items-center justify-center gap-0 rounded-full bg-[rgba(125,211,252,0.08)] p-1 max-w-max mx-auto">
			<motion.div
				className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full ${txType === "expense" ? "bg-red-500/15 border border-red-400/40" : "bg-emerald-500/15 border border-emerald-400/40"}`}
				animate={{ x: txType === "expense" ? 0 : "100%" }}
				transition={{ type: "spring", stiffness: 350, damping: 30 }}
				style={{ left: "4px" }}
			/>
			<button
				onClick={() => onChange("expense")}
				className={`relative z-10 flex-1 py-1 px-4 text-sm font-semibold transition-colors rounded-full max-w-max tracking-widest ${
					txType === "expense"
						? "text-red-400"
						: "text-glacier-on-surface-variant"
				}`}>
				Chi
			</button>
			<button
				onClick={() => onChange("income")}
				className={`relative z-10 flex-1 py-1 px-4 text-sm font-semibold transition-colors rounded-full max-w-max tracking-widest ${
					txType === "income"
						? "text-emerald-400"
						: "text-glacier-on-surface-variant"
				}`}>
				Thu
			</button>
		</div>
	);
}

function SwipeToConfirm({
	onConfirm,
	disabled,
	txType,
	loading,
}: {
	onConfirm: () => void;
	disabled: boolean;
	txType: TxType;
	loading?: boolean;
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
		if (disabled || loading) return;
		const current = x.get();
		if (current >= maxDrag * threshold) {
			onConfirm();
		}
		x.set(0);
	};

	if (loading) {
		return (
			<div ref={containerRef} className="absolute inset-0 flex items-center justify-center">
				<div className="absolute inset-0 rounded-full bg-glacier-primary/20" />
				<div className="relative z-10 flex items-center gap-2">
					<svg className="animate-spin h-5 w-5 text-glacier-primary" viewBox="0 0 24 24" fill="none">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
					</svg>
					<span className="text-sm font-bold text-glacier-primary">Đang xử lý...</span>
				</div>
			</div>
		);
	}

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
				Vuốt để xác nhận →
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

function AmountDisplay({ amount, txType }: { amount: number; txType: TxType }) {
	return (
		<div className="relative flex items-center justify-center min-h-12 my-6">
			<span className={`text-5xl font-extrabold ${txType === "expense" ? "text-red-400" : "text-emerald-400"}`}>
				{new Intl.NumberFormat("vi-VN", {
					style: "currency",
					currency: "VND",
					maximumFractionDigits: 0,
				}).format(amount)}
			</span>
		</div>
	);
}

const categories = [
	{ id: "utilities", label: "Tiện ích", icon: Zap },
	{ id: "retail", label: "Mua sắm", icon: ShoppingBag },
	{ id: "dining", label: "Ăn uống", icon: Utensils },
	{ id: "travel", label: "Du lịch", icon: Car },
	{ id: "other", label: "Khác", icon: FileQuestion },
];

function CategorySelect({
	value,
	onChange,
}: {
	value: string;
	onChange: (id: string) => void;
}) {
	const selected = categories.find((c) => c.id === value);
	return (
		<div className="relative flex items-center justify-center gap-4 mt-4">
      <span className="text-xs">Danh mục</span>
      <div className="flex items-center gap-1">
        <span className="text-xs text-glacier-on-surface-variant lowercase">{selected?.label ?? "Danh mục"}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-glacier-on-surface-variant"><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer">
          {categories.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
		</div>
	);
}

function Numpad({
	onInput,
	onDelete,
	digitCount,
	maxDigits = 9,
}: {
	onInput: (value: string) => void;
	onDelete: () => void;
	digitCount: number;
	maxDigits?: number;
}) {
	const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
	const btnClass =
		"h-12 rounded-2xl bg-[rgba(125,211,252,0.06)] border border-[rgba(125,211,252,0.1)] flex items-center justify-center active:scale-95 active:bg-[rgba(125,211,252,0.15)] transition-all";
	const disabledClass = "opacity-30 pointer-events-none";

	const atLimit = digitCount >= maxDigits;

	return (
		<div className="grid grid-cols-3 gap-2">
			{keys.map((num) => (
				<button
					key={num}
					type="button"
					onClick={() => onInput(String(num))}
					disabled={atLimit}
					className={`${btnClass} text-3xl font-medium text-glacier-on-surface ${atLimit ? disabledClass : ""}`}>
					{num}
				</button>
			))}
			<button
				type="button"
				onClick={() => onInput("000")}
				disabled={digitCount + 3 > maxDigits}
				className={`${btnClass} text-3xl font-bold text-glacier-on-surface-variant ${digitCount + 3 > maxDigits ? disabledClass : ""}`}>
				000
			</button>
			<button
				type="button"
				onClick={() => onInput("0")}
				disabled={atLimit}
				className={`${btnClass} text-3xl font-medium text-glacier-on-surface ${atLimit ? disabledClass : ""}`}>
				0
			</button>
			<button
				type="button"
				onClick={onDelete}
				className={`${btnClass} text-glacier-on-surface-variant`}>
				<Delete size={32} />
			</button>
		</div>
	);
}

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
	const [txType, setTxType] = useState<TxType>("expense");
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

	const drawerRef = useRef<HTMLDivElement>(null);

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
				ref={drawerRef}
				className={`fixed mb-0 left-0 right-0 z-60 glass-panel-elevated rounded-t-3xl px-4 pt-2 pb-10 animate-in slide-in-from-bottom duration-300 transition-[bottom] ease-in-out max-h-[80vh] ${isOpen ? "bottom-0" : "bottom-[-100vh]"}`}>
				{/* Handle */}
				<div className="w-10 h-1 bg-[rgba(125,211,252,0.2)] rounded-full mx-auto mb-2" />
				<div className="overflow-y-auto space-y-2">
					{/* Amount Display */}
					<div className="text-center">
						<TxTypeToggle txType={txType} onChange={setTxType} />
            <CategorySelect value={category} onChange={setCategory} />
						<AmountDisplay amount={displayAmount} txType={txType} />
						{/* Hidden input for form compatibility */}
						<input
							ref={inputRef}
							type="hidden"
							value={amount}
						/>
					</div>

					{/* Account Selector */}
					<div className="flex items-center gap-2 relative">
						{/* Date */}
						<div className="clear-both w-full">
							<DatePicker
								value={transactionDate}
								onChange={setTransactionDate}
								label="Ngày giao dịch"
							/>
						</div>
						<div className="clear-both w-full">
							<PaymentSourceSelect
								accounts={accounts}
								value={paymentSourceId}
								onChange={setPaymentSourceId}
								label="Nguồn tiền"
							/>
						</div>
					</div>



					{/* Note */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú (tuỳ chọn)"
            className="glass-input w-full py-2 px-4 rounded-xl text-glacier-on-surface placeholder:text-glacier-on-surface text-sm resize-none placeholder:opacity-80"
            maxLength={200}
            rows={1}
          />

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
							loading={loading}
						/>
					</div>

					{/* Numpad */}
					<div className="w-full">
						<Numpad
							digitCount={amount.length}
							onInput={(val) => { setAmount((prev) => prev + val); setError(""); }}
							onDelete={() => { setAmount((prev) => prev.slice(0, -1)); setError(""); }}
						/>
					</div>
				</div>
			</div>
		</>
	);
}
