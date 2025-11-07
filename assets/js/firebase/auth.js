// assets/js/firebase/auth.js
import { auth } from "../app.js";
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
// ✅ SAFARI FIX: Обработка результата перенаправления
// ===============================
export async function handleRedirectResult() {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
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
// Google Login (Используем Redirect)
// ===============================
export async function loginWithGoogle() {
    try {
        // 🔥 Заменяем signInWithPopup на signInWithRedirect
        await signInWithRedirect(auth, googleProvider);
    } catch (err) {
        // Ошибки здесь бывают редко (только если не удалось начать редирект)
        console.error("❌ Ошибка Google входа:", err);
        alert("Ошибка начала Google входа");
    }
}

// ===============================
// Facebook Login (Используем Redirect)
// ===============================
export async function loginWithFacebook() {
    try {
        // 🔥 Заменяем signInWithPopup на signInWithRedirect
        await signInWithRedirect(auth, facebookProvider);
    } catch (err) {
        console.error("❌ Ошибка Facebook входа:", err);
        alert("Ошибка начала Facebook входа");
    }
}

// ===============================
// Email Login (Оставляем как есть, тут нет проблем)
// =================================
export async function loginWithEmail(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
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
        await createUserWithEmailAndPassword(auth, email, password);
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
