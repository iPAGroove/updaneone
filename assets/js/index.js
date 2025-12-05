function isPwa() {
  return window.matchMedia("(display-mode: standalone)").matches ||
         window.navigator.standalone;
}

// Регистрация SW (обязательно!)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js")
    .then(() => console.log("🛠️ SW зарегистрирован (index.html)"))
    .catch(err => console.warn("SW error:", err));
}

if (isPwa()) {
  console.log("✔️ PWA → перенаправление на home.html");
  window.location.href = "home.html";
}

document.getElementById("checkPwaBtn").addEventListener("click", () => {
  if (isPwa()) {
    window.location.href = "home.html";
  } else {
    alert("⚠️ Добавьте сайт на главный экран!");
  }
});
