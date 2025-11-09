// assets/js/firebase/user.js
import { auth, db } from "../app.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

export function onUserChanged(callback) {
    onAuthStateChanged(auth, async (user) => {

        // ❌ Не авторизован
        if (!user) return callback(null);

        const userRef = doc(db, "ursa_users", user.uid);
        const snap = await getDoc(userRef);

        // ✅ Если пользователь входит впервые — создаём запись со статусом FREE
        if (!snap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email || null,
                name: user.displayName || "Пользователь",
                photo: user.photoURL || null,
                status: "free", // ← дефолтный статус
                language: "ru",
                created_at: new Date().toISOString(),
                last_active_at: new Date().toISOString()
            }, { merge: true });

            return callback({
                uid: user.uid,
                displayName: user.displayName || null,
                photoURL: user.photoURL || null,
                email: user.email || null,
                status: "free"
            });
        }

        // ✅ Есть документ → считываем статус
        const data = snap.data();

        // обновляем дату активности
        await setDoc(userRef, {
            last_active_at: new Date().toISOString()
        }, { merge: true });

        return callback({
            uid: user.uid,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            email: user.email || null,
            status: data.status || "free" // ← поддержка VIP
        });
    });
}
