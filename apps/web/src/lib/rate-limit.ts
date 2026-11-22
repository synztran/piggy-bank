/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * This is intentionally dependency-free and per-process. It is enough for a
 * single Node instance; behind multiple instances or serverless it should be
 * replaced with a shared store (Redis/Upstash).
 */

interface Bucket {
	count: number;
	resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

function purgeExpired(now: number): void {
	for (const [key, bucket] of buckets) {
		if (bucket.resetAt <= now) buckets.delete(key);
	}
}

export interface RateLimitResult {
	ok: boolean;
	/** Seconds until the caller may retry. 0 when the call is allowed. */
	retryAfter: number;
}

export function rateLimit(
	key: string,
	limit: number,
	windowMs: number,
): RateLimitResult {
	const now = Date.now();

	if (buckets.size > MAX_BUCKETS) purgeExpired(now);

	const bucket = buckets.get(key);
	if (!bucket || bucket.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return { ok: true, retryAfter: 0 };
	}

	bucket.count += 1;

	if (bucket.count > limit) {
		return {
			ok: false,
			retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
		};
	}

	return { ok: true, retryAfter: 0 };
}

/** Best-effort client identity for rate limiting (proxy-aware). */
export function clientKey(req: Request, scope: string): string {
	const forwarded = req.headers.get("x-forwarded-for") ?? "";
	const ip =
		forwarded.split(",")[0]?.trim() ||
		req.headers.get("x-real-ip") ||
		"unknown";
	return `${scope}:${ip}`;
}

export function tooManyRequests(retryAfter: number): Response {
	return Response.json(
		{ error: "Too many requests. Please try again later." },
		{
			status: 429,
			headers: { "Retry-After": String(retryAfter) },
		},
	);
}
