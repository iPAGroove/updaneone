// assets/js/modal.js
// ===============================
// MODAL (APP VIEW + INSTALL / SIGNER INTEGRATION)
// ===============================
import { installIPA } from "./signer.js";
import { currentLang, getTranslation } from "./i18n.js"; // 🚀 ИМПОРТ

const modalOverlay = document.getElementById("app-modal");

function getUserStatus() {
    return localStorage.getItem("ursa_user_status") || "free";
}

// 🚀 Адаптированная функция для времени
function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const ago = getTranslation('timeAgo');
    
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} ${getTranslation('timeYear')}${ago}`;
    
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} ${getTranslation('timeMonth')}${ago}`;
    
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} ${getTranslation('timeDay')}${ago}`;
    
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} ${getTranslation('timeHour')}${ago}`;
    
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} ${getTranslation('timeMinute')}${ago}`;
    
    return `${Math.floor(seconds)} ${getTranslation('timeSecond')}${ago}`;
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
    // 1. Пытаемся взять текущий язык (desc_en или desc_ru)
    // 2. Если пусто, берем другой язык (для фоллбэка, если в БД заполнено только одно поле)
    const features = data[`features${langSuffix}`] || data[`features${langSuffix === '_ru' ? '_en' : '_ru'}`] || "";
    const desc = data[`desc${langSuffix}`] || data[`desc${langSuffix === '_ru' ? '_en' : '_ru'}`] || "";

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
    modalOverlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
}

if (modalOverlay) {
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
// 🚀 Слушатель на смену языка для обновления динамических текстов
window.addEventListener('langChange', () => {
    // Если модалка открыта, переоткрываем ее для обновления контента
    if (modalOverlay.classList.contains('visible') && modalOverlay.dataset.currentApp) {
        // Здесь потребуется логика, чтобы найти объект приложения по ID и переоткрыть модалку
        // Для упрощения: мы полагаемся на translatePage, но TimeSince не обновится, если не переоткрыть.
        // В данном случае, полагаемся, что translatePage обновит статические тексты,
        // а для динамики (TimeSince) пользователь должен переоткрыть.
    }
});
