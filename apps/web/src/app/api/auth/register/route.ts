import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, getCookieName } from "@/lib/auth";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 50;

export async function POST(req: NextRequest) {
	try {
		const limit = rateLimit(
			clientKey(req, "register"),
			5,
			60 * 60 * 1000,
		);
		if (!limit.ok) return tooManyRequests(limit.retryAfter);

		const { username, password, name } = await req.json();

		if (
			typeof username !== "string" ||
			typeof password !== "string" ||
			typeof name !== "string"
		) {
			return NextResponse.json(
				{ error: "Username, password, and name are required" },
				{ status: 400 },
			);
		}

		const normalized = username.toLowerCase().trim();
		const trimmedName = name.trim();

		if (!normalized || !password || !trimmedName) {
			return NextResponse.json(
				{ error: "Username, password, and name are required" },
				{ status: 400 },
			);
		}

		if (!USERNAME_PATTERN.test(normalized)) {
			return NextResponse.json(
				{
					error: "Username must be 3-30 characters: a-z, 0-9, dot, dash, underscore",
				},
				{ status: 400 },
			);
		}

		if (trimmedName.length > MAX_NAME_LENGTH) {
			return NextResponse.json(
				{ error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` },
				{ status: 400 },
			);
		}

		if (password.length < MIN_PASSWORD_LENGTH) {
			return NextResponse.json(
				{
					error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
				},
				{ status: 400 },
			);
		}

		if (password.length > 128) {
			return NextResponse.json(
				{ error: "Password is too long" },
				{ status: 400 },
			);
		}

		await connectDB();

		const existing = await User.findOne({ username: normalized });
		if (existing) {
			return NextResponse.json(
				{ error: "Username already taken" },
				{ status: 409 },
			);
		}

		const passwordHash = await bcrypt.hash(password, 12);
		const user = await User.create({
			username: normalized,
			passwordHash,
			name: trimmedName,
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
	} catch (err) {
		console.error("[register] error:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
