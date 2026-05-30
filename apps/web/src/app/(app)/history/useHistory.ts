"use client";

import { Transaction } from "@/components/TransactionItem";
import { gooeyToast } from "goey-toast";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDateGroup } from "@/lib/utils";

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

export function useHistory() {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [deleting, setDeleting] = useState<string | null>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const [showFilter, setShowFilter] = useState(false);
	const [showSearch, setShowSearch] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeSearchQuery, setActiveSearchQuery] = useState("");
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
  const isSearching = !!activeSearchQuery;

	const [monthlySummary, setMonthlySummary] = useState({
		totalSpent: 0,
		totalIncome: 0,
		transactionsIn: 0,
		transactionsOut: 0,
	});

	const fetchTransactions = useCallback(
		async (
			pageNum = 1,
			append = false,
			from = activeStart,
			to = activeEnd,
			search = activeSearchQuery,
		) => {
			try {
				const params = new URLSearchParams({
					page: String(pageNum),
					limit: "20",
				});
				if (from) params.set("startDate", from);
				if (to) params.set("endDate", to);
				if (search) params.set("search", search);
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
		[activeStart, activeEnd, activeSearchQuery],
	);

	const fetchMonthlySummary = useCallback(async () => {
		try {
			const res = await fetch("/api/summary");
			if (res.ok) {
				const data = await res.json();
				setMonthlySummary({
					totalSpent: data.totalSpentThisMonth ?? 0,
					totalIncome: data.totalIncomeThisMonth ?? 0,
					transactionsIn: data.totalTransactionsIn ?? 0,
					transactionsOut: data.totalTransactionsOut ?? 0,
				});
			}
		} catch {}
	}, []);

	useEffect(() => {
		fetchTransactions(1);
	}, [fetchTransactions]);

	useEffect(() => {
		fetchMonthlySummary();
	}, [fetchMonthlySummary]);

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
		const d = new Date();
		const startDateMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
		const endDateMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
		setStartDate(startDateMonth);
		setEndDate(endDateMonth);
		setActiveStart("");
		setActiveEnd("");
		setPage(1);
		setLoading(true);
		fetchTransactions(1, false, "", "");
	}, [fetchTransactions]);

	const handleToggleFilter = useCallback(() => setShowFilter((v) => !v), []);
	const handleCloseFilter = useCallback(() => setShowFilter(false), []);
	const handleToggleSearch = useCallback(() => setShowSearch((v) => !v), []);

	const handleSearchApply = useCallback(() => {
		setActiveSearchQuery(searchQuery.trim());
		setPage(1);
		setLoading(true);
		setShowSearch(false);
		fetchTransactions(1, false, activeStart, activeEnd, searchQuery.trim());
	}, [searchQuery, activeStart, activeEnd, fetchTransactions]);

	const handleSearchClear = useCallback(() => {
		setSearchQuery("");
		setActiveSearchQuery("");
		setPage(1);
		setLoading(true);
		fetchTransactions(1, false, activeStart, activeEnd, "");
	}, [activeStart, activeEnd, fetchTransactions]);

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

	const handleRefresh = useCallback(() => {
		fetchTransactions(1, false);
		fetchMonthlySummary();
	}, [fetchTransactions, fetchMonthlySummary]);

	const filterProps = {
		showFilter,
		isFiltered,
    isSearching,
		startDate,
		endDate,
		activeStart,
		activeEnd,
		showSearch,
		searchQuery,
		activeSearchQuery,
		onToggleFilter: handleToggleFilter,
		onToggleSearch: handleToggleSearch,
		onSearchQueryChange: setSearchQuery,
		onSearchApply: handleSearchApply,
		onSearchClear: handleSearchClear,
		onStartDateChange: setStartDate,
		onEndDateChange: setEndDate,
		onApply: handleApplyFilter,
		onClose: handleCloseFilter,
		onClear: handleClearFilter,
	};

	return {
		// State
		loading,
		total,
		hasMore,
		loadingMore,
		deleting,
		sentinelRef,
		isFiltered,
    isSearching,
		monthlySummary,
		groups,
		transactions,
		filterProps,
		// Actions
		handleDelete,
		handleRefresh,
	};
}
