// assets/js/signer.js
// ===============================
// URSA Signer + DownloadCounter + Realtime Progress UI
// ===============================

import { auth, db } from "./app.js";
import { doc, onSnapshot, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getTranslation } from "./i18n.js"; // 🚀 ИМПОРТ

const SIGNER_API_START_JOB = "https://ursa-signer-239982196215.europe-west1.run.app/start_sign_job";
let currentInstallListener = null;

// ===============================
// 📈 downloadCount (для Popular сортировки)
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
// 🚀 Установка / Подпись IPA (НОВЫЙ UI) - Обновлено для i18n
// ===============================
export async function installIPA(app) {
    
    // ✅ Используем новую модалку установки
    const installModal = document.getElementById("install-modal");
    const fill = document.getElementById("install-progress-fill");
    const percent = document.getElementById("install-percent");
    const title = document.getElementById("install-title");
    const sub = document.getElementById("install-subtext");

    // 🚀 Устанавливаем базовые переведённые тексты
    title.textContent = getTranslation('installPrepare');
    sub.textContent = getTranslation('installWaitServer');

    function updateProgress(text, p) {
        sub.textContent = text;
        percent.textContent = p + "%";
        fill.style.width = p + "%";
    }

    installModal.classList.add("visible");
    updateProgress(getTranslation('installWaitServer'), 5); // 🚀 Перевод

    // 1️⃣ Проверяем вход
    const user = auth.currentUser;
    if (!user) {
        title.textContent = getTranslation('installLoginRequired'); // 🚀 Перевод
        sub.textContent = getTranslation('installLoginPrompt');     // 🚀 Перевод
        updateProgress("0", 0);
        return;
    }

    // 2️⃣ Проверяем сертификат
    const udid = localStorage.getItem("ursa_cert_udid");
    const exp = localStorage.getItem("ursa_cert_exp");

    if (!udid || !exp) {
        title.textContent = getTranslation('installCertRequired'); // 🚀 Перевод
        sub.textContent = getTranslation('installCertPrompt');     // 🚀 Перевод
        updateProgress("0", 0);
        return;
    }

    // 3️⃣ Проверяем ссылку IPA
    const ipa_url = app.link || app.DownloadUrl || app.downloadUrl;
    if (!ipa_url) {
        title.textContent = getTranslation('installErrorTitle'); // 🚀 Перевод
        sub.textContent = getTranslation('ipaLinkNotFound');     // 🚀 Перевод
        updateProgress("0", 0);
        return;
    }

    // 4️⃣ Увеличиваем счетчик загрузок (для сортировок)
    if (app.id) incrementDownloadCount(app.id);

    try {
        updateProgress(getTranslation('sendJobText'), 25); // 🚀 Перевод

        const form = new FormData();
        form.append("ipa_url", ipa_url);
        form.append("signer_id", user.uid);

        const res = await fetch(SIGNER_API_START_JOB, { method: "POST", body: form });
        if (!res.ok) throw new Error(await res.text());

        const json = await res.json();
        if (!json.job_id) throw new Error("Сервер не вернул job_id");

        const job_id = json.job_id;
        updateProgress(getTranslation('waitExecutionText'), 45); // 🚀 Перевод

        // 🔥 Живой мониторинг статуса
        const jobRef = doc(db, "ursa_sign_jobs", job_id);

        if (currentInstallListener) currentInstallListener();
        currentInstallListener = onSnapshot(jobRef, snap => {
            if (!snap.exists()) return;
            const data = snap.data();

            if (data.status === "running") {
                updateProgress(getTranslation('signingText'), 75); // 🚀 Перевод
            }

            if (data.status === "complete") {
                currentInstallListener && currentInstallListener();
                currentInstallListener = null;

                updateProgress(getTranslation('completeInstallText'), 100); // 🚀 Перевод

                setTimeout(() => {
                    installModal.classList.remove("visible");
                    window.location.href = data.install_link;
                }, 900);
            }

            if (data.status === "error") {
                currentInstallListener && currentInstallListener();
                currentInstallListener = null;

                title.textContent = getTranslation('installErrorTitle'); // 🚀 Перевод
                sub.textContent = data.error;
                updateProgress("0", 0);
            }
        });

    } catch (err) {
        let msg = err.message || getTranslation('unknownErrorText'); // 🚀 Перевод
        if (msg.includes("Signer not found"))
            msg = getTranslation('signerNotFoundText'); // 🚀 Перевод

        title.textContent = getTranslation('installErrorTitle'); // 🚀 Перевод
        sub.textContent = msg;
        updateProgress("0", 0);
    }
}

// 🚀 Слушатель на смену языка для обновления статических текстов модалки
window.addEventListener('langChange', () => {
    // Обновляем статические заголовки, если модалка не активна
    if (!document.getElementById("install-modal").classList.contains('visible')) {
        document.getElementById("install-title").textContent = getTranslation('installPrepare');
        document.getElementById("install-subtext").textContent = getTranslation('installWaitServer');
    }
});
