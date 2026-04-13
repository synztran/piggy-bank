import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { IPaymentSource } from "@/models/User";

export async function DELETE(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	await connectDB();

	const tx = await Transaction.findOneAndUpdate(
		{
			_id: new mongoose.Types.ObjectId(id),
			userId: new mongoose.Types.ObjectId(session.userId),
			isRemove: { $ne: true },
		},
		{
			$set: {
				isRemove: true,
				deletedBy: new mongoose.Types.ObjectId(session.userId),
			},
		},
		{ new: true },
	);

	if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

	// Reverse the balance effect on the transaction owner's account
	const amount = parseFloat(tx.amount.toString());
	// expense was subtracted → add back; income was added → subtract
	const delta = tx.type === "expense" ? amount : -amount;

	const user = await User.findById(tx.userId);
	if (user) {
		const newBalance = parseFloat(user.currentBalance.toString()) + delta;
		user.currentBalance = mongoose.Types.Decimal128.fromString(
			newBalance.toFixed(2),
		);

		// Reverse the effect on the payment source
		if (tx.paymentSourceId) {
			const ps = user.paymentSources.find(
				(s: IPaymentSource) => s.id === tx.paymentSourceId,
			);
			if (ps) {
				const beforeDebt = Number(ps.debt || 0);
				const beforeBalance = Number(ps.balance || 0);
				const debtAction = tx.debtAction;
				const isCardType = ps.type === "Credit" || ps.type === "Debit";

				if (debtAction === "charge" && tx.type === "expense") {
					// reverse: decrease debt (card only)
					ps.debt = Math.max(0, beforeDebt - amount);
				} else if (debtAction === "payment") {
					// reverse: increase debt, add back balance (card only)
					if (isCardType) ps.debt = beforeDebt + amount;
					ps.balance = beforeBalance + amount;
				} else {
					// regular: reverse balance; only touch debt for card types
					if (tx.type === "expense") {
						ps.balance = beforeBalance + amount;
						if (isCardType)
							ps.debt = Math.max(0, beforeDebt - amount);
					} else {
						ps.balance = beforeBalance - amount;
						if (isCardType) ps.debt = beforeDebt + amount;
					}
				}
			}
		}

		await user.save();
	}

	return NextResponse.json({ success: true });
}
