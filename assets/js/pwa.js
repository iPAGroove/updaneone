// Регистрируем Service Worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/pwa/sw.js")
        .then(() => console.log("🛠️ SW зарегистрирован"))
        .catch(err => console.warn("SW error:", err));
}

// Проверяем, что запущено как PWA
function isPwa() {
    return window.matchMedia("(display-mode: standalone)").matches ||
           window.navigator.standalone;
}

if (!isPwa()) {
    console.log("⚠️ Не PWA → на инструкцию");
    window.location.href = "/index.html";
}
