// ===============================
// MODAL (APP VIEW + INSTALL / SIGNER INTEGRATION + VIP CHECK)
// ===============================

import { installIPA } from "./signer.js";
import { auth, db } from "./app.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const modalOverlay = document.getElementById('app-modal');
const dlRow = document.getElementById("dl-buttons-row");

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

export async function openModal(data) {
    if (!modalOverlay || !data) return;

    // поля
    const icon = data.img || data.iconUrl || "";
    const title = data.title || data.NAME || "Без названия";
    const version = data.version || data.Version || "N/A";
    const size = data.size || (data.sizeBytes ? (data.sizeBytes / 1_000_000).toFixed(1) + " MB" : "N/A");
    const uploadTime = data.uploadTime || data.updatedAt || new Date().toISOString();
    const link = data.link || data.DownloadUrl;

    // UI
    document.getElementById('modal-icon').src = icon;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-version').textContent = version;
    document.getElementById('modal-size').textContent = size;
    document.getElementById('modal-time-ago').textContent = timeSince(new Date(uploadTime));

    const features = data.features || data.features_ru || data.features_en || "";
    const featuresFormatted = features.replace(/,\s*/g, '\n').trim();
    document.getElementById('modal-features').textContent = featuresFormatted;

    let desc = (data.desc || data.description_ru || data.description_en || "").trim();
    if (
        desc.toLowerCase() === "функции мода" ||
        desc.toLowerCase() === "hack features" ||
        desc === "" ||
        desc === featuresFormatted ||
        desc.replace(/\s+/g, '') === featuresFormatted.replace(/\s+/g, '')
    ) desc = "";
    document.getElementById('modal-desc').textContent = desc;

    const ctaButton = document.getElementById('modal-cta');
    ctaButton.textContent = "Установить";
    ctaButton.removeAttribute("href");

    // ===============================
    // ✅ ПРОВЕРКА VIP
    // ===============================
    let userStatus = "free";
    const user = auth.currentUser;

    if (user) {
        const snap = await getDoc(doc(db, "ursa_users", user.uid));
        if (snap.exists()) userStatus = snap.data().status || "free";
    }

    const isVipApp = data.vipOnly === true || data.badge === "VIP";

    if (isVipApp && userStatus !== "vip") {
        ctaButton.style.opacity = "0.5";
        ctaButton.style.filter = "grayscale(100%)";
        ctaButton.style.pointerEvents = "none";
        ctaButton.textContent = "VIP ONLY";

        // ↓ Если хочешь кнопку "Купить VIP" — скажи, добавлю
    } else {
        // ✅ Разрешено → Устанавливаем
        ctaButton.onclick = (e) => {
            e.preventDefault();
            installIPA({
                ...data,
                link
            });
        };
    }

    // очистка прогресса
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
