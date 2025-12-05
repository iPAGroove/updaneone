// pwa/service-worker.js
const CACHE_VERSION = "ursa-pwa-v3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // пока без оффлайна
});
