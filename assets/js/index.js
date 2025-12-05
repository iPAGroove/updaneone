// Проверка PWA-режима
function isPwa() {
  return window.matchMedia("(display-mode: standalone)").matches ||
         window.navigator.standalone;
}

// Регистрация Service Worker (чтобы A2HS вообще видел PWA)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/pwa/sw.js")
    .then(() => console.log("🛠️ SW зарегистрирован с index.html"))
    .catch(err => console.warn("SW error:", err));
}

// Если уже запущено как PWA → сразу в home.html
if (isPwa()) {
  console.log("✔️ Уже PWA → редирект на home.html");
  window.location.href = "/home.html";
}

// Кнопка "Проверить режим"
const btn = document.getElementById("checkPwaBtn");
if (btn) {
  btn.addEventListener("click", (e) => {
    e.preventDefault();

    if (isPwa()) {
      window.location.href = "/home.html";
    } else {
      alert("⚠️ Сейчас обычный режим браузера. Добавьте сайт на главный экран.");
    }
  });
}
