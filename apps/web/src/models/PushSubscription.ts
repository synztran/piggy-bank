import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPushSubscription extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subscription: {
      endpoint: { type: String, required: true },
      keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
      },
    },
    userAgent: { type: String },
  },
  { timestamps: true },
);

PushSubscriptionSchema.index({ userId: 1, "subscription.endpoint": 1 }, { unique: true });

const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);

export default PushSubscription;
