// assets/js/firebase/auth.js
import { auth } from "../app.js";
import {
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

// 🔥 Запрос фото + профиля для Facebook
facebookProvider.addScope("public_profile");
facebookProvider.addScope("user_photos");

// ===============================
// ✅ SAFARI FIX — обработка redirect входа
// ===============================
export async function handleRedirectResult() {
    try {
        const result = await getRedirectResult(auth);
        if (result) return result;
        return null; 
    } catch (err) {
        console.error("❌ Ошибка при обработке редиректа:", err);
        throw err;
    }
}

// ===============================
// Google Login (Popup)
// ===============================
export async function loginWithGoogle() {
    try {
        await signInWithPopup(auth, googleProvider);
        console.log("✅ Google вход выполнен");
    } catch (err) {
        console.error("❌ Ошибка Google входа:", err);
        alert(`❌ Ошибка Google: ${err.message}`);
    }
}

// ===============================
// Facebook Login (Popup)
// ===============================
export async function loginWithFacebook() {
    try {
        await signInWithPopup(auth, facebookProvider);
        console.log("✅ Facebook вход выполнен");
    } catch (err) {
        console.error("❌ Ошибка Facebook входа:", err);
        alert(`❌ Ошибка Facebook: ${err.message}`);
    }
}

// ===============================
// Email Login
// ===============================
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
        console.log("✅ Аккаунт создан + вход выполнен");
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
        alert("📩 Ссылка для восстановления отправлена на почту");
    } catch (err) {
        console.error("❌ Ошибка восстановления:", err.message);
        alert(err.message.replace("Firebase:", "").trim());
    }
}
