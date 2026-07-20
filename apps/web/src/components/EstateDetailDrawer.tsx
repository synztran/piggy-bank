"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { gooeyToast } from "goey-toast";
import { Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";

interface EstateItem {
	_id: string;
	type: "gold" | "stock" | "keyboard";
	name: string;
	boughtAt: string;
	price: number;
	currentPrice?: number;
	source: string;
	quantityUnit?: string;
	quantity?: number;
}

interface EstateDetailDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	group: {
		type: string;
		label: string;
		items: EstateItem[];
		boughtPrice: number;
		currentPrice: number;
	};
	showValues: boolean;
	onItemsChange?: (items: EstateItem[]) => void;
	onItemDelete?: (id: string) => void;
}

export default function EstateDetailDrawer({
	isOpen,
	onClose,
	group,
	showValues,
	onItemsChange,
	onItemDelete,
}: EstateDetailDrawerProps) {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");
	const [saving, setSaving] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const handleStartEdit = (item: EstateItem | null) => {
		if (!item) {
			setEditingId(null);
			setEditValue("");
			return;
		}
		setEditingId(item._id);
		setEditValue(String(item.currentPrice ?? item.price));
	};

	const handleSaveCurrentPrice = async (item: EstateItem) => {
		const newPrice = Number(editValue);
		if (isNaN(newPrice) || newPrice < 0) return;

		setSaving(true);
		try {
			const res = await fetch(`/api/estates/${item._id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ currentPrice: newPrice }),
			});
			if (res.ok) {
				const data = await res.json();
				if (onItemsChange) {
					const updated = group.items.map((i) =>
						i._id === item._id
							? { ...i, currentPrice: data.estate.currentPrice }
							: i,
					);
					onItemsChange(updated);
				}
			}
		} finally {
			setSaving(false);
			setEditingId(null);
		}
	};

	const handleDelete = async (id: string) => {
		setDeletingId(id);
		try {
			const res = await fetch(`/api/estates/${id}`, {
				method: "DELETE",
			});
			if (res.ok) {
				onItemDelete?.(id);
			} else {
				gooeyToast.error("Xoá thất bại");
			}
		} catch {
			gooeyToast.error("Lỗi kết nối");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<>
			{isOpen && (
				<div
					className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
					onClick={onClose}
				/>
			)}
			<div
				className={`fixed bottom-0 left-0 right-0 z-70 glass-panel-elevated rounded-t-3xl animate-in slide-in-from-bottom duration-300 max-h-[92dvh] flex flex-col safe-padding-bottom ${isOpen ? "top-[10dvh]" : "top-[100dvh]"}`}>
				<div className="shrink-0">
					<div className="flex justify-center pt-3 pb-1">
						<div className="w-10 h-1 rounded-md bg-[rgba(125,211,252,0.2)]" />
					</div>
					<div className="flex justify-between items-center px-6 pb-3">
						<h2 className="text-xl font-bold text-glacier-on-surface">
							{group.label}
						</h2>
						<button
							onClick={onClose}
							className="w-9 h-9 rounded-md bg-[rgba(125,211,252,0.1)] flex items-center justify-center text-glacier-on-surface-variant hover:text-glacier-on-surface transition-colors">
							<X size={16} />
						</button>
					</div>
				</div>

				<div className="overflow-y-auto flex-1 px-6 pb-8 space-y-4">
					{group.items.map((item) => (
						<div
							key={item._id}
							className="glass-panel rounded-xl p-4 space-y-2">
							<div className="space-y-2">
								<div className="flex items-center justify-between gap-4">
									<h4 className="font-semibold text-glacier-on-surface text-sm">
										{item.name}
									</h4>
									<div className="flex items-center gap-1">
										{item.currentPrice != null &&
											item.currentPrice !== 0 &&
											item.price > 0 && (
												<div
													className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
														item.currentPrice >=
														item.price
															? "text-income bg-income/10"
															: "text-expense bg-expense/10"
													}`}>
													<span>
														{(item.currentPrice ??
															0) >= item.price
															? "↑"
															: "↓"}
													</span>
													{Math.abs(
														(((item.currentPrice ??
															0) -
															item.price) /
															item.price) *
															100,
													).toFixed(1)}
													%
												</div>
											)}
										<button
											onClick={() =>
												handleDelete(item._id)
											}
											disabled={deletingId === item._id}
											className="px-1.5 py-0.5 text-xs rounded-md border border-red-400/30 text-red-400 hover:bg-red-500/10 transition-colors">
											{deletingId === item._id ? (
												<span className="inline-block w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
											) : (
												<Trash2 size={12} />
											)}
										</button>
									</div>
								</div>
								{item.quantity != null && (
									<p className="text-sm text-glacier-on-surface-variant">
										Số lượng: {item.quantity}{" "}
										{item.quantityUnit &&
											`(${item.quantityUnit})`}
									</p>
								)}
								<div className="flex items-center justify-between text-sm">
									<span className="text-glacier-on-surface-variant">
										Đã mua:{" "}
										{showValues
											? formatCurrency(item.price)
											: "••••••"}
									</span>
								</div>
								<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-glacier-on-surface-variant">
									<span>
										Nguồn: {item.source} -{" "}
										{formatDate(item.boughtAt)}
									</span>
								</div>
								<div className="flex items-center gap-2 text-glacier-on-surface font-medium">
									{editingId === item._id ? (
										<div className="flex items-center gap-2">
											<input
												type="number"
												value={editValue}
												onChange={(e) =>
													setEditValue(e.target.value)
												}
												className="glass-input max-w-28 py-1 px-2 rounded text-sm text-glacier-on-surface text-right no-spinner"
												min="0"
												step="1000"
												autoFocus
											/>
											<button
												onClick={() =>
													handleSaveCurrentPrice(item)
												}
												disabled={saving}
												className="text-glacier-primary text-xs font-semibold hover:underline">
												Lưu
											</button>
											<button
												onClick={() =>
													handleStartEdit(null)
												}
												disabled={saving}
												className="text-error text-xs font-semibold hover:underline">
												Hủy
											</button>
										</div>
									) : (
										<>
											Hiện tại:{" "}
											{showValues
												? formatCurrency(
														item.currentPrice ??
															item.price,
													)
												: "••••••"}
											<button
												onClick={() =>
													handleStartEdit(item)
												}
												className="text-glacier-on-surface-variant hover:text-glacier-primary transition-colors">
												<Pencil size={12} />
											</button>
										</>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</>
	);
}
