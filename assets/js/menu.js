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

document.addEventListener("DOMContentLoaded", () => {

    // ===============================
    // 📌 Меню
    // ===============================
    const menuBtn = document.getElementById("menu-btn");
    const menuOverlay = document.getElementById("menu-modal");

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
    // 🔐 Вход через Google / Facebook
    // ===============================
    document.querySelector(".google-auth")?.addEventListener("click", loginWithGoogle);
    document.querySelector(".facebook-auth")?.addEventListener("click", loginWithFacebook);


    // ===============================
    // ✉ Открыть окно email входа
    // ===============================
    const emailBtn = document.querySelector(".email-auth");
    const emailModal = document.getElementById("email-modal");

    emailBtn?.addEventListener("click", () => {
        closeMenu();
        emailModal.classList.add("visible");
    });

    emailModal?.addEventListener("click", (e) => {
        if (e.target === emailModal || e.target.closest("[data-action='close-email']")) {
            emailModal.classList.remove("visible");
        }
    });


    // ===============================
    // ✉ Email вход / регистрация / восстановление
    // ===============================
    const emailInput = document.getElementById("email-input");
    const passwordInput = document.getElementById("password-input");

    document.getElementById("email-login-btn")?.addEventListener("click", () => {
        loginWithEmail(emailInput.value, passwordInput.value);
    });

    document.getElementById("email-register-btn")?.addEventListener("click", () => {
        registerWithEmail(emailInput.value, passwordInput.value);
    });

    document.getElementById("email-reset-btn")?.addEventListener("click", () => {
        resetPassword(emailInput.value);
    });


    // ===============================
    // 👤 Обновление UI пользователя
    // ===============================
    const nickEl = document.getElementById("user-nickname");
    const avatarEl = document.getElementById("user-avatar");

    onUserChanged((user) => {
        if (!user) {
            nickEl.textContent = "Гость";
            avatarEl.src = "https://placehold.co/100x100/121722/00b3ff?text=User";
            return;
        }

        nickEl.textContent = user.displayName || user.email || "Пользователь";
        avatarEl.src = user.photoURL || "https://placehold.co/100x100/121722/00b3ff?text=User";
    });

});
