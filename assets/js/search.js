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
// 🔄 Обновление статических текстов
// ===============================
function updateSearchTexts() {
    input.setAttribute("placeholder", getTranslation('searchPlaceholder'));
    hint.textContent = getTranslation('searchHint');
}

// ===============================
// Открытие
// ===============================
searchBtn.addEventListener("click", () => {
    updateSearchTexts(); // 🚀 Обновляем тексты при открытии
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
// Поиск (с поддержкой 2-х языков)
// ===============================
input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    results.innerHTML = "";

    if (!q) {
        hint.style.display = "block";
        return;
    }
    hint.style.display = "none";

    // 🚀 Поиск по всем языковым полям (ru/en)
    const filtered = appsData.filter(app =>
        app.title.toLowerCase().includes(q) ||
        (app.desc_ru || "").toLowerCase().includes(q) || // Ищем в русском описании
        (app.desc_en || "").toLowerCase().includes(q) || // Ищем в английском описании
        (app.features_ru || "").toLowerCase().includes(q) || // Ищем в русских фичах
        (app.features_en || "").toLowerCase().includes(q)    // Ищем в английских фичах
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

// 🚀 Слушатель на смену языка для обновления текстов, если поиск не активен
window.addEventListener('langChange', updateSearchTexts);
