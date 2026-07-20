import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Estate from "@/models/Estate";
import { NextRequest, NextResponse } from "next/server";

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
		const update: Record<string, unknown> = {};

		if (body.type !== undefined) update.type = body.type;
		if (body.name !== undefined) update.name = body.name.trim();
		if (body.boughtAt !== undefined) update.boughtAt = new Date(body.boughtAt);
		if (body.price !== undefined) update.price = Number(body.price);
		if (body.currentPrice !== undefined)
			update.currentPrice = Number(body.currentPrice);
		if (body.source !== undefined) update.source = body.source.trim();
		if (body.quantityUnit !== undefined)
			update.quantityUnit = body.quantityUnit.trim();
		if (body.quantity !== undefined) update.quantity = Number(body.quantity);

		await connectDB();

		const estate = await Estate.findOneAndUpdate(
			{ _id: id, userId: session.userId },
			{ $set: update },
			{ new: true },
		);

		if (!estate)
			return NextResponse.json({ error: "Not found" }, { status: 404 });

		return NextResponse.json({ estate });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;

	await connectDB();

	const estate = await Estate.findOneAndDelete({
		_id: id,
		userId: session.userId,
	});

	if (!estate)
		return NextResponse.json({ error: "Not found" }, { status: 404 });

	return NextResponse.json({ success: true });
}
