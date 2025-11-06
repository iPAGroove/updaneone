import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// Открыть модалку
document.querySelector(".add-cert-btn").addEventListener("click", () => {
    document.getElementById("cert-modal").classList.add("visible");
    document.body.classList.add("modal-open");
});

// Закрыть модалку
document.querySelector("[data-action='close-cert']").addEventListener("click", () => {
    document.getElementById("cert-modal").classList.remove("visible");
    document.body.classList.remove("modal-open");
});

// ================================
//   ПАРСИНГ mobileprovision
// ================================
async function parseMobileProvision(file) {
    const text = await file.text();
    const xml = text.substring(text.indexOf("<?xml"), text.indexOf("</plist>") + 8);

    const parser = new DOMParser();
    const plist = parser.parseFromString(xml, "text/xml");

    const get = (name) =>
        plist.querySelector(`key:contains(${name}) + *`)?.textContent ||
        plist.evaluate(`//key[text()='${name}']/following-sibling::*[1]`, plist, null, XPathResult.STRING_TYPE).stringValue;

    // UDID (берем первый в списке, обычно он единственный)
    const udid = plist.evaluate("//key[text()='ProvisionedDevices']/following-sibling::array/string[1]", plist, null, XPathResult.STRING_TYPE).stringValue;

    // ExpirationDate
    const expiration = plist.evaluate("//key[text()='ExpirationDate']/following-sibling::date[1]", plist, null, XPathResult.STRING_TYPE).stringValue;

    return { udid, expiration };
}

// ================================
//   Обработка кнопки "Импортировать"
// ================================
document.getElementById("cert-upload-btn").addEventListener("click", async () => {
    const fileP12 = document.getElementById("cert-file-p12").files[0];
    const fileMobile = document.getElementById("cert-file-mobile").files[0];
    const pass = document.getElementById("cert-pass").value.trim();

    if (!fileP12 || !fileMobile) {
        alert("Выберите .p12 и .mobileprovision");
        return;
    }

    // Парсим .mobileprovision
    const { udid, expiration } = await parseMobileProvision(fileMobile);

    const user = auth.currentUser;
    if (!user) return alert("Ошибка: вы не авторизованы.");

    // Сохраняем информацию в Firestore под user.uid
    await setDoc(doc(db, "certificates", user.uid), {
        p12Name: fileP12.name,
        mobileName: fileMobile.name,
        password: pass || null,
        udid,
        expiration,
        updatedAt: Date.now()
    });

    // Закрываем модалку
    document.getElementById("cert-modal").classList.remove("visible");
    document.body.classList.remove("modal-open");

    // Обновляем UI сертификата
    updateCertificateUI({ udid, expiration });
});

// ================================
//   ОБНОВЛЕНИЕ UI В МЕНЮ
// ================================
function updateCertificateUI(data) {
    const card = document.querySelector(".certificate-card");
    card.innerHTML = `
        <p class="cert-info">UDID: <strong>${data.udid}</strong></p>
        <p class="cert-info">Действует до: <strong>${new Date(data.expiration).toLocaleDateString()}</strong></p>
        <button class="btn remove-cert-btn">Удалить сертификат</button>
    `;

    document.querySelector(".remove-cert-btn").addEventListener("click", async () => {
        await setDoc(doc(db, "certificates", auth.currentUser.uid), {}, { merge: false });
        location.reload();
    });
}

export { updateCertificateUI };
