// assets/js/all-catalog.js
import { openModal } from "./modal.js";
import { appsData, currentCategory } from "./app.js";
import { currentLang, getTranslation, translatePage } from "./i18n.js"; // 🚀 ИМПОРТ

const overlay = document.getElementById("all-catalog-modal");
const container = document.getElementById("all-list-container");
const title = document.getElementById("all-list-title");

function openListModal() {
    // 🚀 Переводим заголовок динамически
    const titleKey = currentCategory === "apps" ? "appsTitle" : "gamesTitle";
    title.textContent = getTranslation(titleKey);
    
    container.innerHTML = "";
    const filtered = appsData.filter(app =>
        (app.tags || "").split(",").map(t => t.trim()).includes(currentCategory)
    );
    
    filtered.forEach(app => {
        const card = document.createElement("div");
        card.className = "card";
        // Используем app.title, который приходит из Firestore
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
    translatePage(); // Обновляем статические элементы, если они есть
}

function closeListModal() {
    overlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
}

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

// 🚀 Слушатель на смену языка для обновления заголовка
window.addEventListener('langChange', () => {
    if (overlay.classList.contains('visible')) {
        openListModal();
    }
});
