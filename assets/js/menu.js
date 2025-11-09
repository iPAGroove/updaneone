// assets/js/menu.js
// ===============================
// Меню + Авторизация + Email Login + Импорт Сертификата + Статус FREE/VIP
// ===============================
import {
  loginWithGoogle,
  loginWithFacebook,
  loginWithEmail,
  registerWithEmail,
  resetPassword,
  handleRedirectResult
} from "./firebase/auth.js";

import { onUserChanged } from "./firebase/user.js";
import { auth, db, app } from "./app.js"; // ✅ важное исправление

import {
  doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// ✅ Storage должен использовать app → иначе Storage уйдет в ipa-panel.appspot.com → 404
const storage = getStorage(app);

// ----------------------------------------------------
// Helpers: DOM
// ----------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Меню и модалки
const menuOverlay = $("#menu-modal");
const menuBtn      = $("#menu-btn");

const emailModal   = $("#email-modal");
const emailInput   = $("#email-input");
const passwordInput= $("#password-input");

const certModal    = $("#cert-modal");

// Профиль
const userAvatar   = $("#user-avatar");
const userNickname = $("#user-nickname");

// ----------------------------------------------------
// UI Меню
// ----------------------------------------------------
function openMenu() {
  menuOverlay?.classList.add("visible");
  document.body.classList.add("modal-open");
}

function closeMenu() {
  menuOverlay?.classList.remove("visible");
  document.body.classList.remove("modal-open");
}

// ----------------------------------------------------
// Парсим UDID + Expiration из .mobileprovision
// ----------------------------------------------------
async function parseMobileProvision(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const text = event.target.result;

        const xmlStart = text.indexOf("<?xml");
        const xmlEnd = text.indexOf("</plist>") + "</plist>".length;
        const xml = text.substring(xmlStart, xmlEnd);

        const udidBlock = xml.match(/<key>ProvisionedDevices<\/key>[\s\S]*?<array>([\s\S]*?)<\/array>/);
        let udid = null;

        if (udidBlock) {
          const list = [...udidBlock[1].matchAll(/<string>([^<]+)<\/string>/g)];
          if (list.length > 0) udid = list[0][1];
        }

        if (!udid)
          udid = xml.match(/<key>UUID<\/key>\s*<string>([^<]+)<\/string>/)?.[1] || null;

        const expiry = xml.match(/<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/)?.[1]?.split("T")[0] || null;

        resolve({ udid, expiry });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}

// ----------------------------------------------------
// Рендер сертификата
// ----------------------------------------------------
function renderCertificateBlock() {
  const card = $(".certificate-card");
  if (!card) return;

  const udid   = localStorage.getItem("ursa_cert_udid");
  const expiry = localStorage.getItem("ursa_cert_exp");
  const logged = !!auth.currentUser;

  if (!udid) {
    card.innerHTML = logged
      ? `<button class="btn add-cert-btn">Добавить сертификат</button>`
      : `<p class="cert-info-placeholder">Для добавления сертификата, пожалуйста, войдите.</p>`;
    return;
  }

  const expired = new Date(expiry) < new Date();
  const shortUdid = udid.length > 12 ? udid.slice(0, 8) + "..." : udid;

  card.innerHTML = `
    <p><strong>ID Профиля:</strong> ${shortUdid}</p>
    <p><strong>Действует до:</strong> ${expiry}</p>
    <p style="font-weight:600;color:${expired ? "#ff6b6b" : "#00ff9d"};">Статус: ${expired ? "❌ Отозван" : "✅ Активен"}</p>
    <button class="btn delete-cert-btn">Удалить сертификат</button>
  `;
}

// ----------------------------------------------------
// Импорт сертификата
// ----------------------------------------------------
async function importCertificate() {
  const p12 = $("#cert-p12")?.files?.[0];
  const mp  = $("#cert-mobileprovision")?.files?.[0];
  const password = $("#cert-password")?.value?.trim() || "";

  if (!p12 || !mp) return alert("Выберите .p12 и .mobileprovision");
  if (!auth.currentUser) return alert("Сначала выполните вход.");

  const parsed = await parseMobileProvision(mp);
  if (!parsed.udid || !parsed.expiry) return alert("Не удалось извлечь данные профиля (.mobileprovision).");

  const uid = auth.currentUser.uid;
  const folder = `signers/${uid}/`;

  const p12Ref  = ref(storage, folder + p12.name);
  const provRef = ref(storage, folder + mp.name);

  try {
    await uploadBytes(p12Ref, p12);
    await uploadBytes(provRef, mp);

    const p12Url  = await getDownloadURL(p12Ref);
    const provUrl = await getDownloadURL(provRef);

    await setDoc(doc(db, "ursa_signers", uid), {
      udid: parsed.udid,
      expires: parsed.expiry,
      pass: password,
      createdAt: new Date().toISOString(),
      p12Url,
      provUrl
    }, { merge: true });

    localStorage.setItem("ursa_cert_udid", parsed.udid);
    localStorage.setItem("ursa_cert_exp", parsed.expiry);
    localStorage.setItem("ursa_signer_id", uid);

    certModal?.classList.remove("visible");
    renderCertificateBlock();
    openMenu();
  } catch (err) {
    console.error("❌ Ошибка при импорте сертификата:", err);
    alert("❌ Ошибка при загрузке сертификата. Проверь Firebase Storage Rules.");
  }
}

// ----------------------------------------------------
// Lifecycle
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  try { await handleRedirectResult(); } catch {}

  menuBtn?.addEventListener("click", () => { renderCertificateBlock(); openMenu(); });

  menuOverlay?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget || e.target.closest("[data-action='close-menu']"))
      closeMenu();
  });

  emailModal?.addEventListener("click", (e) => {
    if (e.target === emailModal || e.target.closest("[data-action='close-email']"))
      emailModal.classList.remove("visible");
  });

  certModal?.addEventListener("click", (e) => {
    if (e.target === certModal || e.target.closest("[data-action='close-cert']")) {
      certModal.classList.remove("visible");
      openMenu();
    }
  });

  $(".email-auth")?.addEventListener("click", () => { closeMenu(); emailModal.classList.add("visible"); });

  $("#email-login-btn")?.addEventListener("click", async () => {
    await loginWithEmail(emailInput.value.trim(), passwordInput.value.trim());
    emailModal.classList.remove("visible");
    openMenu();
  });

  $("#email-register-btn")?.addEventListener("click", async () => {
    await registerWithEmail(emailInput.value.trim(), passwordInput.value.trim());
    emailModal.classList.remove("visible");
    openMenu();
  });

  $("#email-reset-btn")?.addEventListener("click", () =>
    resetPassword(emailInput.value.trim())
  );

  $(".google-auth")?.addEventListener("click", async () => { closeMenu(); await loginWithGoogle(); });
  $(".facebook-auth")?.addEventListener("click", async () => { closeMenu(); await loginWithFacebook(); });

  $("#cert-import-btn")?.addEventListener("click", importCertificate);

  document.body.addEventListener("click", (e) => {
    if (e.target.closest(".add-cert-btn")) certModal.classList.add("visible");
    if (e.target.closest(".delete-cert-btn")) {
      localStorage.removeItem("ursa_cert_udid");
      localStorage.removeItem("ursa_cert_exp");
      localStorage.removeItem("ursa_signer_id");
      renderCertificateBlock();
    }
  });

  onUserChanged(async (user) => {
    if (!user) {
      userNickname.textContent = "Гость";
      userAvatar.src = "https://placehold.co/100x100/121722/00b3ff?text=User";
      renderCertificateBlock();
      return;
    }

    userNickname.textContent = user.displayName || user.email;
    userAvatar.src = user.photoURL || "https://placehold.co/100x100/121722/00b3ff?text=User";

    let status = "free";
    try {
      const snap = await getDoc(doc(db, "ursa_users", user.uid));
      if (snap.exists()) status = snap.data().status || "free";
    } catch {}

    const badge = document.createElement("span");
    badge.textContent = status.toUpperCase();
    badge.style.marginLeft = "6px";
    badge.style.color = status === "vip" ? "#ffab00" : "#9aa7bd";
    userNickname.appendChild(badge);

    renderCertificateBlock();
  });

  $$(".nav-btn").forEach((btn) => {
    if (btn.id !== "menu-btn") btn.addEventListener("click", closeMenu);
  });
});
function openMenu() {
  menuOverlay?.classList.add("visible");
  document.body.classList.add("modal-open");
}

