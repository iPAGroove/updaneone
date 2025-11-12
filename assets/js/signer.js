// assets/js/signer.js
// ===============================
// URSA Signer + Realtime Progress + i18n
// ===============================

import { auth, db } from "./app.js";
import { doc, onSnapshot, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { t, currentLang } from "./i18n.js";

const SIGNER_API_START_JOB = "https://ursa-signer-239982196215.europe-west1.run.app/start_sign_job";
let currentInstallListener = null;

/* ============================================================
   📈 Увеличение downloadCount
   ============================================================ */
async function incrementDownloadCount(appId) {
  try {
    await updateDoc(doc(db, "ursa_ipas", appId), {
      downloadCount: increment(1)
    });
  } catch (err) {
    console.warn("⚠️ downloadCount error:", err.message);
  }
}

/* ============================================================
   🚀 Основная функция установки IPA (с i18n)
   ============================================================ */
export async function installIPA(app) {
  const installModal = document.getElementById("install-modal");
  const fill = document.getElementById("install-progress-fill");
  const percent = document.getElementById("install-percent");
  const title = document.getElementById("install-title");
  const sub = document.getElementById("install-subtext");

  function updateProgress(text, p) {
    sub.textContent = text;
    percent.textContent = p + "%";
    fill.style.width = p + "%";
  }

  installModal.classList.add("visible");
  updateProgress(t("install_preparing") || "Подготовка…", 5);

  /* ============================================================
     1️⃣ Проверка входа
     ============================================================ */
  const user = auth.currentUser;
  if (!user) {
    title.textContent = t("install_need_login") || "⚠️ Требуется вход";
    sub.textContent = t("install_login_hint") || "Авторизуйтесь через меню.";
    updateProgress(t("error") || "Ошибка", 0);
    return;
  }

  /* ============================================================
     2️⃣ Проверка сертификата
     ============================================================ */
  const udid = localStorage.getItem("ursa_cert_udid");
  const exp = localStorage.getItem("ursa_cert_exp");

  if (!udid || !exp) {
    title.textContent = t("install_no_cert") || "⚠️ Нет сертификата";
    sub.textContent = t("install_add_cert") || "Добавьте сертификат в меню.";
    updateProgress(t("error") || "Ошибка", 0);
    return;
  }

  /* ============================================================
     3️⃣ Проверка ссылки IPA
     ============================================================ */
  const ipa_url = app.link || app.DownloadUrl || app.downloadUrl;

  if (!ipa_url) {
    title.textContent = t("error") || "❌ Ошибка";
    sub.textContent = t("install_no_link") || "Ссылка на IPA не найдена.";
    updateProgress(t("error") || "Ошибка", 0);
    return;
  }

  /* ============================================================
     4️⃣ Увеличиваем статистику
     ============================================================ */
  if (app.id) incrementDownloadCount(app.id);

  /* ============================================================
     🚀 Отправляем задачу на сервер
     ============================================================ */
  try {
    updateProgress(t("install_sending") || "Отправляем задачу…", 25);

    const form = new FormData();
    form.append("ipa_url", ipa_url);
    form.append("signer_id", user.uid);

    const res = await fetch(SIGNER_API_START_JOB, { method: "POST", body: form });
    if (!res.ok) throw new Error(await res.text());

    const json = await res.json();
    if (!json.job_id) throw new Error("Server did not return job_id");

    const job_id = json.job_id;
    updateProgress(t("install_waiting") || "Ожидаем выполнение…", 45);

    /* ============================================================
       🔥 Живой мониторинг Firebase
       ============================================================ */
    const jobRef = doc(db, "ursa_sign_jobs", job_id);

    if (currentInstallListener) currentInstallListener();
    currentInstallListener = onSnapshot(jobRef, snap => {
      if (!snap.exists()) return;
      const data = snap.data();

      // running
      if (data.status === "running") {
        updateProgress(t("install_signing") || "Подписываем IPA…", 75);
      }

      // complete
      if (data.status === "complete") {
        currentInstallListener && currentInstallListener();
        currentInstallListener = null;

        updateProgress(t("install_done") || "Готово!", 100);

        setTimeout(() => {
          installModal.classList.remove("visible");
          window.location.href = data.install_link;
        }, 900);
      }

      // error
      if (data.status === "error") {
        currentInstallListener && currentInstallListener();
        currentInstallListener = null;

        title.textContent = t("error") || "❌ Ошибка";
        sub.textContent = data.error;
        updateProgress(t("error") || "Ошибка", 0);
      }
    });

  } catch (err) {
    let msg = err.message || "Unknown error";

    if (msg.includes("Signer not found")) {
      msg =
        currentLang === "ru"
          ? "Сертификат повреждён или не активирован. Импортируйте заново."
          : "Certificate damaged or inactive. Re-import it.";
    }

    title.textContent = t("error") || "❌ Ошибка";
    sub.textContent = msg;
    updateProgress(t("error") || "Ошибка", 0);
  }
}

/* ============================================================
   🔄 Реакция на смену языка — перерисовка текста
   ============================================================ */
document.addEventListener("ursa_lang_changed", () => {
  const title = document.getElementById("install-title");
  const sub = document.getElementById("install-subtext");

  // Переписываем текст, только если окно открыто
  const modal = document.getElementById("install-modal");
  if (!modal.classList.contains("visible")) return;

  title.textContent = t("install_preparing") || "Подготовка…";
  sub.textContent = t("install_waiting") || "Ожидание сервера…";
});
