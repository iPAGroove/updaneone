// assets/js/menu.js
// ===============================
// Меню + Авторизация + Email Login + Смена Языка
// ===============================
import {
    loginWithGoogle,
    loginWithFacebook,
    loginWithEmail,
    registerWithEmail,
    resetPassword
} from "./firebase/auth.js";
import { onUserChanged } from "./firebase/user.js";
// 🆕 Импорт функции для загрузки и обновления UI сертификата И функции открытия модалки
import { loadUserCertificateData, openAddCertModal } from "./certificate.js"; // 💡 openAddCertModal теперь импортируется

document.addEventListener("DOMContentLoaded", () => {
    // ===============================
    // 📌 Меню
    // ===============================
    const menuBtn = document.getElementById("menu-btn");
    const menuOverlay = document.getElementById("menu-modal");

    // 💡 Функции open/close Menu
    function openMenu() {
        menuOverlay.classList.add("visible");
        document.body.classList.add("modal-open");
    }
    function closeMenu() {
        menuOverlay.classList.remove("visible");
        document.body.classList.remove("modal-open");
    }

    menuBtn?.addEventListener("click", openMenu);
    menuOverlay?.addEventListener("click", (e) => {
        if (e.target === menuOverlay || e.target.closest("[data-action='close-menu']")) closeMenu();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMenu();
    });

    // ===============================
    // 🔗 Логика открытия модалки сертификата (ПЕРЕМЕЩЕНО СЮДА)
    // ===============================
    const openCertModalBtn = document.getElementById("open-cert-modal-btn");
    
    openCertModalBtn?.addEventListener("click", () => {
        // 1. Сначала закрываем основное меню
        closeMenu(); 
        // 2. Затем открываем модалку сертификата (которая теперь экспортирована!)
        openAddCertModal(); 
    });
    
    // ===============================
    // 🌍 Смена языка
    // ===============================
    const changeLangBtn = document.querySelector(".change-lang-btn");
    let currentLang = localStorage.getItem("ursa_lang") || "ru";
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
    function applyLang() {
        document.querySelector(".select-plan-btn").textContent = uiText[currentLang].selectPlan;
        document.querySelector(".buy-cert-btn").textContent = uiText[currentLang].buyCert;
        document.querySelector(".change-lang-btn").textContent = uiText[currentLang].changeLang;
        document.querySelector(".about-us-btn").textContent = uiText[currentLang].aboutUs;
    }
    applyLang();
    changeLangBtn?.addEventListener("click", () => {
        currentLang = currentLang === "ru" ? "en" : "ru";
        localStorage.setItem("ursa_lang", currentLang);
        applyLang();
    });
    // ===============================
    // 🔐 Google / Facebook вход
    // ===============================
    document.querySelector(".google-auth")?.addEventListener("click", async () => {
        await loginWithGoogle();
        closeMenu();
    });
    document.querySelector(".facebook-auth")?.addEventListener("click", async () => {
        await loginWithFacebook();
        closeMenu();
    });
    // ===============================
    // ✉ Email Login Modal
    // ===============================
    const emailBtn = document.querySelector(".email-auth");
    const emailModal = document.getElementById("email-modal");

    function openEmailModal() { 
        closeMenu();
        emailModal.classList.add("visible");
    }
    function closeEmailModal() {
        emailModal.classList.remove("visible");
    }

    emailBtn?.addEventListener("click", openEmailModal);
    emailModal?.addEventListener("click", (e) => {
        if (e.target === emailModal || e.target.closest("[data-action='close-email']")) closeEmailModal();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeEmailModal();
    });
    // ===============================
    // ✉ Email вход / регистрация / восстановление
    // ===============================
    const emailInput = document.getElementById("email-input");
    const passwordInput = document.getElementById("password-input");
    document.getElementById("email-login-btn")?.addEventListener("click", async () => {
        await loginWithEmail(emailInput.value.trim(), passwordInput.value.trim());
        closeEmailModal();
        openMenu();
    });
    document.getElementById("email-register-btn")?.addEventListener("click", async () => {
        await registerWithEmail(emailInput.value.trim(), passwordInput.value.trim());
        closeEmailModal();
        openMenu();
    });
    document.getElementById("email-reset-btn")?.addEventListener("click", () => {
        resetPassword(emailInput.value.trim());
    });
    // ===============================
    // 👤 Обновление UI (СРАЗУ, без перезагрузки)
    // ===============================
    const nickEl = document.getElementById("user-nickname");
    const avatarEl = document.getElementById("user-avatar");

    onUserChanged((user) => {
        if (!user) {
            nickEl.textContent = "Гость";
            avatarEl.src = "https://placehold.co/100x100/121722/00b3ff?text=User";
            loadUserCertificateData(null); 
            return;
        }

        nickEl.textContent = user.displayName || user.email || "Пользователь";
        avatarEl.src = user.photoURL || "https://placehold.co/100x100/121722/00b3ff?text=User";

        loadUserCertificateData(user); 
    });
});
