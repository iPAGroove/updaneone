// assets/js/certificate.js

import { auth } from "./app.js"; 

// ===============================
// 💡 УКАЖИТЕ СЮДА РЕАЛЬНЫЙ АДРЕС ВАШЕЙ CLOUD FUNCTION ДЛЯ ИМПОРТА!
// Например: https://europe-west1-ipa-panel.cloudfunctions.net/import_signer_cert
// ===============================
const IMPORT_CERT_API_URL = "https://YOUR_BACKEND_API_URL/import_cert"; 

// ===============================
// DOM Элементы
// ===============================
// Примечание: DOM-элементы в вашем HTML не совпадают с этими именами
// ВАШ HTML: #cert-modal, #cert-p12, #cert-mobileprovision, #cert-password
// ЭТОТ JS: #add-cert-modal, #cert-file-input, #cert-password-input
// Я ИСПОЛЬЗУЮ ИМЕНА ИЗ ПРЕДОСТАВЛЕННОГО ВАМИ КОДА JS ДЛЯ ЦЕЛОСТНОСТИ.
const addCertModal = document.getElementById("cert-modal"); // Исправлено на id из index.html
const certFileInputP12 = document.getElementById("cert-p12"); // Исправлено на id из index.html
const certFileInputMobileprovision = document.getElementById("cert-mobileprovision"); // Исправлено на id из index.html
const certPasswordInput = document.getElementById("cert-password"); // Исправлено на id из index.html
const certImportBtn = document.getElementById("cert-import-btn");
const certMessage = document.getElementById("cert-message"); // Нужно добавить этот элемент в модалку HTML

const certPlaceholder = document.querySelector(".cert-info-placeholder");
const certDisplay = document.getElementById("cert-info-display");
const certUdidEl = document.getElementById("cert-udid");
const certExpiryEl = document.getElementById("cert-expiry-date");
const deleteCertBtn = document.querySelector(".delete-cert-btn");
const addCertBtn = document.querySelector(".add-cert-btn"); // Используем класс для кнопки из меню

// ===============================
// Управление модальным окном
// ===============================
export function openAddCertModal() { 
    if (!auth.currentUser) {
        alert("⚠️ Для добавления сертификата необходимо войти!");
        return;
    }
    // Убедимся, что #cert-message существует или используем alert
    if (certMessage) certMessage.textContent = "";
    
    if (certFileInputP12) certFileInputP12.value = "";
    if (certFileInputMobileprovision) certFileInputMobileprovision.value = "";
    if (certPasswordInput) certPasswordInput.value = "";

    addCertModal?.classList.add("visible");
    document.body.classList.add("modal-open");
}

function closeAddCertModal() {
    addCertModal?.classList.remove("visible");
    document.body.classList.remove("modal-open");
}

// 💡 Обработчик закрытия
addCertModal?.addEventListener("click", (e) => {
    // Исправлено на data-action из index.html
    if (e.target === addCertModal || e.target.closest("[data-action='close-cert']")) { 
        closeAddCertModal();
    }
});

// ===============================
// 🚀 Логика импорта сертификата (РЕАЛЬНЫЙ API ВЫЗОВ)
// ===============================

