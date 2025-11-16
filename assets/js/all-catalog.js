// assets/js/all-catalog.js
// ===============================
import { openModal } from "./modal.js";
import { appsData, currentCategory } from "./app.js";
import { t } from "./i18n.js";

const overlay = document.getElementById("all-catalog-modal");
const container = document.getElementById("all-list-container");
const title = document.getElementById("all-list-title");

// ТЕКУЩИЙ ТИП СПИСКА ("popular" / "update" / "vip")
let currentListType = "popular";

// ===============================
// Функция сортировки СПИСКА
// ===============================
function sortApps(listType, data) {
    let arr = [...data];

    if (listType === "popular") {
        arr = arr.sort((a, b) => b.downloadCount - a.downloadCount);
    }
    else if (listType === "update") {
        arr = arr.sort((a, b) => b.updatedTime - a.updatedTime);
    }
    else if (listType === "vip") {
        arr = arr
            .filter(app => app.vip)
            .sort((a, b) => b.downloadCount - a.downloadCount);
    }

    return arr;
}

// ===============================
// Открыть список
// ===============================
function openListModal() {

    container.innerHTML = "";

    // 🔥 Фильтрация по текущей категории (apps/games)
    let filtered = appsData.filter(app =>
        Array.isArray(app.tags) && app.tags.includes(currentCategory)
    );

    // 🔥 Применяем сортировку
    const finalList = sortApps(currentListType, filtered);

    // 🔥 Заголовок окна
    if (currentListType === "popular") title.textContent = t("popular");
    if (currentListType === "update")  title.textContent = t("update");
    if (currentListType === "vip")     title.textContent = t("vip");

    // Рендер карточек
    finalList.forEach(app => {
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
// Закрытие
// ===============================
function closeListModal() {
    overlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
}

overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest("[data-action='close-list']")) {
        closeListModal();
    }
});

// ===============================
// Обработчик кнопок "Смотреть все"
// ===============================
document.querySelectorAll(".view-all-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        currentListType = btn.dataset.type;
        openListModal();
    });
});

// ===============================
// 🔄 Перерисовка при смене языка
// ===============================
document.addEventListener("ursa_lang_changed", () => {
    if (overlay.classList.contains("visible")) {
        if (currentListType === "popular") title.textContent = t("popular");
        if (currentListType === "update")  title.textContent = t("update");
        if (currentListType === "vip")     title.textContent = t("vip");
    }
});