function closeMenu() {
  menuOverlay?.classList.remove("visible");
  document.body.classList.remove("modal-open");
}

// ----------------------------------------------------
// Парсим UDID + Expiration из .mobileprovision
// ----------------------------------------------------
async function parseMobileProvision(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const text = event.target.result;

        const xmlStart = text.indexOf("<?xml");
        const xmlEnd = text.indexOf("</plist>") + "</plist>".length;
        const xml = text.substring(xmlStart, xmlEnd);

        const udidBlock = xml.match(/<key>ProvisionedDevices<\/key>[\s\S]*?<array>([\s\S]*?)<\/array>/);
        let udid = null;

        if (udidBlock) {
          const list = [...udidBlock[1].matchAll(/<string>([^<]+)<\/string>/g)];
          if (list.length > 0) udid = list[0][1];
        }

        if (!udid)
          udid = xml.match(/<key>UUID<\/key>\s*<string>([^<]+)<\/string>/)?.[1] || null;

        const expiry = xml.match(/<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/)?.[1]?.split("T")[0] || null;

        resolve({ udid, expiry });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}

// ----------------------------------------------------
// Рендер сертификата
// ----------------------------------------------------
function renderCertificateBlock() {
  const card = $(".certificate-card");
  if (!card) return;

  const udid   = localStorage.getItem("ursa_cert_udid");
  const expiry = localStorage.getItem("ursa_cert_exp");
  const logged = !!auth.currentUser;

  if (!udid) {
    card.innerHTML = logged
      ? `<button class="btn add-cert-btn">Добавить сертификат</button>`
      : `<p class="cert-info-placeholder">Для добавления сертификата, пожалуйста, войдите.</p>`;
    return;
  }

  const expired = new Date(expiry) < new Date();
  const shortUdid = udid.length > 12 ? udid.slice(0, 8) + "..." : udid;

  card.innerHTML = `
    <p><strong>ID Профиля:</strong> ${shortUdid}</p>
    <p><strong>Действует до:</strong> ${expiry}</p>
    <p style="font-weight:600;color:${expired ? "#ff6b6b" : "#00ff9d"};">Статус: ${expired ? "❌ Отозван" : "✅ Активен"}</p>
    <button class="btn delete-cert-btn">Удалить сертификат</button>
  `;
}

