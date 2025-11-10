// assets/js/signer.js
// ===============================
// URSA Signer + DownloadCounter + Realtime Progress UI
// ===============================

import { auth, db } from "./app.js";
import { doc, onSnapshot, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
// 🚀 Установка / Подпись IPA (НОВЫЙ UI)
// ===============================
export async function installIPA(app) {
    
    // ✅ Используем новую модалку установки
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
    updateProgress("Подготовка…", 5);

    // 1️⃣ Проверяем вход
    const user = auth.currentUser;
    if (!user) {
        title.textContent = "⚠️ Требуется вход";
        sub.textContent = "Авторизуйтесь через меню.";
        updateProgress("Ошибка", 0);
        return;
    }

    // 2️⃣ Проверяем сертификат
    const udid = localStorage.getItem("ursa_cert_udid");
    const exp = localStorage.getItem("ursa_cert_exp");

    if (!udid || !exp) {
        title.textContent = "⚠️ Нет сертификата";
        sub.textContent = "Добавьте сертификат в меню.";
        updateProgress("Ошибка", 0);
        return;
    }

    // 3️⃣ Проверяем ссылку IPA
    const ipa_url = app.link || app.DownloadUrl || app.downloadUrl;
    if (!ipa_url) {
        title.textContent = "❌ Ошибка";
        sub.textContent = "Ссылка на IPA не найдена.";
        updateProgress("Ошибка", 0);
        return;
    }

    // 4️⃣ Увеличиваем счетчик загрузок (для сортировок)
    if (app.id) incrementDownloadCount(app.id);

    try {
        updateProgress("Отправляем задачу на сервер…", 25);

        const form = new FormData();
        form.append("ipa_url", ipa_url);
        form.append("signer_id", user.uid);

        const res = await fetch(SIGNER_API_START_JOB, { method: "POST", body: form });
        if (!res.ok) throw new Error(await res.text());

        const json = await res.json();
        if (!json.job_id) throw new Error("Сервер не вернул job_id");

        const job_id = json.job_id;
        updateProgress("Ожидаем выполнение…", 45);

        // 🔥 Живой мониторинг статуса
        const jobRef = doc(db, "ursa_sign_jobs", job_id);

        if (currentInstallListener) currentInstallListener();
        currentInstallListener = onSnapshot(jobRef, snap => {
            if (!snap.exists()) return;
            const data = snap.data();

            if (data.status === "running") {
                updateProgress("Подписываем IPA…", 75);
            }

            if (data.status === "complete") {
                currentInstallListener && currentInstallListener();
                currentInstallListener = null;

                updateProgress("Готово! Установка начинается…", 100);

                setTimeout(() => {
                    installModal.classList.remove("visible");
                    window.location.href = data.install_link;
                }, 900);
            }

            if (data.status === "error") {
                currentInstallListener && currentInstallListener();
                currentInstallListener = null;

                title.textContent = "❌ Ошибка";
                sub.textContent = data.error;
                updateProgress("Ошибка", 0);
            }
        });

    } catch (err) {
        let msg = err.message || "Неизвестная ошибка";
        if (msg.includes("Signer not found"))
            msg = "Сертификат повреждён или не активирован. Импортируй заново.";

        title.textContent = "❌ Ошибка";
        sub.textContent = msg;
        updateProgress("Ошибка", 0);
    }
}
