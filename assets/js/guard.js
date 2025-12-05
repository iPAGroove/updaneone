export function checkAccess() {
  const isPwa = window.matchMedia("(display-mode: standalone)").matches ||
                window.navigator.standalone;

  if (!isPwa) {
    console.log("⛔ home.html открыт НЕ как PWA — назад на index");
    window.location.href = "index.html";
    return false;
  }

  console.log("✔️ PWA режим подтверждён, можно грузить приложение");
  return true;
}
