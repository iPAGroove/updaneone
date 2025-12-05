export function checkAccess() {
    const isPwa = window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone;

    if (!isPwa) {
        console.log("⛔ Не PWA — redirect to index");
        window.location.href = "/index.html";
        return false;
    }

    console.log("✔️ PWA режим подтвержден");
    return true;
}
