// Регистрируем Service Worker (дублирует регистрацию, но не страшно)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("pwa/sw.js")
    .then(() => console.log("🛠️ SW зарегистрирован с home.html"))
    .catch(err => console.warn("SW error:", err));
}
