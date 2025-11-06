// ===============================
// Меню + Авторизация + Email Login + Смена Языка + Импорт Сертификата
// ===============================
import {
    loginWithGoogle,
    loginWithFacebook,
    loginWithEmail,
    registerWithEmail,
    resetPassword
} from "./firebase/auth.js";

import { onUserChanged } from "./firebase/user.js";
import { auth, db } from "./firebase.js";

import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

const storage = getStorage();

// ===============================
// 📌 Рендер блока сертификата
// ===============================
function renderCertificateBlock() {
    const card = document.querySelector(".certificate-card");
    const signerId = localStorage.getItem("ursa_signer_id");
    const account = localStorage.getItem("ursa_cert_account");
    const expires = localStorage.getItem("ursa_cert_exp");

    if (!signerId) {
        card.innerHTML = `
            <p class="cert-info-placeholder">Данные о сертификате будут здесь</p>
            <button class="btn add-cert-btn">Добавить сертификат</button>
        `;
        return;
    }

    const expDate = new Date(expires).toLocaleDateString("ru-RU");
    card.innerHTML = `
        <p><strong>Apple ID:</strong> ${account}</p>
        <p><strong>Действует до:</strong> ${expDate}</p>
        <button class="btn delete-cert-btn">Удалить сертификат</button>
    `;
}

// ===============================
// 📥 Импорт сертификата
// ===============================
async function importCertificate() {
    const p12 = document.getElementById("cert-p12").files[0];
    const mp = document.getElementById("cert-mobileprovision").files[0];
    const password = document.getElementById("cert-password").value.trim() || "";

    if (!p12 || !mp) {
        alert("Выберите .p12 и .mobileprovision");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert("Сначала выполните вход.");
        return;
    }

    const uid = user.uid;
    const folder = `signers/${uid}/`;

    const p12Ref = ref(storage, folder + p12.name);
    const mpRef = ref(storage, folder + mp.name);

    await uploadBytes(p12Ref, p12);
    await uploadBytes(mpRef, mp);

    const p12Url = await getDownloadURL(p12Ref);
    const mpUrl = await getDownloadURL(mpRef);
    const expires = new Date(Date.now() + 31536000000).toISOString(); // +1 год

    await setDoc(doc(db, "ursa_signers", uid), {
        p12Url,
        provUrl: mpUrl,
        pass: password,
        expires,
        createdAt: new Date().toISOString()
    }, { merge: true });

    // localStorage обновление
    localStorage.setItem("ursa_signer_id", uid);
    localStorage.setItem("ursa_cert_account", user.email || uid);
    localStorage.setItem("ursa_cert_exp", expires);

    document.getElementById("cert-modal").classList.remove("visible");
    renderCertificateBlock();
    document.getElementById("menu-modal").classList.add("visible");
}

document.addEventListener("DOMContentLoaded", () => {

    // ===============================
    // 📌 Меню
    // ===============================
    const menuBtn = document.getElementById("menu-btn");
    const menuOverlay = document.getElementById("menu-modal");

    function openMenu() {
        renderCertificateBlock();
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
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

    // ===============================
    // 🌍 Смена языка
    // ===============================
    const changeLangBtn = document.querySelector(".change-lang-btn");
    let currentLang = localStorage.getItem("ursa_lang") || "ru";

    const uiText = {
        ru: { selectPlan: "Выбрать план", buyCert: "Купить сертификат", changeLang: "Сменить язык", aboutUs: "О нас" },
        en: { selectPlan: "Select Plan", buyCert: "Buy Certificate", changeLang: "Change Language", aboutUs: "About Us" }
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
    // 🔐 Соц вход
    // ===============================
    document.querySelector(".google-auth")?.addEventListener("click", async () => { await loginWithGoogle(); closeMenu(); });
    document.querySelector(".facebook-auth")?.addEventListener("click", async () => { await loginWithFacebook(); closeMenu(); });

    // ===============================
    // ✉ Email auth
    // ===============================
    const emailBtn = document.querySelector(".email-auth");
    const emailModal = document.getElementById("email-modal");

    emailBtn?.addEventListener("click", () => { closeMenu(); emailModal.classList.add("visible"); });
    emailModal.addEventListener("click", (e) => { if (e.target === emailModal || e.target.closest("[data-action='close-email']")) emailModal.classList.remove("visible"); });

    document.getElementById("email-login-btn")?.addEventListener("click", async () => {
        await loginWithEmail(emailInput.value.trim(), passwordInput.value.trim());
        emailModal.classList.remove("visible");
        openMenu();
    });

    document.getElementById("email-register-btn")?.addEventListener("click", async () => {
        await registerWithEmail(emailInput.value.trim(), passwordInput.value.trim());
        emailModal.classList.remove("visible");
        openMenu();
    });

    document.getElementById("email-reset-btn")?.addEventListener("click", () => resetPassword(emailInput.value.trim()));

    // ===============================
    // 👤 Профиль
    // ===============================
    onUserChanged((user) => {
        document.getElementById("user-nickname").textContent = user?.displayName || user?.email || "Гость";
        document.getElementById("user-avatar").src = user?.photoURL || "https://placehold.co/100x100/121722/00b3ff?text=User";
    });

    // ===============================
    // 💳 Модалка сертификата
    // ===============================
    document.body.addEventListener("click", (e) => {
        if (e.target.classList.contains("add-cert-btn")) document.getElementById("cert-modal").classList.add("visible");
        if (e.target.classList.contains("delete-cert-btn")) {
            localStorage.removeItem("ursa_signer_id");
            localStorage.removeItem("ursa_cert_account");
            localStorage.removeItem("ursa_cert_exp");
            renderCertificateBlock();
        }
    });

    document.getElementById("cert-import-btn").onclick = importCertificate;
});
