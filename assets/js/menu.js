// ===============================
// Меню + Авторизация + Email Login + Смена Языка + Сертификат
// ===============================

import {
    loginWithGoogle,
    loginWithFacebook,
    loginWithEmail,
    registerWithEmail,
    resetPassword
} from "./firebase/auth.js";

import { onUserChanged } from "./firebase/user.js";
import { uploadCertificate, getCertificate, deleteCertificate } from "./firebase/cert.js";

document.addEventListener("DOMContentLoaded", () => {

    // ===============================
    // 📌 Меню
    // ===============================
    const menuBtn = document.getElementById("menu-btn");
    const menuOverlay = document.getElementById("menu-modal");

    function openMenu() {
        menuOverlay.classList.add("visible");
        document.body.classList.add("modal-open");
        renderCertUI(); // ✅ всегда перерисовываем блок сертификата
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
    // 🔐 Авторизация
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
    // ✉ Email Modal
    // ===============================
    const emailBtn = document.querySelector(".email-auth");
    const emailModal = document.getElementById("email-modal");

    function openEmailModal() { closeMenu(); emailModal.classList.add("visible"); }
    function closeEmailModal() { emailModal.classList.remove("visible"); }

    emailBtn?.addEventListener("click", openEmailModal);
    emailModal?.addEventListener("click", (e) => {
        if (e.target === emailModal || e.target.closest("[data-action='close-email']")) closeEmailModal();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeEmailModal();
    });

    const emailInput = document.getElementById("email-input");
    const passwordInput = document.getElementById("password-input");

    document.getElementById("email-login-btn")?.addEventListener("click", async () => {
        await loginWithEmail(emailInput.value.trim(), passwordInput.value.trim());
        closeEmailModal(); openMenu();
    });

    document.getElementById("email-register-btn")?.addEventListener("click", async () => {
        await registerWithEmail(emailInput.value.trim(), passwordInput.value.trim());
        closeEmailModal(); openMenu();
    });

    document.getElementById("email-reset-btn")?.addEventListener("click", () => {
        resetPassword(emailInput.value.trim());
    });


    // ===============================
    // ✅ CERTIFICATE UPLOAD MODAL
    // ===============================
    const certModal = document.getElementById("cert-modal");
    const addCertBtn = document.querySelector(".add-cert-btn");

    function openCertModal() {
        closeMenu();
        certModal.classList.add("visible");
    }
    function closeCertModal() {
        certModal.classList.remove("visible");
    }

    addCertBtn?.addEventListener("click", openCertModal);
    certModal?.addEventListener("click", (e) => {
        if (e.target === certModal || e.target.closest("[data-action='close-cert']")) closeCertModal();
    });

    document.getElementById("cert-upload-btn")?.addEventListener("click", async () => {
        const file = document.getElementById("cert-file").files[0];
        const pass = document.getElementById("cert-pass").value.trim();

        if (!file) return alert("Выберите файл сертификата.");

        await uploadCertificate(file, pass);
        closeCertModal();
        openMenu();
    });


    // ===============================
    // 🧩 Рендер UI сертификата
    // ===============================
    async function renderCertUI() {
        const certBlock = document.querySelector(".certificate-card");
        const certData = await getCertificate();

        if (!certData) {
            certBlock.innerHTML = `
                <p class="cert-info-placeholder">Данные о сертификате будут здесь</p>
                <button class="btn add-cert-btn">Добавить сертификат</button>
            `;
            certBlock.querySelector(".add-cert-btn").addEventListener("click", openCertModal);
            return;
        }

        certBlock.innerHTML = `
            <p class="cert-info-placeholder">
                UDID: <b>${certData.udid}</b><br>
                Доступен до: <b>${certData.expiresAt}</b>
            </p>
            <button class="btn buy-cert-btn delete-cert-btn">Удалить сертификат</button>
        `;

        certBlock.querySelector(".delete-cert-btn").addEventListener("click", async () => {
            await deleteCertificate();
            renderCertUI();
        });
    }


    // ===============================
    // 👤 Обновление UI пользователя
    // ===============================
    const nickEl = document.getElementById("user-nickname");
    const avatarEl = document.getElementById("user-avatar");

    onUserChanged((user) => {
        if (!user) {
            nickEl.textContent = "Гость";
            avatarEl.src = "https://placehold.co/100x100/121722/00b3ff?text=User";
            renderCertUI();
            return;
        }

        nickEl.textContent = user.displayName || user.email || "Пользователь";
        avatarEl.src = user.photoURL || "https://placehold.co/100x100/121722/00b3ff?text=User";

        renderCertUI();
    });

});
