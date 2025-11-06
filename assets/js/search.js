import { appsData } from "./app.js";
import { openModal } from "./modal.js";

const searchBtn = document.getElementById("search-btn");
const overlay = document.getElementById("search-modal");
const input = document.getElementById("search-input");
const results = document.getElementById("search-results");
const hint = document.querySelector(".search-hint");
const tabbar = document.getElementById("tabbar");

// ===============================
// ОТКРЫТИЕ ПОИСКА
// ===============================
searchBtn.addEventListener("click", () => {
    overlay.classList.add("visible");
    document.body.classList.add("modal-open");
    hint.style.display = "block";
    input.focus();
});

// ===============================
// ЗАКРЫТИЕ ПОИСКА
// ===============================
function closeSearch() {
    overlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
    input.value = "";
    results.innerHTML = "";
    hint.style.display = "block";
}

// Закрытие по клику вне
overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSearch();
});

// Закрытие по ESC
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearch();
});

// ✅ Закрытие при переключении кнопок навигации
if (tabbar) tabbar.addEventListener("click", closeSearch);

// ===============================
// ПОИСК
// ===============================
input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    results.innerHTML = "";

    if (!q) {
        hint.style.display = "block";
        return;
    }
    hint.style.display = "none";

    const filtered = appsData
        .map(app => ({
            ...app,
            _score:
                (app.title || app.NAME || "").toLowerCase().includes(q) ? 2 :
                (app.desc || "").toLowerCase().includes(q) ? 1 :
                (app.features || "").toLowerCase().includes(q) ? 0.5 : 0
        }))
        .filter(a => a._score > 0)
        .sort((a, b) => b._score - a._score);

    filtered.forEach(app => {
        const icon = app.img || app.iconUrl || "https://placehold.co/100x100/121722/00b3ff?text=IPA";
        const title = app.title || app.NAME || "Без названия";

        const div = document.createElement("div");
        div.className = "result-item";
        div.innerHTML = `
            <img src="${icon}">
            <span class="title">${title}</span>
        `;
        div.addEventListener("click", () => {
            closeSearch();

            // ✅ Закрываем модалку "Смотреть все", если она открыта
            document.querySelectorAll(".view-all-modal.visible")
                .forEach(m => m.classList.remove("visible"));

            openModal(app);
        });

        results.appendChild(div);
    });
});
