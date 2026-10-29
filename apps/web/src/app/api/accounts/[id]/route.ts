import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User, { IPaymentSource, IUser } from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

// GET /api/accounts/[id] — find one paymentSource by id
export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	await connectDB();

	const user = await User.findById(session.userId)
		.select("paymentSources")
		.lean<IUser>();
	const source = user?.paymentSources?.find(
		(s: IPaymentSource) => s.id === id,
	);
	if (!source)
		return NextResponse.json({ error: "Not found" }, { status: 404 });

	return NextResponse.json({ account: source });
}

// PUT /api/accounts/[id] — update a paymentSource
export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;

	try {
		const body = await req.json();
		const { name, type, last4Digits, debt, balance, dueDay } = body;

		if (name !== undefined && (!name || !name.trim())) {
			return NextResponse.json(
				{ error: "Name is required" },
				{ status: 400 },
			);
		}

		const validTypes = ["Debit", "Credit", "Cash", "Transfer"];
		if (type !== undefined && !validTypes.includes(type)) {
			return NextResponse.json(
				{ error: "Type must be Debit, Credit, Cash, or Transfer" },
				{ status: 400 },
			);
		}

		await connectDB();

		const currentUser = await User.findOne({
			_id: session.userId,
			"paymentSources.id": id,
		})
			.select("paymentSources")
			.lean<IUser>();
		const currentSource = currentUser?.paymentSources?.find(
			(source) => source.id === id,
		);

		if (!currentSource) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		const effectiveType = type ?? currentSource.type;
		const isCredit = effectiveType === "Credit";
		const update: Record<string, unknown> = {};

		if (name !== undefined)
			update["paymentSources.$.name"] = name.trim();
		if (type !== undefined) update["paymentSources.$.type"] = type;
		if (last4Digits !== undefined)
			update["paymentSources.$.last4Digits"] = last4Digits;

		if (debt !== undefined && isCredit) {
			const parsedDebt =
				debt === null || debt === "" ? 0 : Number(debt);
			if (!Number.isFinite(parsedDebt) || parsedDebt < 0) {
				return NextResponse.json(
					{ error: "Debt must be a non-negative number" },
					{ status: 400 },
				);
			}
			update["paymentSources.$.debt"] = parsedDebt;
		}

		if (balance !== undefined && !isCredit) {
			const parsedBalance =
				balance === null || balance === "" ? 0 : Number(balance);
			if (!Number.isFinite(parsedBalance) || parsedBalance < 0) {
				return NextResponse.json(
					{ error: "Balance must be a non-negative number" },
					{ status: 400 },
				);
			}
			update["paymentSources.$.balance"] = parsedBalance;
		}

		if (isCredit) {
			// A credit card is a liability, never part of the main total.
			update["paymentSources.$.balance"] = 0;

			if (dueDay !== undefined) {
				const parsedDueDay =
					dueDay === null || dueDay === "" ? null : Number(dueDay);
				if (
					parsedDueDay !== null &&
					(!Number.isInteger(parsedDueDay) ||
						parsedDueDay < 1 ||
						parsedDueDay > 31)
				) {
					return NextResponse.json(
						{
							error: "Due day must be an integer between 1 and 31",
						},
						{ status: 400 },
					);
				}
				update["paymentSources.$.dueDay"] = parsedDueDay;
			}
		} else {
			update["paymentSources.$.debt"] = 0;
			update["paymentSources.$.dueDay"] = null;
		}

		const result = await User.findOneAndUpdate(
			{ _id: session.userId, "paymentSources.id": id },
			{ $set: update },
			{ new: true },
		)
			.select("paymentSources")
			.lean<IUser>();

		if (!result)
			return NextResponse.json({ error: "Not found" }, { status: 404 });

		const updated = result.paymentSources?.find(
			(s: IPaymentSource) => s.id === id,
		);
		return NextResponse.json({ account: updated });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// DELETE /api/accounts/[id] — remove a paymentSource
export async function DELETE(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	await connectDB();

	const result = await User.findOneAndUpdate(
		{ _id: session.userId, "paymentSources.id": id },
		{ $pull: { paymentSources: { id } } },
		{ new: true },
	);

	if (!result)
		return NextResponse.json({ error: "Not found" }, { status: 404 });

	return NextResponse.json({ success: true });
}
