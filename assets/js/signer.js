// ===============================
// URSA Signer Integration (новый проект)
// ===============================

import { auth, db } from "./app.js";
import { doc, onSnapshot, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const SIGNER_API_START_JOB = "https://ursa-signer-239982196215.europe-west1.run.app/start_sign_job";

let currentInstallListener = null;

// Увеличиваем счётчик установок
async function incrementInstallCount(appId) {
  try {
    await updateDoc(doc(db, "ursa_ipas", appId), {
      installCount: increment(1)
    });
  } catch (err) {
    console.warn("installCount error:", err);
  }
}

export async function installIPA(app) {
  const dl = document.getElementById("dl-buttons-row");
  if (!dl) return;

  // Плавный UI Feedback
  dl.innerHTML = `<div style="opacity:.8;font-size:14px;">🔄 Подготовка…</div>
  <progress id="sign-progress" max="100" value="25" style="width:100%;height:8px;margin-top:6px;border-radius:8px;"></progress>`;

  // Проверяем вход
  const user = auth.currentUser;
  if (!user) {
    dl.innerHTML = `<div style="opacity:.9;color:#ff6;">⚠️ Войдите в аккаунт через меню</div>`;
    return;
  }

  const signer_id = user.uid; // ← ТЕКСТЬЮ: uid и есть наш signer_id

  // Проверяем что сертификат загружен
  const udid = localStorage.getItem("ursa_cert_udid");
  const exp = localStorage.getItem("ursa_cert_exp");
  if (!udid || !exp) {
    dl.innerHTML = `<div style="opacity:.9;color:#ff6;">⚠️ Загрузите сертификат в меню</div>`;
    return;
  }

  // Проверяем IPA ссылку
  const ipa_url = app.link || app.DownloadUrl || app.downloadUrl;
  if (!ipa_url) {
    dl.innerHTML = `<div style="opacity:.9;color:#ff6;">❌ Не найдена ссылка на IPA</div>`;
    return;
  }

  // Увеличиваем installCount
  if (app.id) incrementInstallCount(app.id);

  try {
    // 1) Отправляем запрос на запуск подписи
    const form = new FormData();
    form.append("ipa_url", ipa_url);
    form.append("signer_id", signer_id);

    dl.innerHTML = `<div style="opacity:.8;font-size:14px;">🔄 Запрашиваем подпись…</div>`;

    const res = await fetch(SIGNER_API_START_JOB, { method: "POST", body: form });
    const json = await res.json();

    if (!json.job_id) throw new Error("Ошибка запуска подписи");
    const job_id = json.job_id;

    dl.innerHTML = `<div style="opacity:.8;font-size:14px;">⏳ Ожидание завершения…</div>`;

    // 2) Подписываемся на обновления
    const jobRef = doc(db, "ursa_sign_jobs", job_id);

    if (currentInstallListener) currentInstallListener();
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
