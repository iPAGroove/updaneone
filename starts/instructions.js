// starts/instructions.js

(function () {
  function detectPWA() {
    const modes = [];

    if (typeof window.navigator.standalone !== "undefined") {
      modes.push("navigator.standalone=" + window.navigator.standalone);
      if (window.navigator.standalone) return true;
    }

    if (window.matchMedia) {
      const variants = ["standalone", "fullscreen", "minimal-ui"];
      for (const m of variants) {
        try {
          if (window.matchMedia("(display-mode: " + m + ")").matches) {
            modes.push("display-mode:" + m);
            return true;
          }
        } catch (e) {}
      }
    }

    console.log("[URSA] PWA detection:", modes.length ? modes.join(", ") : "no matches");
    return false;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("continueBtn");
    if (!btn) return;

    const isPwa = detectPWA();

    if (isPwa) {
      btn.textContent = "Открываем приложение…";
      btn.disabled = true;
      setTimeout(() => {
        window.location.replace("home.html");
      }, 50);
    } else {
      btn.textContent = "Добавьте на главный экран";
      btn.disabled = true;
    }
  });
})();
