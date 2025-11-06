// assets/js/certificate.js

import { auth } from "./app.js"; // Используем экспортированный auth
// 🚨 ВАЖНО: Тебе нужно будет добавить функции для работы с Firebase Storage
// и Firestore (для сохранения/получения метаданных сертификата)
// и импортировать их здесь, например:
// import { uploadCertificateAndGetMetadata, deleteCertificateData } from "./firebase/storage.js"; 

// ===============================
// DOM Элементы
// ===============================
const openCertModalBtn = document.getElementById("open-cert-modal-btn");
const addCertModal = document.getElementById("add-cert-modal");
const closeCertModalBtn = addCertModal?.querySelector("[data-action='close-add-cert']");
const certFileInput = document.getElementById("cert-file-input");
const certPasswordInput = document.getElementById("cert-password-input");
const certImportBtn = document.getElementById("cert-import-btn");
const certMessage = document.getElementById("cert-message");

const certPlaceholder = document.querySelector(".cert-info-placeholder");
const certDisplay = document.getElementById("cert-info-display");
const certUdidEl = document.getElementById("cert-udid");
const certExpiryEl = document.getElementById("cert-expiry-date");
const deleteCertBtn = document.querySelector(".delete-cert-btn");
const addCertBtn = document.getElementById("open-cert-modal-btn");


// ===============================
// Управление модальным окном
// ===============================
function openAddCertModal() {
    if (!auth.currentUser) {
        alert("⚠️ Для добавления сертификата необходимо войти!");
        return;
    }
    certMessage.textContent = "";
    certFileInput.value = "";
    certPasswordInput.value = "";
    addCertModal?.classList.add("visible");
    document.body.classList.add("modal-open");
}

function closeAddCertModal() {
    addCertModal?.classList.remove("visible");
    document.body.classList.remove("modal-open");
}

openCertModalBtn?.addEventListener("click", openAddCertModal);
addCertModal?.addEventListener("click", (e) => {
    if (e.target === addCertModal || e.target.closest("[data-action='close-add-cert']")) {
        closeAddCertModal();
    }
});

// ===============================
// 🚀 Логика импорта сертификата
// ===============================

certImportBtn?.addEventListener("click", async () => {
    const file = certFileInput.files?.[0];
    const password = certPasswordInput.value.trim();

    if (!file) {
        certMessage.textContent = "Выберите файл .p12";
        return;
    }

    if (file.size > 5 * 1024 * 1024) { // Например, ограничение 5MB
        certMessage.textContent = "Файл слишком большой (макс. 5MB)";
        return;
    }

    certImportBtn.disabled = true;
    certMessage.textContent = "Импорт...";

    try {
        // ⚠️ ЗАГЛУШКА ДЛЯ FIREBASE UPLOAD
        // Здесь должна быть реальная логика загрузки файла в Firebase Storage
        // и получение метаданных (UDID, Expiry Date)
        console.log(`Загрузка файла: ${file.name}, Пароль: ${password ? 'есть' : 'нет'}`);
        
        // 🚨 Реальная функция должна выглядеть примерно так:
        // const certMetadata = await uploadCertificateAndGetMetadata(auth.currentUser.uid, file, password);

        // Эмуляция успешного ответа от сервера/Firebase:
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const certMetadata = {
            udid: `ABCDEF1234567890_Emulated_${Math.random().toString(36).substring(7).toUpperCase()}`,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Год вперед
        };

        if (certMetadata) {
            // 3. Сохраняем метаданные в UI/Локальное хранилище (в реальном проекте - в Firestore)
            localStorage.setItem(`user_cert_data_${auth.currentUser.uid}`, JSON.stringify(certMetadata));
            updateCertificateUI(certMetadata);
            certMessage.textContent = "✅ Сертификат успешно импортирован!";
            closeAddCertModal();
        } else {
            certMessage.textContent = "❌ Не удалось обработать сертификат. Проверьте файл и пароль.";
        }
    } catch (error) {
        console.error("Ошибка импорта сертификата:", error);
        certMessage.textContent = `❌ Ошибка импорта: ${error.message || "Неизвестная ошибка"}`;
    } finally {
        certImportBtn.disabled = false;
    }
});


// ===============================
// 🗑️ Логика удаления сертификата
// ===============================

deleteCertBtn?.addEventListener("click", () => {
    if (confirm("Вы уверены, что хотите удалить сертификат?")) {
        // ⚠️ ЗАГЛУШКА ДЛЯ FIREBASE DELETE
        // Здесь должна быть логика удаления файла и данных из Firebase
        console.log(`Удаление сертификата для ${auth.currentUser.uid}`);

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
        // Сертификат есть: показываем данные, скрываем кнопку добавления
        certPlaceholder.style.display = "none";
        certDisplay.style.display = "flex"; // Или 'block', в зависимости от CSS
        certUdidEl.textContent = certData.udid;
        certExpiryEl.textContent = certData.expiryDate;
        addCertBtn.style.display = "none";
        console.log("UI: Сертификат отображен.");
    } else {
        // Сертификата нет: показываем плейсхолдер и кнопку добавления
        certPlaceholder.style.display = "block";
        certDisplay.style.display = "none";
        certUdidEl.textContent = "N/A";
        certExpiryEl.textContent = "N/A";
        addCertBtn.style.display = "block";
        console.log("UI: Отображена кнопка 'Добавить сертификат'.");
    }
}


// ===============================
// ⚡ Инициализация (Загрузка данных при старте)
// ===============================

// Мы должны обновлять UI при изменении состояния пользователя (входе/выходе)
// Загрузка данных должна быть привязана к onUserChanged из user.js
// Но для простоты: загрузим при загрузке модуля и при смене пользователя в menu.js

// 💡 Загрузка данных из Локального хранилища (эмуляция Firestore)
export function loadUserCertificateData(user) {
    if (!user) {
        updateCertificateUI(null);
        return;
    }
    // 🚨 В реальном проекте: запросить данные из Firestore
    // const data = await getCertificateFromFirestore(user.uid);
    const dataString = localStorage.getItem(`user_cert_data_${user.uid}`);
    const certData = dataString ? JSON.parse(dataString) : null;
    
    updateCertificateUI(certData);
}

// Загрузим данные при старте (если пользователь уже вошел)
// Эту функцию нужно вызывать после загрузки аутентификации в menu.js
// loadUserCertificateData(auth.currentUser); 
// 💡 Лучше вызвать из menu.js, чтобы гарантировать, что onUserChanged сработал
