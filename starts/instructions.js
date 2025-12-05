// starts/instructions.js

function isStandalone() {
  // iOS Safari: navigator.standalone
  // PWA: display-mode: standalone
  return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
}

const btn = document.getElementById("continueBtn");

if (isStandalone()) {
  // 🔥 Уже запущено как PWA → сразу в основной интерфейс
  btn.textContent = "Открываем приложение…";
  btn.disabled = true;

  // Лёгкая задержка, чтобы не мигнул экран
  setTimeout(() => {
    window.location.replace("home.html");
  }, 150);
} else {
  // Обычный браузер → только инструкция
  btn.textContent = "Добавьте на главный экран";
  btn.disabled = true;
}
