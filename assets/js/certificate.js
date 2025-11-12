// assets/js/certificate.js
// ===============================
// Локальная UI-логика сертификата (UDID + Expiration) + i18n
// ===============================

import { auth } from "./app.js";
import { t, currentLang } from "./i18n.js";

// DOM
const certModal = document.getElementById("cert-modal");
const certImportBtn = document.getElementById("cert-import-btn");
const certP12Input = document.getElementById("cert-p12");
const certProvInput = document.getElementById("cert-mobileprovision");
const certPasswordInput = document.getElementById("cert-password");
const certCard = document.querySelector(".certificate-card");

/* ============================================================
   📌 Парсинг UDID + Expiration из .mobileprovision
   ============================================================ */
async function parseMobileProvision(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target.result;

        const xml = text.substring(
          text.indexOf("<?xml"),
          text.indexOf("</plist>") + "</plist>".length
        );

        const udid =
          xml.match(/<string>([0-9A-Fa-f-]{12,})<\/string>/)?.[1] || null;

        const expiry =
          xml.match(/<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/)?.[1]
            ?.split("T")[0] || null;

        resolve({ udid, expiry });
      } catch (err) {
        reject(err);
      }
    };

    reader.readAsText(file);
  });
}

/* ============================================================
   🧩 UI-блок сертификата (полный i18n)
   ============================================================ */
export function renderCertificateBlock() {
  const udid = localStorage.getItem("ursa_cert_udid");
  const expiry = localStorage.getItem("ursa_cert_exp");
  const logged = !!auth.currentUser;

  // --- Нет сертификата ---
  if (!udid || !expiry) {
    certCard.innerHTML = logged
      ? `<button class="btn add-cert-btn">${t("addCert")}</button>`
      : `<p class="cert-info-placeholder">${
          currentLang === "ru"
            ? "Для добавления сертификата войдите в аккаунт."
            : "Log in to add a certificate."
        }</p>`;
    return;
  }

  // --- Сертификат есть ---
  const expired = new Date(expiry) < new Date();
  const statusText = expired ? t("certRevoked") : t("certActive");
  const color = expired ? "#ff6b6b" : "#00ff9d";

  certCard.innerHTML = `
    <div class="cert-info">

      <div class="cert-row">
        <span class="cert-label">${t("certId")}:</span>
        <span class="cert-value mono" style="white-space:nowrap;">${udid}</span>
      </div>

      <div class="cert-row">
        <span class="cert-label">${t("certExpires")}:</span>
        <span class="cert-value">${expiry}</span>
      </div>

      <div class="cert-row">
        <span class="cert-label">${t("certStatus")}:</span>
        <span class="cert-value" style="color:${color};font-weight:600;">
          ${statusText}
        </span>
      </div>

    </div>

    <button class="btn delete-cert-btn">${t("deleteCert")}</button>
  `;
}

/* ============================================================
   📂 Открыть / закрыть модалку
   ============================================================ */
export function openCertModal() {
  if (!auth.currentUser)
    return alert(currentLang === "ru" ? "Сначала войдите." : "Please log in first.");

  certModal.classList.add("visible");
  document.body.classList.add("modal-open");
}

function closeCertModal() {
  certModal.classList.remove("visible");
  document.body.classList.remove("modal-open");
}

certModal?.addEventListener("click", (e) => {
  if (e.target === certModal || e.target.closest("[data-action='close-cert']"))
    closeCertModal();
});

/* ============================================================
   📥 Импорт сертификата
   ============================================================ */
certImportBtn?.addEventListener("click", async () => {
  const p12 = certP12Input.files[0];
  const mp = certProvInput.files[0];
  const pass = certPasswordInput.value.trim();

  if (!p12 || !mp) {
    alert(currentLang === "ru" ? "Выберите .p12 и .mobileprovision" : "Select .p12 and .mobileprovision");
    return;
  }

  const parsed = await parseMobileProvision(mp);
  if (!parsed.udid || !parsed.expiry) {
    alert(currentLang === "ru" ? "Не удалось прочитать сертификат." : "Failed to parse certificate.");
    return;
  }

  localStorage.setItem("ursa_cert_udid", parsed.udid);
  localStorage.setItem("ursa_cert_exp", parsed.expiry);

  closeCertModal();
  renderCertificateBlock();
});

/* ============================================================
   🗑 Удаление сертификата
   ============================================================ */
document.body.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-cert-btn")) {
    localStorage.removeItem("ursa_cert_udid");
    localStorage.removeItem("ursa_cert_exp");
    renderCertificateBlock();
  }

  if (e.target.classList.contains("add-cert-btn")) {
    openCertModal();
  }
});

/* ============================================================
   🚀 Инициализация
   ============================================================ */
document.addEventListener("DOMContentLoaded", renderCertificateBlock);

/* ============================================================
   🔄 Реакция на смену языка (перезагрузка UI)
   ============================================================ */
document.addEventListener("ursa_lang_changed", () => {
  renderCertificateBlock();
});
