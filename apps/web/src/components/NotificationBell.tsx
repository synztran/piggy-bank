"use client";

import { Bell, BellOff } from "lucide-react";
import { useNotification } from "@/lib/notification-context";
import { useState } from "react";

export default function NotificationBell() {
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } =
    useNotification();
  const [loading, setLoading] = useState(false);

  if (!isSupported || permission === "unsupported") return null;

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } finally {
      setLoading(false);
    }
  };

  const isActive = isSubscribed && permission === "granted";

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[rgba(125,211,252,0.1)] transition-colors active:scale-95 disabled:opacity-50"
      aria-label={isActive ? "Disable notifications" : "Enable notifications"}
      title={
        isActive
          ? "Notifications enabled"
          : permission === "denied"
            ? "Notifications blocked in settings"
            : "Enable notifications"
      }
    >
      {isActive ? (
        <Bell size={18} className="text-glacier-primary" />
      ) : (
        <BellOff size={18} className="text-glacier-on-surface-variant" />
      )}
    </button>
  );
}
