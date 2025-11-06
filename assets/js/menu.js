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
import { uploadCertificate, getCertificate, deleteCertificate } from "./cert.js";

document.addEventListener("DOMContentLoaded", () => {
  // ---------- helpers ----------
  const safe = (fn) => (...args) => { try { return fn(...args); } catch (e) { console.error("[menu.js]", e); } };

  // ===============================
  // 📌 Меню
  // ===============================
  const menuBtn = document.getElementById("menu-btn");
  const menuOverlay = document.getElementById("menu-modal");

  const openMenu = safe(() => {
    if (!menuOverlay) return;
    menuOverlay.classList.add("visible");
    document.body.classList.add("modal-open");
    queueMicrotask(renderCertUI); // не блокируем открытие
  });

  const closeMenu = safe(() => {
    if (!menuOverlay) return;
    menuOverlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
  });

  if (menuBtn) menuBtn.addEventListener("click", openMenu);
  if (menuOverlay) {
    menuOverlay.addEventListener("click", safe((e) => {
      if (e.target === menuOverlay || e.target.closest("[data-action='close-menu']")) closeMenu();
    }));
  }
  document.addEventListener("keydown", safe((e) => {
    if (e.key === "Escape") closeMenu();
  }));

  // ===============================
  // 🌍 Смена языка
  // ===============================
  const changeLangBtn = document.querySelector(".change-lang-btn");
  let currentLang = localStorage.getItem("ursa_lang") || "ru";

  const uiText = {
    ru: { selectPlan: "Выбрать план", buyCert: "Купить сертификат", changeLang: "Сменить язык", aboutUs: "О нас" },
    en: { selectPlan: "Select Plan", buyCert: "Buy Certificate", changeLang: "Change Language", aboutUs: "About Us" }
  };

  const applyLang = safe(() => {
    const s1 = document.querySelector(".select-plan-btn");
    const s2 = document.querySelector(".buy-cert-btn");
    const s3 = document.querySelector(".change-lang-btn");
    const s4 = document.querySelector(".about-us-btn");
    if (s1) s1.textContent = uiText[currentLang].selectPlan;
    if (s2) s2.textContent = uiText[currentLang].buyCert;
    if (s3) s3.textContent = uiText[currentLang].changeLang;
    if (s4) s4.textContent = uiText[currentLang].aboutUs;
  });

  applyLang();

  if (changeLangBtn) {
    changeLangBtn.addEventListener("click", safe(() => {
      currentLang = currentLang === "ru" ? "en" : "ru";
      localStorage.setItem("ursa_lang", currentLang);
      applyLang();
    }));
  }

  // ===============================
  // 🔐 Авторизация
  // ===============================
  document.querySelector(".google-auth")?.addEventListener("click", safe(async () => {
    await loginWithGoogle();
    closeMenu();
  }));
  document.querySelector(".facebook-auth")?.addEventListener("click", safe(async () => {
    await loginWithFacebook();
    closeMenu();
  }));

  // ===============================
  // ✉ Email Modal
  // ===============================
  const emailBtn = document.querySelector(".email-auth");
  const emailModal = document.getElementById("email-modal");

  const openEmailModal = safe(() => { closeMenu(); emailModal?.classList.add("visible"); });
  const closeEmailModal = safe(() => { emailModal?.classList.remove("visible"); });

  if (emailBtn) emailBtn.addEventListener("click", openEmailModal);
  if (emailModal) {
    emailModal.addEventListener("click", safe((e) => {
      if (e.target === emailModal || e.target.closest("[data-action='close-email']")) closeEmailModal();
    }));
  }
  document.addEventListener("keydown", safe((e) => {
    if (e.key === "Escape") closeEmailModal();
  }));

  const emailInput = document.getElementById("email-input");
  const passwordInput = document.getElementById("password-input");

  document.getElementById("email-login-btn")?.addEventListener("click", safe(async () => {
    await loginWithEmail(emailInput?.value.trim() || "", passwordInput?.value.trim() || "");
    closeEmailModal(); openMenu();
  }));
  document.getElementById("email-register-btn")?.addEventListener("click", safe(async () => {
    await registerWithEmail(emailInput?.value.trim() || "", passwordInput?.value.trim() || "");
    closeEmailModal(); openMenu();
  }));
  document.getElementById("email-reset-btn")?.addEventListener("click", safe(() => {
    resetPassword(emailInput?.value.trim() || "");
  }));

  // ===============================
  // ✅ CERTIFICATE UPLOAD MODAL (2 файла)
  // ===============================
  const certModal = document.getElementById("cert-modal");
  const addCertBtn = document.querySelector(".add-cert-btn");

  const openCertModal = safe(() => { closeMenu(); certModal?.classList.add("visible"); });
  const closeCertModal = safe(() => { certModal?.classList.remove("visible"); });

  if (addCertBtn) addCertBtn.addEventListener("click", openCertModal);
  if (certModal) {
    certModal.addEventListener("click", safe((e) => {
      if (e.target === certModal || e.target.closest("[data-action='close-cert']")) closeCertModal();
    }));
  }

  document.getElementById("cert-upload-btn")?.addEventListener("click", safe(async () => {
    const fileP12 = document.getElementById("cert-file-p12")?.files?.[0] || null;
    const fileMobile = document.getElementById("cert-file-mobile")?.files?.[0] || null;
    const pass = document.getElementById("cert-pass")?.value?.trim() || "";

    if (!fileP12 || !fileMobile) {
      alert("Выберите .p12 и .mobileprovision");
      return;
    }

    await uploadCertificate(fileP12, fileMobile, pass);
    closeCertModal();
    openMenu();
  }));

  // ===============================
  // 🧩 Рендер UI сертификата
  // ===============================
  async function renderCertUI() {
    const certBlock = document.querySelector(".certificate-card");
    if (!certBlock) return;

    let certData = null;
    try { certData = await getCertificate(); } catch (e) { console.warn("getCertificate:", e); }

    if (!certData) {
      certBlock.innerHTML = `
        <p class="cert-info-placeholder">Данные о сертификате будут здесь</p>
        <button class="btn add-cert-btn">Добавить сертификат</button>
      `;
      certBlock.querySelector(".add-cert-btn")?.addEventListener("click", openCertModal);
      return;
    }

    const expireText = certData.expiresAt
      ? new Date(certData.expiresAt).toLocaleDateString()
      : (certData.expiration || "—");

    certBlock.innerHTML = `
      <p class="cert-info-placeholder">
        UDID: <b>${certData.udid || "—"}</b><br>
        Доступен до: <b>${expireText}</b>
      </p>
      <button class="btn buy-cert-btn delete-cert-btn">Удалить сертификат</button>
    `;

    certBlock.querySelector(".delete-cert-btn")?.addEventListener("click", safe(async () => {
      await deleteCertificate();
      await renderCertUI();
    }));
  }

  // ===============================
  // 👤 Обновление UI пользователя
  // ===============================
  const nickEl = document.getElementById("user-nickname");
  const avatarEl = document.getElementById("user-avatar");

  onUserChanged((user) => {
    if (!nickEl || !avatarEl) return;

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
