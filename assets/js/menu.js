const menuBtn = document.getElementById("menu-btn");
const overlay = document.getElementById("menu-modal");

// Открытие модалки
function openMenuModal() {
    overlay.classList.add("visible");
    document.body.classList.add("modal-open");
}

// Закрытие модалки
function closeMenuModal() {
    overlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
}

// Обработчик кнопки меню
menuBtn.addEventListener("click", openMenuModal);

// Обработчик закрытия по клику вне контента или по кнопке "✕"
overlay.addEventListener("click", (e) => {
    // Проверяем, кликнули ли по оверлею ИЛИ по кнопке закрытия
    if (e.target === overlay || e.target.closest("[data-action='close-menu']")) {
        closeMenuModal();
    }
});

// Закрытие по клавише Esc
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("visible")) {
        closeMenuModal();
    }
});
