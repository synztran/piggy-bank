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

const DB_NAME = process.env.MONGO_INIT_DATABASE || "PIGY_BANK";
const FIX = process.argv.includes("--fix");
const targetArg = process.argv.slice(2).find((a) => !a.startsWith("--"));

const rawUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
if (!rawUri) {
	console.error("No DATABASE_URL found in .env");
	process.exit(1);
}
const uriObj = new URL(rawUri);
uriObj.pathname = "/" + DB_NAME;
const uri = uriObj.toString();

const UserSchema = new mongoose.Schema(
	{
		name: String,
		username: String,
		currentBalance: mongoose.Schema.Types.Decimal128,
		paymentSources: { type: Array, default: [] },
	},
	{ strict: false },
);

const TransactionSchema = new mongoose.Schema(
	{
		userId: mongoose.Schema.Types.ObjectId,
		amount: mongoose.Schema.Types.Decimal128,
		type: String,
		category: String,
		paymentSourceId: String,
		description: String,
		transactionDate: Date,
		isRemove: Boolean,
		debtAction: String,
		createdAt: Date,
	},
	{ strict: false },
);

const User = mongoose.models.ReconcileUser || mongoose.model("ReconcileUser", UserSchema, "users");
const Transaction =
	mongoose.models.ReconcileTx ||
	mongoose.model("ReconcileTx", TransactionSchema, "transactions");

const vnd = (n) =>
	new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency: "VND",
		maximumFractionDigits: 0,
	}).format(Math.round(n));

const dec = (d) => (d == null ? 0 : parseFloat(String(d)));
const sign = (n) => (n > 0 ? "+" : n < 0 ? "-" : " ");
const signed = (n) => `${sign(n)}${vnd(Math.abs(n))}`;

// Mirrors sourceDelta() in apps/web/src/models/Transaction.ts
function sourceDelta(t) {
	const amount = dec(t.amount);
	if (t.debtAction === "charge" && t.type === "expense") return 0;
	if (t.debtAction === "payment") return -amount;
	return t.type === "income" ? amount : -amount;
}

await mongoose.connect(uri);
console.log(`Connected to ${DB_NAME}${FIX ? "  (--fix: WRITES ENABLED)" : "  (dry run)"}\n`);

const users = targetArg
	? await User.find({ username: targetArg }).lean()
	: await User.find({}).lean();

if (!users.length) {
	console.error(`No user matched "${targetArg}"`);
	await mongoose.disconnect();
	process.exit(1);
}

let legacyFields = 0;

for (const user of users) {
	const sources = user.paymentSources || [];
	const tx = await Transaction.find({ userId: user._id }).lean();
	const live = tx.filter((t) => t.isRemove !== true);

	// Recompute each source balance from its own ledger
	const expected = new Map(sources.map((s) => [s.id, 0]));
	let unassigned = 0;
	let unassignedCount = 0;
	for (const t of live) {
		if (!t.paymentSourceId || !expected.has(t.paymentSourceId)) {
			unassigned += sourceDelta(t);
			unassignedCount++;
			continue;
		}
		expected.set(t.paymentSourceId, expected.get(t.paymentSourceId) + sourceDelta(t));
	}

	const storedTotal = sources.reduce((s, p) => s + (Number(p.balance) || 0), 0);
	const ledgerTotal = [...expected.values()].reduce((a, b) => a + b, 0);
	const hasLegacy = user.currentBalance != null;
	if (hasLegacy) legacyFields++;

	console.log("=".repeat(74));
	console.log(`${user.name} (${user.username})  _id=${user._id}`);
	console.log("=".repeat(74));
	console.log(`  total held (sum of sources)   ${vnd(storedTotal)}`);
	console.log(`  legacy users.currentBalance    ${
		hasLegacy ? vnd(dec(user.currentBalance)) : "(already removed)"
	}`);
	console.log("");

	console.log("  per-source: stored vs recomputed-from-ledger");
	let drifted = 0;
	for (const s of sources) {
		const exp = expected.get(s.id) || 0;
		const stored = Number(s.balance) || 0;
		const diff = stored - exp;
		if (Math.abs(diff) > 0.5) drifted++;
		console.log(
			`    ${(s.name || "?").padEnd(22)}${(s.type || "?").padEnd(9)}` +
				`stored ${vnd(stored).padStart(16)}  ledger ${vnd(exp).padStart(16)}` +
				(diff === 0 ? "   ok" : `   drift ${signed(diff)}`),
		);
	}
	if (!drifted) console.log("    all sources reconcile exactly");
	console.log("");

	if (unassignedCount) {
		console.log(
			`  ${unassignedCount} live transactions carry no paymentSourceId`,
		);
		console.log(`  and therefore move no source balance: ${signed(unassigned)}`);
		console.log("  (legacy rows from before sources existed — left untouched)");
		console.log("");
	}

	const phantom = live.filter(
		(t) => t.paymentSourceId === "balance_adjustment",
	);
	if (phantom.length) {
		console.log(
			`  ${phantom.length} legacy balance_adjustment rows remain in history:`,
		);
		for (const t of phantom) {
			console.log(
				`    ${new Date(t.createdAt).toISOString().slice(0, 10)}  ` +
					`${signed(sourceDelta(t)).padStart(16)}  "${t.description || ""}"`,
			);
		}
		console.log(
			"  These no longer touch any balance; they are inert history.",
		);
		console.log("");
	}

	console.log(
		`  ledger total ${vnd(ledgerTotal)} vs stored ${vnd(storedTotal)} ` +
			`(${signed(storedTotal - ledgerTotal)})`,
	);
	console.log("");
}

console.log("=".repeat(74));
console.log(`legacy users.currentBalance fields present: ${legacyFields}`);
if (legacyFields > 0) {
	console.log("");
	console.log(
		"  These are the old duplicate counters. Nothing reads them any more —",
	);
	console.log("  totals are derived from the payment sources. Remove them with:");
	console.log("");
	console.log("    node scripts/reconcile-balance.mjs --fix");
	if (!FIX) {
		console.log("");
		console.log("  (dry run — nothing was written)");
	}
}

if (FIX) {
	if (legacyFields === 0) {
		console.log("\nNothing to do — no legacy currentBalance fields found.");
	} else {
		const res = await User.updateMany(
			{ currentBalance: { $exists: true } },
			{ $unset: { currentBalance: "" } },
		);
		console.log(
			`\nRemoved currentBalance from ${res.modifiedCount} user document(s).`,
		);
		const check = await User.find({ currentBalance: { $exists: true } })
			.lean();
		console.log(`Remaining legacy fields: ${check.length}`);
	}
}

await mongoose.disconnect();
