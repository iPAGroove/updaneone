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

    // ==========================================
    // 🔥 Привязываем реальную ссылку на IPA
    // ==========================================
    data.link = data.DownloadUrl; // ← ВАЖНО! (ИСПРАВЛЯЕТ Invalid URL)
    
    // ==========================================
    // Заголовок + иконка + метаданные
    // ==========================================
    document.getElementById('modal-icon').src = data.iconUrl;
    document.getElementById('modal-title').textContent = data.NAME;
    document.getElementById('modal-version').textContent = data.Version;
    document.getElementById('modal-time-ago').textContent = timeSince(new Date(data.updatedAt));

    // Размер конвертируем
    const sizeMB = data.sizeBytes ? (data.sizeBytes / 1_000_000).toFixed(1) + " MB" : "N/A";
    document.getElementById('modal-size').textContent = sizeMB;

    // ==========================================
    // Функции мода (RU > EN fallback)
    // ==========================================
    const features = data.features_ru || data.features_en || "";
    const formattedFeatures = features.replace(/,\s*/g, '\n').trim();
    document.getElementById('modal-features').textContent = formattedFeatures;

    // ==========================================
    // Описание (RU > EN fallback)
    // ==========================================
    let desc = (data.description_ru || data.description_en || "").trim();
    if (
        desc.toLowerCase() === "функции мода" ||
        desc.toLowerCase() === "hack features" ||
        desc === formattedFeatures ||
        desc.replace(/\s+/g, '') === formattedFeatures.replace(/\s+/g, '')
    ) {
        desc = "";
    }
    document.getElementById('modal-desc').textContent = desc;

    // ==========================================
    // Кнопка Установить → installIPA(data)
    // ==========================================
    const ctaButton = document.getElementById('modal-cta');
    ctaButton.textContent = "Установить";
    ctaButton.removeAttribute("href");

    ctaButton.onclick = (e) => {
        e.preventDefault();
        installIPA(data); // ← Запускаем signer
    };

    // Очистить прогресс-линии при повторном открытии
    if (dlRow) dlRow.innerHTML = "";

    // Показать окно
    modalOverlay.classList.add('visible');
    document.body.classList.add('modal-open');
}

function closeModal() {
    modalOverlay.classList.remove('visible');
    document.body.classList.remove('modal-open');

    // Очистить прогресс после закрытия
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
