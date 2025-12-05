// sw.js
// Минимальный Service Worker, пока без логики кэширования.
// Он необходим, чтобы браузер распознал приложение как PWA.

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activated');
});

// Заглушка для fetch, чтобы избежать ошибок
self.addEventListener('fetch', (event) => {
    // В дальнейшем здесь будет логика кэширования
    // event.respondWith(fetch(event.request));
});
