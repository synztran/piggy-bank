import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
	"/",
	"/register",
	"/api/auth/login",
	"/api/auth/register",
];

const COOKIE_NAME = "glacier_token";

export function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;

	// Allow public paths and static files
	if (
		PUBLIC_PATHS.includes(pathname) ||
		pathname.startsWith("/_next") ||
		pathname.startsWith("/favicon")
	) {
		return NextResponse.next();
	}

	// Allow all other API routes through (protected individually by getSession)
	if (pathname.startsWith("/api/")) {
		return NextResponse.next();
	}

	// Check cookie existence only — Edge-runtime safe
	// Full JWT verification is done in each API route via getSession()
	const hasToken = !!req.cookies.get(COOKIE_NAME)?.value;

	// Redirect to login if no token cookie
	if (!hasToken) {
		const loginUrl = new URL("/", req.url);
		return NextResponse.redirect(loginUrl);
	}

	// Already authenticated — redirect away from login/register
	if (pathname === "/" || pathname === "/register") {
		return NextResponse.redirect(new URL("/dashboard", req.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
