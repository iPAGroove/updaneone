// Регистрируем Service Worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/pwa/sw.js")
        .then(() => console.log("🛠️ SW зарегистрирован"))
        .catch(err => console.warn("SW error:", err));
}
