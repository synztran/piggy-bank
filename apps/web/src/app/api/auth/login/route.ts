import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, getCookieName } from "@/lib/auth";

export async function POST(req: NextRequest) {
	try {
		const { username, password } = await req.json();

		if (!username || !password) {
			return NextResponse.json(
				{ error: "Username and password are required" },
				{ status: 400 },
			);
		}

		await connectDB();

		const user = await User.findOne({
			username: username.toLowerCase().trim(),
		});
		if (!user) {
			return NextResponse.json(
				{ error: "Invalid credentials" },
				{ status: 401 },
			);
		}

		const isValid = await bcrypt.compare(password, user.passwordHash);
		if (!isValid) {
			return NextResponse.json(
				{ error: "Invalid credentials" },
				{ status: 401 },
			);
		}

		const token = signToken({
			userId: user._id.toString(),
			username: user.username,
		});

		const res = NextResponse.json({
			success: true,
			user: {
				id: user._id.toString(),
				username: user.username,
				name: user.name,
				currentBalance: parseFloat(user.currentBalance.toString()),
			},
		});

		res.cookies.set(getCookieName(), token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 60 * 60 * 24 * 7,
			path: "/",
		});

		return res;
	} catch (err) {
		console.error("[login] error:", err);
		return NextResponse.json(
			{
				error: "Internal server error",
				detail: err instanceof Error ? err.message : String(err),
			},
			{ status: 500 },
		);
	}
}
