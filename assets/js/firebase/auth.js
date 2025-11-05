// assets/js/firebase/auth.js

import { auth } from "../app.js";
import {
    signInWithPopup,
    signInAnonymously,
    GoogleAuthProvider,
    FacebookAuthProvider
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export async function loginWithGoogle() {
    try {
        await signInWithPopup(auth, googleProvider);
        console.log("✅ Google вход выполнен");
    } catch (err) {
        console.error("❌ Ошибка Google входа:", err);
    }
}

export async function loginWithFacebook() {
    try {
        await signInWithPopup(auth, facebookProvider);
        console.log("✅ Facebook вход выполнен");
    } catch (err) {
        console.error("❌ Ошибка Facebook входа:", err);
    }
}

export async function loginAnon() {
    try {
        await signInAnonymously(auth);
        console.log("✅ Анонимный вход выполнен");
    } catch (err) {
        console.error("❌ Ошибка анонимного входа:", err);
    }
}
