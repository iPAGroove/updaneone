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
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMenu();
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
    // 🔒 Cert Upload Modal (Добавить сертификат)
    // ===============================
    const addCertBtn = document.querySelector(".add-cert-btn");
    const certModal = document.getElementById("cert-modal");
    
    // Элементы для файлов и пароля
    const p12FileEl = document.getElementById("p12-file");
    const p12FilenameEl = document.getElementById("p12-filename");
    const provisionFileEl = document.getElementById("provision-file");
    const provisionFilenameEl = document.getElementById("provision-filename");
    const certPasswordInput = document.getElementById("cert-password-input");

    function openCertModal() {
        closeMenu();
        certModal.classList.add("visible");
    }

    function closeCertModal() {
        certModal.classList.remove("visible");
    }

    addCertBtn?.addEventListener("click", openCertModal);
    
    // Закрытие по клику вне модалки или по кнопке
    certModal?.addEventListener("click", (e) => {
        if (e.target === certModal || e.target.closest("[data-action='close-cert']")) closeCertModal();
    });

    // Закрытие по Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && certModal.classList.contains("visible")) closeCertModal();
    });

    // Обновление имени файла .p12
    p12FileEl.addEventListener("change", () => {
        if (p12FileEl.files.length > 0) {
            p12FilenameEl.textContent = p12FileEl.files[0].name;
        } else {
            p12FilenameEl.textContent = "Выберите файл .p12";
        }
    });

    // Обновление имени файла .mobileprovision
    provisionFileEl.addEventListener("change", () => {
        if (provisionFileEl.files.length > 0) {
            provisionFilenameEl.textContent = provisionFileEl.files[0].name;
        } else {
            provisionFilenameEl.textContent = "Выберите файл .mobileprovision";
        }
    });

    // Логика загрузки (заглушка)
    document.getElementById("upload-cert-btn")?.addEventListener("click", () => {
        const p12 = p12FileEl.files[0];
        const mobileprovision = provisionFileEl.files[0];
        const password = certPasswordInput.value.trim();

        if (!p12 || !mobileprovision || !password) {
            alert("Пожалуйста, выберите оба файла и введите пароль.");
            return;
        }

        console.log("Попытка загрузки сертификата:", {
            p12: p12.name,
            mobileprovision: mobileprovision.name,
            passwordLength: password.length
        });
        
        alert("Загрузка и обработка сертификата пока не реализованы. Данные собраны!");
        // closeCertModal(); 
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
            return;
        }
        nickEl.textContent = user.displayName || user.email || "Пользователь";
        avatarEl.src = user.photoURL || "https://placehold.co/100x100/121722/00b3ff?text=User";
    });
});
