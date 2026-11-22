import mongoose, { Document, Schema, Types } from "mongoose";

export type EstateType = "gold" | "stock" | "keyboard";

export interface IEstate extends Document {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	type: EstateType;
	name: string;
	boughtAt: Date;
	price: number;
	currentPrice?: number;
	source: string;
	quantityUnit?: string;
	quantity?: number;
	createdAt: Date;
	updatedAt: Date;
}

const EstateSchema = new Schema<IEstate>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		type: {
			type: String,
			enum: ["gold", "stock", "keyboard"],
			required: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 100,
		},
		boughtAt: {
			type: Date,
			required: true,
		},
		price: {
			type: Number,
			required: true,
			min: 0,
		},
		currentPrice: {
			type: Number,
			min: 0,
		},
		source: {
			type: String,
			required: true,
			trim: true,
			maxlength: 100,
		},
		quantityUnit: {
			type: String,
			trim: true,
			maxlength: 30,
		},
		quantity: {
			type: Number,
			min: 0,
		},
	},
	{ timestamps: true },
);

const Estate =
	mongoose.models.Estate ||
	mongoose.model<IEstate>("Estate", EstateSchema);

export default Estate;
