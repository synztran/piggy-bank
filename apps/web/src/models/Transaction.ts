import mongoose, { Document, Schema, Types } from "mongoose";

export type TransactionType = "expense" | "income";

export type TransactionCategory =
	| "food"
	| "travel"
	| "utilities"
	| "retail"
	| "dining"
	| "subscriptions"
	| "income"
	| "other";

export interface ITransaction extends Document {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	amount: Types.Decimal128;
	type: TransactionType;
	category: TransactionCategory;
	paymentSourceId?: string;
	description: string;
	transactionDate: Date;
	isRemove?: boolean;
	deletedBy?: Types.ObjectId;
	debtAction?: "charge" | "payment";
	/** Credit card paymentSource id that a debt payment pays down. */
	debtTargetId?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Signed effect of this transaction on its payment source balance.
 * `createDelta` is applied on insert; `-createDelta` on soft-delete, so the
 * two stay symmetric. Shared by the POST and DELETE routes.
 */
export function sourceDelta(tx: {
	type: TransactionType;
	amount: Types.Decimal128;
	debtAction?: "charge" | "payment";
}): number {
	const amount = parseFloat(tx.amount.toString());

	// A charge puts money on the card instead of moving the source balance.
	if (tx.debtAction === "charge" && tx.type === "expense") return 0;

	// Paying down debt always leaves the source balance.
	if (tx.debtAction === "payment") return -amount;

	return tx.type === "income" ? amount : -amount;
}

const TransactionSchema = new Schema<ITransaction>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		amount: { type: Schema.Types.Decimal128, required: true },
		type: {
			type: String,
			enum: ["expense", "income"],
			required: true,
		},
		category: {
			type: String,
			enum: [
				"food",
				"travel",
				"utilities",
				"retail",
				"dining",
				"subscriptions",
				"income",
				"other",
			],
			default: "other",
		},
		paymentSourceId: { type: String, required: false, default: null },
		description: {
			type: String,
			required: false,
			trim: true,
			maxlength: 200,
			default: "",
		},
		transactionDate: { type: Date, required: true, index: true },
		isRemove: { type: Boolean, default: false, index: true },
		deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
		debtAction: {
			type: String,
			enum: ["charge", "payment"],
			required: false,
			default: null,
		},
		debtTargetId: {
			type: String,
			required: false,
			default: null,
		},
	},
	{
		timestamps: true,
		toJSON: {
			transform(_doc, ret: Record<string, unknown>) {
				if (ret.amount != null) {
					ret.amount = parseFloat(String(ret.amount));
				}
				return ret;
			},
		},
	},
);

// Delete cached model so schema changes (e.g. new fields) are always picked up
delete mongoose.models["Transaction"];
const Transaction = mongoose.model<ITransaction>(
	"Transaction",
	TransactionSchema,
);

export default Transaction;
