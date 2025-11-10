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
// 🚀 Установка / Подпись IPA (ИСПОЛЬЗУЕМ НОВЫЙ UI)
// ===============================
export async function installIPA(app) {
    // 1. Получаем ссылки на элементы НОВОГО модального окна
    const installModal = document.getElementById("install-modal");
    const installTitle = document.getElementById("install-title");
    const installSubtext = document.getElementById("install-subtext");
    const progressBarFill = document.getElementById("install-progress-fill");
    const progressPercent = document.getElementById("install-percent");
    const appModal = document.getElementById("app-modal"); // Модалка приложения для скрытия/показа

    if (!installModal || !installTitle || !progressBarFill) return;

    // Скрываем модальное окно приложения и показываем новый модал установки
    if (appModal) appModal.classList.remove("visible");
    installModal.classList.remove("complete"); // Сбрасываем статус "Готово"
    installModal.classList.add("visible");
    document.body.classList.add("modal-open");

    // --- Функции UI ---
    const updateProgress = (title, subtext, percent) => {
        if (installTitle) installTitle.textContent = title;
        if (installSubtext) installSubtext.textContent = subtext;
        if (progressPercent) progressPercent.textContent = `${percent}%`;
        if (progressBarFill) progressBarFill.style.width = `${percent}%`;
    };

    const hideAndResetModal = (isError = false, errorMessage = "") => {
        installModal.classList.remove("visible");
        document.body.classList.remove("modal-open");
        
        // В случае ошибки, выводим сообщение в модалке приложения (если она открыта)
        if (isError && appModal) {
            const ctaButton = document.getElementById("modal-cta");
            if (ctaButton) {
                // Возвращаем кнопку "Установить" в модалке приложения для повторной попытки
                ctaButton.textContent = "❌ Ошибка. Нажмите, чтобы посмотреть."; 
                ctaButton.onclick = (e) => {
                    e.preventDefault();
                    // Возможно, открыть тут отдельную модалку ошибки или логировать
                    alert(`Ошибка установки: ${errorMessage}`);
                    // Сбрасываем текст кнопки после алерта
                    ctaButton.textContent = "Установить"; 
                    ctaButton.onclick = (event) => {
                        event.preventDefault();
                        installIPA(app);
                    };
                };
            }
            // Показываем модалку приложения
            appModal.classList.add("visible");
        }
    };
    // --- Конец Функции UI ---

    // 0. Начальный статус
    updateProgress("🚀 Подготовка…", "Проверка статуса пользователя...", 5);


    // 1️⃣ Проверяем вход
    const user = auth.currentUser;
    if (!user) {
        hideAndResetModal(true, "Войдите в аккаунт через меню");
        return;
    }

    // 2️⃣ Проверяем сертификат
    const udid = localStorage.getItem("ursa_cert_udid");
    const exp  = localStorage.getItem("ursa_cert_exp");

    if (!udid || !exp) {
        hideAndResetModal(true, "Добавьте сертификат в меню");
        return;
    }

    // 3️⃣ Проверяем ссылку IPA
    const ipa_url = app.link || app.DownloadUrl || app.downloadUrl;
    if (!ipa_url) {
        hideAndResetModal(true, "IPA ссылка не найдена");
        return;
    }

    // 4️⃣ Увеличиваем downloadCount
    if (app.id) incrementDownloadCount(app.id);

    try {
        updateProgress("🔄 Отправляем задачу…", "Отправка запроса на сервер подписи...", 35);

        const form = new FormData();
        form.append("ipa_url", ipa_url);
        form.append("signer_id", user.uid);

        const res = await fetch(SIGNER_API_START_JOB, { method: "POST", body: form });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`HTTP ${res.status}: ${text}`);
        }

        const json = await res.json();
        if (!json.job_id) throw new Error("Сервер не вернул job_id");

        const job_id = json.job_id;
        updateProgress("⏳ Ожидаем…", "Ожидание выполнения подписи...", 50);

        // 5️⃣ Слушаем Firestore на живую
        const jobRef = doc(db, "ursa_sign_jobs", job_id);

        if (currentInstallListener) currentInstallListener();
        currentInstallListener = onSnapshot(jobRef, snap => {
            if (!snap.exists()) return;
            const data = snap.data();

            // 🟡 Статус RUNNING
            if (data.status === "running") {
                updateProgress("⚙️ Подписываем IPA…", "Сертификат применяется к файлу", 80);
            }

            // ✅ УСПЕХ
            if (data.status === "complete") {
                currentInstallListener && currentInstallListener();
                currentInstallListener = null;

                // Используем новый UI: добавляем класс для эффекта завершения
                installModal.classList.add("complete");
                updateProgress("✅ Готово!", "Установка начинается автоматически", 100);

                setTimeout(() => {
                    hideAndResetModal(); // Скрываем модал установки
                    window.location.href = data.install_link;
                }, 1200);
            }

            // ❌ ОШИБКА
            if (data.status === "error") {
                currentInstallListener && currentInstallListener();
                currentInstallListener = null;

                let msg = data.error || "Неизвестная ошибка";
                if (msg.includes("Signer not found"))
                    msg = "Сертификат повреждён или не активирован. Импортируй заново.";

                hideAndResetModal(true, msg);
            }
        });

    } catch (err) {
        let msg = err.message || "Неизвестная ошибка";

        if (msg.includes("Signer not found"))
            msg = "Сертификат повреждён или не активирован. Импортируй заново.";

        hideAndResetModal(true, msg);
    }
}
