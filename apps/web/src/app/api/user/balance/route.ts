import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import User, { IPaymentSource } from "@/models/User";
import Transaction from "@/models/Transaction";
import { getSession } from "@/lib/auth";
import { totalBalance } from "@/lib/balance";

// PUT /api/user/balance — apply a manual adjustment to one payment source
export async function PUT(req: NextRequest) {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const { balance, paymentSourceId } = await req.json();
		const parsed = parseFloat(balance);

		if (isNaN(parsed))
			return NextResponse.json(
				{ error: "Invalid balance value" },
				{ status: 400 },
			);

		if (!paymentSourceId)
			return NextResponse.json(
				{ error: "paymentSourceId is required" },
				{ status: 400 },
			);

		await connectDB();

		const user = await User.findById(session.userId);
		if (!user)
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 },
			);

		const ps = user.paymentSources.find(
			(s: IPaymentSource) => s.id === paymentSourceId,
		);
		if (!ps)
			return NextResponse.json(
				{ error: "Payment source not found" },
				{ status: 404 },
			);

		if (ps.type === "Credit") {
			return NextResponse.json(
				{
					error: "Credit cards are adjusted through debt payments",
				},
				{ status: 400 },
			);
		}

		const oldBalance = Number(ps.balance || 0);
		const diff = parsed - oldBalance;

		ps.balance = parsed;
		await user.save();

		// Log the adjustment as a transaction so history stays explainable
		if (diff !== 0) {
			await Transaction.create({
				userId: session.userId,
				amount: mongoose.Types.Decimal128.fromString(
					Math.abs(diff).toFixed(2),
				),
				type: diff > 0 ? "income" : "expense",
				category: "other",
				paymentSourceId,
				description: `Điều chỉnh số dư`,
				transactionDate: new Date(),
			});
		}

		return NextResponse.json({
			currentBalance: totalBalance(user.paymentSources),
		});
	} catch (err) {
		console.error("[user:balance] error:", err);
		const message = err instanceof Error ? err.message : "Internal server error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

// GET /api/user/balance — total money held across all payment sources
export async function GET() {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	await connectDB();
	const user = await User.findById(session.userId).select("paymentSources");

	if (!user)
		return NextResponse.json({ error: "User not found" }, { status: 404 });

	return NextResponse.json({
		currentBalance: totalBalance(user.paymentSources),
	});
}
