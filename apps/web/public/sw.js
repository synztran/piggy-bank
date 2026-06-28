const CACHE_NAME = "haja-pwa-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || "",
      icon: "/icon",
      badge: "/apple-icon",
      vibrate: [200, 100, 200],
      data: {
        url: data.url || "/dashboard",
        ...data.data,
      },
      actions: data.actions || [
        { action: "open", title: "Open" },
      ],
      tag: data.tag || "default",
      renotify: data.renotify || false,
      requireInteraction: true,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "HaJa Piggy Bank", options),
    );
  } catch {
    const title = event.data.text() || "HaJa Piggy Bank";
    event.waitUntil(
      self.registration.showNotification(title, {
        body: "You have a new notification",
        icon: "/icon",
        badge: "/apple-icon",
      }),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const existing = windowClients.find((c) => c.url.includes(urlToOpen));
        if (existing) {
          existing.focus();
          return;
        }
        return clients.openWindow(urlToOpen);
      }),
  );
});
