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
		const { name, type, last4Digits, debt, balance } = body;

		await connectDB();

		const update: Record<string, any> = {};
		if (name !== undefined) update["paymentSources.$.name"] = name.trim();
		if (type !== undefined) update["paymentSources.$.type"] = type;
		if (last4Digits !== undefined)
			update["paymentSources.$.last4Digits"] = last4Digits;
		if (debt !== undefined)
			update["paymentSources.$.debt"] =
				typeof debt === "number" ? debt : Number(debt);
		if (balance !== undefined)
			update["paymentSources.$.balance"] =
				typeof balance === "number" ? balance : Number(balance);

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
