import { appsData } from "./app.js";
import { openModal } from "./modal.js";

const searchBtn = document.getElementById("search-btn");
const overlay = document.getElementById("search-modal");
const input = document.getElementById("search-input");
const results = document.getElementById("search-results");
const hint = document.querySelector(".search-hint"); // ✅ вот она

// Открытие
searchBtn.addEventListener("click", () => {
    overlay.classList.add("visible");
    document.body.classList.add("modal-open");
    input.focus();

    // ✅ при открытии показать подсказку
    hint.style.display = "block";
});

// Закрываем модалку
function close() {
    overlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
    input.value = "";
    results.innerHTML = "";
    hint.style.display = "block"; // ✅ вернуть подсказку
}

overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
});

// Поиск
input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    results.innerHTML = "";

    if (!q) {
        hint.style.display = "block"; // ✅ пустой поиск → показать подсказку
        return;
    }

    hint.style.display = "none"; // ✅ при вводе скрыть подсказку

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
            close();
            openModal(app);
        });
        results.appendChild(div);
    });
});
