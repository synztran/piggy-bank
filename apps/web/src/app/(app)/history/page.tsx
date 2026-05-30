"use client";

import PullToRefresh from "@/components/PullToRefresh";
import TransactionFilter from "@/components/history/TransactionFilter";
import TransactionGroup from "@/components/history/TransactionGroup";
import TransactionSummary from "@/components/history/TransactionSummary";
import { useHistory } from "./useHistory";

export default function HistoryPage() {
	const {
		loading,
		total,
		loadingMore,
		deleting,
		sentinelRef,
		isFiltered,
		monthlySummary,
		groups,
		transactions,
		filterProps,
		handleDelete,
		handleRefresh,
	} = useHistory();

	return (
		<PullToRefresh onRefresh={handleRefresh}>
			<div className="space-y-4">
				<TransactionFilter {...filterProps} />

				{/* spacer to push content below the fixed TransactionFilter */}
				<div
					className={`h-filter${isFiltered ? " h-filter-expanded" : ""}`}
				/>

				<TransactionSummary
					totalSpent={monthlySummary.totalSpent}
					totalIncome={monthlySummary.totalIncome}
					totalTransactionsIn={monthlySummary.transactionsIn}
					totalTransactionsOut={monthlySummary.transactionsOut}
					total={total}
				/>

				<div className="space-y-4">
					{loading &&
						Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className="glass-panel p-4 rounded-xl h-16 animate-pulse"
							/>
						))}

					{!loading && transactions.length === 0 && (
						<div className="glass-panel p-8 rounded-xl text-center space-y-2">
							<p className="text-glacier-on-surface-variant">
								Chưa có giao dịch nào.
							</p>
							<p className="text-glacier-on-surface-variant text-sm">
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
							<span className="w-5 h-5 border-2 borderglacier-primary border-t-transparent rounded-full animate-spin" />
						</div>
					)}
				</div>
			</div>
		</PullToRefresh>
	);
}
