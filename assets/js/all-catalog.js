// assets/js/all-catalog.js
// ===============================
// All Catalog modal + Lang support
// ===============================
import { openModal } from "./modal.js";
import { appsData, currentCategory } from "./app.js";
import { t } from "./i18n.js";

// DOM
const overlay = document.getElementById("all-catalog-modal");
const container = document.getElementById("all-list-container");
const title = document.getElementById("all-list-title");

// ===============================
// Открыть модалку полного списка
// ===============================
function openListModal() {
    // 🔥 Переведённое название списка
    title.textContent = currentCategory === "apps" ? t("apps") : t("games");

    container.innerHTML = "";

    // 🔥 Корректная фильтрация по массиву tags
    const filtered = appsData.filter(app =>
        Array.isArray(app.tags) && app.tags.includes(currentCategory)
    );

    filtered.forEach(app => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <img src="${app.img}" alt="">
            <span class="card-title">${app.title}</span>
        `;

        card.addEventListener("click", () => {
            overlay.classList.remove("visible");
            document.body.classList.remove("modal-open");
            openModal(app);
        });

        container.appendChild(card);
    });

    overlay.classList.add("visible");
    document.body.classList.add("modal-open");
}

// ===============================
// Закрыть модалку
// ===============================
function closeListModal() {
    overlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
}

// ===============================
// Обработчики
// ===============================
overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest("[data-action='close-list']")) {
        closeListModal();
    }
});

document.querySelectorAll(".view-all-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        openListModal();
    });
});

// ===============================
// 🔄 Реакция на смену языка
// ===============================
document.addEventListener("ursa_lang_changed", () => {
    // Если окно открыто — перерисовать заголовок
    if (overlay.classList.contains("visible")) {
        title.textContent = currentCategory === "apps" ? t("apps") : t("games");
    }
});
