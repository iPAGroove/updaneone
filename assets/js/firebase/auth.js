// assets/js/firebase/auth.js

import {
    getAuth,
    signInWithPopup,
    signInAnonymously,
    GoogleAuthProvider,
    FacebookAuthProvider
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const auth = getAuth();

// Google вход
export async function loginWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        console.log("✅ Google вход выполнен");
    } catch (err) {
        console.error("❌ Ошибка Google входа:", err);
    }
}

// Facebook вход
export async function loginWithFacebook() {
    try {
        const provider = new FacebookAuthProvider();
        await signInWithPopup(auth, provider);
        console.log("✅ Facebook вход выполнен");
    } catch (err) {
        console.error("❌ Ошибка Facebook входа:", err);
    }
}

// Анонимный вход
export async function loginAnon() {
    try {
        await signInAnonymously(auth);
        console.log("✅ Анонимный вход выполнен");
    } catch (err) {
        console.error("❌ Ошибка анонимного входа:", err);
    }
}
