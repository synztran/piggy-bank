import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User, { IPaymentSource } from "@/models/User";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { searchParams } = new URL(req.url);
	const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
	const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
	const skip = (page - 1) * limit;
	const startDate = searchParams.get("startDate");
	const endDate = searchParams.get("endDate");

	await connectDB();

	const dateFilter: Record<string, Date> = {};
	if (startDate) dateFilter.$gte = new Date(startDate);
	if (endDate) {
		const end = new Date(endDate);
		end.setHours(23, 59, 59, 999);
		dateFilter.$lte = end;
	}
	const baseMatch = {
		...(Object.keys(dateFilter).length
			? { transactionDate: dateFilter }
			: {}),
	};

	const [transactions, total] = await Promise.all([
		Transaction.aggregate([
			{ $match: baseMatch },
			{ $sort: { transactionDate: -1 } },
			{ $skip: skip },
			{ $limit: limit },
			{
				$lookup: {
					from: "users",
					localField: "userId",
					foreignField: "_id",
					as: "_user",
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "deletedBy",
					foreignField: "_id",
					as: "_deletedByUser",
				},
			},
			{
				$addFields: {
					userName: { $arrayElemAt: ["$_user.name", 0] },
					deletedByName: {
						$arrayElemAt: ["$_deletedByUser.name", 0],
					},
					isOwn: {
						$eq: ["$userId", { $toObjectId: session.userId }],
					},
					amount: { $toDouble: "$amount" },
				},
			},
			{ $project: { _user: 0, _deletedByUser: 0, passwordHash: 0 } },
		]),
		Transaction.countDocuments({ ...baseMatch, isRemove: { $ne: true } }),
	]);

	return NextResponse.json({
		transactions,
		total,
		page,
		limit,
	});
}

export async function POST(req: NextRequest) {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const {
			description,
			amount,
			type,
			category,
			paymentSourceId,
			transactionDate,
		} = await req.json();

		if (!amount || !type || !paymentSourceId) {
			return NextResponse.json(
				{ error: "amount, type, and paymentSourceId are required" },
				{ status: 400 },
			);
		}

		if (!["expense", "income"].includes(type)) {
			return NextResponse.json(
				{ error: "type must be expense or income" },
				{ status: 400 },
			);
		}

		const parsedAmount = parseFloat(amount);
		if (isNaN(parsedAmount) || parsedAmount <= 0)
			return NextResponse.json(
				{ error: "Invalid amount" },
				{ status: 400 },
			);

		await connectDB();

		// Verify paymentSource belongs to user
		const user = await User.findById(session.userId);
		if (!user)
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 },
			);

		const sourceExists = user.paymentSources.some(
			(s: IPaymentSource) => s.id === paymentSourceId,
		);
		if (!sourceExists)
			return NextResponse.json(
				{ error: "Payment source not found" },
				{ status: 404 },
			);

		// Update currentBalance
		const currentBalance = parseFloat(user.currentBalance.toString());
		const delta = type === "income" ? parsedAmount : -parsedAmount;
		const newBalance = currentBalance + delta;

		user.currentBalance = mongoose.Types.Decimal128.fromString(
			newBalance.toFixed(2),
		);
		await user.save();

		const transaction = await Transaction.create({
			userId: session.userId,
			amount: mongoose.Types.Decimal128.fromString(
				parsedAmount.toFixed(2),
			),
			type,
			category: category || (type === "income" ? "income" : "other"),
			paymentSourceId,
			description: description?.trim() || "",
			transactionDate: transactionDate
				? new Date(transactionDate)
				: new Date(),
		});

		return NextResponse.json(
			{ transaction: transaction.toJSON() },
			{ status: 201 },
		);
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
