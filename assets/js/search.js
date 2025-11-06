import { appsData } from "./app.js";
import { openModal } from "./modal.js";

const searchBtn = document.getElementById("search-btn");
const overlay = document.getElementById("search-modal");
const input = document.getElementById("search-input");
const results = document.getElementById("search-results");
const hint = document.querySelector(".search-hint");

// Открытие
searchBtn.addEventListener("click", () => {
    overlay.classList.add("visible");
    document.body.classList.add("modal-open");
    input.focus();
    hint.style.display = "block";
});

// Закрытие
export function closeSearchModal() { // 💡 Сделали экспорт, чтобы использовать в других модулях
    overlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
    input.value = "";
    results.innerHTML = "";
    hint.style.display = "block";
}

// 💡 ИСПРАВЛЕНИЕ ПУНКТА 6: Переименовываем 'close' в 'closeSearchModal'
overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSearchModal();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearchModal();
});

// 💡 ИСПРАВЛЕНИЕ ПУНКТА 6: Закрытие при клике на другие кнопки навигации
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        // Если поиск открыт И нажатая кнопка не является кнопкой поиска
        if (overlay.classList.contains("visible") && e.currentTarget.id !== "search-btn") {
            closeSearchModal();
        }
    });
});

// Поиск
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
            closeSearchModal(); // 💡 Используем новое имя функции
            openModal(app);
        });
        results.appendChild(div);
    });
});
