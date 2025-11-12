// assets/js/i18n.js
// ===============================
// Логика локализации (i18n)
// ===============================

// ------------------------------
// 🔑 Переводы
// ------------------------------
const translations = {
    ru: {
        // Общие
        pageTitle: "URSA IPA",
        brandName: "URSA IPA",
        viewAllBtn: "Смотреть все",
        installBtn: "Установить",
        waitingText: "Ожидание…",
        searchPlaceholder: "Поиск приложений...",
        searchHint: "Нажмите вне поиска, чтобы закрыть",
        guestNickname: "Гость",

        // Коллекции
        popularTitle: "Популярные",
        updateTitle: "Обновления",
        vipTitle: "VIP",
        catalogTitle: "Каталог", // All catalog

        // Модальное окно приложения
        modalTitlePlaceholder: "Название",
        versionLabel: "Версия",
        sizeLabel: "Размер",
        uploadedLabel: "Загружено",
        featuresTitle: "ФУНКЦИИ МОДА",
        vipOnly: "ТОЛЬКО ДЛЯ VIP",
        installFail: "Установка", // для signer.js

        // Меню
        loginPrompt: "Войти через:",
        certPlaceholder: "Данные о сертификате будут здесь",
        addCertBtn: "Добавить сертификат",
        selectPlanBtn: "Выбрать план",
        buyCertBtn: "Купить сертификат",
        changeLangBtn: "Language / Язык",
        aboutUsBtn: "О нас",
        supportChatBtn: "Чат поддержки",

        // Логин/Регистрация
        loginRegisterTitle: "Вход / Регистрация",
        loginBtn: "Войти",
        registerBtn: "Создать аккаунт",
        forgotPassBtn: "Забыли пароль?",

        // Импорт сертификата
        importCertTitle: "Импорт сертификата",
        certPassLabel: "Пароль для .p12 (если есть)",
        certPassPlaceholder: "Пароль (необязательно)",
        importBtn: "Импортировать",

        // Установка
        installPrepare: "Подготовка…",
        installWaitServer: "Ожидание сервера…",
        installErrorTitle: "Ошибка", // для signer.js
        installCertRequired: "⚠️ Нет сертификата", // для signer.js
        installCertPrompt: "Добавьте сертификат в меню.", // для signer.js
        installLoginRequired: "⚠️ Требуется вход", // для signer.js
        installLoginPrompt: "Авторизуйтесь через меню.", // для signer.js
    },
    en: {
        // Общие
        pageTitle: "URSA IPA",
        brandName: "URSA IPA",
        viewAllBtn: "View All",
        installBtn: "Install",
        waitingText: "Waiting…",
        searchPlaceholder: "Search Apps...",
        searchHint: "Tap outside to close search",
        guestNickname: "Guest",

        // Коллекции
        popularTitle: "Popular",
        updateTitle: "Updates",
        vipTitle: "VIP",
        catalogTitle: "Catalog", // All catalog

        // Модальное окно приложения
        modalTitlePlaceholder: "Title",
        versionLabel: "Version",
        sizeLabel: "Size",
        uploadedLabel: "Uploaded",
        featuresTitle: "HACK FEATURES",
        vipOnly: "VIP ONLY",
        installFail: "Installation",

        // Меню
        loginPrompt: "Log in with:",
        certPlaceholder: "Certificate data will be here",
        addCertBtn: "Add Certificate",
        selectPlanBtn: "Select Plan",
        buyCertBtn: "Buy Certificate",
        changeLangBtn: "Language / Язык",
        aboutUsBtn: "About Us",
        supportChatBtn: "Support Chat",

        // Логин/Регистрация
        loginRegisterTitle: "Login / Register",
        loginBtn: "Login",
        registerBtn: "Create Account",
        forgotPassBtn: "Forgot Password?",

        // Импорт сертификата
        importCertTitle: "Import Certificate",
        certPassLabel: "Password for .p12 (if any)",
        certPassPlaceholder: "Password (optional)",
        importBtn: "Import",

        // Установка
        installPrepare: "Preparing…",
        installWaitServer: "Waiting for server…",
        installErrorTitle: "Error",
        installCertRequired: "⚠️ No Certificate",
        installCertPrompt: "Add certificate in the menu.",
        installLoginRequired: "⚠️ Login Required",
        installLoginPrompt: "Authorize via the menu.",
    },
};

// ------------------------------
// 🌍 Глобальное состояние
// ------------------------------
export let currentLang = localStorage.getItem("ursa_lang") || "ru";

// ------------------------------
// 🔧 Функция перевода
// ------------------------------
export function translatePage() {
    const lang = currentLang;
    const t = translations[lang] || translations["ru"];
    
    // Перевод HTML-элементов
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (t[key]) {
            el.textContent = t[key];
        }
    });

    // Перевод атрибутов (например, placeholder)
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (t[key]) {
            el.setAttribute("placeholder", t[key]);
        }
    });

    // Обновление атрибута lang для HTML-элемента
    document.documentElement.setAttribute("lang", lang);

    // Обновление заголовка страницы
    const pageTitleEl = document.querySelector('title');
    const titleKey = pageTitleEl.getAttribute('data-i18n') || 'pageTitle';
    if (t[titleKey]) {
        pageTitleEl.textContent = t[titleKey];
    }
}

// ------------------------------
// 🔄 Переключение языка
// ------------------------------
export function toggleLanguage() {
    currentLang = currentLang === "ru" ? "en" : "ru";
    localStorage.setItem("ursa_lang", currentLang);
    translatePage();
    // ⚠️ Глобально вызываем ре-рендер каталога и других компонентов
    // Это нужно, чтобы обновить динамические тексты
    window.dispatchEvent(new CustomEvent('langChange', { detail: { lang: currentLang } }));
}

// ------------------------------
// 🚀 Инициализация
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
    translatePage();

    // Обработчик для кнопки смены языка
    const langBtn = document.querySelector(".change-lang-btn");
    langBtn?.addEventListener("click", toggleLanguage);
});

// ------------------------------
// 💡 Утилита для динамического контента
// ------------------------------
export function getTranslation(key) {
    return translations[currentLang]?.[key] || translations['ru'][key] || key;
}
