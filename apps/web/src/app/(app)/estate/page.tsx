"use client";

import AddEstateDrawer from "@/components/AddEstateDrawer";
import PullToRefresh from "@/components/PullToRefresh";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { gooeyToast } from "goey-toast";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Plus, PlusCircle } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface EstateItem {
	_id: string;
	type: "gold" | "stock" | "keyboard";
	name: string;
	boughtAt: string;
	price: number;
	source: string;
	quantityUnit?: string;
	quantity?: number;
}

const ALLOWED_KEYBOARD_USER_ID = "69c55ee4c121525ca058f09b";

const BASE_ESTATE_TYPES = [
	{ key: "all", label: "Tất cả" },
	{ key: "gold", label: "Vàng" },
	{ key: "stock", label: "Cổ phiếu" },
];

const typeIcons: Record<string, string> = {
	gold: "/icons/golds.png",
	stock: "/icons/stocks.png",
	keyboard: "/icons/keyboards.png",
};

const typeColors: Record<string, string> = {
	gold: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
	stock: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
	keyboard: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

const typeGradients: Record<string, string> = {
	gold: "bg-gradient-to-br from-[#3a2a0a] via-[#5a4a1a] to-[#8a7a2a]",
	stock: "bg-gradient-to-br from-[#0a3a1a] via-[#1a5a3a] to-[#2a7a5a]",
	keyboard: "bg-gradient-to-br from-[#2a0a3a] via-[#4a1a5a] to-[#6a2a7a]",
};

const typeLabel: Record<string, string> = {
	gold: "Vàng",
	stock: "Cổ phiếu",
	keyboard: "Bàn phím",
};

const cardVariants = {
	initial: { opacity: 0, y: 20, scale: 0.97 },
	animate: { opacity: 1, y: 0, scale: 1 },
	exit: { opacity: 0, y: -10, scale: 0.97 },
};

const containerVariants = {
	animate: {
		transition: { staggerChildren: 0.05 },
	},
};

export default function EstatePage() {
	const { user } = useAuth();
	const [estates, setEstates] = useState<EstateItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("all");
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [showValues, setShowValues] = useState(false);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const el = dialogRef.current;
		if (!el) return;
		if (deleteConfirmId) {
			el.showModal();
		} else {
			el.close();
		}
		const onClose = () => setDeleteConfirmId(null);
		el.addEventListener("close", onClose);
		return () => el.removeEventListener("close", onClose);
	}, [deleteConfirmId]);

	const confirmDelete = async () => {
		const id = deleteConfirmId;
		if (!id) return;
		setDeleting(true);
		try {
			const res = await fetch(`/api/estates/${id}`, {
				method: "DELETE",
			});
			if (res.ok) {
				setEstates((prev) => prev.filter((e) => e._id !== id));
				gooeyToast.success("Đã xoá tài sản");
			} else {
				gooeyToast.error("Xoá thất bại");
			}
		} catch {
			gooeyToast.error("Lỗi kết nối", {
				description: "Vui lòng thử lại.",
			});
		} finally {
			setDeleting(false);
			setDeleteConfirmId(null);
		}
	};

	const ESTATE_TYPES = useMemo(() => {
		if (user?.id === ALLOWED_KEYBOARD_USER_ID) {
			return [
				...BASE_ESTATE_TYPES,
				{ key: "keyboard", label: "Bàn phím" },
			];
		}
		return BASE_ESTATE_TYPES;
	}, [user?.id]);

	const fetchEstates = useCallback(async () => {
		try {
			const res = await fetch("/api/estates");
			if (res.ok) {
				const data = await res.json();
				setEstates(data.estates || []);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchEstates();
	}, [fetchEstates]);

	const filtered =
		activeTab === "all"
			? estates
			: estates.filter((e) => e.type === activeTab);

	const totalsByType = useMemo(() => {
		const map: Record<string, number> = {};
		for (const e of estates) {
			map[e.type] = (map[e.type] || 0) + e.price;
		}
		return map;
	}, [estates]);

	const totalAll = Object.values(totalsByType).reduce((a, b) => a + b, 0);

	const handleDelete = (id: string) => {
		setDeleteConfirmId(id);
	};

	return (
		<PullToRefresh onRefresh={fetchEstates}>
			<div className="space-y-4 pt-2">
				<div className="flex justify-between items-center">
					<div>
						<h2 className="text-2xl font-bold text-glacier-on-surface tracking-tight">
							Tài sản
						</h2>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={() => setShowValues(!showValues)}
							className="p-2 rounded-md bg-white/10 backdrop-blur-xl border border-white/20 text-glacier-on-surface-variant hover:text-glacier-on-surface transition-colors">
							{showValues ? <Eye size={16} /> : <EyeOff size={16} />}
						</button>
						<button
							onClick={() => setDrawerOpen(true)}
							className="bg-glacier-on-surface text-black p-2 rounded-md font-medium active:scale-95 transition-all text-xs">
							Thêm mới
						</button>
					</div>
				</div>

				{/* Summary Card */}
				{!loading && estates.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="glass-panel p-4 rounded-xl space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-sm text-glacier-on-surface-variant">
								Tổng giá trị
							</span>
							<span className="text-xl font-bold text-glacier-on-surface">
								{showValues ? formatCurrency(totalAll) : "••••••"}
							</span>
						</div>
						<div className="flex gap-4 pt-2 border-t border-white/10">
							{Object.entries(totalsByType).map(
								([type, total]) => (
									<div key={type} className="flex-1">
										<p className="text-[10px] uppercase tracking-wide text-glacier-on-surface-variant">
											{typeLabel[type] || type}
										</p>
										<p className="text-xs font-semibold text-glacier-on-surface mt-0.5">
											{showValues ? formatCurrency(total) : "••••••"}
										</p>
									</div>
								),
							)}
						</div>
					</motion.div>
				)}

				{/* Type Tabs */}
				<div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
					{ESTATE_TYPES.map(({ key, label }) => (
						<button
							key={key}
							onClick={() => setActiveTab(key)}
							className={`shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-all active:scale-95 ${
								activeTab === key
									? "bg-glacier-on-surface text-black"
									: "glass-panel text-glacier-on-surface-variant hover:text-glacier-on-surface"
							}`}>
							{label}
						</button>
					))}
				</div>

				{/* Estate List */}
				<div className="space-y-4">
					{loading &&
						Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className="glass-panel p-5 rounded-xl h-28 animate-pulse"
							/>
						))}

					<AnimatePresence mode="popLayout">
						{!loading && filtered.length === 0 && (
							<motion.div
								key="empty"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="glass-panel p-8 rounded-xl text-center space-y-3">
								<p className="text-glacier-on-surface-variant">
									{activeTab === "all"
										? "Chưa có tài sản nào."
										: `Chưa có tài sản loại ${typeLabel[activeTab] || activeTab}.`}
								</p>
								<button
									onClick={() => setDrawerOpen(true)}
									className="inline-flex items-center gap-2 text-glacier-primary font-medium text-sm hover:underline">
									<Plus size={16} />
									Thêm tài sản đầu tiên
								</button>
							</motion.div>
						)}

						{!loading && (
							<motion.div
								key={activeTab}
								variants={containerVariants}
								initial="initial"
								animate="animate"
								className="space-y-4">
								<AnimatePresence mode="popLayout">
									{filtered.map((item) => {
										const iconSrc =
											typeIcons[item.type] ||
											"/icons/golds.png";
										const colorClass =
											typeColors[item.type] ||
											typeColors.gold;
										const gradient =
											typeGradients[item.type] ||
											typeGradients.gold;

										return (
											<motion.div
												key={item._id}
												layout
												variants={cardVariants}
												initial="initial"
												animate="animate"
												exit="exit"
												transition={{
													type: "spring",
													stiffness: 300,
													damping: 25,
												}}
												className={`p-4 rounded-xl relative group ${gradient}`}>
												<div className="flex items-start gap-2 relative z-10">
													<div
														className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${colorClass}`}>
														<Image
															src={iconSrc}
															alt=""
															width={22}
															height={22}
															className="object-contain"
															unoptimized
														/>
													</div>
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2">
															<span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide bg-white/10 text-glacier-on-surface-variant backdrop-blur-xl border border-white/10">
																{typeLabel[
																	item.type
																] || item.type}
															</span>
															<h3 className="font-semibold text-glacier-on-surface text-lg truncate">
																{item.name}
															</h3>
															<button
																onClick={() =>
																	handleDelete(
																		item._id,
																	)
																}
																className="px-1.5 py-0.5 text-xs rounded-md border border-red-400 group-hover:opacity-100 ml-auto text-red-400">
																Xóa
															</button>
														</div>

														<div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
															{item.quantity !=
																null && (
																<span className="text-glacier-on-surface font-medium">
																	{showValues
																		? item.quantity
																		: "••••••"}{" "}
																	{showValues && item.quantityUnit && (
																		<span className="text-glacier-on-surface-variant">
																			{
																				item.quantityUnit
																			}
																		</span>
																	)}
																</span>
															)}
															<span className="text-glacier-on-surface-variant">
																{showValues
																	? formatCurrency(
																			item.price,
																		)
																	: "••••••"}
															</span>
														</div>
														<div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-glacier-on-surface-variant">
															<span>
																Nguồn:{" "}
																{item.source}
															</span>
															<span>
																Mua:{" "}
																{formatDate(
																	item.boughtAt,
																)}
															</span>
														</div>
													</div>
												</div>
											</motion.div>
										);
									})}
								</AnimatePresence>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{!loading && filtered.length > 0 && (
					<motion.button
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						onClick={() => setDrawerOpen(true)}
						className="w-full p-6 border-2 border-dashed border-[rgba(125,211,252,0.1)] rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[rgba(125,211,252,0.04)] transition-colors group">
						<div className="w-10 h-10 rounded-md bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
							<PlusCircle size={22} className="text-slate-400" />
						</div>
						<span className="text-sm font-medium text-slate-400">
							Thêm tài sản mới
						</span>
					</motion.button>
				)}
			</div>

			<dialog ref={dialogRef} className="modal">
				<div className="modal-box">
					<h3 className="font-bold text-lg">Xoá tài sản?</h3>
					<p className="py-4 text-sm text-glacier-on-surface-variant">
						Hành động này không thể hoàn tác.
					</p>
					<div className="modal-action">
						<button
							className="btn btn-ghost"
							onClick={() => setDeleteConfirmId(null)}
							disabled={deleting}>
							Huỷ
						</button>
						<button
							className="btn btn-error"
							onClick={confirmDelete}
							disabled={deleting}>
							{deleting ? (
								<span className="loading loading-spinner" />
							) : null}
							Xác nhận
						</button>
					</div>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={() => setDeleteConfirmId(null)}>
						close
					</button>
				</form>
			</dialog>

			<AddEstateDrawer
				isOpen={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				onSaved={(estate) => setEstates((prev) => [...prev, estate])}
			/>
		</PullToRefresh>
	);
}
