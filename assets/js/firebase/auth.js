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

// ============================
// 🌐 Google Login
// ============================
export async function loginWithGoogle() {
    try {
        await signInWithPopup(auth, googleProvider);
        console.log("✅ Google вход выполнен");
    } catch (err) {
        console.error("❌ Ошибка Google входа:", err.message || err);
    }
}

// ============================
// 📘 Facebook Login
// ============================
export async function loginWithFacebook() {
    try {
        await signInWithPopup(auth, facebookProvider);
        console.log("✅ Facebook вход выполнен");
    } catch (err) {
        console.error("❌ Ошибка Facebook входа:", err.message || err);
    }
}

// ============================
// ✉️ Email Login
// ============================
export async function loginWithEmail(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("✅ Вход по Email выполнен");
    } catch (err) {
        console.error("❌ Ошибка входа по Email:", err.message || err);
        alert("Ошибка входа: " + err.message);
    }
}

// ============================
// 🆕 Email Register
// ============================
export async function registerWithEmail(email, password) {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log("✅ Регистрация выполнена");
    } catch (err) {
        console.error("❌ Ошибка регистрации:", err.message || err);
        alert("Ошибка регистрации: " + err.message);
    }
}

// ============================
// 🔄 Reset Password
// ============================
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        alert("✅ Ссылка на сброс пароля отправлена на email");
    } catch (err) {
        console.error("❌ Ошибка восстановления пароля:", err.message || err);
        alert("Ошибка: " + err.message);
    }
}
