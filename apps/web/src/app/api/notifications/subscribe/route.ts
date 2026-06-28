import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { endpoint, keys, userAgent } = await req.json();

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Invalid subscription object" },
        { status: 400 },
      );
    }

    await connectDB();

    await PushSubscription.findOneAndUpdate(
      { userId: session.userId, "subscription.endpoint": endpoint },
      {
        userId: session.userId,
        subscription: { endpoint, keys },
        userAgent: userAgent || null,
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
