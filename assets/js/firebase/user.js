// assets/js/firebase/user.js

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const auth = getAuth();

// callback → вызывается при изменении пользователя
export function onUserChanged(callback) {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            callback(null);
            return;
        }

        callback({
            uid: user.uid,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            email: user.email || null,
            isAnonymous: user.isAnonymous || false,
        });
    });
}
