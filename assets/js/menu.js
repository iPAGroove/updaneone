// assets/js/menu.js
// ===============================
// Меню + Авторизация + Сертификат + VIP статус + i18n
// ===============================

import {
  loginWithGoogle,
  loginWithFacebook,
  loginWithEmail,
  registerWithEmail,
  resetPassword,
  handleRedirectResult,
} from "./firebase/auth.js";

import { onUserChanged } from "./firebase/user.js";
import { auth, db } from "./app.js";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

import { t, currentLang, switchLang } from "./i18n.js";

const storage = getStorage();

/* ============================================================
   🔧 Парсинг mobileprovision → UDID + Expiration
   ============================================================ */
async function parseMobileProvision(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const xml = text.substring(text.indexOf("<?xml"), text.indexOf("</plist>") + 8);

        let udid = null;

        const udidBlock = xml.match(
          /<key>ProvisionedDevices<\/key>[\s\S]*?<array>([\s\S]*?)<\/array>/
        );

        if (udidBlock) {
          const list = [...udidBlock[1].matchAll(/<string>([^<]+)<\/string>/g)];
          if (list.length > 0) udid = list[0][1];
        }

        if (!udid)
          udid = xml.match(/<key>UUID<\/key>\s*<string>([^<]+)<\/string>/)?.[1] || null;

        const expiryDate =
          xml.match(/<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/)?.[1]?.split("T")[0] ||
          null;

        resolve({ udid, expiryDate });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}

/* ============================================================
   🧩 Отображение сертификата (переводы + компактно)
   ============================================================ */
function renderCertificateBlock() {
  const card = document.querySelector(".certificate-card");
  const udid = localStorage.getItem("ursa_cert_udid");
  const expiry = localStorage.getItem("ursa_cert_exp");
  const isLoggedIn = !!auth.currentUser;

  if (!udid) {
    card.innerHTML = isLoggedIn
      ? `<button class="btn add-cert-btn">${t("addCert")}</button>`
      : `<p class="cert-info-placeholder">${currentLang === "ru"
          ? "Для управления сертификатом необходимо войти."
          : "You must log in to manage the certificate."
        }</p>`;
    return;
  }

  const isExpired = new Date(expiry) < new Date();

  card.innerHTML = `
    <div class="cert-info">
      <div class="cert-row">
        <span class="cert-label">${t("certId")}:</span>
        <span class="cert-value mono">${udid}</span>
      </div>
      <div class="cert-row">
        <span class="cert-label">${t("certExpires")}:</span>
        <span class="cert-value">${expiry}</span>
      </div>
      <div class="cert-row">
        <span class="cert-label">${t("certStatus")}:</span>
        <span class="cert-value" style="color:${isExpired ? "#ff6b6b" : "#00ff9d"};font-weight:600;">
          ${isExpired ? t("certRevoked") : t("certActive")}
        </span>
      </div>
    </div>

    <button class="btn delete-cert-btn">${t("deleteCert")}</button>
  `;
}

/* ============================================================
   📥 Импорт сертификата
   ============================================================ */
async function importCertificate() {
  const p12 = document.getElementById("cert-p12").files[0];
  const mp = document.getElementById("cert-mobileprovision").files[0];
  const password = document.getElementById("cert-password").value.trim() || "";

  if (!p12 || !mp)
    return alert(currentLang === "ru" ? "Выберите .p12 и .mobileprovision" : "Select .p12 and .mobileprovision");

  const user = auth.currentUser;
  if (!user) return alert(currentLang === "ru" ? "Сначала войдите." : "Please log in first.");

  const parsed = await parseMobileProvision(mp);
  if (!parsed.udid || !parsed.expiryDate)
    return alert(currentLang === "ru" ? "Ошибка: нет UDID." : "Failed to extract UDID.");

  const uid = user.uid;
  const folder = `signers/${uid}/`;

  try {
    const p12Ref = ref(storage, folder + p12.name);
    const mpRef = ref(storage, folder + mp.name);

    await uploadBytes(p12Ref, p12);
    await uploadBytes(mpRef, mp);

    const p12Url = await getDownloadURL(p12Ref);
    const mpUrl = await getDownloadURL(mpRef);

    await setDoc(
      doc(db, "ursa_signers", uid),
      {
        udid: parsed.udid,
        expires: parsed.expiryDate,
        pass: password,
        createdAt: new Date().toISOString(),
        p12Url,
        provUrl: mpUrl,
      },
      { merge: true }
    );

    localStorage.setItem("ursa_cert_udid", parsed.udid);
    localStorage.setItem("ursa_cert_exp", parsed.expiryDate);
    localStorage.setItem("ursa_signer_id", uid);

    document.getElementById("cert-modal").classList.remove("visible");
    renderCertificateBlock();
    openMenu();
  } catch {
    alert(currentLang === "ru" ? "Ошибка загрузки" : "Upload error");
  }
}

/* ============================================================
   📂 Открыть / закрыть меню
   ============================================================ */
function openMenu() {
  document.getElementById("menu-modal").classList.add("visible");
  document.body.classList.add("modal-open");
}
function closeMenu() {
  document.getElementById("menu-modal").classList.remove("visible");
  document.body.classList.remove("modal-open");
}

/* ============================================================
   🧠 Перерисовка текстов меню при смене языка
   ============================================================ */
function refreshMenuTexts() {
  document.querySelector(".change-lang-btn").textContent = t("changeLang");
  document.querySelector(".buy-cert-btn").textContent = t("buyCert");
  document.querySelector(".select-plan-btn").textContent = t("selectPlan");
  document.querySelector(".about-us-btn").textContent = t("aboutUs");
  document.querySelector(".support-chat-btn").textContent = t("supportChat");
  document.querySelector(".login-prompt").textContent = t("loginVia");

  renderCertificateBlock();
}