certImportBtn?.addEventListener("click", async () => {
    const p12File = certFileInputP12?.files?.[0];
    const mobileprovisionFile = certFileInputMobileprovision?.files?.[0];
    const password = certPasswordInput?.value.trim() || "";
    const user = auth.currentUser;

    if (!user) {
        if (certMessage) certMessage.textContent = "❌ Войдите в аккаунт, чтобы импортировать.";
        return;
    }

    if (!p12File || !mobileprovisionFile) {
        if (certMessage) certMessage.textContent = "Выберите оба файла (.p12 и .mobileprovision)";
        return;
    }

    if (p12File.size > 5 * 1024 * 1024 || mobileprovisionFile.size > 5 * 1024 * 1024) { 
        if (certMessage) certMessage.textContent = "Файл слишком большой (макс. 5MB)";
        return;
    }

    certImportBtn.disabled = true;
    if (certMessage) certMessage.textContent = "Импорт и обработка на сервере...";

    try {
        // 1. Создаем FormData
        const formData = new FormData();
        formData.append("p12_file", p12File);
        formData.append("mobileprovision_file", mobileprovisionFile);
        formData.append("p12_password", password);
        formData.append("uid", user.uid); // Ключевой параметр для бэкенда!

        // 2. Выполняем реальный вызов API
        const response = await fetch(IMPORT_CERT_API_URL, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        
        // 3. Проверка ответа сервера
        if (!response.ok || result.error) {
            const serverError = result.error || `Сервер ответил ошибкой HTTP ${response.status}.`;
            // Важно: если сервер возвращает ошибку, он должен содержать ее в поле 'error'
            throw new Error(serverError);
        }

        // 4. Сервер вернул реальные метаданные (УДАЛЯЕМ ЛОКАЛЬНУЮ ЗАГЛУШКУ!)
        const certMetadata = {
            udid: result.udid, 
            expiryDate: result.expiryDate 
        };

        // 5. Сохраняем и обновляем UI
        if (certMetadata.udid && certMetadata.expiryDate) {
            // Сохраняем в localStorage, как и раньше, но уже реальные данные с сервера
            localStorage.setItem(`user_cert_data_${user.uid}`, JSON.stringify(certMetadata));
            updateCertificateUI(certMetadata);
            if (certMessage) certMessage.textContent = "✅ Сертификат успешно импортирован!";
            closeAddCertModal();
        } else {
            if (certMessage) certMessage.textContent = "❌ Сервер не вернул UDID/дату. Проверьте логи бэкенда.";
        }
    } catch (error) {
        console.error("Ошибка импорта сертификата:", error);
        if (certMessage) certMessage.textContent = `❌ Ошибка импорта: ${error.message || "Неизвестная ошибка"}`;
    } finally {
        certImportBtn.disabled = false;
    }
});


// ===============================
// 🗑️ Логика удаления сертификата (если требуется удалить и с бэкенда)
// ===============================

deleteCertBtn?.addEventListener("click", () => {
    if (confirm("Вы уверены, что хотите удалить сертификат?")) {
        console.log(`Удаление сертификата для ${auth.currentUser.uid}`);

        // !!! ПРИМЕЧАНИЕ: Здесь нужно добавить вызов API для удаления сертификата с сервера !!!
        
        localStorage.removeItem(`user_cert_data_${auth.currentUser.uid}`);
        updateCertificateUI(null);
    }
});


// ===============================
// 🔄 Обновление UI карточки сертификата
// ===============================

export function updateCertificateUI(certData) {
    if (!certPlaceholder || !certDisplay || !addCertBtn) return;
    
    if (certData && certData.udid && certData.expiryDate) {
        certPlaceholder.style.display = "none";
        certDisplay.style.display = "flex"; 
        certUdidEl.textContent = certData.udid;
        certExpiryEl.textContent = certData.expiryDate;
        addCertBtn.style.display = "none";
        console.log("UI: Сертификат отображен.");
    } else {
        certPlaceholder.style.display = "block";
        certDisplay.style.display = "none";
        // Примечание: Эти элементы могут не существовать в DOM, так как они находятся внутри certDisplay
        // certUdidEl.textContent = "N/A";
        // certExpiryEl.textContent = "N/A";
        addCertBtn.style.display = "block";
        console.log("UI: Отображена кнопка 'Добавить сертификат'.");
    }
}


// ===============================
// ⚡ Инициализация (Загрузка данных при старте)
// ===============================

export function loadUserCertificateData(user) {
    if (!user) {
        updateCertificateUI(null);
        return;
    }
    // Использование старого формата ключа localStorage для совместимости
    const dataString = localStorage.getItem(`user_cert_data_${user.uid}`); 
    const certData = dataString ? JSON.parse(dataString) : null;
    
    // Если данных нет в старом формате, пробуем новый, который вы использовали в signer.js:
    if (!certData) {
      const udid = localStorage.getItem("ursa_cert_udid");
      const exp = localStorage.getItem("ursa_cert_exp");
      if (udid && exp) {
        updateCertificateUI({ udid: udid, expiryDate: exp });
        return;
      }
    }
    
    updateCertificateUI(certData);
}
