function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
}

const btn = document.getElementById("continueBtn");

if (isStandalone()) {
  btn.textContent = "Продолжить";
  btn.disabled = false;
  btn.onclick = () => {
    window.location.href = "home.html"; // ⚡ будет на следующем шаге
  };
} else {
  btn.textContent = "Добавьте на главный экран";
  btn.disabled = true;
}
