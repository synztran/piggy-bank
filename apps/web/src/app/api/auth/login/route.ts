import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, getCookieName } from "@/lib/auth";
import { totalBalance } from "@/lib/balance";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
	try {
		const { username, password } = await req.json();

		if (typeof username !== "string" || typeof password !== "string") {
			return NextResponse.json(
				{ error: "Username and password are required" },
				{ status: 400 },
			);
		}

		if (!username.trim() || !password) {
			return NextResponse.json(
				{ error: "Username and password are required" },
				{ status: 400 },
			);
		}

		const normalized = username.toLowerCase().trim();

		// Brute-force protection: per IP and per targeted account.
		const ipLimit = rateLimit(clientKey(req, "login"), 10, 5 * 60 * 1000);
		if (!ipLimit.ok) return tooManyRequests(ipLimit.retryAfter);

		const accountLimit = rateLimit(
			`login-user:${normalized}`,
			8,
			5 * 60 * 1000,
		);
		if (!accountLimit.ok) return tooManyRequests(accountLimit.retryAfter);

		await connectDB();

		const user = await User.findOne({ username: normalized }).select(
			"+passwordHash",
		);
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
				currentBalance: totalBalance(user.paymentSources),
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
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
