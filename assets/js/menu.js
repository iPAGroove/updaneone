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
import { auth, db } from "./app.js";

import {
  doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

const storage = getStorage();

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
// Меню UI
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
// Парсинг .mobileprovision → UDID + Expiration
// ----------------------------------------------------
async function parseMobileProvision(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
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

        const expiryDate = xml.match(/<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/)?.[1]?.split("T")[0] || null;

        resolve({ udid, expiryDate });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}

// ----------------------------------------------------
// Сертификат: рендер карточки
// ----------------------------------------------------
function renderCertificateBlock() {
  const card = $(".certificate-card");
  if (!card) return;

  const udid   = localStorage.getItem("ursa_cert_udid");
  const expiry = localStorage.getItem("ursa_cert_exp");

  const isLoggedIn = !!auth.currentUser;

  const showAddButton = isLoggedIn
    ? `<button class="btn add-cert-btn">Добавить сертификат</button>`
    : `<p class="cert-info-placeholder">Для добавления сертификата, пожалуйста, войдите.</p>`;

  if (!udid) {
    card.innerHTML = showAddButton;
    return;
  }

  const isExpired  = new Date(expiry) < new Date();
  const status     = isExpired ? "❌ Отозван" : "✅ Активен";
  const statusColor= isExpired ? "#ff6b6b" : "#00ff9d";

  const shortUdid  = udid.length > 12 ? `${udid.slice(0, 8)}...` : udid;

  card.innerHTML = `
    <p><strong>ID Профиля:</strong> ${shortUdid}</p>
    <p><strong>Действует до:</strong> ${expiry}</p>
    <p style="font-weight:600;color:${statusColor};">Статус: ${status}</p>
    <button class="btn delete-cert-btn">Удалить сертификат</button>
  `;
}

// ----------------------------------------------------
// Сертификат: импорт
// ----------------------------------------------------
async function importCertificate() {
  const p12 = $("#cert-p12")?.files?.[0];
  const mp  = $("#cert-mobileprovision")?.files?.[0];
  const password = $("#cert-password")?.value?.trim() || "";

  if (!p12 || !mp) return alert("Выберите .p12 и .mobileprovision");

  const user = auth.currentUser;
  if (!user) return alert("Сначала выполните вход.");

  const parsed = await parseMobileProvision(mp);
  if (!parsed.udid || !parsed.expiryDate) return alert("Не удалось извлечь данные профиля.");

  const uid    = user.uid;
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
      expires: parsed.expiryDate,
      pass: password,
      createdAt: new Date().toISOString(),
      p12Url,
      provUrl
    }, { merge: true });

    localStorage.setItem("ursa_cert_udid", parsed.udid);
    localStorage.setItem("ursa_cert_exp", parsed.expiryDate);
    localStorage.setItem("ursa_signer_id", uid);

    certModal?.classList.remove("visible");
    renderCertificateBlock();
    openMenu();
  } catch (err) {
    console.error("❌ Ошибка при импорте сертификата:", err);
    alert(`❌ Ошибка при импорте: проверьте Firebase Rules / консоль.`);
  }
}

// ----------------------------------------------------
// Lifecycle
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // 1) Обработка redirect результата (Safari/редиректы соц.логина)
  try {
    const result = await handleRedirectResult();
    if (result?.user) {
      renderCertificateBlock();
      openMenu();
    }
  } catch (error) {
    console.error("❌ Ошибка при редирект-входе:", error);
    if (error?.code === "auth/account-exists-with-different-credential") {
      alert("Аккаунт с этим email уже существует. Войдите через другой провайдер или через email.");
    }
  }

  // 2) Открытие меню
  menuBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    renderCertificateBlock();
    openMenu();
  });

  // 3) Закрытия: меню, email-модалка, cert-модалка
  menuOverlay?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget || e.target.closest("[data-action='close-menu']")) {
      closeMenu();
    }
  });

  emailModal?.addEventListener("click", (e) => {
    if (e.target === emailModal || e.target.closest("[data-action='close-email']")) {
      emailModal.classList.remove("visible");
    }
  });

  certModal?.addEventListener("click", (e) => {
    if (e.target === certModal || e.target.closest("[data-action='close-cert']")) {
      certModal.classList.remove("visible");
      openMenu();
    }
  });

  // 4) Email-авторизация: открыть форму, логин/регистрация/ресет
  $(".email-auth")?.addEventListener("click", () => {
    closeMenu();
    emailModal?.classList.add("visible");
  });

  $("#email-login-btn")?.addEventListener("click", async () => {
    await loginWithEmail(emailInput.value.trim(), passwordInput.value.trim());
    emailModal?.classList.remove("visible");
    openMenu();
  });

  $("#email-register-btn")?.addEventListener("click", async () => {
    await registerWithEmail(emailInput.value.trim(), passwordInput.value.trim());
    emailModal?.classList.remove("visible");
    openMenu();
  });

  $("#email-reset-btn")?.addEventListener("click", () => {
    resetPassword(emailInput.value.trim());
  });

  // 5) Соц-логины
  $(".google-auth")?.addEventListener("click", async () => {
    closeMenu();
    await loginWithGoogle(); // popup (как сейчас используется)
  });

  $(".facebook-auth")?.addEventListener("click", async () => {
    closeMenu();
    await loginWithFacebook(); // popup (как сейчас используется)
  });

  // 6) Импорт сертификата
  $("#cert-import-btn")?.addEventListener("click", importCertificate);

  // 7) Делегирование кликов по динамическим кнопкам в меню (add/delete cert)
  document.body.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".add-cert-btn");
    if (addBtn) {
      certModal?.classList.add("visible");
      return;
    }
    const delBtn = e.target.closest(".delete-cert-btn");
    if (delBtn) {
      localStorage.removeItem("ursa_cert_udid");
      localStorage.removeItem("ursa_cert_exp");
      localStorage.removeItem("ursa_signer_id");
      renderCertificateBlock();
    }
  });

  // 8) Обновление UI при смене пользователя (ник/аватар/статус)
  onUserChanged(async (user) => {
    if (!user) {
      userNickname.textContent = "Гость";
      userAvatar.src = "https://placehold.co/100x100/121722/00b3ff?text=User";
      renderCertificateBlock();
      return;
    }

    // ник и аватар
    userNickname.textContent = user.displayName || user.email || "Пользователь";
    userAvatar.src = user.photoURL || "https://placehold.co/100x100/121722/00b3ff?text=User";

    // статус
    let status = "free";
    try {
      const snap = await getDoc(doc(db, "ursa_users", user.uid));
      if (snap.exists()) status = snap.data().status || "free";
    } catch (_) {}

    // аккуратно добавляем бейдж, без дублирования
    const badge = document.createElement("span");
    badge.style.marginLeft = "6px";
    badge.style.fontSize = "14px";
    badge.style.fontWeight = status === "vip" ? "700" : "600";
    badge.style.color = status === "vip" ? "#ffab00" : "#9aa7bd";
    badge.textContent = status.toUpperCase();
    userNickname.appendChild(badge);

    renderCertificateBlock();
  });

  // 9) Закрытие меню при переключении вкладок навигации
  $$(".nav-btn").forEach((btn) => {
    if (btn.id !== "menu-btn") {
      btn.addEventListener("click", closeMenu);
    }
  });
});
