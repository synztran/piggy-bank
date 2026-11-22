import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// Support JWT_HEX32 (32-byte hex key) or fallback to JWT_SECRET
const JWT_SECRET = process.env.JWT_HEX32 || process.env.JWT_SECRET || "";
if (!JWT_SECRET) {
	console.warn(
		"[auth] JWT_HEX32 / JWT_SECRET is not set — tokens will not verify correctly",
	);
}
const COOKIE_NAME = "glacier_token";

export interface JwtPayload {
	userId: string;
	username: string;
}

export function signToken(payload: JwtPayload): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
	try {
		return jwt.verify(token, JWT_SECRET) as JwtPayload;
	} catch {
		return null;
	}
}

export async function getSession(): Promise<JwtPayload | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get(COOKIE_NAME)?.value;
	if (!token) return null;
	return verifyToken(token);
}

export function getCookieName(): string {
	return COOKIE_NAME;
}
