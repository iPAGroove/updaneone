// assets/js/certificate.js
// ===============================
// UI-логика работы с сертификатом (локальное хранение)
// ===============================

import { auth } from "./app.js";

// DOM элементы
const certModal = document.getElementById("cert-modal");
const certImportBtn = document.getElementById("cert-import-btn");
const certP12Input = document.getElementById("cert-p12");
const certProvInput = document.getElementById("cert-mobileprovision");
const certPasswordInput = document.getElementById("cert-password");

const certCard = document.querySelector(".certificate-card");

// ===============================
// Парсинг .mobileprovision (UDID + Дата окончания)
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

        const udid = xml.match(/<string>([0-9A-Fa-f-]{16,})<\/string>/)?.[1] || null;
        const expiry = xml.match(/<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/)?.[1]?.split("T")[0] || null;

        resolve({ udid, expiry });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}

// ===============================
// Обновление UI
// ===============================
export function renderCertificateBlock() {
  const udid = localStorage.getItem("ursa_cert_udid");
  const expiry = localStorage.getItem("ursa_cert_exp");

  const isLoggedIn = !!auth.currentUser;

  if (!udid || !expiry) {
    certCard.innerHTML = isLoggedIn
      ? `<button class="btn add-cert-btn">Добавить сертификат</button>`
      : `<p class="cert-info-placeholder">Для добавления сертификата войдите в аккаунт.</p>`;
    return;
  }

  const expired = new Date(expiry) < new Date();
  const status = expired ? "❌ Отозван" : "✅ Активен";
  const color = expired ? "#ff6b6b" : "#00ff9d";

  certCard.innerHTML = `
    <p><strong>ID Профиля:</strong> ${udid}</p>
    <p><strong>Действует до:</strong> ${expiry}</p>
    <p style="color:${color};font-weight:600;">${status}</p>
    <button class="btn delete-cert-btn">Удалить сертификат</button>
  `;
}

// ===============================
// Открыть/Закрыть модалку
// ===============================
export function openCertModal() {
  if (!auth.currentUser) return alert("Сначала выполните вход.");
  certModal.classList.add("visible");
  document.body.classList.add("modal-open");
}

function closeCertModal() {
  certModal.classList.remove("visible");
  document.body.classList.remove("modal-open");
}

certModal?.addEventListener("click", (e) => {
  if (e.target === certModal || e.target.closest("[data-action='close-cert']")) closeCertModal();
});

// ===============================
// Импорт сертификата
// ===============================
certImportBtn?.addEventListener("click", async () => {
  const p12 = certP12Input.files[0];
  const mp = certProvInput.files[0];
  const password = certPasswordInput.value.trim();

  if (!p12 || !mp) return alert("Выберите .p12 и .mobileprovision");

  const parsed = await parseMobileProvision(mp);
  if (!parsed.udid || !parsed.expiry) return alert("Не удалось извлечь UDID/expiry.");

  localStorage.setItem("ursa_cert_udid", parsed.udid);
  localStorage.setItem("ursa_cert_exp", parsed.expiry);

  closeCertModal();
  renderCertificateBlock();
});

// ===============================
// Удаление сертификата
// ===============================
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

// ===============================
// Инициализация при загрузке сайта
// ===============================
document.addEventListener("DOMContentLoaded", renderCertificateBlock);
