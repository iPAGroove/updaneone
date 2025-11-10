// assets/js/firebase/user.js
import { auth, db } from "../app.js"; // Импортируем db
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
// ✅ ДОБАВЛЕНО: Импорт Firestore
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Глобальная переменная для хранения статуса пользователя
export let userStatus = "free"; // Дефолтный статус free

/**
 * Создает или обновляет запись пользователя в Firestore.
 * @param {import("firebase/auth").User} user Firebase User объект
 */
export async function createOrUpdateUserDoc(user) {
    const userRef = doc(db, "ursa_users", user.uid);
    const docSnap = await getDoc(userRef);

    const userData = {
        uid: user.uid,
        email: user.email || null,
        name: user.displayName || "Гость",
        photo: user.photoURL || null,
        last_active_at: serverTimestamp(),
        // 🚨 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Устанавливаем дефолтный статус 'free' при первом создании
        status: docSnap.exists() ? docSnap.data().status : "free",
        created_at: docSnap.exists() ? docSnap.data().created_at : serverTimestamp(),
        language: docSnap.exists() ? docSnap.data().language : "ru"
    };

    await setDoc(userRef, userData, { merge: true });
    return userData;
}

export function onUserChanged(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            userStatus = "free"; // Сбрасываем статус при выходе
            return callback(null, userStatus);
        }

        try {
            // 1. Создаем/Обновляем запись в Firestore (и получаем статус)
            const userData = await createOrUpdateUserDoc(user);
            userStatus = userData.status || "free"; // Обновляем глобальный статус

            // 2. Возвращаем данные для UI
            callback({
                uid: user.uid,
                displayName: user.displayName || userData.name,
                photoURL: user.photoURL || userData.photo,
                email: user.email || userData.email,
                isAnonymous: user.isAnonymous || false,
            }, userStatus);

        } catch (error) {
            console.error("Ошибка при загрузке/создании документа пользователя:", error);
            userStatus = "free";
            callback({
                uid: user.uid,
                displayName: user.displayName || "Гость",
                photoURL: user.photoURL || null,
                email: user.email || null,
                isAnonymous: user.isAnonymous || false,
            }, userStatus);
        }
    });
}
