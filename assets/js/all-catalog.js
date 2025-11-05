import { openModal } from "./modal.js";
import { appsData } from "./app.js"; // используем те же данные что и для карточек

const overlay = document.getElementById("all-catalog-modal");
const container = document.getElementById("all-list-container");
const title = document.getElementById("all-list-title");

// открытие
function openListModal(listTitle, items) {
    title.textContent = listTitle;
    container.innerHTML = "";

    items.forEach(app => {
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

// закрытие
function closeListModal() {
    overlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
}

overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest("[data-action='close-list']")) {
        closeListModal();
    }
});

// обработчик кнопок "Смотреть все"
document.querySelectorAll(".view-all-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const collectionType = btn.dataset.collection;

        let selected = [];

        if (collectionType === "popular") {
            selected = appsData.filter(a => a.tags?.includes("popular"));
        } 
        else if (collectionType === "update") {
            selected = appsData.filter(a => a.tags?.includes("update"));
        } 
        else if (collectionType === "vip") {
            selected = appsData.filter(a => a.vip === true);
        }

        openListModal(btn.parentElement.querySelector(".collection-title").textContent, selected);
    });
});
