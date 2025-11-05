// assets/js/firebase/auth.js

import { auth } from "../app.js";
import {
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Провайдеры
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// =======================
// 🌐 Вход через Google
// =======================
export async function loginWithGoogle() {
    try {
        await signInWithPopup(auth, googleProvider);
        console.log("✅ Google вход выполнен");
    } catch (err) {
        console.error("❌ Ошибка Google входа:", err);
        alert("Ошибка Google входа");
    }
}

// =======================
// 📘 Вход через Facebook
// =======================
export async function loginWithFacebook() {
    try {
        await signInWithPopup(auth, facebookProvider);
        console.log("✅ Facebook вход выполнен");
    } catch (err) {
        console.error("❌ Ошибка Facebook входа:", err);
        alert("Ошибка Facebook входа");
    }
}

// =======================
// ✉ Email Вход
// =======================
export async function loginWithEmail(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("✅ Email вход выполнен");
    } catch (err) {
        console.error("❌ Ошибка входа:", err.message);
        alert(err.message.replace("Firebase:", "").trim());
    }
}

// =======================
// 🆕 Email Регистрация
// =======================
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

// =======================
// 🔄 Восстановление пароля
// =======================
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        alert("📩 Ссылка для восстановления пароля отправлена на ваш email");
    } catch (err) {
        console.error("❌ Ошибка восстановления:", err.message);
        alert(err.message.replace("Firebase:", "").trim());
    }
}
