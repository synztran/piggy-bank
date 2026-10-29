import type { NextConfig } from "next";

// Static assets used by the app are all local, so no remote image hosts are
// allowed. Add specific hosts here if remote images are ever needed.
const securityHeaders = [
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=(), payment=()",
	},
	{
		key: "Strict-Transport-Security",
		value: "max-age=63072000; includeSubDomains; preload",
	},
	{
		// Report-only until the app can ship a nonce-based policy, so inline
		// hydration scripts keep working without silently blocking them.
		key: "Content-Security-Policy-Report-Only",
		value: [
			"default-src 'self'",
			"base-uri 'self'",
			"object-src 'none'",
			"frame-ancestors 'none'",
			"img-src 'self' data: blob:",
			"font-src 'self' data:",
			"style-src 'self' 'unsafe-inline'",
			"script-src 'self' 'unsafe-inline'",
			"connect-src 'self'",
			"form-action 'self'",
		].join("; "),
	},
];

const nextConfig: NextConfig = {
	poweredByHeader: false,
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: securityHeaders,
			},
		];
	},
	images: {
		remotePatterns: [],
	},
};

export default nextConfig;
