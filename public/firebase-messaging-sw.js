// public/firebase-messaging-sw.js
// Service Worker xử lý push notification khi app đóng (background)
// iOS 16.4+ PWA yêu cầu file này tại root public/

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Nhận cấu hình an toàn qua URL search parameters khi đăng ký Service Worker
const params = new URLSearchParams(self.location.search);
const apiKey = params.get('apiKey');
const authDomain = params.get('authDomain');
const projectId = params.get('projectId');
const storageBucket = params.get('storageBucket');
const messagingSenderId = params.get('messagingSenderId');
const appId = params.get('appId');

if (apiKey && projectId) {
  firebase.initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  });

  const messaging = firebase.messaging();

  // Nhận thông báo khi app đang ở background / đóng
  messaging.onBackgroundMessage(function (payload) {
    const { title, body, url } = payload.data || {};

    self.registration.showNotification(title || 'ZoldyVocab', {
      body: body || 'Đến giờ ôn tập từ vựng rồi!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'zoldy-vocab',
      data: { url: url || '/review' },
      requireInteraction: false,
    });
  });
}

// Khi người dùng bấm vào thông báo → mở app
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/review';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Nếu app đang mở → focus vào đó
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Nếu app chưa mở → mở window mới
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
