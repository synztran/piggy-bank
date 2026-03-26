import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, getCookieName } from "@/lib/auth";

export async function POST(req: NextRequest) {
	try {
		const { username, password, name } = await req.json();

		if (!username || !password || !name) {
			return NextResponse.json(
				{ error: "Username, password, and name are required" },
				{ status: 400 },
			);
		}

		if (username.length < 3 || username.length > 30) {
			return NextResponse.json(
				{ error: "Username must be 3-30 characters" },
				{ status: 400 },
			);
		}

		if (password.length < 6) {
			return NextResponse.json(
				{ error: "Password must be at least 6 characters" },
				{ status: 400 },
			);
		}

		await connectDB();

		const existing = await User.findOne({
			username: username.toLowerCase().trim(),
		});
		if (existing) {
			return NextResponse.json(
				{ error: "Username already taken" },
				{ status: 409 },
			);
		}

		const passwordHash = await bcrypt.hash(password, 12);
		const user = await User.create({
			username: username.toLowerCase().trim(),
			passwordHash,
			name: name.trim(),
			currentBalance: 0,
			paymentSources: [],
		});

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
				currentBalance: 0,
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
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
