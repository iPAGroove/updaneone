// assets/js/search.js
import { appsData } from "./app.js";
import { openModal } from "./modal.js";
import { currentLang, getTranslation } from "./i18n.js"; // 🚀 ИМПОРТ

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
    // 🚀 Обновляем placeholder при открытии на случай смены языка
    input.setAttribute("placeholder", getTranslation('searchPlaceholder'));
    hint.textContent = getTranslation('searchHint');
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
// ... (остальные слушатели закрытия без изменений)

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
    
    // 🚀 Поиск по обоим языковым полям
    const filtered = appsData.filter(app =>
        app.title.toLowerCase().includes(q) ||
        (app.desc_ru || "").toLowerCase().includes(q) ||
        (app.desc_en || "").toLowerCase().includes(q) ||
        (app.features_ru || "").toLowerCase().includes(q) ||
        (app.features_en || "").toLowerCase().includes(q)
    );
    
    filtered.forEach(app => {
        const div = document.createElement("div");
        div.className = "result-item";
        div.innerHTML = `
            <img src="${app.img}">
            <span class="title">${app.title}</span>
        `;
        div.addEventListener("click", () => {
            close(); // закрываем поиск ✅
            openModal(app); // открываем карточку ✅
        });
        results.appendChild(div);
    });
});
