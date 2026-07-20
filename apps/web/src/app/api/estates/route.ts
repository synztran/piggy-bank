import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Estate from "@/models/Estate";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	await connectDB();
	const estates = await Estate.find({ userId: session.userId })
		.sort({ boughtAt: -1 })
		.lean();

	return NextResponse.json({ estates });
}

export async function POST(req: NextRequest) {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const { type, name, boughtAt, price, source, quantityUnit, quantity } =
			await req.json();

		if (!type || !name || !boughtAt || price == null || !source) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		const validTypes = ["gold", "stock", "keyboard"];
		if (!validTypes.includes(type))
			return NextResponse.json(
				{ error: "Invalid type" },
				{ status: 400 },
			);

		await connectDB();

		const estate = await Estate.create({
			userId: session.userId,
			type,
			name: name.trim(),
			boughtAt: new Date(boughtAt),
			price: Number(price),
			source: source.trim(),
			...(quantity != null && { quantity: Number(quantity) }),
			...(quantityUnit && { quantityUnit: quantityUnit.trim() }),
		});

		return NextResponse.json({ estate }, { status: 201 });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
