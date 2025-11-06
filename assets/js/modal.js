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

    // --- базовые данные ---
    document.getElementById('modal-icon').src = data.img;
    document.getElementById('modal-title').textContent = data.title;
    document.getElementById('modal-version').textContent = data.version;
    document.getElementById('modal-size').textContent = data.size;
    document.getElementById('modal-time-ago').textContent = timeSince(new Date(data.uploadTime));

    // --- функции мода ---
    const featuresFormatted = (data.features || "")
        .replace(/,\s*/g, '\n')
        .trim();
    document.getElementById('modal-features').textContent = featuresFormatted;

    // --- описание ---
    let desc = (data.desc || "").trim();
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
    // КНОПКА УСТАНОВКИ → installIPA()
    // ===============================

    const ctaButton = document.getElementById('modal-cta');

    ctaButton.textContent = "Установить";
    ctaButton.removeAttribute("href");
    ctaButton.onclick = (e) => {
        e.preventDefault();
        installIPA(data);
    };

    // очистка UI прогресса при открытии
    if (dlRow) dlRow.innerHTML = "";

    // отображаем модалку
    modalOverlay.classList.add('visible');
    document.body.classList.add('modal-open');
}

function closeModal() {
    modalOverlay.classList.remove('visible');
    document.body.classList.remove('modal-open');

    // сбрасываем прогресс установщика при закрытии
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