/* ============================================================
   🚀 Инициализация
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  try { await handleRedirectResult(); } catch {}

  // Кнопка открытия меню
  document.getElementById("menu-btn")?.addEventListener("click", () => {
    refreshMenuTexts();
    renderCertificateBlock();
    openMenu();
  });

  // Закрыть меню
  document.getElementById("menu-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget || e.target.closest("[data-action='close-menu']"))
      closeMenu();
  });

  // Импорт сертификата
  document.getElementById("cert-import-btn").addEventListener("click", importCertificate);

  // Добавить сертификат
  document.body.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-cert-btn"))
      document.getElementById("cert-modal").classList.add("visible");
  });

  // Удалить сертификат
  document.body.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-cert-btn")) {
      if (!confirm(t("deleteCert"))) return;

      const user = auth.currentUser;
      if (user) {
        try { await deleteDoc(doc(db, "ursa_signers", user.uid)); }
        catch (err) { console.error("Удаление сертификата:", err); }
      }

      localStorage.removeItem("ursa_cert_udid");
      localStorage.removeItem("ursa_cert_exp");
      localStorage.removeItem("ursa_signer_id");

      renderCertificateBlock();
    }
  });

  // Переходы
  document.querySelector(".buy-cert-btn").addEventListener("click", () => {
    closeMenu();
    window.location.href = "./cert.html";
  });

  document.querySelector(".select-plan-btn").addEventListener("click", () => {
    closeMenu();
    window.location.href = "./vip.html";
  });

  document.querySelector(".about-us-btn").addEventListener("click", () => {
    closeMenu();
    window.location.href = "./about.html";
  });

  // Чат поддержки
  document.querySelector(".support-chat-btn").addEventListener("click", async () => {
    closeMenu();

    const user = auth.currentUser;
    if (!user) {
      alert(currentLang === "ru" ? "Сначала войдите." : "Please log in first.");
      openMenu();
      return;
    }

    const chatRef = doc(db, "support_orders", `support_${user.uid}`);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        uid: user.uid,
        email: user.email || null,
        status: "open",
        type: "support",
        createdAt: new Date().toISOString(),
      });
    }

    window.location.href = `./support.html?uid=${user.uid}`;
  });

  // Email Login
  const emailModal = document.getElementById("email-modal");
  const emailInput = document.getElementById("email-input");
  const passwordInput = document.getElementById("password-input");

  document.querySelector(".email-auth")?.addEventListener("click", () => {
    closeMenu();
    emailModal.classList.add("visible");
  });

  emailModal.addEventListener("click", (e) => {
    if (e.target === emailModal || e.target.closest("[data-action='close-email']"))
      emailModal.classList.remove("visible");
  });

  document.getElementById("email-login-btn").addEventListener("click", async () => {
    await loginWithEmail(emailInput.value.trim(), passwordInput.value.trim());
    emailModal.classList.remove("visible");
    openMenu();
  });

  document.getElementById("email-register-btn").addEventListener("click", async () => {
    await registerWithEmail(emailInput.value.trim(), passwordInput.value.trim());
    emailModal.classList.remove("visible");
    openMenu();
  });

  document.getElementById("email-reset-btn").addEventListener("click", () =>
    resetPassword(emailInput.value.trim())
  );

  // Google / Facebook
  document.querySelector(".google-auth").addEventListener("click", async () => {
    closeMenu();
    await loginWithGoogle();
  });

  document.querySelector(".facebook-auth").addEventListener("click", async () => {
    closeMenu();
    await loginWithFacebook();
  });

  // FREE / VIP STATUS
  onUserChanged(async (user) => {
    const statusEl = document.getElementById("user-status");

    if (!user) {
      localStorage.setItem("ursa_user_status", "free");
      document.getElementById("user-nickname").textContent = t("guest");

      statusEl.textContent = "Free";
      statusEl.classList.remove("vip");

      renderCertificateBlock();
      return;
    }

    const userRef = doc(db, "ursa_users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName || null,
        photo: user.photoURL || null,
        status: "free",
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("ursa_user_status", "free");
    } else {
      localStorage.setItem("ursa_user_status", snap.data().status);
    }

    statusEl.textContent = snap.data().status === "vip" ? "VIP" : "Free";

    document.getElementById("user-nickname").textContent =
      snap.data().name || user.email || t("guest");

    document.getElementById("user-avatar").src =
      snap.data().photo ||
      user.photoURL ||
      "https://placehold.co/100x100/121722/00b3ff?text=User";

    // восстановление сертификата
    try {
      const signerRef = doc(db, "ursa_signers", user.uid);
      const signerSnap = await getDoc(signerRef);

      if (signerSnap.exists()) {
        const data = signerSnap.data();
        localStorage.setItem("ursa_cert_udid", data.udid);
        localStorage.setItem("ursa_cert_exp", data.expires);
        localStorage.setItem("ursa_signer_id", user.uid);
      } else {
        localStorage.removeItem("ursa_cert_udid");
        localStorage.removeItem("ursa_cert_exp");
        localStorage.removeItem("ursa_signer_id");
      }
    } catch {}

    renderCertificateBlock();
  });
});

/* ============================================================
   🌐 Реакция на смену языка
   ============================================================ */
document.querySelector(".change-lang-btn").addEventListener("click", () => {
  switchLang();
  refreshMenuTexts();
});
