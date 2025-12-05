function isPWA() {
  // iPhone Safari — old style
  if (window.navigator.standalone) return true;

  // New style PWA (iOS 16+, iPadOS, Android)
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;

  return false;
}

const btn = document.getElementById("continueBtn");

if (isPWA()) {
  btn.textContent = "Открываем приложение…";
  btn.disabled = true;
  setTimeout(() => {
    window.location.replace("home.html");
  }, 10);
} else {
  btn.textContent = "Добавьте на главный экран";
  btn.disabled = true;
}
