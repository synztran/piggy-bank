"use client";

import { useAuth } from "@/lib/auth-context";
import { gooeyToast } from "goey-toast";
import { CheckCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface UpdateBalanceDrawerProps {
	currentBalance: number;
	onClose: () => void;
	onUpdated: () => void;
	isOpen: boolean;
}

export default function UpdateBalanceDrawer({
	currentBalance,
	onClose,
	onUpdated,
	isOpen,
}: UpdateBalanceDrawerProps) {
	const [amount, setAmount] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();
	const { updateBalance } = useAuth();

	const resetForm = useCallback(() => {
		setAmount("");
		setError("");
	}, []);

	const handleClose = useCallback(() => {
		resetForm();
		onClose();
	}, [onClose, resetForm]);

	const presets = [100000, 500000, 1000000];

	const handlePreset = (val: number) => {
		setAmount((prev) => {
			const current = parseFloat(prev) || 0;
			return String(current + val);
		});
	};

	const formatPreset = (val: number) =>
		new Intl.NumberFormat("vi-VN", {
			notation: "compact",
			maximumFractionDigits: 1,
		}).format(val);

	const delta = parseFloat(amount) || 0;
	const resultBalance = currentBalance + delta;

	const handleUpdate = async () => {
		if (isNaN(delta) || amount.trim() === "") {
			setError("Vui lòng nhập số tiền hợp lệ");
			return;
		}

		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/user/balance", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ balance: resultBalance }),
			});

			if (!res.ok) {
				const data = await res.json();
				const msg = data.error || "Cập nhật thất bại";
				setError(msg);
				gooeyToast.error("Cập nhật thất bại", { description: msg });
				return;
			}

			gooeyToast.success("Số dư đã cập nhật", {
				description: new Intl.NumberFormat("vi-VN", {
					style: "currency",
					currency: "VND",
					maximumFractionDigits: 0,
				}).format(resultBalance),
			});
			updateBalance(resultBalance);
			resetForm();
			onUpdated();
			router.refresh();
			handleClose();
		} catch {
			gooeyToast.error("Lỗi kết nối", {
				description: "Vui lòng thử lại.",
			});
			setError("Lỗi kết nối. Vui lòng thử lại.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!isOpen) {
			resetForm();
			return;
		}
		const prevent = (e: TouchEvent | WheelEvent) => e.preventDefault();
		document.addEventListener("touchmove", prevent, { passive: false });
		document.addEventListener("wheel", prevent, { passive: false });
		return () => {
			document.removeEventListener("touchmove", prevent);
			document.removeEventListener("wheel", prevent);
		};
	}, [isOpen, resetForm]);

	return (
		<>
			{/* Backdrop */}
			<div
				className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
				onClick={handleClose}
			/>

			{/* Drawer */}
			<div
				className={`fixed mb-0 left-0 right-0 z-60 glass-panel-elevated rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300 transition-[bottom] ease-in-out max-h-[80vh] ${isOpen ? "bottom-0" : "bottom-[-100vh]"}`}>
				{/* Handle */}
				<div className="w-10 h-1 bg-[rgba(125,211,252,0.2)] rounded-full mx-auto mb-6" />

				<div className="flex justify-between items-start mb-6">
					<div>
						<h2 className="text-2xl font-bold text-[#e0e8f0]">
							Điều chỉnh số dư
						</h2>
						<p className="text-sm text-[#a0b4c4] mt-1">
							Nhập số dương để cộng, số âm để trừ
						</p>
					</div>
				</div>

				{/* Input */}
				{/* Result preview */}
				<div className="mb-4 text-center">
					<p className="text-[10px] font-bold uppercase tracking-widest text-[#a0b4c4] mb-1">
						Số dư sau điều chỉnh
					</p>
					<span
						className={`text-3xl font-extrabold ${resultBalance < 0 ? "text-red-400" : "text-[#7dd3fc]"}`}>
						{new Intl.NumberFormat("vi-VN", {
							style: "currency",
							currency: "VND",
							maximumFractionDigits: 0,
						}).format(resultBalance)}
					</span>
				</div>

				<div className="relative mb-4">
					<input
						type="number"
						value={amount}
						onChange={(e) => {
							setAmount(e.target.value);
							setError("");
						}}
						placeholder="0"
						className="glass-input w-full pl-4 pr-12 py-4 rounded-xl text-[#e0e8f0] text-2xl font-bold placeholder:text-[#4a6070]"
						step="1000"
						inputMode="numeric"
						autoFocus
					/>
					<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a0b4c4] font-bold text-base">
						₫
					</span>
				</div>

				{error && <p className="text-red-400 text-sm mb-4">{error}</p>}

				{/* Presets */}
				<div className="flex gap-3 mb-6">
					{presets.map((p) => (
						<button
							key={p}
							onClick={() => handlePreset(p)}
							className="flex-1 py-2.5 rounded-full border border-[rgba(125,211,252,0.2)] text-[#e0e8f0] text-sm font-medium hover:bg-[rgba(125,211,252,0.1)] transition-colors active:scale-95">
							+{formatPreset(p)}
						</button>
					))}
				</div>

				{/* Update Button */}
				<button
					onClick={handleUpdate}
					disabled={loading || !amount}
					className="w-full py-4 rounded-full bg-[#7dd3fc] text-[#001f2e] font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#93d9fc] transition-colors active:scale-[0.98]">
					{loading ? (
						<RefreshCw size={20} className="animate-spin" />
					) : (
						<>
							<CheckCircle size={22} />
							Cập nhật
						</>
					)}
				</button>
			</div>
		</>
	);
}
