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
		const { type, name, boughtAt, price, currentPrice, source, quantityUnit, quantity } =
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

		if (typeof name !== "string" || !name.trim() || name.trim().length > 100)
			return NextResponse.json(
				{ error: "Name must be 1-100 characters" },
				{ status: 400 },
			);

		if (typeof source !== "string" || !source.trim() || source.trim().length > 100)
			return NextResponse.json(
				{ error: "Source must be 1-100 characters" },
				{ status: 400 },
			);

		const boughtAtDate = new Date(boughtAt);
		if (Number.isNaN(boughtAtDate.getTime()))
			return NextResponse.json(
				{ error: "Invalid boughtAt" },
				{ status: 400 },
			);

		const parsedPrice = Number(price);
		if (!Number.isFinite(parsedPrice) || parsedPrice < 0)
			return NextResponse.json(
				{ error: "Invalid price" },
				{ status: 400 },
			);

		const parsedCurrentPrice =
			currentPrice != null ? Number(currentPrice) : undefined;
		if (
			parsedCurrentPrice !== undefined &&
			(!Number.isFinite(parsedCurrentPrice) || parsedCurrentPrice < 0)
		)
			return NextResponse.json(
				{ error: "Invalid currentPrice" },
				{ status: 400 },
			);

		const parsedQuantity = quantity != null ? Number(quantity) : undefined;
		if (
			parsedQuantity !== undefined &&
			(!Number.isFinite(parsedQuantity) || parsedQuantity < 0)
		)
			return NextResponse.json(
				{ error: "Invalid quantity" },
				{ status: 400 },
			);

		await connectDB();

		const estate = await Estate.create({
			userId: session.userId,
			type,
			name: name.trim(),
			boughtAt: boughtAtDate,
			price: parsedPrice,
			...(parsedCurrentPrice !== undefined && {
				currentPrice: parsedCurrentPrice,
			}),
			source: source.trim(),
			...(parsedQuantity !== undefined && {
				quantity: parsedQuantity,
			}),
			...(quantityUnit && { quantityUnit: String(quantityUnit).trim().slice(0, 30) }),
		});

		return NextResponse.json({ estate }, { status: 201 });
	} catch (err) {
		console.error("[estates:create] error:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
