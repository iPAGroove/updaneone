// assets/js/signer.js
// ===============================
// URSA Signer + DownloadCounter + Realtime Job Tracking
// ===============================

import { auth, db } from "./app.js";
import { doc, onSnapshot, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const SIGNER_API_START_JOB = "https://ursa-signer-239982196215.europe-west1.run.app/start_sign_job";

let currentInstallListener = null;

// ===============================
// 📈 Увеличиваем downloadCount
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

  // UI прогресс-блок (красивый, как мы сделали)
  dl.style.display = "block";
  dl.innerHTML = `
    <div class="install-progress-container" id="install-progress-container">
      <div class="progress-header">
        <span id="progress-text" class="progress-text">🔄 Подготовка…</span>
        <span id="progress-percent" class="progress-percent">15%</span>
      </div>
      <div class="progress-bar-wrap">
        <div id="progress-bar-fill" class="progress-bar-fill" style="width: 15%;"></div>
      </div>
    </div>
  `;

  const progressText = document.getElementById("progress-text");
  const progressPercent = document.getElementById("progress-percent");
  const progressBarFill = document.getElementById("progress-bar-fill");
  const progressContainer = document.getElementById("install-progress-container");

  const updateProgress = (text, percent) => {
    if (progressText) progressText.textContent = text;
    if (progressPercent) progressPercent.textContent = `${percent}%`;
    if (progressBarFill) progressBarFill.style.width = `${percent}%`;
  };

  // USER CHECK
  const user = auth.currentUser;
  if (!user) {
    dl.innerHTML = `<div class="install-error-msg">⚠️ Войдите в аккаунт через меню</div>`;
    return;
  }

  // CERT CHECK
  const udid = localStorage.getItem("ursa_cert_udid");
  const exp = localStorage.getItem("ursa_cert_exp");
  if (!udid || !exp) {
    dl.innerHTML = `<div class="install-error-msg">⚠️ Добавьте сертификат в меню</div>`;
    return;
  }

  // IPA URL CHECK
  const ipa_url = app.link || app.DownloadUrl || app.downloadUrl;
  if (!ipa_url) {
    dl.innerHTML = `<div class="install-error-msg error">❌ IPA ссылка не найдена</div>`;
    return;
  }

  // Download Count
  if (app.id) incrementDownloadCount(app.id);

  try {
    // 1) Запуск подписи
    const form = new FormData();
    form.append("ipa_url", ipa_url);
    form.append("signer_id", user.uid);

    updateProgress("🔄 Отправка задачи на сервер…", 30);

    const res = await fetch(SIGNER_API_START_JOB, { method: "POST", body: form });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const json = await res.json();

    if (!json.job_id) throw new Error("Сервер не вернул job_id");

    const job_id = json.job_id;

    updateProgress("⏳ Ждем завершения…", 50);

    // 2) Реальное отслеживание Firestore
    const jobRef = doc(db, "ursa_sign_jobs", job_id);

    if (currentInstallListener) currentInstallListener();
    currentInstallListener = onSnapshot(jobRef, snap => {
      if (!snap.exists()) return;
      const data = snap.data();

      // 🟡 Доступные статусы
      if (data.status === "running") {
        updateProgress("⚙️ Подпись…", 70);
      }

      if (data.status === "complete") {
        if (currentInstallListener) currentInstallListener();
        currentInstallListener = null;

        updateProgress("✅ Готово! Установка…", 100);
        progressContainer.classList.add("complete");

        setTimeout(() => {
          window.location.href = data.install_link;
        }, 900);
      }

      if (data.status === "error") {
        if (currentInstallListener) currentInstallListener();
        currentInstallListener = null;

        dl.innerHTML = `<div class="install-error-msg error">❌ ${data.error}</div>`;
      }
    });

  } catch (err) {
    let msg = err.message || "Неизвестная ошибка";

    if (msg.includes("Signer not found"))
      msg = "Сертификат не найден или неправильно загружен. Загрузите его заново.";

    dl.innerHTML = `<div class="install-error-msg error">❌ ${msg}</div>`;
  }
}
