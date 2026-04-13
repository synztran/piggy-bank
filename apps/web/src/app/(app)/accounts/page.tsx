"use client";

import EditAccountDrawer from "@/components/EditAccountDrawer";
import PullToRefresh from "@/components/PullToRefresh";
import {
	ArrowLeftRight,
	Banknote,
	CreditCard,
	MoreVertical,
	Plus,
	PlusCircle,
	Settings,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface PaymentSource {
	id: string;
	name: string;
	type: "Debit" | "Credit" | "Cash" | "Transfer";
	last4Digits?: string;
	debt?: number;
	balance?: number;
}

const accountIcon = {
	Cash: Banknote,
	Debit: CreditCard,
	Credit: CreditCard,
	Transfer: ArrowLeftRight,
};

const accountIconColor = {
	Cash: "text-[#7dd3fc] bg-[rgba(125,211,252,0.1)] border-[rgba(125,211,252,0.2)]",
	Debit: "text-[#c8a0f0] bg-[rgba(200,160,240,0.1)] border-[rgba(200,160,240,0.2)]",
	Credit: "text-[#7dd3fc] bg-[rgba(125,211,252,0.08)] border-[rgba(125,211,252,0.3)]",
	Transfer: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const accountTypeLabel = {
	Cash: "Tiền mặt",
	Debit: "Thẻ ngân hàng",
	Credit: "Thẻ tín dụng",
	Transfer: "Nền tảng khác",
};

export default function AccountsPage() {
	const [accounts, setAccounts] = useState<PaymentSource[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeMenu, setActiveMenu] = useState<string | null>(null);
	const [deleting, setDeleting] = useState<string | null>(null);
	const [editingAccount, setEditingAccount] = useState<PaymentSource | null>(
		null,
	);

	const fetchAccounts = useCallback(async () => {
		try {
			const res = await fetch("/api/accounts");
			if (res.ok) {
				const data = await res.json();
				setAccounts(data.accounts || []);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAccounts();
	}, [fetchAccounts]);

	const handleDelete = async (id: string) => {
		if (!confirm("Xoá nguồn thanh toán này?")) return;
		setDeleting(id);
		try {
			await fetch(`/api/accounts/${id}`, { method: "DELETE" });
			setAccounts((prev) => prev.filter((a) => a.id !== id));
		} finally {
			setDeleting(null);
			setActiveMenu(null);
		}
	};

	return (
		<PullToRefresh onRefresh={fetchAccounts}>
			<div className="space-y-6 pt-4">
				{/* Header */}
				<div className="flex justify-between items-end">
					<div>
						<h2 className="text-2xl font-bold text-[#e0e8f0] tracking-tight">
							Tài khoản
						</h2>
						<p className="text-[#a0b4c4] text-sm mt-1">
							Quản lý nguồn tiền của bạn
						</p>
					</div>
					<Link
						href="/accounts/add"
						className="bg-[rgba(125,211,252,0.1)] border border-[rgba(125,211,252,0.2)] text-[#7dd3fc] px-4 py-2 rounded-xl flex items-center gap-2 font-medium active:scale-95 transition-all hover:bg-[rgba(125,211,252,0.2)] text-sm">
						<Plus size={18} />
						Thêm mới
					</Link>
				</div>
				{/* Account Cards */}
				<div className="space-y-4">
					{loading &&
						Array.from({ length: 2 }).map((_, i) => (
							<div
								key={i}
								className="glass-panel p-6 rounded-xl h-32 animate-pulse"
							/>
						))}

					{!loading && accounts.length === 0 && (
						<div className="glass-panel p-8 rounded-xl text-center space-y-3">
							<p className="text-[#a0b4c4]">
								Chưa có tài khoản nào.
							</p>
							<Link
								href="/accounts/add"
								className="inline-flex items-center gap-2 text-[#7dd3fc] font-medium text-sm hover:underline">
								<Plus size={16} />
								Thêm tài khoản đầu tiên
							</Link>
						</div>
					)}

					{accounts.map((account) => {
						const Icon = accountIcon[account.type] || Banknote;
						const iconClass =
							accountIconColor[account.type] ||
							accountIconColor.Cash;

						return (
							<div
								key={account.id}
								className="glass-panel p-4 rounded-xl relative group">
								<div className="flex justify-between items-start relative z-10">
									<div className="flex items-center gap-3">
										<div
											className={`min-w-12 h-12 rounded-xl flex items-center justify-center border ${iconClass}`}>
											<Icon size={22} />
										</div>
										<div>
											<h3 className="font-semibold text-[#e0e8f0]">
												{account.name}
												{account.last4Digits
													? ` •••• ${account.last4Digits}`
													: ""}
											</h3>
											<p className="text-xs text-[#a0b4c4]">
												{accountTypeLabel[
													account.type
												] || account.type}
											</p>
											{/* <p className="text-xs font-semibold text-[#e0e8f0] mt-1">
												Hạn mức:{" "}
												{new Intl.NumberFormat(
													"vi-VN",
													{
														style: "currency",
														currency: "VND",
														maximumFractionDigits: 0,
													},
												).format(
													Number(
														account.balance || 0,
													),
												)}
											</p> */}
											{account.debt &&
											account.debt > 0 ? (
												<p className="text-xs text-red-400 mt-1">
													Dư nợ:{" "}
													{new Intl.NumberFormat(
														"vi-VN",
														{
															style: "currency",
															currency: "VND",
															maximumFractionDigits: 0,
														},
													).format(
														Number(account.debt),
													)}
												</p>
											) : null}
											{account.type !== "Credit" ? (
												<p className="text-xs text-green-400 mt-1">
													Số dư:{" "}
													{new Intl.NumberFormat(
														"vi-VN",
														{
															style: "currency",
															currency: "VND",
															maximumFractionDigits: 0,
														},
													).format(
														Number(account.balance),
													)}
												</p>
											) : null}
										</div>
									</div>
									<div className="relative">
										<button
											onClick={() =>
												setActiveMenu(
													activeMenu === account.id
														? null
														: account.id,
												)
											}
											className="text-[#a0b4c4] hover:text-[#7dd3fc] transition-colors p-1">
											<MoreVertical size={18} />
										</button>

										{activeMenu === account.id && (
											<div className="absolute right-0 top-8 w-36 glass-panel-elevated rounded-xl overflow-hidden z-50 shadow-xl">
												<button
													onClick={() => {
														console.log("clicked");
														setEditingAccount(
															account,
														);
														setActiveMenu(null);
													}}
													className="w-full px-4 py-3 text-left text-glacier-on-surface text-sm hover:bg-[rgba(125,211,252,0.1)] flex items-center gap-2 transition-colors">
													<Settings size={14} />
													Chỉnh sửa
												</button>
												<button
													onClick={() =>
														handleDelete(account.id)
													}
													disabled={
														deleting === account.id
													}
													className="w-full px-4 py-3 text-left text-red-400 text-sm hover:bg-red-500/10 flex items-center gap-2 transition-colors">
													<Trash2 size={14} />
													Xoá
												</button>
											</div>
										)}
									</div>
								</div>

								<div className="mt-4 relative z-10">
									<p className="text-[10px] text-[#a0b4c4] uppercase tracking-widest font-medium mb-1">
										Loại nguồn tiền
									</p>
									<p className="text-base font-semibold text-[#e0e8f0]">
										{account.type}
									</p>
								</div>
							</div>
						);
					})}

					{/* Add another */}
					<Link
						href="/accounts/add"
						className="w-full p-8 border-2 border-dashed border-[rgba(125,211,252,0.1)] rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[rgba(125,211,252,0.04)] transition-colors group">
						<div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
							<PlusCircle size={22} className="text-slate-400" />
						</div>
						<span className="text-sm font-medium text-slate-400">
							Kết nối nguồn khác
						</span>
					</Link>
				</div>

				{/* Edit Account Drawer */}
				<EditAccountDrawer
					isOpen={!!editingAccount}
					account={editingAccount}
					onClose={() => setEditingAccount(null)}
					onSaved={(updated) => {
						setAccounts((prev) =>
							prev.map((a) =>
								a.id === updated.id ? updated : a,
							),
						);
					}}
				/>
			</div>
		</PullToRefresh>
	);
}
