// ===============================
// Меню + Авторизация + Смена Языка
// ===============================

import { loginWithGoogle, loginWithFacebook } from "./firebase/auth.js";
import { onUserChanged } from "./firebase/user.js";

// Ждем DOM
document.addEventListener("DOMContentLoaded", () => {

    const menuBtn = document.getElementById("menu-btn");
    const overlay = document.getElementById("menu-modal");

    if (!menuBtn || !overlay) {
        console.error("❌ Меню не найдено (menu-btn или menu-modal отсутствуют)");
        return;
    }

    // Открыть меню
    function openMenuModal() {
        overlay.classList.add("visible");
        document.body.classList.add("modal-open");
    }

    // Закрыть меню
    function closeMenuModal() {
        overlay.classList.remove("visible");
        document.body.classList.remove("modal-open");
    }

    menuBtn.addEventListener("click", openMenuModal);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay || e.target.closest("[data-action='close-menu']")) {
            closeMenuModal();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlay.classList.contains("visible")) {
            closeMenuModal();
        }
    });

    // ===============================
    // 🌍 СМЕНА ЯЗЫКА
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
    // 🔐 ВХОДЫ
    // ===============================

    document.querySelector(".google-auth")?.addEventListener("click", loginWithGoogle);
    document.querySelector(".facebook-auth")?.addEventListener("click", loginWithFacebook);

    // 🎯 Новый: открыть модалку Email логина
    const emailAuthBtn = document.querySelector(".email-auth");
    const emailModal = document.getElementById("email-auth-modal");

    emailAuthBtn?.addEventListener("click", () => {
        emailModal.classList.add("visible");
    });

    emailModal?.addEventListener("click", (e) => {
        if (e.target === emailModal || e.target.closest("[data-action='close-email']")) {
            emailModal.classList.remove("visible");
        }
    });

    // ===============================
    // 👤 UI при изменении пользователя
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
