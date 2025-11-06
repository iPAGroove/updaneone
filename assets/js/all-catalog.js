import { openModal } from "./modal.js";
import { appsData, currentCategory } from "./app.js";

const overlay = document.getElementById("all-catalog-modal");
const container = document.getElementById("all-list-container");
const title = document.getElementById("all-list-title");

// 💡 Экспортируем функцию закрытия, чтобы к ней можно было обратиться из других модулей (например, из card.addEventListener)
export function closeListModal() {
    overlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
}

function openListModal() {
    title.textContent = currentCategory === "apps" ? "Приложения" : "Игры";
    container.innerHTML = "";

    const filtered = appsData.filter(app =>
        app.tags.split(",").map(t => t.trim()).includes(currentCategory)
    );

    filtered.forEach(app => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <img src="${app.img}" alt="">
            <span class="card-title">${app.title}</span>
        `;
        
        // 💡 ИСПРАВЛЕНИЕ ПУНКТА 1: Закрываем текущую модалку перед открытием модалки приложения
        card.addEventListener("click", () => {
            closeListModal(); 
            openModal(app);
        });
        
        container.appendChild(card);
    });

    overlay.classList.add("visible");
    document.body.classList.add("modal-open");
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
