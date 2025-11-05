// assets/js/firebase/user.js

import { auth, db } from "../app.js"; 
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"; // ⚠️ updateDoc для удаления
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getStorage, ref, deleteObject } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

const storage = getStorage(auth.app);

// ===============================
// 👤 Статус Пользователя (Auth)
// ===============================
export function onUserChanged(callback) {
    onAuthStateChanged(auth, (user) => {
        if (!user) return callback(null);

        callback({
            uid: user.uid,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            email: user.email || null,
            isAnonymous: user.isAnonymous || false,
        });
    });
}

// ===============================
// 🔑 Статус Сертификата
// ===============================
/**
 * Загружает данные сертификата пользователя и обновляет UI.
 * @param {string} uid User ID
 * @param {Object} elements DOM-элементы для обновления
 */
export async function updateCertUI(uid, elements) {
    const { displayEl, placeholderEl, udidEl, expiryEl } = elements;
    
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (!userDoc.exists()) {
            // Если нет документа, то нет сертификата
            throw new Error("Документ пользователя не найден");
        }

        const data = userDoc.data();
        const certData = data.certificate; 

        if (certData && certData.udid && certData.expiryDate) {
            // Сертификат найден: отображаем данные
            // UDID - укорачиваем для отображения
            udidEl.textContent = certData.udid.substring(0, 10) + '...'; 
            
            // Форматируем дату
            const date = new Date(certData.expiryDate);
            expiryEl.textContent = date.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            placeholderEl.style.display = 'none';
            displayEl.style.display = 'flex';
        } else {
            // Сертификат не найден: отображаем кнопку "Добавить сертификат"
            displayEl.style.display = 'none';
            placeholderEl.style.display = 'flex';
        }

    } catch (error) {
        console.error("Ошибка при получении данных сертификата:", error);
        // При любой ошибке показываем заглушку
        displayEl.style.display = 'none';
        placeholderEl.style.display = 'flex';
    }
}


/**
 * ❌ ФУНКЦИЯ УДАЛЕНИЯ СЕРТИФИКАТА (ЗАГЛУШКА)
 * @param {string} uid User ID
 */
export async function deleteCertificate(uid) {
    try {
        // 1. Удаление данных из Firestore
        const userDocRef = doc(db, "users", uid);
        await updateDoc(userDocRef, {
            certificate: null // Устанавливаем в null или удаляем поле, в зависимости от требований
        });
        console.log("✅ Данные сертификата удалены из Firestore.");

        // 2. (ОПЦИОНАЛЬНО) Очистка файлов из Storage. 
        // В боевом проекте нужно было бы получить пути к файлам и удалить их.
        // Сейчас просто логируем.
        console.log("⚠️ ВНИМАНИЕ: Файлы .p12 и .mobileprovision не были удалены из Storage в этой заглушке. Это нужно реализовать отдельно.");

        // После успешного удаления onAuthStateChanged обновит меню
        return true;
    } catch (error) {
        console.error("❌ Ошибка удаления сертификата:", error);
        return false;
    }
}
