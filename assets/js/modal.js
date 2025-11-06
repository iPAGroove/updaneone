// ===============================
// MODAL (APP VIEW + INSTALL / SIGNER INTEGRATION)
// ===============================

import { installIPA } from "./signer.js";

const modalOverlay = document.getElementById('app-modal');
const dlRow = document.getElementById("dl-buttons-row"); // контейнер для прогресса

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} г. назад`;

    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} мес. назад`;

    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} дн. назад`;

    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} ч. назад`;

    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} мин. назад`;

    return `${Math.floor(seconds)} сек. назад`;
}

export function openModal(data) {
    if (!modalOverlay || !data) return;

    // ===============================
    // 🔧 ФОЛЛБЭКИ НА СТАРЫЕ / НОВЫЕ ПОЛЯ
    // ===============================
    const icon = data.img || data.iconUrl || "";
    const title = data.title || data.NAME || "Без названия";
    const version = data.version || data.Version || "N/A";
    const size = data.size || (data.sizeBytes ? (data.sizeBytes/1_000_000).toFixed(1) + " MB" : "N/A");
    const uploadTime = data.uploadTime || data.updatedAt || new Date().toISOString();
    const link = data.link || data.DownloadUrl; // ← КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ

    // ===============================
    // Заполняем UI
    // ===============================
    document.getElementById('modal-icon').src = icon;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-version').textContent = version;
    document.getElementById('modal-size').textContent = size;
    document.getElementById('modal-time-ago').textContent = timeSince(new Date(uploadTime));

    // --- функции мода ---
    const features = data.features || data.features_ru || data.features_en || "";
    const featuresFormatted = features.replace(/,\s*/g, '\n').trim();
    document.getElementById('modal-features').textContent = featuresFormatted;

    // --- описание ---
    let desc = (data.desc || data.description_ru || data.description_en || "").trim();
    if (
        desc.toLowerCase() === "функции мода" ||
        desc.toLowerCase() === "hack features" ||
        desc === "" ||
        desc === featuresFormatted ||
        desc.replace(/\s+/g, '') === featuresFormatted.replace(/\s+/g, '')
    ) {
        desc = "";
    }
    document.getElementById('modal-desc').textContent = desc;

    // ===============================
    // 🚀 УСТАНОВКА (в signer уходит правильная ссылка)
    // ===============================
    const ctaButton = document.getElementById('modal-cta');
    ctaButton.textContent = "Установить";
    ctaButton.removeAttribute("href");

    ctaButton.onclick = (e) => {
        e.preventDefault();
        installIPA({
            ...data,
            link // ← ВАЖНО, теперь значение гарантированно есть
        });
    };

    // Очистка прогресса при открытии
    if (dlRow) dlRow.innerHTML = "";

    modalOverlay.classList.add('visible');
    document.body.classList.add('modal-open');
}

function closeModal() {
    modalOverlay.classList.remove('visible');
    document.body.classList.remove('modal-open');
    if (dlRow) dlRow.innerHTML = "";
}

if (modalOverlay) {
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay || event.target.closest('[data-action="close"]')) {
            closeModal();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modalOverlay.classList.contains('visible')) {
            closeModal();
        }
    });
}
