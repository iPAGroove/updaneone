// assets/js/modal.js
// ===============================
// MODAL (APP VIEW + INSTALL / SIGNER INTEGRATION)
// ===============================
import { installIPA } from "./signer.js";
import { currentLang, getTranslation } from "./i18n.js"; // 🚀 ИМПОРТ ЯЗЫКА И УТИЛИТЫ

const modalOverlay = document.getElementById("app-modal");

function getUserStatus() {
    return localStorage.getItem("ursa_user_status") || "free";
}

// 🚀 Адаптированная функция для времени
function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    
    const units = {
        year: getTranslation(currentLang === 'ru' ? 'timeYear' : 'timeYear'),
        month: getTranslation(currentLang === 'ru' ? 'timeMonth' : 'timeMonth'),
        day: getTranslation(currentLang === 'ru' ? 'timeDay' : 'timeDay'),
        hour: getTranslation(currentLang === 'ru' ? 'timeHour' : 'timeHour'),
        minute: getTranslation(currentLang === 'ru' ? 'timeMinute' : 'timeMinute'),
        second: getTranslation(currentLang === 'ru' ? 'timeSecond' : 'timeSecond'),
        ago: getTranslation(currentLang === 'ru' ? 'timeAgo' : 'timeAgo'),
    };
    
    // В i18n.js нужно добавить:
    // ru: { timeYear: "г.", timeMonth: "мес.", timeDay: "дн.", timeHour: "ч.", timeMinute: "мин.", timeSecond: "сек.", timeAgo: "назад" },
    // en: { timeYear: "y", timeMonth: "mo", timeDay: "d", timeHour: "h", timeMinute: "min", timeSecond: "sec", timeAgo: "ago" },

    if (interval > 1) return `${Math.floor(interval)} ${currentLang === 'ru' ? 'г. назад' : 'y ago'}`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} ${currentLang === 'ru' ? 'мес. назад' : 'mo ago'}`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} ${currentLang === 'ru' ? 'дн. назад' : 'd ago'}`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} ${currentLang === 'ru' ? 'ч. назад' : 'h ago'}`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} ${currentLang === 'ru' ? 'мин. назад' : 'min ago'}`;
    return `${Math.floor(seconds)} ${currentLang === 'ru' ? 'сек. назад' : 'sec ago'}`;
}

export function openModal(data) {
    if (!modalOverlay || !data) return;

    // ===============================
    // 🔧 ФОЛЛБЭКИ НА ПОЛЯ (С УЧЕТОМ ЯЗЫКА)
    // ===============================
    const langSuffix = currentLang === 'en' ? '_en' : '_ru';
    
    const icon = data.img || data.iconUrl || "";
    const title = data.title || data.NAME || getTranslation('modalTitlePlaceholder');
    const version = data.version || data.Version || "N/A";
    const size = data.size || (data.sizeBytes ? (data.sizeBytes / 1_000_000).toFixed(1) + " MB" : "N/A");
    const uploadTime = data.uploadTime || data.updatedTime || data.updatedAt || new Date().toISOString();
    const link = data.link || data.DownloadUrl;
    
    // 🚀 Динамический выбор описания/фич
    const features = data[`features${langSuffix}`] || data.features_ru || data.features_en || "";
    const desc = data[`desc${langSuffix}`] || data.description_ru || data.description_en || "";
    // ===============================
    // UI заполняем
    // ===============================
    document.getElementById("modal-icon").src = icon;
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-version").textContent = version;
    document.getElementById("modal-size").textContent = size;
    document.getElementById("modal-time-ago").textContent = timeSince(new Date(uploadTime));
    
    document.getElementById("modal-features").textContent = features.replace(/,\s*/g, "\n").trim();
    let finalDesc = desc.trim();
    document.getElementById("modal-desc").textContent = finalDesc === features ? "" : finalDesc;

    // ===============================
    // 🚀 Проверка VIP
    // ===============================
    const status = getUserStatus();
    const ctaButton = document.getElementById("modal-cta");
    ctaButton.style.pointerEvents = "auto";
    ctaButton.style.opacity = "1";
    ctaButton.textContent = getTranslation('installBtn'); // 🚀 Перевод кнопки
    
    if (data.vip && status !== "vip") {
        ctaButton.textContent = getTranslation('vipOnly'); // 🚀 Перевод VIP ONLY
        ctaButton.style.opacity = "0.45";
        ctaButton.style.pointerEvents = "none";
    } else {
        ctaButton.onclick = (e) => {
            e.preventDefault();
            installIPA({ ...data, link });
        };
    }

    modalOverlay.classList.add("visible");
    document.body.classList.add("modal-open");
}

function closeModal() {
// ... (без изменений)
    modalOverlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
}

if (modalOverlay) {
// ... (без изменений)
    modalOverlay.addEventListener("click", (event) => {
        if (event.target === modalOverlay || event.target.closest("[data-action='close']")) {
            closeModal();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modalOverlay.classList.contains("visible")) {
            closeModal();
        }
    });
}