// ----------------------------------------------------
// Импорт сертификата
// ----------------------------------------------------
async function importCertificate() {
  const p12 = $("#cert-p12")?.files?.[0];
  const mp  = $("#cert-mobileprovision")?.files?.[0];
  const password = $("#cert-password")?.value?.trim() || "";

  if (!p12 || !mp) return alert("Выберите .p12 и .mobileprovision");
  if (!auth.currentUser) return alert("Сначала выполните вход.");

  const parsed = await parseMobileProvision(mp);
  if (!parsed.udid || !parsed.expiry) return alert("Не удалось извлечь данные профиля (.mobileprovision).");

  const uid = auth.currentUser.uid;
  const folder = `signers/${uid}/`;

  const p12Ref  = ref(storage, folder + p12.name);
  const provRef = ref(storage, folder + mp.name);

  try {
    await uploadBytes(p12Ref, p12);
    await uploadBytes(provRef, mp);

    const p12Url  = await getDownloadURL(p12Ref);
    const provUrl = await getDownloadURL(provRef);

    await setDoc(doc(db, "ursa_signers", uid), {
      udid: parsed.udid,
      expires: parsed.expiry,
      pass: password,
      createdAt: new Date().toISOString(),
      p12Url,
      provUrl
    }, { merge: true });

    localStorage.setItem("ursa_cert_udid", parsed.udid);
    localStorage.setItem("ursa_cert_exp", parsed.expiry);
    localStorage.setItem("ursa_signer_id", uid);

    certModal?.classList.remove("visible");
    renderCertificateBlock();
    openMenu();
  } catch (err) {
    console.error("❌ Ошибка при импорте сертификата:", err);
    alert("❌ Ошибка при загрузке сертификата. Проверь Firebase Storage Rules.");
  }
}

