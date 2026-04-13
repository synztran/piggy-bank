import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User, { IPaymentSource } from "@/models/User";
import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// GET /api/accounts — returns the authed user's paymentSources
export async function GET() {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	await connectDB();
	const user = await User.findById(session.userId)
		.select("paymentSources")
		.lean<{ paymentSources: IPaymentSource[] }>();

	return NextResponse.json({ accounts: user?.paymentSources ?? [] });
}

// POST /api/accounts — add a paymentSource to the user
export async function POST(req: NextRequest) {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const { name, type, last4Digits, debt, balance } = await req.json();

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

		if (
			typeof balance !== "number" &&
			(isNaN(Number(balance)) || Number(balance) < 0)
		) {
			return NextResponse.json(
				{ error: "Balance must be a non-negative number" },
				{ status: 400 },
			);
		}

		if (
			typeof debt !== "number" &&
			(isNaN(Number(debt)) || Number(debt) < 0)
		) {
			return NextResponse.json(
				{ error: "Debt must be a non-negative number" },
				{ status: 400 },
			);
		}

		await connectDB();

		const newSource: any = {
			id: new Types.ObjectId().toString(),
			name: name.trim(),
			type,
			...(last4Digits ? { last4Digits: last4Digits.trim() } : {}),
			debt: debt,
			balance: balance,
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
