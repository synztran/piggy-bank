import mongoose, { Schema, Document, Types } from "mongoose";

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
	paymentSourceId: string;
	description: string;
	transactionDate: Date;
	isRemove?: boolean;
	deletedBy?: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
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
		paymentSourceId: { type: String, required: true },
		description: {
			type: String,
			required: false,
			trim: true,
			maxlength: 100,
			default: "",
		},
		transactionDate: { type: Date, required: true, index: true },
		isRemove: { type: Boolean, default: false, index: true },
		deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
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