// ----------------------------------------------------
// Lifecycle
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  try { await handleRedirectResult(); } catch {}

  menuBtn?.addEventListener("click", () => { renderCertificateBlock(); openMenu(); });

  menuOverlay?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget || e.target.closest("[data-action='close-menu']"))
      closeMenu();
  });

  emailModal?.addEventListener("click", (e) => {
    if (e.target === emailModal || e.target.closest("[data-action='close-email']"))
      emailModal.classList.remove("visible");
  });

  certModal?.addEventListener("click", (e) => {
    if (e.target === certModal || e.target.closest("[data-action='close-cert']")) {
      certModal.classList.remove("visible");
      openMenu();
    }
  });

  $(".email-auth")?.addEventListener("click", () => { closeMenu(); emailModal.classList.add("visible"); });

  $("#email-login-btn")?.addEventListener("click", async () => {
    await loginWithEmail(emailInput.value.trim(), passwordInput.value.trim());
    emailModal.classList.remove("visible");
    openMenu();
  });

  $("#email-register-btn")?.addEventListener("click", async () => {
    await registerWithEmail(emailInput.value.trim(), passwordInput.value.trim());
    emailModal.classList.remove("visible");
    openMenu();
  });

  $("#email-reset-btn")?.addEventListener("click", () =>
    resetPassword(emailInput.value.trim())
  );

  $(".google-auth")?.addEventListener("click", async () => { closeMenu(); await loginWithGoogle(); });
  $(".facebook-auth")?.addEventListener("click", async () => { closeMenu(); await loginWithFacebook(); });

  $("#cert-import-btn")?.addEventListener("click", importCertificate);

  document.body.addEventListener("click", (e) => {
    if (e.target.closest(".add-cert-btn")) certModal.classList.add("visible");
    if (e.target.closest(".delete-cert-btn")) {
      localStorage.removeItem("ursa_cert_udid");
      localStorage.removeItem("ursa_cert_exp");
      localStorage.removeItem("ursa_signer_id");
      renderCertificateBlock();
    }
  });

  onUserChanged(async (user) => {
    if (!user) {
      userNickname.textContent = "Гость";
      userAvatar.src = "https://placehold.co/100x100/121722/00b3ff?text=User";
      renderCertificateBlock();
      return;
    }

    userNickname.textContent = user.displayName || user.email;
    userAvatar.src = user.photoURL || "https://placehold.co/100x100/121722/00b3ff?text=User";

    let status = "free";
    try {
      const snap = await getDoc(doc(db, "ursa_users", user.uid));
      if (snap.exists()) status = snap.data().status || "free";
    } catch {}

    const badge = document.createElement("span");
    badge.textContent = status.toUpperCase();
    badge.style.marginLeft = "6px";
    badge.style.color = status === "vip" ? "#ffab00" : "#9aa7bd";
    userNickname.appendChild(badge);

    renderCertificateBlock();
  });

  $$(".nav-btn").forEach((btn) => {
    if (btn.id !== "menu-btn") btn.addEventListener("click", closeMenu);
  });
});
