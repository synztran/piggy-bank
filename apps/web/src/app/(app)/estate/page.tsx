"use client";

import AddEstateDrawer from "@/components/AddEstateDrawer";
import EstateCard from "@/components/EstateCard";
import EstateDetailDrawer from "@/components/EstateDetailDrawer";
import EstateSummaryCard from "@/components/EstateSummaryCard";
import PullToRefresh from "@/components/PullToRefresh";
import { useAuth } from "@/lib/auth-context";
import { gooeyToast } from "goey-toast";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Plus, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

interface EstateGroup {
	type: string;
	label: string;
	items: EstateItem[];
	boughtPrice: number;
	currentPrice: number;
	totalQuantity: string;
}

const ALLOWED_KEYBOARD_USER_ID = "69c55ee4c121525ca058f09b";

const BASE_ESTATE_TYPES = [
	{ key: "all", label: "Tất cả" },
	{ key: "gold", label: "Vàng" },
	{ key: "stock", label: "Cổ phiếu" },
];

const typeLabel: Record<string, string> = {
	gold: "Vàng",
	stock: "Cổ phiếu",
	keyboard: "Bàn phím",
};

export default function EstatePage() {
	const { user } = useAuth();
	const [estates, setEstates] = useState<EstateItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("all");
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [showValues, setShowValues] = useState(false);
	const [selectedGroup, setSelectedGroup] = useState<{
		type: string;
		label: string;
		items: EstateItem[];
		boughtPrice: number;
		currentPrice: number;
	} | null>(null);
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

	const estateGroups = useMemo(() => {
		const groups: Record<string, EstateItem[]> = {};
		for (const e of estates) {
			if (!groups[e.type]) groups[e.type] = [];
			groups[e.type].push(e);
		}
		return Object.entries(groups).map(([type, items]) => {
			const boughtPrice = items.reduce((sum, i) => sum + i.price, 0);
			const currentPrice = items.reduce(
				(sum, i) => sum + (i.currentPrice ?? i.price),
				0,
			);

			let totalQuantity = "";
			if (type === "gold") {
				let totalChi = 0;
				for (const i of items) {
					if (i.quantity == null) continue;
					if (i.quantityUnit === "lượng") {
						totalChi += i.quantity * 10;
					} else {
						totalChi += i.quantity;
					}
				}
				if (totalChi > 0) {
					const luong = Math.floor(totalChi / 10);
					const chi = Math.round((totalChi % 10) * 100) / 100;
					totalQuantity = `${luong > 0 ? `${luong} lượng ` : ""}${chi} chỉ`;
				}
			} else if (type === "stock") {
				const totalShares = items.reduce(
					(sum, i) => sum + (i.quantity ?? 0),
					0,
				);
				if (totalShares > 0) {
					totalQuantity = `${totalShares} cổ phiếu`;
				}
			} else if (type === "keyboard") {
				totalQuantity = `${items.length} cái`;
			}

			return {
				type,
				label: typeLabel[type] || type,
				items,
				boughtPrice,
				currentPrice,
				totalQuantity,
			};
		});
	}, [estates]);

	const filteredGroups = useMemo(() => {
		if (activeTab === "all") return estateGroups;
		return estateGroups.filter((g) => g.type === activeTab);
	}, [estateGroups, activeTab]);

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
							{showValues ? (
								<Eye size={16} />
							) : (
								<EyeOff size={16} />
							)}
						</button>
						<button
							onClick={() => setDrawerOpen(true)}
							className="bg-glacier-on-surface text-black p-2 rounded-md font-medium active:scale-95 transition-all text-xs">
							Thêm mới
						</button>
					</div>
				</div>

				{!loading && estates.length > 0 && (
					<EstateSummaryCard
						estates={estates}
						showValues={showValues}
					/>
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
						{!loading && filteredGroups.length === 0 && (
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
								variants={{
									animate: {
										transition: {
											staggerChildren: 0.05,
										},
									},
								}}
								initial="initial"
								animate="animate"
								className="space-y-2">
								<AnimatePresence mode="popLayout">
									{filteredGroups.map((group) => (
										<EstateCard
											key={group.type}
											group={group}
											showValues={showValues}
											onClick={() =>
												setSelectedGroup(group)
											}
										/>
									))}
								</AnimatePresence>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{!loading && filteredGroups.length > 0 && (
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

			<EstateDetailDrawer
				isOpen={selectedGroup !== null}
				onClose={() => setSelectedGroup(null)}
				group={
					selectedGroup || {
						type: "",
						label: "",
						items: [],
						boughtPrice: 0,
						currentPrice: 0,
					}
				}
				showValues={showValues}
				onItemsChange={(updatedItems) => {
					setEstates((prev) =>
						prev.map(
							(e) =>
								updatedItems.find((u) => u._id === e._id) ||
								e,
						),
					);
				}}
				onItemDelete={(id) => {
					setEstates((prev) => prev.filter((e) => e._id !== id));
				}}
			/>
		</PullToRefresh>
	);
}
