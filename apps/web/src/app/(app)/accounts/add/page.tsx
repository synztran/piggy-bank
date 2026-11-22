"use client";

import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { formatCurrency } from "@/lib/utils";
import {
	ArrowLeftRight,
	Banknote,
	CreditCard,
	Landmark,
	Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const accountTypes = [
	{ id: "Credit", label: "Thẻ tín dụng/Khoản nợ", icon: CreditCard },
	{ id: "Debit", label: "Thẻ ngân hàng", icon: CreditCard },
	{ id: "Cash", label: "Tiền mặt", icon: Banknote },
	{ id: "Transfer", label: "Nền tảng khác", icon: ArrowLeftRight },
];

export default function AddAccountPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [type, setType] = useState<"Debit" | "Credit" | "Cash" | "Transfer">(
		"Debit",
	);
	const [last4Digits, setLast4Digits] = useState("");
	const [debt, setDebt] = useState<string>("0");
	const [dueDay, setDueDay] = useState<string>("");
	const [balance, setBalance] = useState<string>("0");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// The optional section only renders when at least one optional field exists.
	const hasOptionalFields =
		(type !== "Credit" ? 1 : 0) + // balance
		(type === "Debit" || type === "Credit" ? 1 : 0) + // last 4 digits
		(type === "Credit" ? 1 : 0) > // due day
		0;

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			setError("Vui lòng nhập tên nguồn tiền");
			return;
		}

		const parsedDebt = Number(debt);
		if (
			type === "Credit" &&
			(debt.trim() === "" ||
				!Number.isFinite(parsedDebt) ||
				parsedDebt < 0)
		) {
			setError("Vui lòng nhập dư nợ hiện tại");
			return;
		}

		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/accounts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name,
					type,
					last4Digits: last4Digits || undefined,
					...(type === "Credit"
						? {
								debt: Number(debt) || 0,
								dueDay: dueDay
									? Number(dueDay)
									: undefined,
							}
						: { balance: Number(balance) || 0 }),
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				setError(data.error || "Lưu thất bại");
				return;
			}

			router.push("/accounts");
		} catch {
			setError("Lỗi kết nối. Vui lòng thử lại.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-glacier-bg max-w-full">
			<AppHeader showBack backHref="/accounts" />

			<main className="pt-20 pb-28 px-5 max-w-lg mx-auto">
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-glacier-on-surface">
						Thêm nguồn thanh toán
					</h1>
					<p className="text-glacier-on-surface-variant text-sm mt-1">
						Thêm tài khoản ngân hàng, thẻ tín dụng, tiền mặt hoặc
						chuyển khoản.
					</p>
				</div>

				{/* Preview Card */}
				<div className="glass-panel p-5 rounded-xl mb-6">
					<div className="flex items-start justify-between">
						<div className="w-12 h-12 rounded-xl bg-[rgba(125,211,252,0.1)] border border-[rgba(125,211,252,0.2)] flex items-center justify-center text-glacier-primary">
							{type === "Debit" && <Landmark size={22} />}
							{type === "Credit" && <CreditCard size={22} />}
							{type === "Cash" && <Banknote size={22} />}
							{type === "Transfer" && (
								<ArrowLeftRight size={22} />
							)}
						</div>
					</div>
					<div className="mt-4">
						<p className="text-[10px] text-glacier-on-surface-variant uppercase tracking-widest">
							Tên nguồn tiền
						</p>
						<p className="text-xl font-bold text-glacier-on-surface mt-1">
							{name || "Chưa đặt tên"}
						</p>
					</div>
				</div>

				<form onSubmit={handleSave} className="space-y-5">
					{/* Source Name */}
					<div className="space-y-2">
						<label className="block text-sm font-medium text-glacier-on-surface">
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
							className="glass-input w-full py-3.5 px-4 rounded-xl text-glacier-on-surface placeholder:text-[#4a6070]"
							maxLength={50}
						/>
					</div>

					{/* Account Type */}
					<div className="space-y-2">
						<label className="block text-sm font-medium text-glacier-on-surface">
							Loại tài khoản
						</label>
						<div className="grid grid-cols-2 gap-3">
							{accountTypes.map(({ id, label, icon: Icon }) => (
								<button
									key={id}
									type="button"
									onClick={() => setType(id as typeof type)}
									className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-all active:scale-95 ${
										type === id
											? "border-[rgba(125,211,252,0.5)] bg-[rgba(125,211,252,0.1)] text-glacier-primary"
											: "border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.4)] text-glacier-on-surface-variant hover:border-[rgba(125,211,252,0.25)]"
									}`}>
									<Icon size={24} />
									<span className="text-[10px] font-bold uppercase tracking-wide">
										{label}
									</span>
								</button>
							))}
						</div>
					</div>

					{/* Credit-card note — right below the account type */}
					{type === "Credit" && (
						<>
							<div className="rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.06)] px-4 py-3">
								<p className="text-xs text-glacier-on-surface-variant">
									Nợ được theo dõi riêng và không cộng vào
									tổng tiền chính.
								</p>
							</div>

							{/* Required for credit cards */}
							<div className="space-y-2 relative">
								<label className="block text-sm font-medium text-glacier-on-surface">
									Dư nợ hiện tại
								</label>
								<input
									type="number"
									value={debt}
									onChange={(e) => {
										setDebt(e.target.value);
										setError("");
									}}
									onWheel={(e) => e.currentTarget.blur()}
									placeholder="0"
									className="glass-input w-full py-3 px-4 rounded-xl text-glacier-on-surface placeholder:text-[#4a6070]"
									min="0"
									step="1000"
									required
								/>
								<small className="absolute -bottom-4 right-0 text-orange-400">
									{formatCurrency(Number(debt))}
								</small>
							</div>
						</>
					)}

					{/* Optional fields grouped at the bottom */}
					{hasOptionalFields && (
						<div className="flex items-center gap-3 pt-1">
							<span className="text-[10px] font-bold uppercase tracking-widest text-glacier-on-surface-variant">
								Thông tin tùy chọn
							</span>
							<span className="h-px flex-1 bg-[rgba(125,211,252,0.12)]" />
						</div>
					)}

					{/* Balance — non-credit sources only */}
					{type !== "Credit" && (
						<div className="space-y-2 relative">
							<label className="block text-sm font-medium text-glacier-on-surface">
								Số dư ban đầu{" "}
								<span className="text-glacier-on-surface-variant font-normal">
									(tùy chọn)
								</span>
							</label>
							<input
								type="number"
								value={balance}
								onChange={(e) => setBalance(e.target.value)}
								placeholder="0"
								className="glass-input w-full py-3 px-4 rounded-xl text-glacier-on-surface placeholder:text-[#4a6070]"
								min="0"
								step="1000"
							/>
							<small className="absolute -bottom-4 right-0 text-orange-400">
								{formatCurrency(Number(balance))}
							</small>
						</div>
					)}

					{/* Last 4 digits — card types only */}
					{(type === "Debit" || type === "Credit") && (
						<div className="space-y-2">
							<label className="block text-sm font-medium text-glacier-on-surface">
								4 số cuối{" "}
								<span className="text-glacier-on-surface-variant font-normal">
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
								className="glass-input w-full py-3 px-4 rounded-xl text-glacier-on-surface placeholder:text-[#4a6070]"
								maxLength={4}
							/>
						</div>
					)}

					{/* Credit-card due date — optional */}
					{type === "Credit" && (
						<div className="space-y-2">
							<label className="block text-sm font-medium text-glacier-on-surface">
								Ngày đến hạn hằng tháng{" "}
								<span className="text-glacier-on-surface-variant font-normal">
									(tùy chọn)
								</span>
							</label>
							<input
								type="number"
								value={dueDay}
								onChange={(e) => setDueDay(e.target.value)}
								onWheel={(e) => e.currentTarget.blur()}
								placeholder="vd. 15"
								className="glass-input w-full py-3 px-4 rounded-xl text-glacier-on-surface placeholder:text-[#4a6070]"
								min="1"
								max="31"
								step="1"
							/>
							<p className="text-xs text-glacier-on-surface-variant">
								Ngày trong tháng (1–31). Tháng thiếu ngày sẽ tự
								lấy ngày cuối tháng.
							</p>
						</div>
					)}

					{error && (
						<div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
							<p className="text-red-400 text-sm">{error}</p>
						</div>
					)}

					{/* Buttons */}
					<div className="flex gap-3 pt-2">
						<button
							type="submit"
							disabled={loading}
							className="flex-1 py-4 rounded-full bg-glacier-primary text-[#001f2e] font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#93d9fc] transition-colors active:scale-[0.98]">
							{loading ? (
								<span className="inline-block w-4 h-4 border-2 border-[#001f2e] border-t-transparent rounded-full animate-spin" />
							) : (
								<>
									<Save size={18} />
									Lưu lại
								</>
							)}
						</button>
						<button
							type="button"
							onClick={() => router.back()}
							className="flex-1 py-4 rounded-full glass-panel text-glacier-on-surface font-bold text-sm uppercase tracking-wider hover:bg-[rgba(125,211,252,0.1)] transition-colors active:scale-[0.98]">
							Huỷ
						</button>
					</div>
				</form>
			</main>

			<BottomNav />
		</div>
	);
}
