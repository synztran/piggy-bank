"use client";

import EditAccountDrawer from "@/components/EditAccountDrawer";
import PullToRefresh from "@/components/PullToRefresh";
import {
	ArrowLeftRight,
	Banknote,
	CirclePower,
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
	Cash: "text-glacier-primary bg-[rgba(125,211,252,0.1)] border-[rgba(125,211,252,0.2)]",
	Debit: "text-glacier-tertiary bg-[rgba(200,160,240,0.1)] border-[rgba(200,160,240,0.2)]",
	Credit: "text-glacier-primary bg-[rgba(125,211,252,0.08)] border-[rgba(125,211,252,0.3)]",
	Transfer: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const accountBackgroundGradient: Record<PaymentSource["type"], string> = {
	Cash: "bg-gradient-to-br from-[#1a3a4a] via-[#2a5a6a] to-[#3d7a8a]",
	Debit: "bg-gradient-to-br from-[#2d1a5e] via-[#4a2d8a] to-[#6b3faa]",
	Credit: "bg-gradient-to-br from-[#1a3050] via-[#2a5580] to-[#3a7aaa]",
	Transfer: "bg-gradient-to-br from-[#1a4a35] via-[#2a6a50] to-[#3a8a6a]",
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
			<div className="space-y-6 pt-2">
				{/* Header */}
				<div className="flex justify-between items-end">
					<div>
						<h2 className="text-2xl font-bold text-glacier-on-surface tracking-tight">
							Tài khoản
						</h2>
					</div>
					<Link
						href="/accounts/add"
						className="bg-glacier-on-surface text-black p-2 rounded-full font-medium active:scale-95 transition-all hover:bg-[rgba(125,211,252,0.2)] text-xs">
						Thêm mới tài khoản
					</Link>
				</div>
				{/* Account Cards */}
				<div className="space-y-8">
					{loading &&
						Array.from({ length: 2 }).map((_, i) => (
							<div
								key={i}
								className="glass-panel p-6 rounded-xl h-32 animate-pulse"
							/>
						))}

					{!loading && accounts.length === 0 && (
						<div className="glass-panel p-8 rounded-xl text-center space-y-3">
							<p className="text-glacier-on-surface">
								Chưa có tài khoản nào.
							</p>
							<Link
								href="/accounts/add"
								className="inline-flex items-center gap-2 text-glacier-primary font-medium text-sm hover:underline">
								<Plus size={16} />
								Thêm tài khoản đầu tiên
							</Link>
						</div>
					)}

					{accounts.map((account) => {
            const cardBgColor = accountBackgroundGradient[account.type] || accountBackgroundGradient.Cash;

						return (
							<div
								key={account.id}
								className={`p-4 rounded-xl relative group min-h-44 ${cardBgColor}`}>
								<div className="flex w-full justify-between items-start relative z-10">
									<div className="flex flex-col w-full">
											<div className="w-full flex items-center justify-between font-semibold text-glacier-on-surface text-xl">
												<span>{account.name}</span>
												<span>{account.last4Digits
													? ` •••• ${account.last4Digits}`
													: ""}</span>
											</div>
											<p className="text-xs text-glacier-on-surface-variant">
												{accountTypeLabel[
													account.type
												] || account.type}
											</p>
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
                <div className="absolute -bottom-4 left-2 w-full space-x-1">
                  <button
                    onClick={() => handleDelete(account.id)}
                    disabled={deleting === account.id}
                    className="rounded-full p-2 bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">
                    <CirclePower size={20} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingAccount(account);
                    }}
                    className="rounded-full p-2 bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">
                    <Settings size={20} />
                  </button>
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
