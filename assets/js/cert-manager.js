// assets/js/cert-manager.js

import { auth, db, app } from "./app.js";
import { getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { updateCertUI } from "./firebase/user.js";

const storage = getStorage(app);

// DOM элементы
const certModal = document.getElementById("cert-upload-modal");
const p12File = document.getElementById('p12-file');
const mpFile = document.getElementById('mobileprovision-file');
const p12Filename = document.getElementById('p12-filename');
const mpFilename = document.getElementById('mp-filename');
const certPasswordInput = document.getElementById('cert-password-input');
const importCertBtn = document.getElementById('import-cert-btn');
const statusText = document.getElementById('cert-upload-status');
const addCertBtn = document.getElementById("add-cert-btn");

// Экспортируемая функция для открытия модалки
export function openCertModal(closeMenuCallback) {
    closeMenuCallback(); // Закрываем главное меню
    certModal.classList.add("visible");
    statusText.textContent = "";
}

function closeCertModal() {
    certModal.classList.remove("visible");
    // Очистка формы
    p12File.value = '';
    mpFile.value = '';
    p12Filename.textContent = "Файл не выбран";
    mpFilename.textContent = "Файл не выбран";
    certPasswordInput.value = '';
}

// ------------------------------------
// 1. Установка обработчиков
// ------------------------------------

// Закрытие модалки
certModal?.addEventListener("click", (e) => {
    if (e.target === certModal || e.target.closest("[data-action='close-cert']")) closeCertModal();
});

// Обновление имени файла
p12File?.addEventListener('change', () => {
    p12Filename.textContent = p12File.files[0] ? p12File.files[0].name : "Файл не выбран";
});

mpFile?.addEventListener('change', () => {
    mpFilename.textContent = mpFile.files[0] ? mpFile.files[0].name : "Файл не выбран";
});

// ------------------------------------
// 2. Логика Импорта Сертификата
// ------------------------------------
importCertBtn?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        statusText.textContent = "Ошибка: Вы не авторизованы.";
        return;
    }

    const p12 = p12File.files[0];
    const mp = mpFile.files[0];
    const password = certPasswordInput.value.trim();

    if (!p12 || !mp) {
        statusText.textContent = "Пожалуйста, выберите оба файла (.p12 и .mobileprovision).";
        return;
    }

    statusText.textContent = "Импорт... Не закрывайте окно.";
    importCertBtn.disabled = true;

    try {
        // 1. Загрузка файлов в Firebase Storage
        const certPath = `certs/${user.uid}/`;
        const p12Ref = ref(storage, certPath + p12.name);
        const mpRef = ref(storage, certPath + mp.name);

        await uploadBytes(p12Ref, p12);
        await uploadBytes(mpRef, mp);
        console.log("✅ Файлы успешно загружены в Storage.");

        // 2. ЗАГЛУШКА ДАННЫХ
        const mockCertData = {
            udid: "MOCK-UDID-FOR-CERTIFICATE-123456789",
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            password: password,
            uploadTime: new Date().toISOString()
        };

        // 3. Обновление Firestore
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
            certificate: mockCertData,
            uid: user.uid
        }, { merge: true });
        
        statusText.textContent = "✅ Сертификат успешно импортирован!";
       
        // 4. Обновление UI и закрытие
        setTimeout(async () => {
            closeCertModal();
            // Принудительное обновление UI сертификата в меню после загрузки
            // Требуется, чтобы в menu.js мы передали нужные DOM-элементы в updateCertUI,
            // но в данном примере мы просто ждем, пока onAuthStateChanged сработает
            // или добавим в 'menu.js' функцию для обновления.
        }, 1500);

    } catch (error) {
        console.error("❌ Ошибка загрузки сертификата:", error);
        statusText.textContent = `Ошибка импорта: ${error.message}`;
    } finally {
        importCertBtn.disabled = false;
    }
});
