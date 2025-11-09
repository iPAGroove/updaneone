// ===============================
// MODAL (APP VIEW + INSTALL / SIGNER INTEGRATION)
// ===============================

import { installIPA } from "./signer.js";
// 🔥 ИМПОРТИРУЕМ onUserChanged для получения статуса
import { onUserChanged } from "./firebase/user.js"; 

const modalOverlay = document.getElementById('app-modal');
const dlRow = document.getElementById("dl-buttons-row"); // контейнер для прогресса

// 🔥 Глобальная переменная для хранения текущего статуса юзера, дефолтно 'free'
let currentUserStatus = "free"; 

// 🔥 Подписываемся на изменение статуса юзера при загрузке
onUserChanged((user) => {
    // user.userStatus приходит из assets/js/firebase/user.js
    currentUserStatus = user ? (user.userStatus || "free") : "free";
    // console.log("✅ Статус юзера в модале обновлен:", currentUserStatus);
});


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
    const link = data.link || data.DownloadUrl; 
    const isVipApp = data.badge === "VIP"; // 🔥 Проверяем, VIP ли приложение

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
    
    // Сброс стилей для кнопки
    ctaButton.style.pointerEvents = 'auto'; 
    ctaButton.style.opacity = '1';
    ctaButton.style.backgroundColor = ''; // Используем CSS (navigation.css)
    ctaButton.style.boxShadow = '';


    // 🔥 Логика блокировки для FREE юзеров и VIP приложений
    if (isVipApp && currentUserStatus === "free") {
        ctaButton.textContent = "VIP доступ";
        // Блокируем кнопку визуально и по клику
        ctaButton.style.pointerEvents = 'none'; 
        ctaButton.style.opacity = '0.7'; 
        ctaButton.style.backgroundColor = 'var(--muted)'; // Заблокированный вид
        ctaButton.style.boxShadow = 'none';

        // Назначаем обработчик, который просто информирует пользователя
        ctaButton.onclick = (e) => {
            e.preventDefault();
            // alert("⚠️ Для установки VIP-приложений необходим VIP-статус."); // 🔥 REMOVED
            if (dlRow) {
                dlRow.innerHTML = `<div style="color:#FF4D4D; font-weight:700; font-size:15px; text-align:center; padding:5px 0;">⚠️ Для установки VIP-приложений необходим VIP-статус.</div>`;
            }
        };
        
    } else {
        // Логика для доступной установки (не VIP приложение ИЛИ VIP пользователь)
        ctaButton.onclick = (e) => {
            e.preventDefault();
            installIPA({
                ...data,
                link 
            });
        };
    }

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

