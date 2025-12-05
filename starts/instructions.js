function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
}

const btn = document.getElementById("continueBtn");

if (isStandalone()) {
  btn.textContent = "Открываем приложение…";
  btn.disabled = true;

  setTimeout(() => {
    window.location.replace("home.html");
  }, 150);
} else {
  btn.textContent = "Добавьте на главный экран";
  btn.disabled = true;
}
