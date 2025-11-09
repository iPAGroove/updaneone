// assets/js/firebase/auth.js
import { auth, db } from "../app.js"; // 🔥 ДОБАВЛЯЕМ db
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"; // 🔥 ДОБАВЛЯЕМ ИМПОРТ doc и setDoc

import {
    // Импортируем Redirect и getRedirectResult
    signInWithRedirect,
    // ✅ ДОБАВЛЕНО: Добавляем signInWithPopup (для совместимости/тестов)
    signInWithPopup, 
    getRedirectResult,
    GoogleAuthProvider,
    FacebookAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// 🔥 ЯВНО ЗАПРАШИВАЕМ ПРАВА НА ФОТО И ПРОФИЛЬ
facebookProvider.addScope('public_profile');
facebookProvider.addScope('user_photos'); 

// ===============================
// 🔥 НОВАЯ ФУНКЦИЯ: Запись/Обновление данных юзера и дефолтный статус "free"
// ===============================
async function ensureUserRecord(user) {
    if (!user || !user.uid) return;
    
    const userRef = doc(db, "ursa_users", user.uid);
    const userData = {
        uid: user.uid,
        email: user.email || null,
        name: user.displayName || null,
        photo: user.photoURL || null,
        language: "ru",
        last_active_at: new Date().toISOString(),
        // 🔥 Устанавливаем статус free ТОЛЬКО если это новый пользователь (merge: true)
        status: "free",
        created_at: new Date().toISOString(), // Добавляем на всякий случай
    };

    // Используем setDoc с { merge: true }, чтобы обновить только активные поля 
    // и установить status: 'free' только если его нет, не перезаписывая существующий VIP.
    await setDoc(userRef, userData, { merge: true });
    console.log(`✅ Запись юзера ${user.uid} обновлена/создана.`);
}


// ===============================
// ✅ SAFARI FIX: Обработка результата перенаправления
// ===============================
export async function handleRedirectResult() {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            await ensureUserRecord(result.user); // 🔥 ДОБАВЛЕНО: Устанавливаем статус
            // Пользователь успешно вернулся, возвращаем результат
            return result;
        }
        return null; // Нет результата перенаправления
    } catch (err) {
        // Ошибка при обработке, например, account-exists-with-different-credential
        console.error("❌ Ошибка при обработке редиректа:", err);
        throw err; // Перебрасываем ошибку для обработки в menu.js
    }
}


// ===============================
// Google Login (ВРЕМЕННО POPUP ДЛЯ ДИАГНОСТИКИ)
// ===============================
export async function loginWithGoogle() {
    try {
        // 🔥 ВРЕМЕННОЕ ИЗМЕНЕНИЕ: Используем Popup для получения явной ошибки.
        const result = await signInWithPopup(auth, googleProvider); // 🔥 Сохраняем результат
        await ensureUserRecord(result.user); // 🔥 ДОБАВЛЕНО: Устанавливаем статус
        console.log("✅ Google вход выполнен через Popup (ВРЕМЕННО)");
    } catch (err) {
        // Ошибки здесь бывают редко (только если не удалось начать редирект)
        console.error("❌ КРИТИЧЕСКАЯ ОШИБКА Google входа:", err);
        alert(`❌ Ошибка Google входа: ${err.message}. Проверьте консоль!`);
    }
}

// ===============================
// Facebook Login (ВРЕМЕННО POPUP ДЛЯ ДИАГНОСТИКИ)
// ===============================
export async function loginWithFacebook() {
    try {
        // 🔥 ВРЕМЕННОЕ ИЗМЕНЕНИЕ: Используем Popup для получения явной ошибки.
        const result = await signInWithPopup(auth, facebookProvider); // 🔥 Сохраняем результат
        await ensureUserRecord(result.user); // 🔥 ДОБАВЛЕНО: Устанавливаем статус
        console.log("✅ Facebook вход выполнен через Popup (ВРЕМЕННО)");
    } catch (err) {
        console.error("❌ КРИТИЧЕСКАЯ ОШИБКА Facebook входа:", err);
        alert(`❌ Ошибка Facebook входа: ${err.message}. Проверьте консоль!`);
    }
}

// ===============================
// Email Login (Оставляем как есть, тут нет проблем)
// =================================
export async function loginWithEmail(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password); // 🔥 Сохраняем результат
        await ensureUserRecord(result.user); // 🔥 ДОБАВЛЕНО: Устанавливаем статус
        console.log("✅ Email вход выполнен");
    } catch (err) {
        console.error("❌ Ошибка входа:", err.message);
        alert(err.message.replace("Firebase:", "").trim());
    }
}

// ===============================
// Email Registration
// ===============================
export async function registerWithEmail(email, password) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password); // 🔥 Сохраняем результат
        await ensureUserRecord(result.user); // 🔥 ДОБАВЛЕНО: Устанавливаем статус
        console.log("✅ Аккаунт создан");
        alert("✅ Аккаунт создан! Теперь вы вошли.");
    } catch (err) {
        console.error("❌ Ошибка регистрации:", err.message);
        alert(err.message.replace("Firebase:", "").trim());
    }
}

// ===============================
// Password Reset
// ===============================
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        alert("📩 Ссылка для восстановления пароля отправлена на ваш email");
    } catch (err) {
        console.error("❌ Ошибка восстановления:", err.message);
        alert(err.message.replace("Firebase:", "").trim());
    }
}
