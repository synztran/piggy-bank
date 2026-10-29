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
		const { name, type, last4Digits, debt, balance, dueDay } =
			await req.json();

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

		const isCredit = type === "Credit";

		const parsedBalance =
			balance === undefined || balance === null || balance === ""
				? 0
				: Number(balance);
		if (
			!isCredit &&
			(!Number.isFinite(parsedBalance) || parsedBalance < 0)
		) {
			return NextResponse.json(
				{ error: "Balance must be a non-negative number" },
				{ status: 400 },
			);
		}

		const parsedDebt =
			debt === undefined || debt === null || debt === ""
				? 0
				: Number(debt);
		if (!Number.isFinite(parsedDebt) || parsedDebt < 0) {
			return NextResponse.json(
				{ error: "Debt must be a non-negative number" },
				{ status: 400 },
			);
		}

		const parsedDueDay =
			dueDay === undefined || dueDay === null || dueDay === ""
				? null
				: Number(dueDay);
		if (
			isCredit &&
			parsedDueDay !== null &&
			(!Number.isInteger(parsedDueDay) ||
				parsedDueDay < 1 ||
				parsedDueDay > 31)
		) {
			return NextResponse.json(
				{ error: "Due day must be an integer between 1 and 31" },
				{ status: 400 },
			);
		}

		await connectDB();

		const newSource: IPaymentSource = {
			id: new Types.ObjectId().toString(),
			name: name.trim(),
			type,
			...(last4Digits ? { last4Digits: last4Digits.trim() } : {}),
			debt: isCredit ? parsedDebt : 0,
			// Credit cards are liabilities; their balance is not part of total money.
			balance: isCredit ? 0 : parsedBalance,
			...(isCredit && parsedDueDay !== null
				? { dueDay: parsedDueDay }
				: {}),
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
