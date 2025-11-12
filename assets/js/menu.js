// assets/js/menu.js
// ===============================
// Меню + Авторизация + Email Login + Импорт Сертификата + Статус free/vip
// + Автовосстановление / удаление сертификата (Firestore + Storage)
// + Переходы: VIP / Сертификаты / О нас / Поддержка
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
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";

const storage = getStorage();

// ===============================
// 🔍 Парсинг UDID + Expiration из .mobileprovision
// ===============================
async function parseMobileProvision(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
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
// 📌 Отображение сертификата
// ===============================
function renderCertificateBlock() {
  const card = document.querySelector(".certificate-card");
  const udid = localStorage.getItem("ursa_cert_udid");
  const expiry = localStorage.getItem("ursa_cert_exp");
  const isLoggedIn = !!auth.currentUser;

  const showAddButton = isLoggedIn
    ? `<button class="btn add-cert-btn">Добавить сертификат</button>
       <button class="btn buy-cert-btn neon">Купить сертификат</button>`
    : `<p class="cert-info-placeholder">Для управления сертификатом необходимо войти.</p>`;

  if (!udid) {
    card.innerHTML = `${showAddButton}`;
    return;
  }

  const isExpired = new Date(expiry) < new Date();
  const status = isExpired ? "❌ Отозван" : "✅ Активен";
  const statusColor = isExpired ? "#ff6b6b" : "#00ff9d";

  card.innerHTML = `
    <p><strong>ID Профиля:</strong> ${
      udid.length > 30 ? udid.substring(0, 8) + "..." : udid
    }</p>
    <p><strong>Действует до:</strong> ${expiry}</p>
    <p style="font-weight:600;color:${statusColor};">Статус: ${status}</p>
    <button class="btn delete-cert-btn">Удалить сертификат</button>
    <button class="btn buy-cert-btn neon">Купить новый сертификат</button>
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
  } catch (err) {
    alert("❌ Ошибка при загрузке: " + err.message);
  }
}

// ===============================
// ❌ Удаление сертификата (Firestore + Storage + localStorage)
// ===============================
async function deleteCertificate() {
  const user = auth.currentUser;
  if (!user) return alert("⚠️ Войдите в аккаунт.");

  if (!confirm("Удалить сертификат безвозвратно?")) return;

  const uid = user.uid;
  const folder = `signers/${uid}/`;

  try {
    // 🧹 Удаляем все файлы сертификатов в Storage
    const listRef = ref(storage, folder);
    const listResult = await listAll(listRef);
    for (const file of listResult.items) {
      await deleteObject(file).catch(() =>
        console.warn("Не удалось удалить файл:", file.fullPath)
      );
    }

    // 🔥 Удаляем документ из Firestore
    await deleteDoc(doc(db, "ursa_signers", uid));

    // 🗑️ Очищаем localStorage
    localStorage.removeItem("ursa_cert_udid");
    localStorage.removeItem("ursa_cert_exp");
    localStorage.removeItem("ursa_signer_id");

    renderCertificateBlock();
    alert("✅ Сертификат успешно удалён!");
  } catch (err) {
    console.error("Ошибка удаления сертификата:", err);
    alert("❌ Не удалось удалить сертификат: " + err.message);
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

  document.getElementById("menu-modal")?.addEventListener("click", (e) => {
    if (
      e.target === e.currentTarget ||
      e.target.closest("[data-action='close-menu']")
    )
      closeMenu();
  });

  document
    .getElementById("cert-import-btn")
    ?.addEventListener("click", importCertificate);

  // === Кнопки сертификата ===
  document.body.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-cert-btn"))
      document.getElementById("cert-modal").classList.add("visible");
    if (e.target.classList.contains("delete-cert-btn")) deleteCertificate();
  });

  // === Переходы ===
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

  // ✅ Чат поддержки
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
    });
  }

  // ===============================
  // Авторизация и восстановление сертификата
  // ===============================
  onUserChanged(async (user) => {
    if (!user) {
      localStorage.setItem("ursa_user_status", "free");
      document.getElementById("user-nickname").textContent = "Гость";
      document.getElementById("user-avatar").src =
        "https://placehold.co/100x100/121722/00b3ff?text=User";
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

    document.getElementById("user-nickname").textContent =
      snap.data()?.name || user.email || "Пользователь";
    document.getElementById("user-avatar").src =
      snap.data()?.photo ||
      user.photoURL ||
      "https://placehold.co/100x100/121722/00b3ff?text=User";

    // 🔄 Восстановление сертификата
    try {
      const signerRef = doc(db, "ursa_signers", user.uid);
      const signerSnap = await getDoc(signerRef);
      if (signerSnap.exists()) {
        const data = signerSnap.data();
        if (data.udid && data.expires) {
          localStorage.setItem("ursa_cert_udid", data.udid);
          localStorage.setItem("ursa_cert_exp", data.expires);
          console.log("✅ Сертификат восстановлен из Firestore");
        }
      }
    } catch (err) {
      console.warn("⚠️ Не удалось восстановить сертификат:", err);
    }

    renderCertificateBlock();
  });
});
