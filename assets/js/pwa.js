if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js")
    .then(() => console.log("🛠️ SW зарегистрирован (home.html)"))
    .catch(err => console.warn("SW error:", err));
}
