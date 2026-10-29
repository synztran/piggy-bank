import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { maskAmount, sendPushNotification } from "@/lib/notification";
import Transaction, { sourceDelta } from "@/models/Transaction";
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
	const category = searchParams.get("category");

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
		...(category ? { category } : {}),
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
					debtTargetName: {
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
													"$debtTargetId",
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
			debtTargetId,
		} = await req.json();

		if (!amount || !type) {
			return NextResponse.json(
				{ error: "amount and type are required" },
				{ status: 400 },
			);
		}

		if (!paymentSourceId) {
			return NextResponse.json(
				{ error: "paymentSourceId is required" },
				{ status: 400 },
			);
		}

		if (!["expense", "income"].includes(type)) {
			return NextResponse.json(
				{ error: "type must be expense or income" },
				{ status: 400 },
			);
		}

		if (
			debtAction !== undefined &&
			debtAction !== null &&
			!["charge", "payment"].includes(debtAction)
		) {
			return NextResponse.json(
				{ error: "debtAction must be charge or payment" },
				{ status: 400 },
			);
		}

		const parsedAmount = parseFloat(amount);
		if (isNaN(parsedAmount) || parsedAmount <= 0)
			return NextResponse.json(
				{ error: "Invalid amount" },
				{ status: 400 },
			);

		if (description && description.trim().length > 200)
			return NextResponse.json(
				{ error: "Description must be 200 characters or fewer" },
				{ status: 400 },
			);

		await connectDB();

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

		const fundingSource = user.paymentSources.find(
			(s: IPaymentSource) => s.id === paymentSourceId,
		)!;

		let debtTarget: IPaymentSource | undefined;
		if (debtAction === "payment") {
			if (!debtTargetId || typeof debtTargetId !== "string") {
				return NextResponse.json(
					{ error: "debtTargetId is required to pay debt" },
					{ status: 400 },
				);
			}
			if (debtTargetId === paymentSourceId) {
				return NextResponse.json(
					{ error: "Debt payment must come from another source" },
					{ status: 400 },
				);
			}
			if (fundingSource.type === "Credit") {
				return NextResponse.json(
					{
						error: "Debt must be paid from a non-credit source",
					},
					{ status: 400 },
				);
			}
			debtTarget = user.paymentSources.find(
				(s: IPaymentSource) => s.id === debtTargetId,
			);
			if (!debtTarget || debtTarget.type !== "Credit") {
				return NextResponse.json(
					{ error: "Credit card to pay was not found" },
					{ status: 404 },
				);
			}
			if (parsedAmount > Number(debtTarget.debt || 0)) {
				return NextResponse.json(
					{ error: "Payment exceeds the current debt" },
					{ status: 400 },
				);
			}
		}

		if (debtAction === "charge" && type !== "expense") {
			return NextResponse.json(
				{ error: "debtAction charge must be an expense" },
				{ status: 400 },
			);
		}

		if (debtAction === "charge" && fundingSource.type !== "Credit") {
			return NextResponse.json(
				{ error: "debtAction charge is only valid for credit cards" },
				{ status: 400 },
			);
		}

		if (debtAction === "payment" && type !== "expense") {
			return NextResponse.json(
				{ error: "Debt payment must be an expense" },
				{ status: 400 },
			);
		}

		// Validate the transaction before touching any money, so a schema
		// violation can never leave a balance move without a ledger row.
		const draft = new Transaction({
			userId: session.userId,
			amount: mongoose.Types.Decimal128.fromString(
				parsedAmount.toFixed(2),
			),
			type,
			category: category || (type === "income" ? "income" : "other"),
			paymentSourceId,
			debtAction: debtAction || null,
			debtTargetId:
				debtAction === "payment" ? (debtTargetId as string) : null,
			description: description?.trim() || "",
			transactionDate: transactionDate
				? new Date(transactionDate)
				: new Date(),
		});
		if (isNaN(draft.transactionDate.getTime()))
			return NextResponse.json(
				{ error: "Invalid transactionDate" },
				{ status: 400 },
			);

		const validationError = draft.validateSync();
		if (validationError)
			return NextResponse.json(
				{ error: validationError.message },
				{ status: 400 },
			);

		// Credit cards are liabilities: their balance never moves. Only debt
		// changes, which keeps them out of the main total by construction.
		const beforeDebt = Number(fundingSource.debt || 0);
		const beforeBalance = Number(fundingSource.balance || 0);
		const isCardType = fundingSource.type === "Credit";
		const delta = isCardType ? 0 : sourceDelta(draft);

		fundingSource.balance = beforeBalance + delta;

		if (debtAction === "payment" && debtTarget) {
			debtTarget.debt = Math.max(
				0,
				Number(debtTarget.debt || 0) - parsedAmount,
			);
		} else if (debtAction === "charge" && type === "expense") {
			fundingSource.debt = beforeDebt + parsedAmount;
		} else if (type === "income") {
			if (isCardType) {
				fundingSource.debt = Math.max(
					0,
					beforeDebt - parsedAmount,
				);
			}
		} else if (isCardType) {
			fundingSource.debt = beforeDebt + parsedAmount;
		}

		// Persist the balance move and the ledger row together, so a failure in
		// either one can never leave money moved with no transaction recorded.
		const mongoSession = await mongoose.startSession();
		let transaction: InstanceType<typeof Transaction>;
		try {
			transaction = await mongoSession.withTransaction(async () => {
				await user.save({ session: mongoSession });
				const [created] = await Transaction.create(
					[draft.toObject()],
					{ session: mongoSession },
				);
				return created;
			});
		} finally {
			await mongoSession.endSession();
		}

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

		const emoji = emojiMap[category || "Khác"] || "📌";
		const catLabel = categoryLabels[category || "Khác"] || category;

		const masked = maskAmount(fmtAmount);
		const who = user.name;
		const title =
			debtAction === "payment"
				? `💳 ${who} đã trả nợ ${masked}`
				: type === "expense"
					? `${emoji} ${who} đã chi ${masked}`
					: `${emoji} ${who} đã nhận ${masked}`;
		const body = description?.trim()
			? `Danh mục: ${description.trim()}`
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
	} catch (err) {
		// Surface the real reason instead of an opaque 500 — a silent failure
		// here used to leave the balance moved with no transaction row.
		console.error("[transactions:create] error:", err);
		const message =
			err instanceof mongoose.Error.ValidationError
				? Object.values(err.errors)
						.map((e) => e.message)
						.join(", ")
				: err instanceof Error
					? err.message
					: "Internal server error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
