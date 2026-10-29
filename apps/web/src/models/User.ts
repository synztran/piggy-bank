import mongoose, { Document, Schema, Types } from "mongoose";

// --- Payment Source subdocument ---
export interface IPaymentSource {
	id: string;
	name: string;
	type: "Debit" | "Credit" | "Cash" | "Transfer";
	last4Digits?: string;
	debt?: number;
	balance?: number;
	/** Day of month (1-31) the credit card payment is due. */
	dueDay?: number;
}

const PaymentSourceSchema = new Schema<IPaymentSource>(
	{
		id: { type: String, required: true },
		name: { type: String, required: true, trim: true, maxlength: 50 },
		type: {
			type: String,
			enum: ["Debit", "Credit", "Cash", "Transfer"],
			required: true,
		},
		last4Digits: { type: String, maxlength: 4 },
		debt: { type: Number, required: true, default: 0 },
		balance: { type: Number, required: true, default: 0 },
		dueDay: {
			type: Number,
			min: 1,
			max: 31,
			validate: {
				validator: (value: number | null | undefined) =>
					value == null || Number.isInteger(value),
				message: "dueDay must be an integer between 1 and 31",
			},
		},
	},
	{ _id: false },
);

// --- User document ---
export interface IUser extends Document {
	_id: Types.ObjectId;
	name: string;
	username: string;
	passwordHash: string;
	paymentSources: IPaymentSource[];
	createdAt: Date;
	updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
	{
		name: { type: String, required: true, trim: true, maxlength: 50 },
		username: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
			minlength: 3,
			maxlength: 30,
		},
		passwordHash: { type: String, required: true },
		paymentSources: { type: [PaymentSourceSchema], default: [] },
	},
	{
		timestamps: true,
	},
);

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
