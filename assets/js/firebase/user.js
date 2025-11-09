// assets/js/firebase/user.js
import { auth, db } from "../app.js"; // 🔥 ДОБАВЛЯЕМ db
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"; // 🔥 ДОБАВЛЯЕМ ИМПОРТ doc и onSnapshot

let userListener = null; // Для отписки от предыдущего слушателя Firestore

export function onUserChanged(callback) {
    onAuthStateChanged(auth, (user) => {
        
        // 1. Отписываемся от старого слушателя Firestore, если он есть
        if (userListener) {
            userListener();
            userListener = null;
        }

        if (!user) return callback(null);

        const baseUserData = {
            uid: user.uid,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            email: user.email || null,
            isAnonymous: user.isAnonymous || false,
            userStatus: "free" // Дефолтное значение до загрузки из Firestore
        };
        
        callback(baseUserData); // Отправляем базовые данные немедленно
        
        // 2. 🔥 Подписываемся на изменения в Firestore коллекции ursa_users
        const userRef = doc(db, "ursa_users", user.uid);

        userListener = onSnapshot(userRef, (docSnap) => {
            let finalUserData = baseUserData;

            if (docSnap.exists()) {
                const firestoreData = docSnap.data();
                finalUserData = {
                    ...baseUserData,
                    // 🔥 Получаем статус из Firestore, или оставляем 'free'
                    userStatus: firestoreData.status || "free" 
                };
            }

            // Отправляем полные данные, включая статус
            callback(finalUserData);
        }, (error) => {
            console.error("❌ Ошибка при получении статуса юзера:", error);
            // Возвращаем данные без статуса при ошибке
            callback(baseUserData); 
        });

    });
}
