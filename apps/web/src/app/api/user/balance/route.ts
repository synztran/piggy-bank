import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { getSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

// PUT /api/user/balance — directly set the user's currentBalance
export async function PUT(req: NextRequest) {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const { balance } = await req.json();
		const parsed = parseFloat(balance);

		if (isNaN(parsed) || parsed < 0)
			return NextResponse.json(
				{ error: "Invalid balance value" },
				{ status: 400 },
			);

		await connectDB();

		const user = await User.findById(session.userId).select(
			"currentBalance",
		);
		if (!user)
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 },
			);

		const oldBalance = parseFloat(user.currentBalance.toString());
		const diff = parsed - oldBalance;

		// Update balance
		await User.findByIdAndUpdate(session.userId, {
			$set: {
				currentBalance: mongoose.Types.Decimal128.fromString(
					parsed.toFixed(2),
				),
			},
		});

		// Log the adjustment as a transaction (skip if no change)
		if (diff !== 0) {
			await Transaction.create({
				userId: session.userId,
				amount: mongoose.Types.Decimal128.fromString(
					Math.abs(diff).toFixed(2),
				),
				type: diff > 0 ? "income" : "expense",
				category: "other",
				paymentSourceId: "balance_adjustment",
				description: `Điều chỉnh số dư`,
				transactionDate: new Date(),
			});
		}

		return NextResponse.json({ currentBalance: parsed });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// GET /api/user/balance — return current balance
export async function GET() {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	await connectDB();
	const user = await User.findById(session.userId).select("currentBalance");

	if (!user)
		return NextResponse.json({ error: "User not found" }, { status: 404 });

	return NextResponse.json({
		currentBalance: parseFloat(user.currentBalance.toString()),
	});
}
