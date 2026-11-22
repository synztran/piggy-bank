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
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  balance: number;
}

const PaymentSourceSelect = memo(function PaymentSourceSelect({
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
					<div className="text-[10px] font-semibold text-slate-400 mb-2 block">
						{label}
					</div>
				)}
				<div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2">
					<span className="text-yellow-400 text-sm">⚠</span>
					<p className="text-yellow-600 text-xs font-medium">
						Chưa có nguồn tiền. Vui lòng thêm mới tài khoản.
					</p>
				</div>
			</div>
		);
	}

	return (
		<>
      <div className="flex items-end justify-between mb-0.5">
        <span className="text-[10px] text-slate-500">
          {label}
        </span>
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
          className="select select-accent w-full py-2 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-sm">
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
});

const DatePicker = memo(function DatePicker({
	value,
	onChange,
	label,
}: {
	value: string;
	onChange: (date: string) => void;
	label?: string;
}) {
	return (
		<div className="w-full clear">
      <div className="flex items-end justify-between mb-0.5">
        {label && (
          <label className="text-[10px] text-slate-500">
            {label}
          </label>
        )}
      </div>
			<input
				type="date"
				value={value}
				max={new Date().toISOString().slice(0, 10)}
				onChange={(e) => onChange(e.target.value)}
				className="w-full h-10 py-2 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-sm appearance-none [&::-webkit-calendar-picker-indicator]:invert-[0.4] [&::-webkit-date-and-time-value]:text-left"
			/>
		</div>
	);
});

type TxType = "expense" | "income";

const TxTypeToggle = memo(function TxTypeToggle({
	txType,
	onChange,
}: {
	txType: TxType;
	onChange: (type: TxType) => void;
}) {
	return (
		<div className="relative flex items-center justify-center gap-0 rounded-full bg-slate-100 p-1 max-w-max mx-auto">
			<motion.div
				className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full ${txType === "expense" ? "bg-red-500/15 border border-red-400/40" : "bg-emerald-500/15 border border-emerald-400/40"}`}
				animate={{ x: txType === "expense" ? 0 : "100%" }}
				transition={{ type: "spring", stiffness: 350, damping: 30 }}
				style={{ left: "4px" }}
			/>
			<button
				onClick={() => onChange("expense")}
				className={`relative z-10 flex-1 py-1 px-4 text-sm font-extrabold transition-colors rounded-full max-w-max tracking-widest ${
					txType === "expense"
						? "text-red-400"
						: "text-slate-400"
				}`}>
				Chi
			</button>
			<button
				onClick={() => onChange("income")}
				className={`relative z-10 flex-1 py-1 px-4 text-sm font-extrabold transition-colors rounded-full max-w-max tracking-widest ${
					txType === "income"
						? "text-emerald-400"
						: "text-slate-400"
				}`}>
				Thu
			</button>
		</div>
	);
});

const SwipeToConfirm = memo(function SwipeToConfirm({
	onConfirm,
	disabled,
	loading,
}: {
	onConfirm: () => void;
	disabled: boolean;
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
				<div className="absolute inset-0 rounded-full bg-slate-100" />
				<div className="relative z-10 flex items-center gap-2">
					<svg className="animate-spin h-5 w-5 text-slate-800" viewBox="0 0 24 24" fill="none">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
					</svg>
					<span className="text-sm font-bold text-slate-800">Đang xử lý...</span>
				</div>
			</div>
		);
	}

	return (
		<div ref={containerRef} className="absolute inset-0 flex items-center">
			{/* Background fill */}
			<motion.div
				className="absolute inset-0 rounded-full bg-slate-300"
				style={{ opacity: bgOpacity }}
			/>
			{/* Label */}
			<motion.span
				className="absolute inset-0 flex items-center justify-center font-bold text-slate-400 pointer-events-none"
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
				className={`relative z-10 ml-1 w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
				<ArrowRight size={22} className="text-white" />
			</motion.div>
		</div>
	);
});

const AmountDisplay = memo(function AmountDisplay({ amount, txType }: { amount: number; txType: TxType }) {
	return (
		<div className="relative flex items-center justify-center my-4">
			<span className={`text-[41px] font-extrabold tracking-tighter leading-none ${txType === "expense" ? "text-red-400" : "text-emerald-500"}`}>
				{new Intl.NumberFormat("vi-VN", {
					style: "currency",
					currency: "VND",
					maximumFractionDigits: 0,
				}).format(amount)}
			</span>
		</div>
	);
});

const categories = [
	{ id: "utilities", label: "Tiện ích", icon: Zap },
	{ id: "retail", label: "Mua sắm", icon: ShoppingBag },
	{ id: "dining", label: "Ăn uống", icon: Utensils },
	{ id: "travel", label: "Du lịch", icon: Car },
	{ id: "other", label: "Khác", icon: FileQuestion },
];

