import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Transaction, { sourceDelta } from "@/models/Transaction";
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

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

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

	const user = await User.findById(tx.userId);
	if (user) {
		const amount = parseFloat(tx.amount.toString());
		const debtAction = tx.debtAction;
		const isChargeToCard = debtAction === "charge" && tx.type === "expense";

		// Reverse exactly what the create applied, so a charge that never moved
		// the balance is not credited back on delete.
		const ps = tx.paymentSourceId
			? user.paymentSources.find(
					(s: IPaymentSource) => s.id === tx.paymentSourceId,
				)
			: undefined;

		if (ps) {
			const beforeDebt = Number(ps.debt || 0);
			const beforeBalance = Number(ps.balance || 0);
			const isCardType = ps.type === "Credit";

			// Credit card balances never move; only their debt does.
			if (!isCardType) {
				ps.balance = beforeBalance - sourceDelta(tx);
			}

			if (debtAction === "payment") {
				const target =
					(tx.debtTargetId
						? user.paymentSources.find(
								(s: IPaymentSource) =>
									s.id === tx.debtTargetId,
							)
						: undefined) ??
					(isCardType ? ps : undefined);

				if (target) {
					target.debt = Number(target.debt || 0) + amount;
				}
			} else if (isChargeToCard) {
				ps.debt = Math.max(0, beforeDebt - amount);
			} else if (tx.type === "income") {
				if (isCardType) ps.debt = beforeDebt + amount;
			} else if (isCardType) {
				ps.debt = Math.max(0, beforeDebt - amount);
			}
		}

		await user.save();
	}

	return NextResponse.json({ success: true });
}
