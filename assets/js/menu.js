// ===============================
// Меню + Авторизация + Email Login + Импорт Сертификата + Статус free/vip
// + Переход в VIP страницу
// + Переход на покупку сертификата
// + Переход в "О нас"
// + Переход в "Чат поддержки"
// + Автоматическое восстановление сертификата при входе
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

const storage = getStorage();

// ===============================
// 🔍 Парсим UDID + Expiration из .mobileprovision
// ===============================
async function parseMobileProvision(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const text = event.target.result;
        const xmlStart = text.indexOf("<?xml");
        const xmlEnd = text.indexOf("</plist>") + "</plist>".length;
        const xml = text.substring(xmlStart, xmlEnd);

        const udidBlock = xml.match(
          /<key>ProvisionedDevices<\/key>[\s\S]*?<array>([\s\S]*?)<\/array>/
        );
        let udid = null;

        if (udidBlock) {
          const list = [...udidBlock[1].matchAll(/<string>([^<]+)<\/string>/g)];
          if (list.length > 0) udid = list[0][1];
        }

        if (!udid)
          udid =
            xml.match(/<key>UUID<\/key>\s*<string>([^<]+)<\/string>/)?.[1] ||
            null;

        const expiryDate =
          xml
            .match(/<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/)?.[1]
            ?.split("T")[0] || null;

        resolve({ udid, expiryDate });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}

