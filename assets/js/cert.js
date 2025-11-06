import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

    const db = getFirestore();
    const auth = getAuth();

    // Открываем модалку добавления сертификата
    document.querySelector(".add-cert-btn")?.addEventListener("click", () => {
        document.getElementById("cert-modal").classList.add("visible");
        document.body.classList.add("modal-open");
    });

    // Закрываем модалку
    document.querySelector("[data-action='close-cert']")?.addEventListener("click", () => {
        document.getElementById("cert-modal").classList.remove("visible");
        document.body.classList.remove("modal-open");
    });

    async function parseMobileProvision(file) {
        const text = await file.text();
        const xml = text.substring(text.indexOf("<?xml"), text.indexOf("</plist>") + 8);
        const parser = new DOMParser();
        const plist = parser.parseFromString(xml, "text/xml");

        const udid = plist.evaluate("//key[text()='ProvisionedDevices']/following-sibling::array/string[1]", plist, null, XPathResult.STRING_TYPE).stringValue;
        const expiration = plist.evaluate("//key[text()='ExpirationDate']/following-sibling::date[1]", plist, null, XPathResult.STRING_TYPE).stringValue;

        return { udid, expiration };
    }

    document.getElementById("cert-upload-btn")?.addEventListener("click", async () => {
        const fileP12 = document.getElementById("cert-file-p12").files[0];
        const fileMobile = document.getElementById("cert-file-mobile").files[0];
        const pass = document.getElementById("cert-pass").value.trim();

        if (!fileP12 || !fileMobile) return alert("Выберите .p12 и .mobileprovision");

        const { udid, expiration } = await parseMobileProvision(fileMobile);

        const user = auth.currentUser;
        if (!user) return alert("Ошибка: вы не вошли.");

        await setDoc(doc(db, "certificates", user.uid), {
            p12Name: fileP12.name,
            mobileName: fileMobile.name,
            password: pass || null,
            udid,
            expiration,
            updatedAt: Date.now()
        });

        document.getElementById("cert-modal").classList.remove("visible");
        document.body.classList.remove("modal-open");

        updateCertificateUI({ udid, expiration });
    });

    function updateCertificateUI(data) {
        const card = document.querySelector(".certificate-card");
        card.innerHTML = `
            <p class="cert-info">UDID: <strong>${data.udid}</strong></p>
            <p class="cert-info">Действует до: <strong>${new Date(data.expiration).toLocaleDateString()}</strong></p>
            <button class="btn remove-cert-btn">Удалить сертификат</button>
        `;
    }

});
