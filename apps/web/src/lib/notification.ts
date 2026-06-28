import webpush from "web-push";
import connectDB from "./mongodb";
import PushSubscription from "@/models/PushSubscription";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:noobassembly@gmail.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[notification] VAPID keys not configured, skipping push");
    return;
  }

  try {
    await connectDB();

    const subscriptions = await PushSubscription.find({ userId });

    const payload = JSON.stringify({
      title,
      body,
      url: "/dashboard",
      data,
      tag: "transaction",
      renotify: false,
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.subscription.endpoint,
              keys: {
                p256dh: sub.subscription.keys.p256dh,
                auth: sub.subscription.keys.auth,
              },
            },
            payload,
          );
        } catch (err: unknown) {
          if (err && typeof err === "object" && "statusCode" in err) {
            const statusCode = (err as { statusCode: number }).statusCode;
            if (statusCode === 410 || statusCode === 404) {
              await PushSubscription.findByIdAndDelete(sub._id);
            }
          }
          console.warn("[notification] send failed for", sub._id, err);
        }
      }),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      console.warn(`[notification] ${failed}/${subscriptions.length} sends failed`);
    }
  } catch (err) {
    console.error("[notification] error sending push:", err);
  }
}
