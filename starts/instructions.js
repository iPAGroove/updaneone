(function () {

  function detectPWA() {
    // iOS лениво сообщает режим → проверяем разные сигналы
    if (window.navigator.standalone === true) return true;

    const modes = ["standalone", "fullscreen", "minimal-ui"];
    for (const mode of modes) {
      if (window.matchMedia("(display-mode: " + mode + ")").matches) {
        return true;
      }
    }

    // БАГ iOS: иногда display-mode не работает первые 50–300 мс
    return false;
  }

  function tryRedirect() {
    if (detectPWA()) {
      console.log("[URSA] PWA detected → redirect");
      window.location.replace("./home.html?v=4");
      return true;
    }
    return false;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("continueBtn");
    btn.textContent = "Добавьте на главный экран";
    btn.disabled = true;

    // пробуем несколько раз — из-за задержки запуска iOS PWA
    let attempts = 0;
    const check = setInterval(() => {
      attempts++;
      if (tryRedirect() || attempts > 10) {
        clearInterval(check);
      }
    }, 200);
  });

})();
