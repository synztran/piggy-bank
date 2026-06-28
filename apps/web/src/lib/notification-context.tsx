import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/lib/auth-context";

interface NotificationContextValue {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | "unsupported";
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData.split("").map((c) => c.charCodeAt(0)));
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }
    setIsSupported(true);
    setPermission(Notification.permission);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        setSwRegistration(reg);
        return reg.pushManager.getSubscription();
      })
      .then((sub) => {
        setIsSubscribed(!!sub);
      })
      .catch(console.warn);
  }, []);

  useEffect(() => {
    if (!user) {
      setIsSubscribed(false);
    }
  }, [user]);

  const subscribe = useCallback(async () => {
    if (!swRegistration || !VAPID_PUBLIC_KEY) {
      console.warn("[Notification] SW not ready or VAPID key missing");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      if (permission !== "granted") return;

      const existingSub = await swRegistration.pushManager.getSubscription();
      if (existingSub) {
        setIsSubscribed(true);
        return;
      }

      const sub = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey("p256dh")),
            auth: arrayBufferToBase64(sub.getKey("auth")),
          },
          userAgent: navigator.userAgent,
        }),
      });

      setIsSubscribed(true);
    } catch (err) {
      console.error("[Notification] subscribe failed:", err);
    }
  }, [swRegistration]);

  const unsubscribe = useCallback(async () => {
    try {
      const existingSub = await swRegistration?.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: existingSub.endpoint }),
        });
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("[Notification] unsubscribe failed:", err);
    }
  }, [swRegistration]);

  return (
    <NotificationContext.Provider
      value={{ isSupported, isSubscribed, permission, subscribe, unsubscribe }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotification must be used inside NotificationProvider");
  return ctx;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
