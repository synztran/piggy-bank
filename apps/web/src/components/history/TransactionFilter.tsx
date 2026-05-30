"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { memo } from "react";

interface TransactionFilterProps {
	showFilter: boolean;
	isFiltered: boolean;
	startDate: string;
	endDate: string;
	activeStart: string;
	activeEnd: string;
	showSearch: boolean;
	searchQuery: string;
	activeSearchQuery: string;
	onToggleFilter: () => void;
	onToggleSearch: () => void;
	onSearchQueryChange: (v: string) => void;
	onSearchApply: () => void;
	onSearchClear: () => void;
	onStartDateChange: (v: string) => void;
	onEndDateChange: (v: string) => void;
	onApply: () => void;
	onClose: () => void;
	onClear: () => void;
}

const TransactionFilter = memo(function TransactionFilter({
	showFilter,
	isFiltered,
	startDate,
	endDate,
	activeStart,
	activeEnd,
	showSearch,
	searchQuery,
	activeSearchQuery,
	onToggleFilter,
	onToggleSearch,
	onSearchQueryChange,
	onSearchApply,
	onSearchClear,
	onStartDateChange,
	onEndDateChange,
	onApply,
	onClose,
	onClear,
}: TransactionFilterProps) {
	return (
		<div
			className="space-y-2 fixed left-0 w-full px-6 z-20 bg-glacier-bg/80 backdrop-blur-sm py-4 mb-0!"
			style={{ top: "calc(4rem + env(safe-area-inset-top))" }}>
			<div className="clear-both relative">
				<div className="flex items-center justify-between mb-1">
					<span className="text-lg font-extrabold text-glacier-on-surface tracking-tight">
						Lịch sử giao dịch
					</span>
					<div className="flex items-center gap-2">
						<button
							onClick={onToggleSearch}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
								activeSearchQuery
									? "bg-[rgba(125,211,252,0.15)] text-glacier-primary border border-[rgba(125,211,252,0.3)]"
									: "bg-[rgba(125,211,252,0.06)] text-glacier-on-surface-variant border border-[rgba(125,211,252,0.1)]"
							}`}>
							<Search size={13} />
							Tìm
						</button>
						<button
							onClick={onToggleFilter}
							className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
								isFiltered
									? "bg-[rgba(125,211,252,0.15)] text-glacier-primary border border-[rgba(125,211,252,0.3)]"
									: "bg-[rgba(125,211,252,0.06)] text-glacier-on-surface-variant border border-[rgba(125,211,252,0.1)]"
							}`}>
							<SlidersHorizontal size={12} />
							Lọc{isFiltered ? " (đang lọc)" : ""}
						</button>
					</div>
				</div>
				{/* <p className="text-glacier-on-surface-variant text-[10px]">
					Xem lại toàn bộ giao dịch của bạn.
				</p> */}
			</div>

			{showFilter && (
				<div className="glass-panel p-4 rounded-xl space-y-3 animate-in slide-in-from-top duration-200">
					<p className="text-sm font-bold uppercase tracking-widest text-glacier-on-surface-variant">
						Bộ lọc
					</p>
					<div className="grid grid-cols-2 gap-3">
						<div className="w-full">
							<label className="text-xs text-glacier-on-surface-variant mb-1 block">
								Từ ngày
							</label>
							<input
								type="date"
								value={startDate}
								onChange={(e) =>
									onStartDateChange(e.target.value)
								}
								className="glass-input py-2 px-3 rounded-lg text-glacier-on-surface text-sm"
							/>
						</div>
						<div className="w-full">
							<label className="text-xs text-glacier-on-surface-variant mb-1 block">
								Đến ngày
							</label>
							<input
								type="date"
								value={endDate}
								onChange={(e) =>
									onEndDateChange(e.target.value)
								}
								className="glass-input py-2 px-3 rounded-lg text-glacier-on-surface text-sm"
							/>
						</div>
					</div>
					<div className="flex gap-2 pt-1">
						<button
							onClick={onApply}
							disabled={!startDate && !endDate}
							className="flex-1 py-2 rounded-lg bg-glacier-primary text-[#001f2e] text-sm font-bold disabled:opacity-40">
							Áp dụng
						</button>
						<button
							onClick={onClose}
							className="px-4 py-2 rounded-lg border border-[rgba(125,211,252,0.15)] text-glacier-on-surface-variant text-sm">
							Đóng
						</button>
					</div>
				</div>
			)}

			{showSearch && (
				<div className="glass-panel p-4 rounded-xl space-y-3 animate-in slide-in-from-top duration-200">
					<p className="text-sm font-bold uppercase tracking-widest text-glacier-on-surface-variant">
						Tìm kiếm
					</p>
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => onSearchQueryChange(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && onSearchApply()}
						placeholder="Nhập tên giao dịch..."
						className="glass-input w-full py-2 px-3 rounded-lg text-glacier-on-surface text-sm placeholder:text-glacier-on-surface-variant"
					/>
					<div className="flex gap-2 pt-1">
						<button
							onClick={onSearchApply}
							disabled={!searchQuery.trim()}
							className="flex-1 py-2 rounded-lg bg-glacier-primary text-[#001f2e] text-sm font-bold disabled:opacity-40">
							Tìm
						</button>
						<button
							onClick={onToggleSearch}
							className="px-4 py-2 rounded-lg border border-[rgba(125,211,252,0.15)] text-glacier-on-surface-variant text-sm">
							Đóng
						</button>
					</div>
				</div>
			)}

			{activeSearchQuery && (
				<div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[rgba(125,211,252,0.08)] border border-[rgba(125,211,252,0.2)]">
					<span className="text-xs text-glacier-primary font-medium">
						Tìm: &ldquo;{activeSearchQuery}&rdquo;
					</span>
					<button
						onClick={onSearchClear}
						className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors">
						<X size={12} />
						Xoá tìm kiếm
					</button>
				</div>
			)}

			{isFiltered && (
				<div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[rgba(125,211,252,0.08)] border border-[rgba(125,211,252,0.2)]">
					<span className="text-xs text-glacier-primary font-medium">
						{activeStart && activeEnd
							? `${activeStart} → ${activeEnd}`
							: activeStart
								? `Từ ${activeStart}`
								: `Đến ${activeEnd}`}
					</span>
					<button
						onClick={onClear}
						className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors">
						<X size={11} />
						Xoá bộ lọc
					</button>
				</div>
			)}
		</div>
	);
});

export default TransactionFilter;
