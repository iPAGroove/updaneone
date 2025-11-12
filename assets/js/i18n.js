// ===============================
// i18n.js — Глобальная система мультиязычности URSA IPA
// ===============================

// Текущий язык (ru/en)
export let currentLang = localStorage.getItem("ursa_lang") || "ru";

// Словарь для всего фронтенда
export const dict = {
  popular: { ru: "Популярное", en: "Popular" },
  update: { ru: "Обновления", en: "Updates" },
  vip: { ru: "VIP", en: "VIP" },
  viewAll: { ru: "Смотреть все", en: "View all" },

  // Modal
  install: { ru: "Установить", en: "Install" },
  version: { ru: "Версия", en: "Version" },
  size: { ru: "Размер", en: "Size" },
  uploaded: { ru: "Загружено", en: "Uploaded" },
  modFeatures: { ru: "Функции мода", en: "Hack Features" },

  // Search
  searchPlaceholder: { ru: "Поиск приложений...", en: "Search apps..." },
  searchHint: { ru: "Нажмите вне поиска, чтобы закрыть", en: "Tap outside to close" },

  // Menu
  guest: { ru: "Гость", en: "Guest" },
  loginVia: { ru: "Войти через:", en: "Login via:" },
  addCert: { ru: "Добавить сертификат", en: "Add certificate" },
  buyCert: { ru: "Купить сертификат", en: "Buy certificate" },
  selectPlan: { ru: "Выбрать план", en: "Choose plan" },
  aboutUs: { ru: "О нас", en: "About us" },
  supportChat: { ru: "Чат поддержки", en: "Support chat" },
  changeLang: { ru: "Language / Язык", en: "Language / Язык" },

  // Certificate
  certId: { ru: "UDID", en: "UDID" },
  certExpires: { ru: "Действует до", en: "Expires" },
  certStatus: { ru: "Статус", en: "Status" },
  certActive: { ru: "Активен", en: "Active" },
  certRevoked: { ru: "Отозван", en: "Revoked" },
  deleteCert: { ru: "Удалить сертификат", en: "Delete certificate" }
};

// ===============================
// Получить перевод ключа
// ===============================
export function t(key) {
  return dict[key]?.[currentLang] ?? key;
}

// ===============================
// Переключить язык
// ===============================
export function switchLang() {
  currentLang = currentLang === "ru" ? "en" : "ru";
  localStorage.setItem("ursa_lang", currentLang);

  // Чтобы все обновилось:
  document.dispatchEvent(new Event("ursa_lang_changed"));
}
