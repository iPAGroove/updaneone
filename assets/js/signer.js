// assets/js/signer.js
// ===============================
// URSA Signer + DownloadCounter + Realtime Job Tracking
// ===============================

import { auth, db } from "./app.js";
import { doc, onSnapshot, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const SIGNER_API_START_JOB = "https://ursa-signer-239982196215.europe-west1.run.app/start_sign_job";

let currentInstallListener = null;

// ===============================
// 📈 Увеличиваем downloadCount (для секции Popular)
// ===============================
async function incrementDownloadCount(appId) {
  try {
    await updateDoc(doc(db, "ursa_ipas", appId), {
      downloadCount: increment(1)
    });
  } catch (err) {
    console.warn("⚠️ Не удалось увеличить downloadCount:", err.message);
  }
}

// ===============================
// 🚀 Установка / Подпись IPA
// ===============================
export async function installIPA(app) {
  const dl = document.getElementById("dl-buttons-row");
  if (!dl) return;

  // UI Feedback
  dl.innerHTML = `
    <div style="opacity:.8;font-size:14px;">🔄 Подготовка…</div>
    <progress id="sign-progress" max="100" value="15" style="width:100%;height:8px;margin-top:6px;border-radius:8px;"></progress>
  `;

  // Проверяем вход
  const user = auth.currentUser;
  if (!user) {
    dl.innerHTML = `<div style="opacity:.9;color:#ff6;">⚠️ Войдите в аккаунт через меню</div>`;
    return;
  }

  // Проверяем сертификат
  const udid = localStorage.getItem("ursa_cert_udid");
  const exp = localStorage.getItem("ursa_cert_exp");
  if (!udid || !exp) {
    dl.innerHTML = `<div style="opacity:.9;color:#ff6;">⚠️ Загрузите сертификат в меню</div>`;
    return;
  }

  // Проверяем ссылку IPA
  const ipa_url = app.link || app.DownloadUrl || app.downloadUrl;
  if (!ipa_url) {
    dl.innerHTML = `<div style="opacity:.9;color:#ff6;">❌ IPA ссылка не найдена</div>`;
    return;
  }

  // ✅ Увеличиваем downloadCount
  if (app.id) incrementDownloadCount(app.id);

  try {
    // 1) Отправляем запрос на запуск подписи
    const form = new FormData();
    form.append("ipa_url", ipa_url);
    form.append("signer_id", user.uid);

    dl.innerHTML = `<div style="opacity:.8;font-size:14px;">🔄 Запрашиваем подпись…</div>`;

    const res = await fetch(SIGNER_API_START_JOB, { method: "POST", body: form });
    const json = await res.json();
    if (!json.job_id) throw new Error("Ошибка запуска подписи");

    const job_id = json.job_id;
    dl.innerHTML = `<div style="opacity:.8;font-size:14px;">⏳ Ожидание завершения…</div>`;

    // 2) Слушаем обновления из Firestore
    const jobRef = doc(db, "ursa_sign_jobs", job_id);

    if (currentInstallListener) currentInstallListener();
    currentInstallListener = onSnapshot(jobRef, snap => {
      if (!snap.exists()) return;
      const data = snap.data();

      // 🟡 Прогресс
      if (data.status === "progress") {
        dl.innerHTML = `<div style="opacity:.8;font-size:14px;">⌛ ${data.step || "Обработка"}...</div>`;
      }

      // ✅ Завершено
      if (data.status === "complete") {
        currentInstallListener();
        currentInstallListener = null;

        dl.innerHTML = `<div style="opacity:.9;font-size:14px;">✅ Готово! Установка начинается…</div>`;
        setTimeout(() => location.href = data.install_link, 800);
      }

      // ❌ Ошибка
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
