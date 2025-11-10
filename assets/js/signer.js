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

  // UI Feedback (Новый, стильный прогресс-бар)
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

  // Вспомогательная функция для обновления UI
  const updateProgress = (text, percent) => {
    if(progressText) progressText.textContent = text;
    if(progressPercent) progressPercent.textContent = `${percent}%`;
    if(progressBarFill) progressBarFill.style.width = `${percent}%`;
  };


  // Проверяем вход
  const user = auth.currentUser;
  if (!user) {
    dl.innerHTML = `<div class="install-error-msg">⚠️ Войдите в аккаунт через меню</div>`;
    return;
  }
  
  // 💡 Добавлено для диагностики проблемы "Signer not found"
  console.log("Current User UID:", user.uid);

  // Проверяем сертификат
  const udid = localStorage.getItem("ursa_cert_udid");
  const exp = localStorage.getItem("ursa_cert_exp");
  if (!udid || !exp) {
    dl.innerHTML = `<div class="install-error-msg">⚠️ Загрузите сертификат в меню</div>`;
    return;
  }

  // Проверяем ссылку IPA
  const ipa_url = app.link || app.DownloadUrl || app.downloadUrl;
  if (!ipa_url) {
    dl.innerHTML = `<div class="install-error-msg error">❌ IPA ссылка не найдена</div>`;
    return;
  }

  // ✅ Увеличиваем downloadCount
  if (app.id) incrementDownloadCount(app.id);

  try {
    // 1) Отправляем запрос на запуск подписи
    const form = new FormData();
    form.append("ipa_url", ipa_url);
    form.append("signer_id", user.uid);

    updateProgress("🔄 Запрашиваем подпись…", 30);

    const res = await fetch(SIGNER_API_START_JOB, { method: "POST", body: form });
    
    // ⚠️ УЛУЧШЕННАЯ ОБРАБОТКА ОШИБОК HTTP
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP Error ${res.status}: ${errorText.substring(0, 100)}...`);
    }

    const json = await res.json();
    
    // Улучшенная обработка ошибки 'Signer not found'
    if (json.error) {
      throw new Error(json.error);
    }

    if (!json.job_id) throw new Error("API не вернул ID задания (job_id)");

    const job_id = json.job_id;
    updateProgress("⏳ Ожидание завершения…", 50);

    // 2) Слушаем обновления из Firestore
    const jobRef = doc(db, "ursa_sign_jobs", job_id);

    if (currentInstallListener) currentInstallListener();
    currentInstallListener = onSnapshot(jobRef, snap => {
      if (!snap.exists()) return;
      const data = snap.data();

      // 🟡 Прогресс
      if (data.status === "progress") {
        const currentStep = data.step || "Обработка";
        // Имитация прогресса на основе шага
        let progressVal = 60;
        if (currentStep.includes("Download")) progressVal = 70;
        else if (currentStep.includes("Sign")) progressVal = 85;

        updateProgress(`⌛ ${currentStep}...`, progressVal);
      }

      // ✅ Завершено
      if (data.status === "complete") {
        currentInstallListener();
        currentInstallListener = null;

        progressContainer.classList.add("complete");
        updateProgress("✅ Готово! Установка начинается…", 100);
        setTimeout(() => location.href = data.install_link, 800);
      }

      // ❌ Ошибка
      if (data.status === "error") {
        currentInstallListener();
        currentInstallListener = null;

        dl.innerHTML = `<div class="install-error-msg error">❌ Ошибка: ${data.error}</div>`;
      }
    });

  } catch (err) {
    // Обработка всех ошибок, включая 'Signer not found'
    let displayError = err.message || "Неизвестная ошибка";
    
    // Дополнительная подсказка для специфической ошибки
    if (displayError.includes("Signer not found")) {
      displayError = "Signer не найден. Возможно, ваш сертификат не активен.";
    } else if (displayError.includes("HTTP Error")) {
      displayError = `Ошибка сервера: ${displayError.split(':')[0]}`;
    }

    dl.innerHTML = `<div class="install-error-msg error">❌ ${displayError}</div>`;
  }
}
