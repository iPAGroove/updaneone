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
import { closeSearchModal } from "./search.js"; // 💡 Импортируем для закрытия поиска

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

                const xmlStart = text.indexOf("<?xml");
                const xmlEnd = text.indexOf("</plist>") + "</plist>".length;
                const xml = text.substring(xmlStart, xmlEnd);

                const udidMatch = xml.match(/<key>ProvisionedDevices<\/key>\s*<array>(.+?)<\/array>/s);
                let profileID = null;

                if (udidMatch) {
                    const udidList = [...udidMatch[1].matchAll(/<string>([^<]+)<\/string>/g)];
                    if (udidList.length > 0) {
                        profileID = udidList[0][1];
                    }
                }

                if (!profileID) {
                    profileID = xml.match(/<key>UUID<\/key>\s*<string>([^<]+)<\/string>/)?.[1] || null;
                }

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

    const isExpired = new Date(expiry) < new Date();
    const status = isExpired ? "❌ Отозван" : "✅ Активен";
    const statusColor = isExpired ? "#ff6b6b" : "#00ff9d";

    card.innerHTML = `
        <p><strong>ID Профиля:</strong> ${udid.length > 30 ? udid.substring(0, 8) + '...' : udid}</p>
        <p><strong>Действует до:</strong> ${expiry}</p>
        <p style="font-weight:600;color:${statusColor};">Статус: ${status}</p>
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

    if (!p12) return alert("Выберите файл **.p12**");
    if (!mp) return alert("Выберите файл **.mobileprovision**");

    const user = auth.currentUser;
    if (!user) return alert("Сначала выполните вход.");

    // 💡 UI Feedback
    document.getElementById("cert-import-btn").textContent = "Загрузка...";
    document.getElementById("cert-import-btn").disabled = true;

    try {
        const parsed = await parseMobileProvision(mp);

        if (!parsed.udid || !parsed.expiryDate) {
            // 💡 Улучшенное сообщение об ошибке парсинга
            throw new Error("Не удалось извлечь информацию о профиле (UUID/дату). Проверьте файл .mobileprovision.");
        }

        const uid = user.uid;
        const folder = `signers/${uid}/`;

        // Загрузка файлов и сохранение данных в Firestore
        await uploadBytes(ref(storage, folder + p12.name), p12);
        await uploadBytes(ref(storage, folder + mp.name), mp);

        await setDoc(doc(db, "ursa_signers", uid), {
            udid: parsed.udid,
            expires: parsed.expiryDate,
            pass: password,
            createdAt: new Date().toISOString()
        }, { merge: true });

        localStorage.setItem("ursa_cert_udid", parsed.udid);
        localStorage.setItem("ursa_cert_exp", parsed.expiryDate);
        localStorage.setItem("ursa_signer_id", uid);

        document.getElementById("cert-modal").classList.remove("visible");
        renderCertificateBlock();
        openMenu();
        alert("✅ Сертификат успешно загружен и импортирован!"); // Уведомление об успехе

    } catch (error) {
        // 💡 ИСПРАВЛЕНИЕ ПУНКТА 3: Более информативное сообщение об ошибке загрузки
        console.error("Ошибка при загрузке файлов:", error);
        alert(`❌ Ошибка при загрузке файлов: ${error.message || "Проверьте файлы и подключение к сети."}`);
    } finally {
        document.getElementById("cert-import-btn").textContent = "Импортировать";
        document.getElementById("cert-import-btn").disabled = false;
    }
}

// ===============================
// 📌 Меню UI
// ===============================
export function openMenu() { // 💡 Экспортируем
    document.getElementById("menu-modal").classList.add("visible");
    document.body.classList.add("modal-open");
}
export function closeMenu() { // 💡 Экспортируем
    document.getElementById("menu-modal").classList.remove("visible");
    document.body.classList.remove("modal-open");
}

// ===============================
// ГЛАВНОЕ
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("menu-btn")?.addEventListener("click", () => {
        closeSearchModal(); // Закрываем поиск, если он открыт
        renderCertificateBlock();
        openMenu();
    });

    document.getElementById("menu-modal")?.addEventListener("click", (e) => {
        if (e.target === e.currentTarget || e.target.closest("[data-action='close-menu']")) closeMenu();
    });

    document.getElementById("cert-modal")?.addEventListener("click", (e) => {
        if (e.target === e.currentTarget || e.target.closest("[data-action='close-cert']")) {
            document.getElementById("cert-modal").classList.remove("visible");
            openMenu();
        }
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

    // 💡 ИСПРАВЛЕНИЕ ПУНКТА 4: После входа через Google/Facebook открываем меню
    document.querySelector(".google-auth")?.addEventListener("click", async () => { 
        await loginWithGoogle(); 
        openMenu(); 
    });
    
    document.querySelector(".facebook-auth")?.addEventListener("click", async () => { 
        await loginWithFacebook(); 
        openMenu(); 
    });

    // 💡 ИСПРАВЛЕНИЕ ПУНКТА 7: Закрытие меню при клике на другие кнопки навигации
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const menuModal = document.getElementById("menu-modal");
            // Если меню открыто И нажатая кнопка не является кнопкой меню
            if (menuModal.classList.contains("visible") && e.currentTarget.id !== "menu-btn") {
                closeMenu();
            }
        });
    });

    onUserChanged((user) => {
        document.getElementById("user-nickname").textContent = user?.displayName || user?.email || "Гость";
        document.getElementById("user-avatar").src = user?.photoURL || "https://placehold.co/100x100/121722/00b3ff?text=User";
    });
});
