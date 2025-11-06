// ===============================
// Меню + Авторизация + Email Login + Импорт Сертификата
// ===============================
import {
    loginWithGoogle,
    loginWithFacebook,
    loginWithEmail,
    registerWithEmail,
    resetPassword
} from "./firebase/auth.js";

import { onUserChanged } from "./firebase/user.js";
import { auth, db } from "./app.js";

import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

const storage = getStorage();

// ===============================
// 🔍 Парсим mobileprovision → UDID + ExpirationDate
// ===============================
async function parseMobileProvision(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const xml = text.substring(text.indexOf("<?xml"), text.indexOf("</plist>") + 8);

                const udidMatch = xml.match(/<key>ProvisionedDevices<\/key>\s*<array>(.+?)<\/array>/s);
                let profileID = null;

                if (udidMatch) {
                    const udids = [...udidMatch[1].matchAll(/<string>([^<]+)<\/string>/g)];
                    if (udids.length > 0) profileID = udids[0][1];
                }

                if (!profileID) {
                    profileID = xml.match(/<key>UUID<\/key>\s*<string>([^<]+)<\/string>/)?.[1] || null;
                }

                const expiryDate = xml.match(/<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/)?.[1]?.split("T")[0];

                resolve({ udid: profileID, expiryDate });
            } catch (err) { reject(err); }
        };
        reader.readAsText(file);
    });
}

// ===============================
// 📌 UI сертификата
// ===============================
function renderCertificateBlock() {
    const block = document.querySelector(".certificate-card");
    const udid = localStorage.getItem("ursa_cert_udid");
    const expiry = localStorage.getItem("ursa_cert_exp");

    if (!udid) {
        block.innerHTML = `
            <p class="cert-info-placeholder">Данные о сертификате будут здесь</p>
            <button class="btn add-cert-btn">Добавить сертификат</button>
        `;
        return;
    }

    const expired = new Date(expiry) < new Date();
    block.innerHTML = `
        <p><strong>ID Профиля:</strong> ${udid}</p>
        <p><strong>Действует до:</strong> ${expiry}</p>
        <p style="color:${expired ? "#ff6b6b" : "#00ff9d"};font-weight:600;">
            ${expired ? "❌ Отозван" : "✅ Активен"}
        </p>
        <button class="btn delete-cert-btn">Удалить сертификат</button>
    `;
}

// ===============================
// 📥 Импорт сертификата
// ===============================
async function importCertificate() {
    const p12 = document.getElementById("cert-p12").files[0];
    const mp = document.getElementById("cert-mobileprovision").files[0];
    const password = document.getElementById("cert-password").value.trim() || "";

    if (!p12 || !mp) return alert("Выберите .p12 и .mobileprovision");

    const user = auth.currentUser;
    if (!user) return alert("Сначала выполните вход.");

    const parsed = await parseMobileProvision(mp);
    if (!parsed.udid || !parsed.expiryDate) return alert("Не удалось прочитать профиль.");

    const uid = user.uid;
    const folder = `signers/${uid}/`;

    try {
        await uploadBytes(ref(storage, folder + p12.name), p12);
        await uploadBytes(ref(storage, folder + mp.name), mp);

        await setDoc(doc(db, "ursa_signers", uid), {
            udid: parsed.udid,
            expires: parsed.expiryDate,
            pass: password,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        localStorage.setItem("ursa_cert_udid", parsed.udid);
        localStorage.setItem("ursa_cert_exp", parsed.expiryDate);
        localStorage.setItem("ursa_signer_id", uid);

        document.getElementById("cert-modal").classList.remove("visible");
        renderCertificateBlock();
        openMenu();
    } catch (err) {
        console.error(err);
        alert("Ошибка при загрузке файлов. Попробуйте снова.");
    }
}

// ===============================
// 🧭 Меню
// ===============================
function openMenu() {
    document.getElementById("menu-modal").classList.add("visible");
    document.body.classList.add("modal-open");
}
function closeMenu() {
    document.getElementById("menu-modal").classList.remove("visible");
    document.body.classList.remove("modal-open");
}

// ===============================
// MAIN INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("menu-btn")?.addEventListener("click", () => {
        renderCertificateBlock();
        openMenu();
    });

    document.getElementById("menu-modal")?.addEventListener("click", (e) => {
        if (e.target === e.currentTarget || e.target.closest("[data-action='close-menu']")) closeMenu();
    });

    document.getElementById("cert-import-btn").onclick = importCertificate;

    document.body.addEventListener("click", (e) => {
        if (e.target.classList.contains("add-cert-btn")) document.getElementById("cert-modal").classList.add("visible");
        if (e.target.classList.contains("delete-cert-btn")) {
            localStorage.removeItem("ursa_cert_udid");
            localStorage.removeItem("ursa_cert_exp");
            localStorage.removeItem("ursa_signer_id");
            renderCertificateBlock();
        }
    });

    const emailModal = document.getElementById("email-modal");
    const emailInput = document.getElementById("email-input");
    const passwordInput = document.getElementById("password-input");

    document.querySelector(".email-auth")?.addEventListener("click", () => {
        closeMenu();
        emailModal.classList.add("visible");
    });

    emailModal.addEventListener("click", (e) => {
        if (e.target === emailModal || e.target.closest("[data-action='close-email']"))
            emailModal.classList.remove("visible");
    });

    document.getElementById("email-login-btn")?.addEventListener("click", async () => {
        await loginWithEmail(emailInput.value.trim(), passwordInput.value.trim());
        emailModal.classList.remove("visible");
        openMenu();
    });

    document.getElementById("email-register-btn")?.addEventListener("click", async () => {
        await registerWithEmail(emailInput.value.trim(), passwordInput.value.trim());
        emailModal.classList.remove("visible");
        openMenu();
    });

    document.getElementById("email-reset-btn")?.addEventListener("click", () =>
        resetPassword(emailInput.value.trim())
    );

    document.querySelector(".google-auth")?.addEventListener("click", async () => { await loginWithGoogle(); openMenu(); });
    document.querySelector(".facebook-auth")?.addEventListener("click", async () => { await loginWithFacebook(); openMenu(); });

    onUserChanged((user) => {
        document.getElementById("user-nickname").textContent = user?.displayName || user?.email || "Гость";
        document.getElementById("user-avatar").src = user?.photoURL || "https://placehold.co/100x100/121722/00b3ff?text=User";
    });
});