const CategorySelect = memo(function CategorySelect({
	value,
	onChange,
}: {
	value: string;
	onChange: (id: string) => void;
}) {
	const selected = categories.find((c) => c.id === value);
	return (
		<div className="relative flex items-center justify-center gap-2 mt-2">
      <span className="text-xs text-slate-600">Danh mục</span>•
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400 lowercase">{selected?.label ?? "Danh mục"}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-slate-400"><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
});

const AccountDebtInfo = memo(function AccountDebtInfo({ account, balance }: { account: Account | undefined; balance: number }) {
	if (!account) return <div className="min-h-4" />;

	if (account.type === "Credit") {
		return (
			<div className="min-h-4">
				<div className="space-x-1 max-h-max text-sm">
					<span className="text-slate-500">Dư nợ:</span>
					<span className={`font-semibold ${account.debt && Number(account.debt) > 0 ? "text-red-500" : "text-green-500"}`}>
						{new Intl.NumberFormat("vi-VN", {
							style: "currency",
							currency: "VND",
							maximumFractionDigits: 0,
						}).format(Number(account.debt || 0))}
					</span>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-4">
			<div className="space-x-1 max-h-max text-sm">
				<span className="text-slate-500">Khả dụng</span>
				<span className="font-bold text-slate-500">
					{new Intl.NumberFormat("vi-VN", {
						style: "currency",
						currency: "VND",
						maximumFractionDigits: 0,
					}).format(Number(account.type === "Debit" ? account.balance || 0 : balance))}
				</span>
			</div>
		</div>
	);
});

const Numpad = memo(function Numpad({
	onInput,
	onDelete,
	digitCount,
	maxDigits = 10,
}: {
	onInput: (value: string) => void;
	onDelete: () => void;
	digitCount: number;
	maxDigits?: number;
}) {
	const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
	const btnClass =
		"h-12 rounded-2xl glass-key flex items-center justify-center active:scale-95 transition-all";
	const disabledClass = "opacity-30 pointer-events-none";

	const deleteInterval = useRef<ReturnType<typeof setInterval> | null>(null);
	const deleteTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	const startDelete = useCallback(() => {
		onDelete();
		deleteTimeout.current = setTimeout(() => {
			deleteInterval.current = setInterval(onDelete, 80);
		}, 400);
	}, [onDelete]);

	const stopDelete = useCallback(() => {
		if (deleteTimeout.current) { clearTimeout(deleteTimeout.current); deleteTimeout.current = null; }
		if (deleteInterval.current) { clearInterval(deleteInterval.current); deleteInterval.current = null; }
	}, []);

	useEffect(() => () => stopDelete(), [stopDelete]);

	const atLimit = digitCount >= maxDigits;
	const isLeadingZero = digitCount === 0;
	const zeroDisabled = isLeadingZero || atLimit;
	const tripleZeroDisabled = isLeadingZero || digitCount + 3 > maxDigits;

	return (
		<div className="grid grid-cols-3 gap-y-2 gap-x-2 p-2 rounded-xl bg-[#f1f5f9]">
			{keys.map((num) => (
				<button
					key={num}
					type="button"
					onClick={() => onInput(String(num))}
					disabled={atLimit}
					className={`${btnClass} text-[28px] font-medium text-slate-800 ${atLimit ? disabledClass : ""}`}>
					{num}
				</button>
			))}
			<button
				type="button"
				onClick={() => onInput("000")}
				disabled={tripleZeroDisabled}
				className={`${btnClass} text-[28px] font-bold text-slate-800 ${tripleZeroDisabled ? disabledClass : ""}`}>
				000
			</button>
			<button
				type="button"
				onClick={() => onInput("0")}
				disabled={zeroDisabled}
				className={`${btnClass} text-[28px] font-bold text-slate-800 ${zeroDisabled ? disabledClass : ""}`}>
				0
			</button>
			<button
				type="button"
				onPointerDown={startDelete}
				onPointerUp={stopDelete}
				onPointerLeave={stopDelete}
				onContextMenu={(e) => e.preventDefault()}
				className={`${btnClass} text-slate-800`}>
				<Delete size={28} />
			</button>
		</div>
	);
});

export default function QuickPaymentModal({
	isOpen,
	accounts,
	onClose,
	onSuccess,
  balance,
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
		const prevent = (e: TouchEvent | WheelEvent) => {
			const target = e.target as HTMLElement;
			if (target.closest('input[type="date"]') || target.closest("select") || target.closest("textarea")) return;
			e.preventDefault();
		};
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

  const selected = useMemo(() => accounts.find((a) => a.id === paymentSourceId), [accounts, paymentSourceId]);

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
				className={`fixed mb-0 left-0 right-0 z-60 glass-panel-light rounded-t-[2.5rem] px-6 pt-4 pb-8 animate-in slide-in-from-bottom duration-300 transition-[bottom] ease-in-out max-h-[85vh] ${isOpen ? "bottom-0" : "bottom-[-100vh]"}`}>
				{/* Handle */}
				<div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-2" />
				<div className="overflow-y-auto space-y-2">
					{/* Amount Display */}
					<div className="text-center mb-2">
						<TxTypeToggle txType={txType} onChange={setTxType} />
            <CategorySelect value={category} onChange={setCategory} />
						<AmountDisplay amount={displayAmount} txType={txType} />
            <AccountDebtInfo account={selected} balance={balance} />
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
            <DatePicker
              value={transactionDate}
              onChange={setTransactionDate}
              label="Ngày giao dịch"
            />
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
            className="block w-full px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm resize-none focus:border-black focus:outline-none"
            maxLength={200}
          />

					{/* {error && (
						<p className="text-red-500 text-sm mb-4">{error}</p>
					)} */}

					{/* Swipe to Confirm */}
					<div className="relative w-full h-14 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
						<SwipeToConfirm
							onConfirm={handleConfirm}
							disabled={
								loading ||
								!amount ||
								!paymentSourceId ||
								accounts.length === 0
							}
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
