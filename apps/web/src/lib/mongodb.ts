import mongoose from "mongoose";

// Use MONGO_INIT_DATABASE env var if set, otherwise default to PIGY_BANK
const DB_NAME = process.env.MONGO_INIT_DATABASE || "PIGY_BANK";

function resolveUri(): string | undefined {
	const raw =
		process.env.DATABASE_URL ||
		process.env.MONGODB_URI ||
		(() => {
			const user = process.env.MONGO_INIT_DB_ROOT_USERNAME;
			const pass = process.env.MONGO_INIT_DB_ROOT_PASSWORD;
			const db = process.env.MONGO_INIT_DATABASE;
			if (user && pass && db) {
				return `mongodb://${user}:${pass}@localhost:27017/${db}?authSource=admin`;
			}
			return undefined;
		})();

	if (!raw) return undefined;

	// Inject DB_NAME if the URI has no database path segment
	try {
		const url = new URL(raw);
		if (!url.pathname || url.pathname === "/") {
			url.pathname = "/" + DB_NAME;
			return url.toString();
		}
	} catch {
		// not a parseable URL, return as-is
	}
	return raw;
}

const MONGODB_URI = resolveUri();

interface MongooseCache {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
}

declare global {
	// eslint-disable-next-line no-var
	var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

async function connectDB(): Promise<typeof mongoose> {
	if (cached.conn) return cached.conn;

	if (!MONGODB_URI) {
		throw new Error(
			"Please define DATABASE_URL or MONGODB_URI in your environment",
		);
	}

	if (!cached.promise) {
		cached.promise = mongoose
			.connect(MONGODB_URI, {
				bufferCommands: false,
				serverSelectionTimeoutMS: 5000,
				connectTimeoutMS: 10000,
			})
			.then((m) => m);
	}

	cached.conn = await cached.promise;
	return cached.conn;
}

export default connectDB;