// ===============================
// 📌 Отображение сертификата (компактная версия)
// ===============================
function renderCertificateBlock() {
  const card = document.querySelector(".certificate-card");
  const udid = localStorage.getItem("ursa_cert_udid");
  const expiry = localStorage.getItem("ursa_cert_exp");
  const isLoggedIn = !!auth.currentUser;

  const showAddButton = isLoggedIn
    ? `<button class="btn add-cert-btn">Добавить сертификат</button>`
    : `<p class="cert-info-placeholder">Для управления сертификатом необходимо войти.</p>`;

  if (!udid) {
    card.innerHTML = `${showAddButton}`;
    return;
  }

  const isExpired = new Date(expiry) < new Date();
  const status = isExpired ? "❌ Отозван" : "✅ Активен";
  const statusColor = isExpired ? "#ff6b6b" : "#00ff9d";

  card.innerHTML = `
    <div class="cert-info">
      <div class="cert-row">
        <span class="cert-label">UDID:</span>
        <span class="cert-value mono">${udid}</span>
      </div>
      <div class="cert-row">
        <span class="cert-label">Действует до:</span>
        <span class="cert-value">${expiry}</span>
      </div>
      <div class="cert-row">
        <span class="cert-label">Статус:</span>
        <span class="cert-value" style="color:${statusColor};font-weight:600;">${status}</span>
      </div>
    </div>
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

  if (!p12 || !mp) return alert("Выберите .p12 и .mobileprovision");

  const user = auth.currentUser;
  if (!user) return alert("Сначала выполните вход.");

  const parsed = await parseMobileProvision(mp);
  if (!parsed.udid || !parsed.expiryDate)
    return alert("Не удалось извлечь данные профиля.");

  const uid = user.uid;
  const folder = `signers/${uid}/`;

  const p12Ref = ref(storage, folder + p12.name);
  const mpRef = ref(storage, folder + mp.name);

  try {
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
    alert("❌ Ошибка при загрузке.");
  }
}

// ===============================
// Меню
// ===============================
function openMenu() {
  const overlay = document.getElementById("menu-modal");
  overlay.classList.add("visible");
  document.body.classList.add("modal-open");
}
function closeMenu() {
  document.getElementById("menu-modal").classList.remove("visible");
  document.body.classList.remove("modal-open");
}

// ===============================
// Инициализация
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await handleRedirectResult();
  } catch {}

  document.getElementById("menu-btn")?.addEventListener("click", () => {
    renderCertificateBlock();
    openMenu();
  });

  document
    .getElementById("menu-modal")
    ?.addEventListener("click", (e) => {
      if (
        e.target === e.currentTarget ||
        e.target.closest("[data-action='close-menu']")
      )
        closeMenu();
    });

  document.getElementById("cert-import-btn")?.addEventListener("click", importCertificate);

  document.body.addEventListener("click", async (e) => {
    if (e.target.classList.contains("add-cert-btn"))
      document.getElementById("cert-modal").classList.add("visible");

    if (e.target.classList.contains("delete-cert-btn")) {
      if (!confirm("Удалить сертификат?")) return;

      const user = auth.currentUser;
      if (user) {
        try {
          await deleteDoc(doc(db, "ursa_signers", user.uid));
          console.log(`✅ Сертификат удалён из Firestore`);
        } catch (error) {
          console.error("❌ Ошибка удаления:", error);
        }
      }

      localStorage.removeItem("ursa_cert_udid");
      localStorage.removeItem("ursa_cert_exp");
      localStorage.removeItem("ursa_signer_id");
      renderCertificateBlock();
    }
  });

  document.body.addEventListener("click", (e) => {
    if (e.target.classList.contains("buy-cert-btn")) {
      closeMenu();
      window.location.href = "./cert.html";
    }
  });

  document.querySelector(".select-plan-btn")?.addEventListener("click", () => {
    closeMenu();
    window.location.href = "./vip.html";
  });

  document.querySelector(".about-us-btn")?.addEventListener("click", () => {
    closeMenu();
    window.location.href = "./about.html";
  });

  const supportBtn = document.querySelector(".support-chat-btn");
  if (supportBtn) {
    supportBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      closeMenu();

      const user = auth.currentUser;
      if (!user) {
        alert("⚠️ Чтобы открыть чат поддержки, войдите в аккаунт.");
        openMenu();
        return;
      }

      try {
const orderRef = doc(db, "vip_orders", `support_${user.uid}`);
const snap = await getDoc(orderRef);

if (!snap.exists()) {
  await setDoc(orderRef, {
    uid: user.uid,
    email: user.email || null,
    status: "open",
    type: "support",
    createdAt: new Date().toISOString(),
  });
}

window.location.assign(`./support.html?uid=${user.uid}`);

  // ===============================
  // Авторизация Email
  // ===============================
  const emailModal = document.getElementById("email-modal");
  const emailInput = document.getElementById("email-input");
  const passwordInput = document.getElementById("password-input");

  document.querySelector(".email-auth")?.addEventListener("click", () => {
    closeMenu();
    emailModal.classList.add("visible");
  });

  emailModal.addEventListener("click", (e) => {
    if (
      e.target === emailModal ||
      e.target.closest("[data-action='close-email']")
    )
      emailModal.classList.remove("visible");
  });

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

  document.getElementById("email-reset-btn")?.addEventListener("click", () =>
    resetPassword(emailInput.value.trim())
  );

  document.querySelector(".google-auth")?.addEventListener("click", async () => {
    closeMenu();
    await loginWithGoogle();
  });

  document.querySelector(".facebook-auth")?.addEventListener("click", async () => {
    closeMenu();
    await loginWithFacebook();
  });

  // ===============================
  // FREE / VIP статус + восстановление сертификата
  // ===============================
  onUserChanged(async (user) => {
    const statusElement = document.getElementById("user-status");

    if (!user) {
      localStorage.setItem("ursa_user_status", "free");
      document.getElementById("user-nickname").textContent = "Гость";
      document.getElementById("user-avatar").src =
        "https://placehold.co/100x100/121722/00b3ff?text=User";
      if (statusElement) {
        statusElement.textContent = "Free";
        statusElement.classList.remove("vip");
      }
      renderCertificateBlock();
      return;
    }

    const userRef = doc(db, "ursa_users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || null,
        name: user.displayName || null,
        photo: user.photoURL || null,
        status: "free",
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("ursa_user_status", "free");
    } else {
      localStorage.setItem("ursa_user_status", snap.data().status || "free");
    }

    const status = snap.data()?.status || "free";
    if (statusElement) {
      if (status.toLowerCase() === "vip") {
        statusElement.textContent = "VIP";
        statusElement.classList.add("vip");
      } else {
        statusElement.textContent = "Free";
        statusElement.classList.remove("vip");
      }
    }

    document.getElementById("user-nickname").textContent =
      snap.data()?.name || user.email || "Пользователь";
    document.getElementById("user-avatar").src =
      snap.data()?.photo ||
      user.photoURL ||
      "https://placehold.co/100x100/121722/00b3ff?text=User";

    try {
      const signerRef = doc(db, "ursa_signers", user.uid);
      const signerSnap = await getDoc(signerRef);
      if (signerSnap.exists()) {
        const data = signerSnap.data();
        if (data.udid && data.expires) {
          localStorage.setItem("ursa_cert_udid", data.udid);
          localStorage.setItem("ursa_cert_exp", data.expires);
          localStorage.setItem("ursa_signer_id", user.uid);
        }
      } else {
        localStorage.removeItem("ursa_cert_udid");
        localStorage.removeItem("ursa_cert_exp");
        localStorage.removeItem("ursa_signer_id");
      }
    } catch (err) {
      console.warn("⚠️ Не удалось восстановить сертификат:", err);
    }

    renderCertificateBlock();
  });
});
