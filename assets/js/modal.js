// assets/js/modal.js
// ===============================
// MODAL (APP VIEW + INSTALL / SIGNER INTEGRATION + i18n)
// ===============================

import { installIPA } from "./signer.js";
import { t, currentLang } from "./i18n.js";

const modalOverlay = document.getElementById("app-modal");

// ===============================
// Получаем VIP статус
// ===============================
function getUserStatus() {
    return localStorage.getItem("ursa_user_status") || "free";
}

// ===============================
// Перевод времени (меняется от языка)
// ===============================
function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    const lang = currentLang;

    const map = {
        ru: {
            year: "г. назад",
            month: "мес. назад",
            day: "дн. назад",
            hour: "ч. назад",
            minute: "мин. назад",
            second: "сек. назад",
        },
        en: {
            year: "year ago",
            years: "years ago",
            month: "month ago",
            months: "months ago",
            day: "day ago",
            days: "days ago",
            hour: "hour ago",
            hours: "hours ago",
            minute: "min ago",
            minuteLong: "minute ago",
            minutesLong: "minutes ago",
            second: "sec ago",
        }
    };

    const intervals = [
        { secs: 31536000, ru: "year", enSing: "year", enPlur: "years" },
        { secs: 2592000,  ru: "month", enSing: "month", enPlur: "months" },
        { secs: 86400,    ru: "day", enSing: "day", enPlur: "days" },
        { secs: 3600,     ru: "hour", enSing: "hour", enPlur: "hours" },
        { secs: 60,       ru: "minute", enSing: "minuteLong", enPlur: "minutesLong" },
    ];

    for (const i of intervals) {
        const value = Math.floor(seconds / i.secs);
        if (value >= 1) {
            if (lang === "ru") {
                return `${value} ${map.ru[i.ru]}`;
            }
            // English plural
            return `${value} ${value === 1 ? map.en[i.enSing] : map.en[i.enPlur]}`;
        }
    }

    if (lang === "ru") {
        return `${seconds} ${map.ru.second}`;
    }
    return `${seconds} ${map.en.second}`;
}

// ===============================
// Открытие модалки
// ===============================
export function openModal(data) {
    if (!modalOverlay || !data) return;

    const icon = data.img || data.iconUrl || "";
    const title = data.title || "Untitled";
    const version = data.version || "N/A";
    const size = data.size || "N/A";
    const uploadTime = data.updatedTime || data.uploadTime || new Date().toISOString();
    const link = data.link;

    // Заполнение UI
    document.getElementById("modal-icon").src = icon;
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-version").textContent = version;
    document.getElementById("modal-size").textContent = size;
    document.getElementById("modal-time-ago").textContent = timeSince(new Date(uploadTime));

    const features = (data.features || "").replace(/,\s*/g, "\n").trim();
    document.getElementById("modal-features").textContent = features;

    const desc = data.desc || "";
    document.getElementById("modal-desc").textContent = desc === features ? "" : desc;

    // === Перевод заголовка "Функции мода" ===
    document.querySelector(".modal-features-new h4").textContent = t("modFeatures");

    // ===============================
    // 🚀 Проверка VIP
    // ===============================
    const status = getUserStatus();
    const ctaButton = document.getElementById("modal-cta");

    ctaButton.style.pointerEvents = "auto";
    ctaButton.style.opacity = "1";

    ctaButton.textContent = t("install");

    if (data.vip && status !== "vip") {
        ctaButton.textContent = "VIP ONLY";
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

// ===============================
// Закрывать модалку
// ===============================
function closeModal() {
    modalOverlay.classList.remove("visible");
    document.body.classList.remove("modal-open");
}

// ===============================
// Обработчики
// ===============================
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

// ===============================
// ⚡ Автоматический перевод при смене языка
// ===============================
document.addEventListener("ursa_lang_changed", () => {
    const ctaButton = document.getElementById("modal-cta");
    if (ctaButton) ctaButton.textContent = t("install");

    const featTitle = document.querySelector(".modal-features-new h4");
    if (featTitle) featTitle.textContent = t("modFeatures");
});
