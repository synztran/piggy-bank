import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { getSession } from "@/lib/auth";

export async function GET() {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	await connectDB();

	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	const [user, allUsers, monthlyExpenses, recentTransactions] =
		await Promise.all([
			User.findById(session.userId).select(
				"currentBalance paymentSources name",
			),
			User.find({}).select("name currentBalance"),
			Transaction.find({
				userId: session.userId,
				type: "expense",
				transactionDate: { $gte: startOfMonth },
				isRemove: { $ne: true },
			}),
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
		totalSpentThisMonth,
		spending,
		recentTransactions: recentTransactions.map((t) => t.toJSON()),
		paymentSourceCount: user.paymentSources.length,
		memberBalances,
	});
}
