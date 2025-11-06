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
// Ищем ProvisionedDevices или используем UUID как ID для Enterprise/Development profiles.
// ===============================
async function parseMobileProvision(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(event) {
            try {
                const text = event.target.result;

                const xmlStart = text.indexOf("<?xml");
                const xmlEnd = text.indexOf("</plist>") + "</plist>".length;
                const xml = text.substring(xmlStart, xmlEnd);

                // 1. Ищем список устройств (ProvisionedDevices) - используем match, чтобы избежать ошибки matchAll без 'g'
                const udidMatch = xml.match(/<key>ProvisionedDevices<\/key>\s*<array>(.+?)<\/array>/s);
                let profileID = null;

                if (udidMatch) {
                    // Внутри array используем matchAll с флагом 'g' для поиска всех UDID
                    const udidList = [...udidMatch[1].matchAll(/<string>([^<]+)<\/string>/g)];
                    if (udidList.length > 0) {
                        profileID = udidList[0][1]; // Берем первое UDID
                    }
                }
                
                // 2. Если UDID не найден, берем UUID профиля как ID
                if (!profileID) {
                    profileID = xml.match(/<key>UUID<\/key>\s*<string>([^<]+)<\/string>/)?.[1] || null;
                }

                // 3. Ищем дату истечения
                const expiryDate = xml.match(/<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/)?.[1]?.split("T")[0] || null;

                resolve({ udid: profileID, expiryDate });
            } catch (err) {
                reject(err);
            }
        };

        reader.readAsText(file);
    });
}

// ===============================
// 📌 Обновить UI сертификата
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
        <p><strong>ID Профиля:</strong> ${udid.length > 30 ? udid.substring(0, 8) + '...' : udid}</p>
        <p><strong>Действует до:</strong> ${expiry}</p>
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

    // ✅ Парсим UDID/UUID и дату
    const parsed = await parseMobileProvision(mp);

    // 🛑 Проверяем profileID
    if (!parsed.udid || !parsed.expiryDate) return alert("Не удалось извлечь информацию о профиле (UUID/дату). Убедитесь, что файл .mobileprovision корректен.");

    const uid = user.uid;
    const folder = `signers/${uid}/`;

    try {
        await uploadBytes(ref(storage, folder + p12.name), p12);
        await uploadBytes(ref(storage, folder + mp.name), mp);

        await setDoc(doc(db, "ursa_signers", uid), {
            udid: parsed.udid,
            expires: parsed.expiryDate,
            pass: password,
            createdAt: new Date().toISOString()
        }, { merge: true });

        // ✅ Сохраняем UI данные
        localStorage.setItem("ursa_cert_udid", parsed.udid);
        localStorage.setItem("ursa_cert_exp", parsed.expiryDate);

        // ✅ Закрываем модалку → возвращаемся в меню
        document.getElementById("cert-modal").classList.remove("visible");
        renderCertificateBlock();
        openMenu();

    } catch (error) {
        console.error("Ошибка при загрузке файлов:", error);
        alert("Произошла ошибка при загрузке файлов. Попробуйте снова.");
    }
}

// ===============================
// 📌 Меню UI
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
// ГЛАВНОЕ
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("menu-btn")?.addEventListener("click", () => {
        renderCertificateBlock();
        openMenu();
    });

    document.getElementById("menu-modal")?.addEventListener("click", (e) => {
        if (e.target === e.currentTarget || e.target.closest("[data-action='close-menu']")) closeMenu();
    });

    // ✅ Кнопка Назад на окне сертификата
    document.getElementById("cert-modal")?.addEventListener("click", (e) => {
        if (e.target === e.currentTarget || e.target.closest("[data-action='close-cert']")) {
            document.getElementById("cert-modal").classList.remove("visible");
            openMenu();
        }
    });

    document.getElementById("cert-import-btn").onclick = importCertificate;

    // Кнопка Добавить / Удалить сертификат
    document.body.addEventListener("click", (e) => {
        if (e.target.classList.contains("add-cert-btn")) document.getElementById("cert-modal").classList.add("visible");
        if (e.target.classList.contains("delete-cert-btn")) {
            localStorage.removeItem("ursa_cert_udid");
            localStorage.removeItem("ursa_cert_exp");
            renderCertificateBlock();
        }
    });

    // ===============================
    // Email Auth
    // ===============================
    const emailModal = document.getElementById("email-modal");
    const emailInput = document.getElementById("email-input");
    const passwordInput = document.getElementById("password-input");

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

    document.getElementById("email-register-btn")?.addEventListener("click", async () => {
        await registerWithEmail(emailInput.value.trim(), passwordInput.value.trim());
        emailModal.classList.remove("visible");
        openMenu();
    });

    document.getElementById("email-reset-btn")?.addEventListener("click", () => resetPassword(emailInput.value.trim()));

    // ===============================
    // Соц авторизация
    // ===============================
    document.querySelector(".google-auth")?.addEventListener("click", async () => { await loginWithGoogle(); closeMenu(); });
    document.querySelector(".facebook-auth")?.addEventListener("click", async () => { await loginWithFacebook(); closeMenu(); });

    // ===============================
    // Профиль
    // ===============================
    onUserChanged((user) => {
        document.getElementById("user-nickname").textContent = user?.displayName || user?.email || "Гость";
        document.getElementById("user-avatar").src = user?.photoURL || "https://placehold.co/100x100/121722/00b3ff?text=User";
    });
});
