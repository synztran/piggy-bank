import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Estate from "@/models/Estate";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

const VALID_TYPES = ["gold", "stock", "keyboard"];

function badRequest(message: string) {
	return NextResponse.json({ error: message }, { status: 400 });
}

function validNumber(value: unknown): boolean {
	return typeof value === "number" ? Number.isFinite(value) : Number.isFinite(Number(value));
}

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getSession();
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	try {
		const body = await req.json();
		const update: Record<string, unknown> = {};

		if (body.type !== undefined) {
			if (!VALID_TYPES.includes(body.type))
				return badRequest("Invalid type");
			update.type = body.type;
		}
		if (body.name !== undefined) {
			if (typeof body.name !== "string" || !body.name.trim())
				return badRequest("Invalid name");
			update.name = body.name.trim().slice(0, 100);
		}
		if (body.boughtAt !== undefined) {
			const boughtAt = new Date(body.boughtAt);
			if (Number.isNaN(boughtAt.getTime()))
				return badRequest("Invalid boughtAt");
			update.boughtAt = boughtAt;
		}
		if (body.price !== undefined) {
			if (!validNumber(body.price) || Number(body.price) < 0)
				return badRequest("Invalid price");
			update.price = Number(body.price);
		}
		if (body.currentPrice !== undefined) {
			if (!validNumber(body.currentPrice) || Number(body.currentPrice) < 0)
				return badRequest("Invalid currentPrice");
			update.currentPrice = Number(body.currentPrice);
		}
		if (body.source !== undefined) {
			if (typeof body.source !== "string" || !body.source.trim())
				return badRequest("Invalid source");
			update.source = body.source.trim().slice(0, 100);
		}
		if (body.quantityUnit !== undefined) {
			if (typeof body.quantityUnit !== "string")
				return badRequest("Invalid quantityUnit");
			update.quantityUnit = body.quantityUnit.trim().slice(0, 30);
		}
		if (body.quantity !== undefined) {
			if (!validNumber(body.quantity) || Number(body.quantity) < 0)
				return badRequest("Invalid quantity");
			update.quantity = Number(body.quantity);
		}

		await connectDB();

		const estate = await Estate.findOneAndUpdate(
			{ _id: id, userId: session.userId },
			{ $set: update },
			{ new: true, runValidators: true },
		);

		if (!estate)
			return NextResponse.json({ error: "Not found" }, { status: 404 });

		return NextResponse.json({ estate });
	} catch (err) {
		console.error("[estates:update] error:", err);
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

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	await connectDB();

	const estate = await Estate.findOneAndDelete({
		_id: id,
		userId: session.userId,
	});

	if (!estate)
		return NextResponse.json({ error: "Not found" }, { status: 404 });

	return NextResponse.json({ success: true });
}
