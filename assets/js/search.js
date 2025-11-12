// assets/js/search.js
import { appsData } from "./app.js";
import { openModal } from "./modal.js";

const searchBtn = document.getElementById("search-btn");
const overlay = document.getElementById("search-modal");
const input = document.getElementById("search-input");
const results = document.getElementById("search-results");
const hint = document.querySelector(".search-hint");

// ===============================
// Открытие
// ===============================
searchBtn.addEventListener("click", () => {
    overlay.classList.add("visible");
    document.body.classList.add("modal-open");
    input.focus();
    hint.style.display = "block";
});

// ===============================
// Закрытие
// ===============================
function close() {
    overlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
    input.value = "";
    results.innerHTML = "";
    hint.style.display = "block";
}

overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
});

// ✅ ИСПРАВЛЕНО: Закрытие при нажатии на нижние вкладки (навигация)
// Закрываем поиск только при нажатии на табы "apps" или "games",
// чтобы нажатие на ☰ или 🔍 не блокировалось.
document.getElementById("tabbar")?.addEventListener("click", (e) => {
    const button = e.target.closest('.nav-btn');
    const dataTab = button?.getAttribute('data-tab');

    if (dataTab === 'apps' || dataTab === 'games') {
        close();
    }
});

// ===============================
// Поиск
// ===============================
input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    results.innerHTML = "";

    if (!q) {
        hint.style.display = "block";
        return;
    }
    hint.style.display = "none";

    const filtered = appsData.filter(app =>
        app.title.toLowerCase().includes(q) ||
        (app.desc || "").toLowerCase().includes(q) ||
        (app.features || "").toLowerCase().includes(q)
    );

    filtered.forEach(app => {
        const div = document.createElement("div");
        div.className = "result-item";
        div.innerHTML = `
            <img src="${app.img}">
            <span class="title">${app.title}</span>
        `;
        div.addEventListener("click", () => {
            close();      // закрываем поиск ✅
            openModal(app); // открываем карточку ✅
        });
        results.appendChild(div);
    });
});
