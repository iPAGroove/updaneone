// assets/js/firebase/user.js
import { auth } from "../app.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
export function onUserChanged(callback) {
    onAuthStateChanged(auth, (user) => {
        if (!user) return callback(null);
        callback({
            uid: user.uid,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            email: user.email || null,
            isAnonymous: user.isAnonymous || false,
        });
    });
}
