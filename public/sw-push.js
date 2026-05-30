/**
 * Confetti Push Notification Service Worker
 * Handles incoming push events and notification click actions.
 */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Confetti", body: event.data.text() };
  }

  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/badge-72.png",
    data: { url: data.url || "/" },
    vibrate: [100, 50, 100],
    actions: [
      { action: "open", title: "View" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if available
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    }),
  );
});

// Handle subscription change (browser may rotate keys)
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options).then((newSub) => {
      // Post new subscription to app for re-registration
      return fetch("/api/push-resubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSub.toJSON()),
      });
    }),
  );
});
