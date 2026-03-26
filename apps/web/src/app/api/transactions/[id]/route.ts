import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { getSession } from "@/lib/auth";

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
		await user.save();
	}

	return NextResponse.json({ success: true });
}
