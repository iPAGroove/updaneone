// =============================
// Меню (открытие / закрытие)
// =============================
const menuBtn = document.getElementById("menu-btn");
const overlay = document.getElementById("menu-modal");

function openMenuModal() {
    overlay.classList.add("visible");
    document.body.classList.add("modal-open");
}

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


// =============================
// 🔐 Авторизация с Firebase
// =============================
import { loginWithGoogle, loginWithFacebook, loginAnon } from "./firebase/auth.js";
import { onUserChanged } from "./firebase/user.js";

// Кнопки входа
document.querySelector(".google-auth")?.addEventListener("click", () => {
    loginWithGoogle().then(closeMenuModal);
});

document.querySelector(".facebook-auth")?.addEventListener("click", () => {
    loginWithFacebook().then(closeMenuModal);
});

document.querySelector(".anon-auth")?.addEventListener("click", () => {
    loginAnon().then(closeMenuModal);
});

// Обновление UI профиля
onUserChanged((user) => {
    const avatar = document.getElementById("user-avatar");
    const nickname = document.getElementById("user-nickname");

    if (!user) {
        avatar.src = "https://placehold.co/100x100/121722/00b3ff?text=User";
        nickname.textContent = "Гость";
        return;
    }

    nickname.textContent = user.displayName || "Пользователь";
    avatar.src = user.photoURL || "https://placehold.co/100x100/121722/00b3ff?text=User";
});


// =============================
// 🌍 Смена языка
// =============================
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

changeLangBtn.addEventListener("click", () => {
    currentLang = currentLang === "ru" ? "en" : "ru";
    localStorage.setItem("ursa_lang", currentLang);
    applyLang();
});
