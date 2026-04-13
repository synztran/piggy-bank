"use client";

import {
	ArrowLeftRight,
	Banknote,
	CreditCard,
	Landmark,
	Save,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface PaymentSource {
	id: string;
	name: string;
	type: "Debit" | "Credit" | "Cash" | "Transfer";
	last4Digits?: string;
	debt?: number;
	balance?: number;
}

interface EditAccountDrawerProps {
	isOpen: boolean;
	account: PaymentSource | null;
	onClose: () => void;
	onSaved: (updated: PaymentSource) => void;
}

const accountTypes = [
	{ id: "Debit", label: "Thẻ ghi nợ", icon: Landmark },
	{ id: "Credit", label: "Thẻ tín dụng", icon: CreditCard },
	{ id: "Cash", label: "Tiền mặt", icon: Banknote },
	{ id: "Transfer", label: "Nền tảng khác", icon: ArrowLeftRight },
];

export default function EditAccountDrawer({
	isOpen,
	account,
	onClose,
	onSaved,
}: EditAccountDrawerProps) {
	console.log(account);
	const [name, setName] = useState(account?.name || "");
	const [type, setType] = useState<"Debit" | "Credit" | "Cash" | "Transfer">(
		account?.type || "Cash",
	);
	const [last4Digits, setLast4Digits] = useState(account?.last4Digits || "");
	const [debt, setDebt] = useState<string>(String(account?.debt ?? 0));
	const [balance, setBalance] = useState<string>(
		String(account?.balance ?? 0),
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// reset state when account changes
	useEffect(() => {
		setName(account?.name || "");
		setType(account?.type || ("Cash" as typeof type));
		setLast4Digits(account?.last4Digits || "");
		setDebt(String(account?.debt ?? 0));
		setBalance(String(account?.balance ?? 0));
		setError("");
	}, [account]);

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			setError("Vui lòng nhập tên nguồn tiền");
			return;
		}
		setLoading(true);
		setError("");
		try {
			const res = await fetch(`/api/accounts/${account?.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					type,
					last4Digits: last4Digits || undefined,
					debt: Number(debt) || 0,
					balance: Number(balance) || 0,
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				setError(data.error || "Lưu thất bại");
				return;
			}

			const data = await res.json();
			onSaved(data.account);
			onClose();
		} catch {
			setError("Lỗi kết nối. Vui lòng thử lại.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			{/* Backdrop */}
			{isOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
					onClick={onClose}
				/>
			)}

			{/* Drawer */}
			<div
				className={`fixed bottom-0 left-0 right-0 z-50 glass-panel-elevated rounded-t-3xl animate-in slide-in-from-bottom duration-300 max-h-[92dvh] flex flex-col ${isOpen ? "top-[10vh]" : "top-[100vh]"}`}>
				{/* Handle */}
				<div className="flex justify-center pt-3 pb-1">
					<div className="w-10 h-1 rounded-full bg-[rgba(125,211,252,0.2)]" />
				</div>

				{/* Scrollable content */}
				<div className="overflow-y-auto flex-1 px-6 pb-8 pt-2">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-xl font-bold text-[#e0e8f0]">
							Chỉnh sửa nguồn tiền
						</h2>
						<button
							onClick={onClose}
							className="w-9 h-9 rounded-full bg-[rgba(125,211,252,0.1)] flex items-center justify-center text-[#a0b4c4] hover:text-[#e0e8f0] transition-colors">
							<X size={16} />
						</button>
					</div>

					<form onSubmit={handleSave} className="space-y-5">
						{/* Name */}
						<div className="space-y-2">
							<label className="block text-sm font-medium text-[#e0e8f0]">
								Tên nguồn tiền
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									setError("");
								}}
								placeholder="vd. Tài khoản cá nhân"
								className="glass-input w-full py-3 px-4 rounded-xl text-[#e0e8f0] placeholder:text-[#4a6070]"
								maxLength={50}
							/>
						</div>

						{/* Type */}
						<div className="space-y-2">
							<label className="block text-sm font-medium text-[#e0e8f0]">
								Loại tài khoản
							</label>
							<div className="grid grid-cols-2 gap-3">
								{accountTypes.map(
									({ id, label, icon: Icon }) => (
										<button
											key={id}
											type="button"
											onClick={() =>
												setType(id as typeof type)
											}
											className={`flex flex-col items-center gap-2 py-3 rounded-xl border transition-all active:scale-95 ${
												type === id
													? "border-[rgba(125,211,252,0.5)] bg-[rgba(125,211,252,0.1)] text-[#7dd3fc]"
													: "border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.4)] text-[#a0b4c4]"
											}`}>
											<Icon size={20} />
											<span className="text-[10px] font-bold uppercase tracking-wide">
												{label}
											</span>
										</button>
									),
								)}
							</div>
						</div>

						{/* Balance — all types */}
						<div className="space-y-2">
							<label className="block text-sm font-medium text-[#e0e8f0]">
								Số dư hiện tại
							</label>
							<input
								type="number"
								value={balance}
								onChange={(e) => setBalance(e.target.value)}
								placeholder="0"
								className="glass-input w-full py-3 px-4 rounded-xl text-[#e0e8f0] placeholder:text-[#4a6070]"
								min="0"
								step="1000"
							/>
						</div>

						{/* Card-only fields */}
						{(type === "Debit" || type === "Credit") && (
							<>
								<div className="space-y-2">
									<label className="block text-sm font-medium text-[#e0e8f0]">
										4 số cuối{" "}
										<span className="text-[#a0b4c4] font-normal">
											(không bắt buộc)
										</span>
									</label>
									<input
										type="text"
										value={last4Digits}
										onChange={(e) =>
											setLast4Digits(
												e.target.value
													.replace(/\D/g, "")
													.slice(0, 4),
											)
										}
										placeholder="vd. 8821"
										className="glass-input w-full py-3 px-4 rounded-xl text-[#e0e8f0] placeholder:text-[#4a6070]"
										maxLength={4}
									/>
								</div>

								<div className="space-y-2">
									<label className="block text-sm font-medium text-[#e0e8f0]">
										Nợ hiện tại{" "}
										<span className="text-[#a0b4c4] font-normal">
											(tùy chọn)
										</span>
									</label>
									<input
										type="number"
										value={debt}
										onChange={(e) =>
											setDebt(e.target.value)
										}
										placeholder="0"
										className="glass-input w-full py-3 px-4 rounded-xl text-[#e0e8f0] placeholder:text-[#4a6070]"
										min="0"
										step="1000"
									/>
								</div>
							</>
						)}

						{error && (
							<div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
								<p className="text-red-400 text-sm">{error}</p>
							</div>
						)}

						<div className="flex gap-3 pt-1">
							<button
								type="submit"
								disabled={loading}
								className="flex-1 py-3.5 rounded-full bg-[#7dd3fc] text-[#001f2e] font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#93d9fc] transition-colors active:scale-[0.98]">
								{loading ? (
									<span className="inline-block w-4 h-4 border-2 border-[#001f2e] border-t-transparent rounded-full animate-spin" />
								) : (
									<>
										<Save size={16} />
										Lưu lại
									</>
								)}
							</button>
							<button
								type="button"
								onClick={onClose}
								className="flex-1 py-3.5 rounded-full glass-panel text-[#e0e8f0] font-bold text-sm uppercase tracking-wider hover:bg-[rgba(125,211,252,0.1)] transition-colors active:scale-[0.98]">
								Huỷ
							</button>
						</div>
					</form>
				</div>
			</div>
		</>
	);
}
