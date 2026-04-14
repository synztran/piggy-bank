"use client";

import PullToRefresh from "@/components/PullToRefresh";
import QuickPaymentModal from "@/components/QuickPaymentModal";
import UpdateBalanceDrawer from "@/components/UpdateBalanceDrawer";
import HeroBalanceCard from "@/components/dashboard/HeroBalanceCard";
import RecentTransactionsList from "@/components/dashboard/RecentTransactionsList";
import SpendingInsights from "@/components/dashboard/SpendingInsights";
import { useCallback, useEffect, useRef, useState } from "react";

interface PaymentSource {
	id: string;
	name: string;
	type: "Debit" | "Credit" | "Cash" | "Transfer";
	last4Digits?: string;
	debt?: number;
	balance?: number;
}

interface SpendingItem {
	category: string;
	amount: number;
	percentage: number;
}

interface Transaction {
	_id: string;
	description: string;
	amount: number;
	category: string;
	type: "expense" | "income";
	transactionDate: string;
}

interface Summary {
	totalBalance: number;
	totalSpentThisMonth: number;
	spending: SpendingItem[];
	recentTransactions: Transaction[];
	accountCount: number;
	memberBalances: { name: string; balance: number; isCurrentUser: boolean }[];
}

export default function DashboardPage() {
	const [summary, setSummary] = useState<Summary | null>(null);
	const [accounts, setAccounts] = useState<PaymentSource[]>([]);
	const [showUpdateBalance, setShowUpdateBalance] = useState(false);
	const [showQuickPayment, setShowQuickPayment] = useState(false);
	const iosKeyboardTriggerRef = useRef<HTMLInputElement>(null);
	const [loading, setLoading] = useState(true);

	const fetchData = useCallback(async () => {
		try {
			const [summaryRes, accountsRes] = await Promise.all([
				fetch("/api/summary"),
				fetch("/api/accounts"),
			]);
			if (summaryRes.ok) {
				const data = await summaryRes.json();
				setSummary(data);
			}
			if (accountsRes.ok) {
				const data = await accountsRes.json();
				setAccounts(data.accounts || []);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleOpenQuickPayment = useCallback(() => {
		iosKeyboardTriggerRef.current?.focus();
		setShowQuickPayment(true);
	}, []);

	const handleCloseQuickPayment = useCallback(
		() => setShowQuickPayment(false),
		[],
	);
	const handleCloseUpdateBalance = useCallback(
		() => setShowUpdateBalance(false),
		[],
	);
	const handleOpenUpdateBalance = useCallback(
		() => setShowUpdateBalance(true),
		[],
	);

	return (
		<PullToRefresh onRefresh={fetchData}>
			{/* Hidden input to keep iOS keyboard open */}
			<input
				ref={iosKeyboardTriggerRef}
				className="sr-only"
				aria-hidden="true"
				readOnly
				tabIndex={-1}
			/>

			<div className="space-y-6 pt-4">
				<HeroBalanceCard
					totalBalance={summary?.totalBalance ?? 0}
					memberBalances={summary?.memberBalances ?? []}
					loading={loading}
					onUpdateBalance={handleOpenUpdateBalance}
					onQuickPayment={handleOpenQuickPayment}
				/>

				{!loading && (
					<SpendingInsights spending={summary?.spending ?? []} />
				)}
				{loading && (
					<div className="grid grid-cols-2 gap-4">
						{[0, 1].map((i) => (
							<div
								key={i}
								className="glass-panel p-5 rounded-xl h-36 animate-pulse"
							/>
						))}
					</div>
				)}

				<RecentTransactionsList
					transactions={summary?.recentTransactions ?? []}
					loading={loading}
				/>

				<UpdateBalanceDrawer
					currentBalance={summary?.totalBalance ?? 0}
					onClose={handleCloseUpdateBalance}
					onUpdated={fetchData}
					isOpen={showUpdateBalance}
				/>

				<QuickPaymentModal
					isOpen={showQuickPayment}
					accounts={accounts}
					onClose={handleCloseQuickPayment}
					onSuccess={fetchData}
				/>
			</div>
		</PullToRefresh>
	);
}
