// assets/js/search.js
// ===============================
// Search + i18n
// ===============================

import { appsData } from "./app.js";
import { openModal } from "./modal.js";
import { t } from "./i18n.js";

// DOM
const searchBtn = document.getElementById("search-btn");
const overlay = document.getElementById("search-modal");
const input = document.getElementById("search-input");
const results = document.getElementById("search-results");
const hint = document.querySelector(".search-hint");

/* ============================================================
   📌 Функции
   ============================================================ */

// Открыть поиск
function openSearch() {
    overlay.classList.add("visible");
    document.body.classList.add("modal-open");
    input.focus();

    input.placeholder = t("searchPlaceholder");
    hint.textContent = t("searchHint");
    hint.style.display = "block";
}

// Закрыть поиск
function closeSearch() {
    overlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
    input.value = "";
    results.innerHTML = "";
    hint.style.display = "block";
}

/* ============================================================
   🔥 Открытие окна
   ============================================================ */
searchBtn.addEventListener("click", openSearch);

/* ============================================================
   🔥 Закрытие окна
   ============================================================ */
overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSearch();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearch();
});

// Закрытие при переключении вкладок
document.getElementById("tabbar")?.addEventListener("click", (e) => {
    const button = e.target.closest(".nav-btn");
    const tab = button?.getAttribute("data-tab");

    if (tab === "apps" || tab === "games") closeSearch();
});

/* ============================================================
   🔍 Поиск
   ============================================================ */
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
        const item = document.createElement("div");
        item.className = "result-item";

        item.innerHTML = `
            <img src="${app.img}">
            <span class="title">${app.title}</span>
        `;

        item.addEventListener("click", () => {
            closeSearch();
            openModal(app);
        });

        results.appendChild(item);
    });
});

/* ============================================================
   🔄 Перерисовка при смене языка
   ============================================================ */
document.addEventListener("ursa_lang_changed", () => {
    input.placeholder = t("searchPlaceholder");
    hint.textContent = t("searchHint");
});
