import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "glacier_token";
const LOGIN_PATH = "/";
const DASHBOARD_PATH = "/dashboard";
const JWT_SECRET = process.env.JWT_HEX32 || process.env.JWT_SECRET || "";

const PUBLIC_PAGES = new Set(["/", "/register"]);
const PUBLIC_APIS = new Set([
	"/api/auth/login",
	"/api/auth/register",
	"/api/auth/logout",
]);

const STATIC_FILE = /\.(?:png|jpe?g|gif|webp|svg|ico|css|js|json|txt|xml|webmanifest|woff2?|ttf|otf|map)$/i;

interface TokenPayload {
	userId?: string;
	username?: string;
	exp?: number;
	iat?: number;
}

function isStaticPath(pathname: string): boolean {
	return (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/__nextjs") ||
		pathname === "/favicon.ico" ||
		pathname === "/sw.js" ||
		pathname === "/manifest.json" ||
		pathname.startsWith("/icons/") ||
		STATIC_FILE.test(pathname)
	);
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
	const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
	const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

function decodeJson(value: string): unknown {
	return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value)));
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
	if (!JWT_SECRET) return null;

	const parts = token.split(".");
	if (parts.length !== 3) return null;

	const [headerPart, payloadPart, signaturePart] = parts;

	try {
		const header = decodeJson(headerPart) as { alg?: string };
		if (header.alg !== "HS256") return null;

		const key = await crypto.subtle.importKey(
			"raw",
			new TextEncoder().encode(JWT_SECRET),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["verify"],
		);

		const valid = await crypto.subtle.verify(
			"HMAC",
			key,
			base64UrlToBytes(signaturePart),
			new TextEncoder().encode(`${headerPart}.${payloadPart}`),
		);
		if (!valid) return null;

		const payload = decodeJson(payloadPart) as TokenPayload;
		if (!payload.userId) return null;
		if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
			return null;
		}

		return payload;
	} catch {
		return null;
	}
}

function clearAuthCookie(response: NextResponse): void {
	response.cookies.set(COOKIE_NAME, "", {
		path: "/",
		maxAge: 0,
		httpOnly: true,
		sameSite: "strict",
		secure: process.env.NODE_ENV === "production",
	});
}

export async function middleware(req: NextRequest) {
	const { pathname, search } = req.nextUrl;

	if (isStaticPath(pathname)) {
		return NextResponse.next();
	}

	const token = req.cookies.get(COOKIE_NAME)?.value;
	const session = token ? await verifyToken(token) : null;

	// Same-site cookie already blocks most CSRF; this rejects cross-origin
	// state changes that manage to send a stale cookie anyway.
	if (
		pathname.startsWith("/api/") &&
		!["GET", "HEAD", "OPTIONS"].includes(req.method)
	) {
		const origin = req.headers.get("origin");
		if (origin) {
			let originHost: string | null = null;
			try {
				originHost = new URL(origin).host;
			} catch {
				originHost = null;
			}
			if (!originHost || originHost !== req.nextUrl.host) {
				return NextResponse.json(
					{ error: "Cross-origin request blocked" },
					{ status: 403 },
				);
			}
		}
	}

	// Public pages are only for logged-out visitors.
	if (PUBLIC_PAGES.has(pathname)) {
		if (session) {
			return NextResponse.redirect(new URL(DASHBOARD_PATH, req.url));
		}
		return NextResponse.next();
	}

	if (PUBLIC_APIS.has(pathname)) {
		return NextResponse.next();
	}

	// Invalid or expired session: clear it and keep the user out.
	if (!session) {
		if (pathname.startsWith("/api/")) {
			const response = NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
			if (token) clearAuthCookie(response);
			return response;
		}

		const loginUrl = new URL(LOGIN_PATH, req.url);
		const redirectTo = `${pathname}${search}`;
		if (redirectTo !== LOGIN_PATH) {
			loginUrl.searchParams.set("next", redirectTo);
		}

		const response = NextResponse.redirect(loginUrl);
		if (token) clearAuthCookie(response);
		return response;
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
