// Firebase Core
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
// Auth
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInAnonymously,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Your Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDFj9gOYU49Df6ohUR5CnbRv3qdY2i_OmU",
    authDomain: "ipa-panel.firebaseapp.com",
    projectId: "ipa-panel",
    storageBucket: "ipa-panel.firebasestorage.app",
    messagingSenderId: "239982196215",
    appId: "1:239982196215:web:9de387c51952da428daaf2"
};

// Init
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// === LOGIN FUNCTIONS ===
export function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
}

export function loginWithFacebook() {
    return signInWithPopup(auth, facebookProvider);
}

export function loginAnon() {
    return signInAnonymously(auth);
}

// === LOGOUT ===
export function logout() {
    return signOut(auth);
}

// === AUTH STATE LISTENER ===
export function onUserChanged(callback) {
    onAuthStateChanged(auth, callback);
}
