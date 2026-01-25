importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  messagingSenderId: "39749517184",
  appId: "1:39749517184:web:XXXXXXXX"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.getToken({
  vapidKey: 'YOUR_PUBLIC_VAPID_KEY'
}).then((token) => {
  console.log('FCM token:', token);
});

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  projectId: "your-project-id",
  messagingSenderId: "39749517184",
  appId: "1:39749517184:web:XXXXXXXX"
});

const messaging = firebase.messaging();

// Background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Background message', payload);

  const notificationTitle = payload.data?.alert || 'Notification';
  const notificationOptions = {
    body: payload.data?.body,
    icon: payload.data?.icon,
    data: {
      click_action: payload.data?.click_action || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handling
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const target = event.notification.data?.click_action || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === target && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(target);
      })
  );
});
