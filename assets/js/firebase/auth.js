// assets/js/firebase/auth.js
import { auth, db } from "../app.js"; // 🔥 ДОБАВЛЕНО: db для записи статуса
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"; 

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
        status: "free",
        created_at: new Date().toISOString(),
    };
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
            await ensureUserRecord(result.user);
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
// Google Login 
// ===============================
export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        await ensureUserRecord(result.user);
        console.log("✅ Google вход выполнен через Popup (ВРЕМЕННО)");
        return result;
    } catch (err) {
        console.error("❌ КРИТИЧЕСКАЯ ОШИБКА Google входа:", err);
        // alert(`❌ Ошибка Google входа: ${err.message}. Проверьте консоль!`); // 🔥 REMOVED
        throw err;
    }
}

// ===============================
// Facebook Login 
// ===============================
export async function loginWithFacebook() {
    try {
        const result = await signInWithPopup(auth, facebookProvider);
        await ensureUserRecord(result.user);
        console.log("✅ Facebook вход выполнен через Popup (ВРЕМЕННО)");
        return result;
    } catch (err) {
        console.error("❌ КРИТИЧЕСКАЯ ОШИБКА Facebook входа:", err);
        // alert(`❌ Ошибка Facebook входа: ${err.message}. Проверьте консоль!`); // 🔥 REMOVED
        throw err;
    }
}

// ===============================
// Email Login
// =================================
export async function loginWithEmail(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await ensureUserRecord(result.user);
        console.log("✅ Email вход выполнен");
    } catch (err) {
        console.error("❌ Ошибка входа:", err.message);
        // alert(err.message.replace("Firebase:", "").trim()); // 🔥 REMOVED
        throw new Error(err.message.replace("Firebase:", "").trim()); // 🔥 Re-throw error for menu.js
    }
}

// ===============================
// Email Registration
// ===============================
export async function registerWithEmail(email, password) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await ensureUserRecord(result.user);
        console.log("✅ Аккаунт создан");
        // alert("✅ Аккаунт создан! Теперь вы вошли."); // 🔥 REMOVED
    } catch (err) {
        console.error("❌ Ошибка регистрации:", err.message);
        // alert(err.message.replace("Firebase:", "").trim()); // 🔥 REMOVED
        throw new Error(err.message.replace("Firebase:", "").trim()); // 🔥 Re-throw error for menu.js
    }
}

// ===============================
// Password Reset
// ===============================
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        // alert("📩 Ссылка для восстановления пароля отправлена на ваш email"); // 🔥 REMOVED
        return true; // Return success
    } catch (err) {
        console.error("❌ Ошибка восстановления:", err.message);
        // alert(err.message.replace("Firebase:", "").trim()); // 🔥 REMOVED
        throw new Error(err.message.replace("Firebase:", "").trim()); // 🔥 Re-throw error for menu.js
    }
}
