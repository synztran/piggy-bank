import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getSession } from "@/lib/auth";

export async function GET() {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	await connectDB();
	const user = await User.findById(session.userId);
	if (!user) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	return NextResponse.json({
		id: user._id.toString(),
		username: user.username,
		name: user.name,
		currentBalance: parseFloat(user.currentBalance.toString()),
	});
}
