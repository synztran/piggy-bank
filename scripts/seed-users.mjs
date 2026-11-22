import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import mongoose from "../node_modules/mongoose/index.js";

// Load .env manually — try root .env first, fall back to apps/web/.env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = (() => {
	for (const p of ["../.env", "../apps/web/.env.local"]) {
		try {
			readFileSync(resolve(__dirname, p));
			return resolve(__dirname, p);
		} catch {}
	}
	return null;
})();
try {
	if (envPath) {
		const lines = readFileSync(envPath, "utf8").split("\n");
		for (const line of lines) {
			const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
			if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
		}
	}
} catch {}

const DB_NAME = "PIGY_BANK";

const rawUri =
	process.env.DATABASE_URL ||
	process.env.MONGODB_URI ||
	(() => {
		const u = process.env.MONGO_INIT_DB_ROOT_USERNAME;
		const p = process.env.MONGO_INIT_DB_ROOT_PASSWORD;
		const d = process.env.MONGO_INIT_DATABASE;
		if (u && p && d)
			return `mongodb://${u}:${p}@localhost:27017/${d}?authSource=admin`;
	})();

if (!rawUri) {
	console.error("No DATABASE_URL found in .env");
	process.exit(1);
}

// Inject the correct database name into the URI
// Handles both mongodb+srv://host/ and mongodb+srv://host/existingdb?params
const uriObj = new URL(rawUri);
uriObj.pathname = "/" + DB_NAME;
const uri = uriObj.toString();

// Inline bcrypt for password hashing
async function hashPassword(password) {
	const { createHash } = await import("crypto");
	// Use bcryptjs via dynamic import from the app's node_modules
	const { default: bcrypt } = await import(
		resolve(__dirname, "../node_modules/bcryptjs/index.js")
	);
	return bcrypt.hash(password, 12);
}

const UserSchema = new mongoose.Schema(
	{
		name: String,
		username: { type: String, unique: true, lowercase: true },
		passwordHash: String,
		currentBalance: {
			type: mongoose.Schema.Types.Decimal128,
			default: () => mongoose.Types.Decimal128.fromString("0.00"),
		},
		paymentSources: { type: Array, default: [] },
	},
	{ timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const users = [
	{ name: "Harry", username: "harry", password: "123456" },
	{ name: "Giang", username: "giang", password: "123456" },
];

await mongoose.connect(uri);
console.log("Connected to MongoDB");

for (const u of users) {
	const existing = await User.findOne({ username: u.username });
	if (existing) {
		console.log(`${u.username}: already exists (id=${existing._id})`);
		continue;
	}
	const passwordHash = await hashPassword(u.password);
	const created = await User.create({
		name: u.name,
		username: u.username,
		passwordHash,
	});
	console.log(`${u.username}: created (id=${created._id})`);
}

await mongoose.disconnect();
console.log("Done.");
