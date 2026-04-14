"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { memo } from "react";

interface TransactionFilterProps {
	showFilter: boolean;
	isFiltered: boolean;
	startDate: string;
	endDate: string;
	activeStart: string;
	activeEnd: string;
	onToggleFilter: () => void;
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
	onToggleFilter,
	onStartDateChange,
	onEndDateChange,
	onApply,
	onClose,
	onClear,
}: TransactionFilterProps) {
	return (
		<div className="space-y-4 sticky top-[4rem] z-20 bg-glacier-bg/80 backdrop-blur-sm py-2">
			<div className="clear-both">
				<div className="flex items-center justify-between mb-1">
					<h2 className="text-2xl font-extrabold text-[#e0e8f0] tracking-tight">
						Lịch sử giao dịch
					</h2>
					<button
						onClick={onToggleFilter}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
							isFiltered
								? "bg-[rgba(125,211,252,0.15)] text-[#7dd3fc] border border-[rgba(125,211,252,0.3)]"
								: "bg-[rgba(125,211,252,0.06)] text-[#a0b4c4] border border-[rgba(125,211,252,0.1)]"
						}`}>
						<SlidersHorizontal size={13} />
						Lọc{isFiltered ? " (đang lọc)" : ""}
					</button>
				</div>
				<p className="text-[#a0b4c4] text-xs">
					Xem lại toàn bộ giao dịch của bạn.
				</p>
			</div>

			{showFilter && (
				<div className="glass-panel p-4 rounded-xl space-y-3 animate-in slide-in-from-top duration-200">
					<p className="text-sm font-bold uppercase tracking-widest text-[#a0b4c4]">
						Bộ lọc
					</p>
					<div className="grid grid-cols-2 gap-3">
						<div className="w-full">
							<label className="text-xs text-[#a0b4c4] mb-1 block">
								Từ ngày
							</label>
							<input
								type="date"
								value={startDate}
								onChange={(e) =>
									onStartDateChange(e.target.value)
								}
								className="glass-input py-2 px-3 rounded-lg text-[#e0e8f0] text-sm"
							/>
						</div>
						<div className="w-full">
							<label className="text-xs text-[#a0b4c4] mb-1 block">
								Đến ngày
							</label>
							<input
								type="date"
								value={endDate}
								onChange={(e) =>
									onEndDateChange(e.target.value)
								}
								className="glass-input py-2 px-3 rounded-lg text-[#e0e8f0] text-sm"
							/>
						</div>
					</div>
					<div className="flex gap-2 pt-1">
						<button
							onClick={onApply}
							disabled={!startDate && !endDate}
							className="flex-1 py-2 rounded-lg bg-[#7dd3fc] text-[#001f2e] text-sm font-bold disabled:opacity-40">
							Áp dụng
						</button>
						<button
							onClick={onClose}
							className="px-4 py-2 rounded-lg border border-[rgba(125,211,252,0.15)] text-[#a0b4c4] text-sm">
							Đóng
						</button>
					</div>
				</div>
			)}

			{isFiltered && (
				<div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[rgba(125,211,252,0.08)] border border-[rgba(125,211,252,0.2)]">
					<span className="text-xs text-[#7dd3fc] font-medium">
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
