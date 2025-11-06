import { openModal } from "./modal.js";
import { appsData, currentCategory } from "./app.js";
// DOM элементы
const overlay = document.getElementById("all-catalog-modal");
const container = document.getElementById("all-list-container");
const title = document.getElementById("all-list-title");
// открыть список
function openListModal() {
    // Название сверху → просто отображаем текущую категорию
    title.textContent = currentCategory === "apps" ? "Приложения" : "Игры";
    container.innerHTML = "";
    // выбираем только элементы по текущей категории
    const filtered = appsData.filter(app =>
        app.tags.split(",").map(t => t.trim()).includes(currentCategory)
    );
    // вставляем карточки
    filtered.forEach(app => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <img src="${app.img}" alt="">
            <span class="card-title">${app.title}</span>
        `;
        card.addEventListener("click", () => openModal(app));
        container.appendChild(card);
    });
    overlay.classList.add("visible");
    document.body.classList.add("modal-open");
}
// закрыть список
function closeListModal() {
    overlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
}
// клик по фону / кнопке закрытия
overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest("[data-action='close-list']")) {
        closeListModal();
    }
});
// обработчик всех кнопок "Смотреть все"
document.querySelectorAll(".view-all-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        openListModal();
    });
});
