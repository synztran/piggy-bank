import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "@/lib/mongodb";
import User, { IUser } from "@/models/User";
import { getSession } from "@/lib/auth";

// GET /api/accounts — returns the authed user's paymentSources
export async function GET() {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	await connectDB();
	const user = await User.findById(session.userId)
		.select("paymentSources")
		.lean<IUser>();

	return NextResponse.json({ accounts: user?.paymentSources ?? [] });
}

// POST /api/accounts — add a paymentSource to the user
export async function POST(req: NextRequest) {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const { name, type, last4Digits } = await req.json();

		if (!name || !type)
			return NextResponse.json(
				{ error: "Name and type are required" },
				{ status: 400 },
			);

		const validTypes = ["Debit", "Credit", "Cash", "Transfer"];
		if (!validTypes.includes(type))
			return NextResponse.json(
				{ error: "Type must be Debit, Credit, Cash, or Transfer" },
				{ status: 400 },
			);

		await connectDB();

		const newSource = {
			id: new Types.ObjectId().toString(),
			name: name.trim(),
			type,
			...(last4Digits ? { last4Digits: last4Digits.trim() } : {}),
		};

		await User.findByIdAndUpdate(session.userId, {
			$push: { paymentSources: newSource },
		});

		return NextResponse.json({ account: newSource }, { status: 201 });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
