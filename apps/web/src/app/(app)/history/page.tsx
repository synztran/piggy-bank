"use client";

import PullToRefresh from "@/components/PullToRefresh";
import { Transaction } from "@/components/TransactionItem";
import TransactionFilter from "@/components/history/TransactionFilter";
import TransactionGroup from "@/components/history/TransactionGroup";
import TransactionSummary from "@/components/history/TransactionSummary";
import { formatDateGroup } from "@/lib/utils";
import { gooeyToast } from "goey-toast";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface GroupedTransactions {
	label: string;
	transactions: Transaction[];
}

function groupTransactions(transactions: Transaction[]): GroupedTransactions[] {
	const groups: Map<string, Transaction[]> = new Map();
	for (const tx of transactions) {
		const label = formatDateGroup(tx.transactionDate);
		if (!groups.has(label)) groups.set(label, []);
		groups.get(label)!.push(tx);
	}
	return Array.from(groups.entries()).map(([label, txs]) => ({
		label,
		transactions: txs,
	}));
}

export default function HistoryPage() {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [deleting, setDeleting] = useState<string | null>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const [showFilter, setShowFilter] = useState(false);
	const [startDate, setStartDate] = useState(() => {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
	});
	const [endDate, setEndDate] = useState(() => {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	});
	const [activeStart, setActiveStart] = useState("");
	const [activeEnd, setActiveEnd] = useState("");

	const isFiltered = !!(activeStart || activeEnd);

	const fetchTransactions = useCallback(
		async (
			pageNum = 1,
			append = false,
			from = activeStart,
			to = activeEnd,
		) => {
			try {
				const params = new URLSearchParams({
					page: String(pageNum),
					limit: "20",
				});
				if (from) params.set("startDate", from);
				if (to) params.set("endDate", to);
				const res = await fetch(`/api/transactions?${params}`);
				if (res.ok) {
					const data = await res.json();
					setTotal(data.total);
					setHasMore(pageNum * 20 < data.total);
					if (append) {
						setTransactions((prev) => [
							...prev,
							...data.transactions,
						]);
					} else {
						setTransactions(data.transactions || []);
					}
				}
			} finally {
				setLoading(false);
			}
		},
		[activeStart, activeEnd],
	);

	useEffect(() => {
		fetchTransactions(1);
	}, [fetchTransactions]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (
					entries[0].isIntersecting &&
					hasMore &&
					!loadingMore &&
					!loading
				) {
					const nextPage = page + 1;
					setPage(nextPage);
					setLoadingMore(true);
					fetchTransactions(nextPage, true).finally(() =>
						setLoadingMore(false),
					);
				}
			},
			{ rootMargin: "120px" },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasMore, loadingMore, loading, page, fetchTransactions]);

	const handleApplyFilter = useCallback(() => {
		setActiveStart(startDate);
		setActiveEnd(endDate);
		setPage(1);
		setLoading(true);
		setShowFilter(false);
		fetchTransactions(1, false, startDate, endDate);
	}, [startDate, endDate, fetchTransactions]);

	const handleClearFilter = useCallback(() => {
		setStartDate("");
		setEndDate("");
		setActiveStart("");
		setActiveEnd("");
		setPage(1);
		setLoading(true);
		fetchTransactions(1, false, "", "");
	}, [fetchTransactions]);

	const handleToggleFilter = useCallback(() => setShowFilter((v) => !v), []);
	const handleCloseFilter = useCallback(() => setShowFilter(false), []);

	const confirmDelete = useCallback((id: string) => {
		setDeleting(id);
		const promise = fetch(`/api/transactions/${id}`, {
			method: "DELETE",
		}).then(async (res) => {
			if (!res.ok) throw new Error("failed");
			setTransactions((prev) =>
				prev.map((t) => (t._id === id ? { ...t, isRemove: true } : t)),
			);
			setTotal((prev) => prev - 1);
		});
		promise.finally(() => setDeleting(null));
		gooeyToast.promise(promise, {
			loading: "Đang ẩn...",
			success: "Đã ẩn",
			error: "Không thể ẩn",
			action: {
				error: {
					label: "Thử lại",
					onClick: () => confirmDelete(id),
				},
			},
		});
	}, []);

	const handleDelete = useCallback(
		(id: string) => {
			gooeyToast.warning("Ẩn giao dịch này?", {
				description:
					"Giao dịch sẽ bị ẩn khỏi số dư. Bạn có chắc không?",
				duration: 100,
				action: {
					label: "Xác nhận",
					onClick: () => confirmDelete(id),
					successLabel: "Đang ẩn...",
				},
			});
		},
		[confirmDelete],
	);

	const groups = useMemo(
		() => groupTransactions(transactions),
		[transactions],
	);

	const totalSpentThisMonth = useMemo(
		() =>
			transactions
				.filter((t) => t.type === "expense" && !t.isRemove)
				.reduce((sum, t) => sum + t.amount, 0),
		[transactions],
	);

	return (
		<PullToRefresh onRefresh={() => fetchTransactions(1, false)}>
			<div className="space-y-4 pt-4">
				<TransactionFilter
					showFilter={showFilter}
					isFiltered={isFiltered}
					startDate={startDate}
					endDate={endDate}
					activeStart={activeStart}
					activeEnd={activeEnd}
					onToggleFilter={handleToggleFilter}
					onStartDateChange={setStartDate}
					onEndDateChange={setEndDate}
					onApply={handleApplyFilter}
					onClose={handleCloseFilter}
					onClear={handleClearFilter}
				/>

				<TransactionSummary
					totalSpent={totalSpentThisMonth}
					total={total}
				/>

				<div className="space-y-6">
					{loading &&
						Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className="glass-panel p-4 rounded-xl h-16 animate-pulse"
							/>
						))}

					{!loading && transactions.length === 0 && (
						<div className="glass-panel p-8 rounded-xl text-center space-y-2">
							<p className="text-[#a0b4c4]">
								Chưa có giao dịch nào.
							</p>
							<p className="text-[#a0b4c4] text-sm">
								Dùng Thêm nhanh ở trang chủ để ghi lại giao dịch
								đầu tiên.
							</p>
						</div>
					)}

					{groups.map((group) => (
						<TransactionGroup
							key={group.label}
							label={group.label}
							transactions={group.transactions}
							deleting={deleting}
							onDelete={handleDelete}
						/>
					))}

					<div ref={sentinelRef} className="h-1" />
					{loadingMore && (
						<div className="flex justify-center py-4">
							<span className="w-5 h-5 border-2 border-[#7dd3fc] border-t-transparent rounded-full animate-spin" />
						</div>
					)}
				</div>
			</div>
		</PullToRefresh>
	);
}
