export function checkAccess() {
  const isPwa = window.matchMedia("(display-mode: standalone)").matches ||
                window.navigator.standalone;

  if (!isPwa) {
    console.log("⛔ Открыт не как PWA — возврат на index");
    window.location.href = "index.html";
    return false;
  }

  console.log("✔️ PWA доступ подтверждён");
  return true;
}
