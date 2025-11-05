// ===============================
// Меню + Авторизация + Смена Языка
// ===============================

import { loginWithGoogle, loginWithFacebook, loginAnon } from "./firebase/auth.js";
import { onUserChanged } from "./firebase/user.js";

// Ждем, пока DOM будет готов
document.addEventListener("DOMContentLoaded", () => {

    const menuBtn = document.getElementById("menu-btn");
    const overlay = document.getElementById("menu-modal");

    if (!menuBtn || !overlay) {
        console.error("❌ Меню не найдено в DOM (menu-btn или menu-modal отсутствуют)");
        return;
    }

    // Открытие меню
    function openMenuModal() {
        overlay.classList.add("visible");
        document.body.classList.add("modal-open");
    }

    // Закрытие меню
    function closeMenuModal() {
        overlay.classList.remove("visible");
        document.body.classList.remove("modal-open");
    }

    // Кнопка меню
    menuBtn.addEventListener("click", openMenuModal);

    // Клик по фону или стрелке ←
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay || e.target.closest("[data-action='close-menu']")) {
            closeMenuModal();
        }
    });

    // Закрытие по Esc
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

    if (changeLangBtn) {
        changeLangBtn.addEventListener("click", () => {
            currentLang = currentLang === "ru" ? "en" : "ru";
            localStorage.setItem("ursa_lang", currentLang);
            applyLang();
        });
    }

    // ===============================
    // 🔐 ВХОДЫ: Google / Facebook / Аноним
    // ===============================

    const googleBtn = document.querySelector(".google-auth");
    const facebookBtn = document.querySelector(".facebook-auth");
    const anonBtn = document.querySelector(".anon-auth");

    if (googleBtn) googleBtn.addEventListener("click", loginWithGoogle);
    if (facebookBtn) facebookBtn.addEventListener("click", loginWithFacebook);
    if (anonBtn) anonBtn.addEventListener("click", loginAnon);

    // ===============================
    // 👤 Обновление UI при изменении пользователя
    // ===============================
    const nickEl = document.getElementById("user-nickname");
    const avatarEl = document.getElementById("user-avatar");

    onUserChanged((user) => {
        if (!user) {
            nickEl.textContent = "Гость";
            avatarEl.src = "https://placehold.co/100x100/121722/00b3ff?text=User";
            return;
        }

        nickEl.textContent = user.displayName || "Пользователь";
        avatarEl.src = user.photoURL || "https://placehold.co/100x100/121722/00b3ff?text=User";
    });

});
