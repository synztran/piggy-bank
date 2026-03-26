import mongoose, { Schema, Document, Types } from "mongoose";

export type AccountType = "bank" | "credit_card" | "cash";
export type AccountStatus = "active" | "inactive";

export interface IAccount extends Document {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	name: string;
	type: AccountType;
	balance: number;
	status: AccountStatus;
	lastFour?: string;
	expiry?: string;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 50,
		},
		type: {
			type: String,
			enum: ["bank", "credit_card", "cash"],
			required: true,
			default: "bank",
		},
		balance: {
			type: Number,
			required: true,
			default: 0,
		},
		status: {
			type: String,
			enum: ["active", "inactive"],
			default: "active",
		},
		lastFour: {
			type: String,
			maxlength: 4,
		},
		expiry: {
			type: String,
			maxlength: 5,
		},
		notes: {
			type: String,
			maxlength: 200,
		},
	},
	{ timestamps: true },
);

const Account =
	mongoose.models.Account ||
	mongoose.model<IAccount>("Account", AccountSchema);

export default Account;
