import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { sendPushNotification } from "@/lib/notification";
import Transaction from "@/models/Transaction";
import User, { IPaymentSource } from "@/models/User";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

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
	const search = searchParams.get("search");

	await connectDB();

	const dateFilter: Record<string, Date> = {};
	if (startDate) dateFilter.$gte = new Date(startDate);
	if (endDate) {
		const end = new Date(endDate);
		end.setHours(23, 59, 59, 999);
		dateFilter.$lte = end;
	}
	const baseMatch: Record<string, unknown> = {
		...(Object.keys(dateFilter).length
			? { transactionDate: dateFilter }
			: {}),
		...(search
			? { description: { $regex: search, $options: "i" } }
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
					paymentSourceName: {
						$let: {
							vars: {
								userDoc: { $arrayElemAt: ["$_user", 0] },
							},
							in: {
								$reduce: {
									input: "$$userDoc.paymentSources",
									initialValue: null,
									in: {
										$cond: [
											{
												$eq: [
													"$$this.id",
													"$paymentSourceId",
												],
											},
											"$$this.name",
											"$$value",
										],
									},
								},
							},
						},
					},
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
			debtAction,
		} = await req.json();

		if (!amount || !type) {
			return NextResponse.json(
				{ error: "amount and type are required" },
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

		// Verify paymentSource belongs to user (only if provided)
		const user = await User.findById(session.userId);
		if (!user)
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 },
			);

		if (paymentSourceId) {
			const sourceExists = user.paymentSources.some(
				(s: IPaymentSource) => s.id === paymentSourceId,
			);
			if (!sourceExists)
				return NextResponse.json(
					{ error: "Payment source not found" },
					{ status: 404 },
				);
		}

		// Handle debt adjustments and update currentBalance accordingly.
		const currentBalance = parseFloat(user.currentBalance.toString());

		// Determine whether this transaction should adjust user balance.
		// If debtAction === 'charge' for an expense, we treat it as a card charge
		// (increase card debt) and do NOT change the user's cash balance here.
		const isChargeToCard = debtAction === "charge" && type === "expense";

		const delta = isChargeToCard
			? 0
			: type === "income"
				? parsedAmount
				: -parsedAmount;
		const newBalance = currentBalance + delta;

		user.currentBalance = mongoose.Types.Decimal128.fromString(
			newBalance.toFixed(2),
		);

		// If paymentSourceId provided, adjust that payment source's debt and/or balance
		if (paymentSourceId) {
			const ps = user.paymentSources.find(
				(s: IPaymentSource) => s.id === paymentSourceId,
			);
			if (ps) {
				const beforeDebt = Number(ps.debt || 0);
				const beforeBalance = Number(ps.balance || 0);
				const isCardType = ps.type === "Credit" || ps.type === "Debit";
				if (debtAction === "charge" && type === "expense") {
					// charge to card: increase debt, do not change balance
					ps.debt = beforeDebt + parsedAmount;
				} else if (debtAction === "payment") {
					// paying down debt: reduce debt and subtract from the source balance
					if (isCardType)
						ps.debt = Math.max(0, beforeDebt - parsedAmount);
					ps.balance = beforeBalance - parsedAmount;
				} else {
					// regular transaction: adjust balance; only touch debt for card types
					if (type === "expense") {
						ps.balance = beforeBalance - parsedAmount;
						if (isCardType) ps.debt = beforeDebt + parsedAmount;
					} else {
						ps.balance = beforeBalance + parsedAmount;
						if (isCardType)
							ps.debt = Math.max(0, beforeDebt - parsedAmount);
					}
				}
			}
		}

		await user.save();

		const transaction = await Transaction.create({
			userId: session.userId,
			amount: mongoose.Types.Decimal128.fromString(
				parsedAmount.toFixed(2),
			),
			type,
			category: category || (type === "income" ? "income" : "other"),
			paymentSourceId,
			debtAction: debtAction || null,
			description: description?.trim() || "",
			transactionDate: transactionDate
				? new Date(transactionDate)
				: new Date(),
		});

		const transactionJson = transaction.toJSON();

		const categoryLabels: Record<string, string> = {
			food: "Food",
			transport: "Transport",
			shopping: "Shopping",
			bills: "Bills",
			entertainment: "Entertainment",
			health: "Health",
			education: "Education",
			other: "Other",
			income: "Income",
		};

		const emojiMap: Record<string, string> = {
			food: "🍽️",
			transport: "🚗",
			shopping: "🛍️",
			bills: "📄",
			entertainment: "🎬",
			health: "💊",
			education: "📚",
			other: "📌",
			income: "💰",
		};

		const fmtAmount = new Intl.NumberFormat("vi-VN", {
			style: "currency",
			currency: "VND",
			minimumFractionDigits: 0,
		}).format(parsedAmount);

		const emoji = emojiMap[category || "other"] || "📌";
		const catLabel = categoryLabels[category || "other"] || category;

		const title =
			type === "expense"
				? `${emoji} Spent ${fmtAmount}`
				: `${emoji} Received ${fmtAmount}`;
		const body = description?.trim()
			? `${catLabel}: ${description.trim()}`
			: catLabel;

		const otherUsers = await User.find({ _id: { $ne: session.userId } }).select("_id");
		const otherUserIds = otherUsers.map((u) => u._id.toString());
		if (otherUserIds.length > 0) {
			sendPushNotification(otherUserIds, title, body, {
				transactionId: transaction._id?.toString(),
				type,
				amount: parsedAmount,
				category,
			});
		}

		return NextResponse.json(
			{ transaction: transactionJson },
			{ status: 201 },
		);
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
