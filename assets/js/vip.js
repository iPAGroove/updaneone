// assets/js/vip.js
import { auth, db } from "./app.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.getElementById("vip-buy-btn").onclick = async () => {

    const user = auth.currentUser;
    if (!user) {
        alert("⚠️ Войдите в аккаунт через меню");
        return;
    }

    // сейчас просто активируем VIP локально (временно)
    await setDoc(doc(db, "ursa_users", user.uid), { status: "vip" }, { merge: true });

    localStorage.setItem("ursa_user_status", "vip");

    alert("🎉 VIP активирован!");
    window.location.href = "/";
};
