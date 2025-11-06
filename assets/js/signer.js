// ===============================
// URSA Signer Integration (новый проект)
// ===============================

import { db } from "./app.js";
import { doc, onSnapshot, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const SIGNER_API_START_JOB = "https://ursa-signer-239982196215.europe-west1.run.app/start_sign_job";

let currentInstallListener = null;

// Увеличиваем счетчик установок
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
  incrementInstallCount(app.id);

  const dl = document.getElementById("dl-buttons-row");
  if (!dl) return;

  // Сброс подписки
  if (currentInstallListener) {
    currentInstallListener();
    currentInstallListener = null;
  }

  dl.innerHTML = `<div style="opacity:.8;font-size:14px;">🔄 Запускаем подпись…</div>
  <progress id="sign-progress" max="100" value="30" style="width:100%;height:8px;margin-top:6px;border-radius:8px;"></progress>`;

  try {
    const signer_id = localStorage.getItem("ursa_signer_id");
    if (!signer_id) throw new Error("❌ Загрузите сертификат в меню");

    // 1) Запускаем задачу
    const form = new FormData();
    form.append("ipa_url", app.downloadUrl);
    form.append("signer_id", signer_id);

    const res = await fetch(SIGNER_API_START_JOB, { method: "POST", body: form });
    const json = await res.json();
    if (!json.job_id) throw new Error("Ошибка запуска подписи");

    const job_id = json.job_id;

    dl.innerHTML = `<div style="opacity:.8;font-size:14px;">⏳ Ожидание готовности…</div>`;

    // 2) Слушаем Firestore
    const jobRef = doc(db, "ursa_sign_jobs", job_id);

    currentInstallListener = onSnapshot(jobRef, snap => {
      if (!snap.exists()) return;
      const data = snap.data();

      if (data.status === "complete") {
        currentInstallListener();
        currentInstallListener = null;
        dl.innerHTML = `<div style="opacity:.9;font-size:14px;">✅ Готово! Установка начнётся…</div>`;
        setTimeout(() => (location.href = data.install_link), 900);
      }

      else if (data.status === "error") {
        currentInstallListener();
        currentInstallListener = null;
        dl.innerHTML = `<div style="opacity:.9;color:#ff6;">❌ Ошибка: ${data.error}</div>`;
      }
    });

  } catch (err) {
    dl.innerHTML = `<div style="opacity:.9;color:#ff6;">❌ ${err.message || err}</div>`;
  }
}
