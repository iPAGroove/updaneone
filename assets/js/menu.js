// ===============================
// Меню + Авторизация + Email Login + Смена Языка + Импорт Сертификата
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
// 🔍 Парсим UDID / UUID и дату из mobileprovision
// ===============================
async function parseMobileProvision(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const text = event.target.result;
                const xml = text.substring(text.indexOf("<?xml"), text.indexOf("</plist>") + 8);

                let udid = xml.match(/<key>ProvisionedDevices<\/key>[\s\S]*?<string>([^<]+)<\/string>/);
                udid = udid ? udid[1] : xml.match(/<key>UUID<\/key>\s*<string>([^<]+)<\/string>/)?.[1];

                const expiry = xml.match(/<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/)?.[1]?.split("T")[0];

                resolve({ udid, expiry });
            } catch (err) { reject(err); }
        };
        reader.readAsText(file);
    });
}

// ===============================
// UI сертификата
// ===============================
function renderCertificateBlock() {
    const card = document.querySelector(".certificate-card");
    const udid = localStorage.getItem("ursa_cert_udid");
    const expiry = localStorage.getItem("ursa_cert_exp");

    if (!udid) {
        card.innerHTML = `
            <p class="cert-info-placeholder">Данные о сертификате будут здесь</p>
            <button class="btn add-cert-btn">Добавить сертификат</button>
        `;
        return;
    }

    card.innerHTML = `
        <div class="cert-info">
            <div class="cert-row"><span class="cert-label">UDID:</span><span>${udid}</span></div>
            <div class="cert-row"><span class="cert-label">Действует до:</span><span>${expiry}</span></div>
        </div>
        <button class="btn delete-cert-btn">Удалить сертификат</button>
    `;
}

// ===============================
// Импорт сертификата
// ===============================
async function importCertificate() {
    const p12 = document.getElementById("cert-p12").files[0];
    const mp = document.getElementById("cert-mobileprovision").files[0];
    const password = document.getElementById("cert-password").value.trim() || "";

    if (!p12 || !mp) return alert("Выберите .p12 и .mobileprovision");

    const user = auth.currentUser;
    if (!user) return alert("Сначала выполните вход.");

    const data = await parseMobileProvision(mp);
    if (!data.udid || !data.expiry) return alert("Не удалось извлечь данные UDID/срока.");

    const uid = user.uid;
    const folder = `signers/${uid}/`;

    await uploadBytes(ref(storage, folder + p12.name), p12);
    await uploadBytes(ref(storage, folder + mp.name), mp);

    await setDoc(doc(db, "ursa_signers", uid), {
        udid: data.udid,
        expires: data.expiry,
        pass: password,
        createdAt: new Date().toISOString()
    }, { merge: true });

    localStorage.setItem("ursa_cert_udid", data.udid);
    localStorage.setItem("ursa_cert_exp", data.expiry);

    document.getElementById("cert-modal").classList.remove("visible");
    renderCertificateBlock();
    openMenu();
}

// ===============================
// Меню UI
// ===============================
function openMenu() {
    const overlay = document.getElementById("menu-modal");
    overlay.classList.add("visible");
    document.body.classList.add("modal-open");
}

function closeMenu() {
    const overlay = document.getElementById("menu-modal");
    overlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
}

// ===============================
// MAIN
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("menu-btn")?.addEventListener("click", () => {
        renderCertificateBlock();
        openMenu();
    });

    document.getElementById("menu-modal")?.addEventListener("click", (e) => {
        if (e.target === e.currentTarget || e.target.closest("[data-action='close-menu']"))
            closeMenu();
    });

    document.getElementById("cert-modal")?.addEventListener("click", (e) => {
        if (e.target === e.currentTarget || e.target.closest("[data-action='close-cert']")) {
            document.getElementById("cert-modal").classList.remove("visible");
            openMenu();
        }
    });

    document.getElementById("cert-import-btn").onclick = importCertificate;

    document.body.addEventListener("click", (e) => {
        if (e.target.classList.contains("add-cert-btn"))
            document.getElementById("cert-modal").classList.add("visible");

        if (e.target.classList.contains("delete-cert-btn")) {
            localStorage.removeItem("ursa_cert_udid");
            localStorage.removeItem("ursa_cert_exp");
            renderCertificateBlock();
        }
    });

    // Email auth
    const emailModal = document.getElementById("email-modal");
    document.querySelector(".email-auth")?.addEventListener("click", () => {
        closeMenu();
        emailModal.classList.add("visible");
    });
    emailModal.addEventListener("click", (e) => {
        if (e.target === e.currentTarget || e.target.closest("[data-action='close-email']"))
            emailModal.classList.remove("visible");
    });

    document.getElementById("email-login-btn")?.addEventListener("click", async () => {
        await loginWithEmail(emailInput.value.trim(), passwordInput.value.trim());
        emailModal.classList.remove("visible");
        openMenu();
    });

    // Соц вход
    document.querySelector(".google-auth")?.addEventListener("click", async () => { await loginWithGoogle(); closeMenu(); });
    document.querySelector(".facebook-auth")?.addEventListener("click", async () => { await loginWithFacebook(); closeMenu(); });

    // Профиль
    onUserChanged((user) => {
        document.getElementById("user-nickname").textContent = user?.displayName || user?.email || "Гость";
        document.getElementById("user-avatar").src = user?.photoURL || "https://placehold.co/100x100/121722/00b3ff?text=User";
    });

});
