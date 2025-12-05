const CACHE_VERSION = "v2"; // поменяли версию!

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());
