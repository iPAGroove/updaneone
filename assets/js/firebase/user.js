// assets/js/firebase/user.js
import { auth, db } from "../app.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

export let currentUserStatus = "free"; // ← ГЛОБАЛЬНО

export function onUserChanged(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            currentUserStatus = "free";
            callback(null);
            return;
        }

        const ref = doc(db, "ursa_users", user.uid);
        let snap = await getDoc(ref);

        // если нет документа → создаём с статусом free
        if (!snap.exists()) {
            await setDoc(ref, {
                uid: user.uid,
                email: user.email || null,
                name: user.displayName || null,
                status: "free",
                created_at: new Date().toISOString()
            });
            currentUserStatus = "free";
        } else {
            currentUserStatus = snap.data().status || "free";
        }

        callback({
            uid: user.uid,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            email: user.email || null,
            status: currentUserStatus
        });
    });
}
