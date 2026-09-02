import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	await connectDB();

	const { searchParams } = new URL(request.url);
	const startDateParam = searchParams.get("startDate");
	const endDateParam = searchParams.get("endDate");
	const category = searchParams.get("category");

	const now = new Date();
	let dateFrom: Date;
	let dateTo: Date;

	if (startDateParam || endDateParam) {
		dateFrom = startDateParam
			? new Date(startDateParam)
			: new Date(0);
		dateTo = endDateParam
			? new Date(endDateParam + "T23:59:59.999Z")
			: now;
	} else {
		dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
		dateTo = now;
	}

	const dateMatch: Record<string, unknown> = {
		transactionDate: { $gte: dateFrom, $lte: dateTo },
		isRemove: { $ne: true },
		...(category ? { category } : {}),
	};

	const [user, allUsers, monthlyExpenses, monthlyIncome, recentTransactions] =
		await Promise.all([
			User.findById(session.userId).select(
				"currentBalance paymentSources name",
			),
			User.find({}).select("name currentBalance"),
			Transaction.find({ type: "expense", ...dateMatch }),
			Transaction.find({ type: "income", ...dateMatch }),
			Transaction.find({
				userId: session.userId,
				isRemove: { $ne: true },
			})
				.sort({ transactionDate: -1 })
				.limit(5),
		]);

	if (!user)
		return NextResponse.json({ error: "User not found" }, { status: 404 });

	const totalBalance = parseFloat(user.currentBalance.toString());

	const totalSpentThisMonth = monthlyExpenses.reduce(
		(sum, t) => sum + parseFloat(t.amount.toString()),
		0,
	);

	const totalIncomeThisMonth = monthlyIncome.reduce(
		(sum, t) => sum + parseFloat(t.amount.toString()),
		0,
	);

	const totalTransactionsIn = monthlyIncome.length;
	const totalTransactionsOut = monthlyExpenses.length;

	// Category breakdown
	const categoryMap: Record<string, number> = {};
	for (const t of monthlyExpenses) {
		const amt = parseFloat(t.amount.toString());
		categoryMap[t.category] = (categoryMap[t.category] || 0) + amt;
	}

	const spending = Object.entries(categoryMap).map(([category, amount]) => ({
		category,
		amount,
		percentage:
			totalSpentThisMonth > 0
				? Math.round((amount / totalSpentThisMonth) * 100)
				: 0,
	}));

	const memberBalances = allUsers.map((u) => ({
		name: u.name,
		balance: parseFloat(u.currentBalance.toString()),
		isCurrentUser: u._id.toString() === session.userId,
	}));

	return NextResponse.json({
		totalBalance,
		totalSpentThisMonth: totalSpentThisMonth,
		totalIncomeThisMonth: totalIncomeThisMonth,
		totalSpent: totalSpentThisMonth,
		totalIncome: totalIncomeThisMonth,
		totalTransactionsIn,
		totalTransactionsOut,
		spending,
		recentTransactions: recentTransactions.map((t) => t.toJSON()),
		paymentSourceCount: user.paymentSources.length,
		memberBalances,
	});
}
