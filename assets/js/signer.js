// ===============================
// URSA Signer Integration (новый проект) + downloadCount tracking
// ===============================

import { auth, db } from "./app.js";
import { doc, onSnapshot, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const SIGNER_API_START_JOB = "https://ursa-signer-239982196215.europe-west1.run.app/start_sign_job";

let currentInstallListener = null;

// ===============================
// 📈 Увеличить счётчик скачиваний
// ===============================
async function incrementDownloadCount(app) {
  try {
    const appId =
      app.id ||
      app.ID ||
      app.docId ||
      app.bundle ||
      app.bundleId ||
      app.package ||
      null;

    if (!appId) return; // если у записи нет id — не ломаем выполнение

    await updateDoc(doc(db, "ursa_ipas", appId), {
      downloadCount: increment(1)
    });
  } catch (err) {
    console.warn("⚠️ Не удалось увеличить downloadCount:", err.message);
  }
}

export async function installIPA(app) {
  const dl = document.getElementById("dl-buttons-row");
  if (!dl) return;

  // UI feedback
  dl.innerHTML = `
    <div style="opacity:.8;font-size:14px;">🔄 Подготовка…</div>
    <progress id="sign-progress" max="100" value="25" style="width:100%;height:8px;margin-top:6px;border-radius:8px;"></progress>
  `;

  // Проверяем вход
  const user = auth.currentUser;
  if (!user) {
    dl.innerHTML = `<div style="opacity:.9;color:#ff6;">⚠️ Войдите в аккаунт через меню</div>`;
    return;
  }

  const signer_id = user.uid;

  // Проверяем сертификат
  const udid = localStorage.getItem("ursa_cert_udid");
  const exp  = localStorage.getItem("ursa_cert_exp");

  if (!udid || !exp) {
    dl.innerHTML = `<div style="opacity:.9;color:#ff6;">⚠️ Загрузите сертификат в меню</div>`;
    return;
  }

  // Проверяем ссылку на IPA
  const ipa_url = app.link || app.DownloadUrl || app.downloadUrl;
  if (!ipa_url) {
    dl.innerHTML = `<div style="opacity:.9;color:#ff6;">❌ Не найдена ссылка на IPA</div>`;
    return;
  }

  // 📈 Увеличиваем downloadCount (эти данные нужны для Popular)
  incrementDownloadCount(app);

  try {
    // 1) Запрос на запуск подписи
    const form = new FormData();
    form.append("ipa_url", ipa_url);
    form.append("signer_id", signer_id);

    dl.innerHTML = `<div style="opacity:.8;font-size:14px;">🔄 Запрашиваем подпись…</div>`;

    const res = await fetch(SIGNER_API_START_JOB, { method: "POST", body: form });
    const json = await res.json();

    if (!json.job_id) throw new Error("Ошибка запуска подписи");
    const job_id = json.job_id;

    dl.innerHTML = `<div style="opacity:.8;font-size:14px;">⏳ Ожидание завершения…</div>`;

    const jobRef = doc(db, "ursa_sign_jobs", job_id);

    // отменяем старый listener если был
    if (currentInstallListener) currentInstallListener();

    // подписываемся на обновления
    currentInstallListener = onSnapshot(jobRef, snap => {
      if (!snap.exists()) return;
      const data = snap.data();

      if (data.status === "progress") {
        dl.innerHTML = `<div style="opacity:.8;font-size:14px;">⌛ ${data.step || "Обработка"}...</div>`;
      }

      if (data.status === "complete") {
        currentInstallListener();
        currentInstallListener = null;
        dl.innerHTML = `<div style="opacity:.9;font-size:14px;">✅ Готово! Установка начинается…</div>`;
        setTimeout(() => location.href = data.install_link, 800);
      }

      if (data.status === "error") {
        currentInstallListener();
        currentInstallListener = null;
        dl.innerHTML = `<div style="opacity:.9;color:#ff6;">❌ Ошибка: ${data.error}</div>`;
      }
    });

  } catch (err) {
    dl.innerHTML = `<div style="opacity:.9;color:#ff6;">❌ ${err.message || err}</div>`;
  }
}
