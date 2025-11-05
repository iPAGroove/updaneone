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


// ==========================================
// 🌍 СМЕНА ЯЗЫКА
// ==========================================

// Находим кнопку
const changeLangBtn = document.querySelector(".change-lang-btn");

// Текущий язык (по умолчанию RU)
let currentLang = "ru";

// Словарь
const uiText = {
    ru: {
        selectPlan: "Выбрать план",
        buyCert: "Купить сертификат",
        changeLang: "Сменить язык",
        aboutUs: "О нас",
    },
    en: {
        selectPlan: "Select Plan",
        buyCert: "Buy Certificate",
        changeLang: "Change Language",
        aboutUs: "About Us",
    }
};

// Функция применения языка
function applyLang() {
    document.querySelector(".select-plan-btn").textContent = uiText[currentLang].selectPlan;
    document.querySelector(".buy-cert-btn").textContent = uiText[currentLang].buyCert;
    document.querySelector(".change-lang-btn").textContent = uiText[currentLang].changeLang;
    document.querySelector(".about-us-btn").textContent = uiText[currentLang].aboutUs;
}

// Переключатель по кнопке
changeLangBtn.addEventListener("click", () => {
    currentLang = currentLang === "ru" ? "en" : "ru";
    applyLang();
});
