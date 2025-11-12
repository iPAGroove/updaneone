// assets/js/app.js
// ===============================
// Firebase + Catalog Loader + Sorting + User Status Export
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { openModal } from "./modal.js";
import { currentLang } from "./i18n.js"; // 🚀 ИМПОРТ ЯЗЫКА

// ===============================
// Firebase Config
// ===============================
const firebaseConfig = {
apiKey: "AIzaSyDFj9gOYU49Df6ohUR5CnbRv3qdY2i_OmU",
authDomain: "ipa-panel.firebaseapp.com",
projectId: "ipa-panel",
storageBucket: "ipa-panel.firebasestorage.app",
messagingSenderId: "239982196215",
appId: "1:239982196215:web:9de387c51952da428daaf2"
};
// Init Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
console.log("✅ Firebase инициализирован");
// ===============================
// Статус пользователя (free/vip)
// ===============================
export let userStatus = "free";
export function setUserStatus(status) {
userStatus = status || "free";
}
// ===============================
// Данные каталога
// ===============================
export let appsData = [];
export let currentCategory = "apps";
export function setCurrentCategory(type) {
currentCategory = type;
displayCatalog();
}
// ===============================
// Генерация карточки
// ===============================
function createCardHtml(data) {
return `
<article class="card" data-id="${data.id}">
<div class="card-media">
<img src="${data.img}" class="card-icon" alt="${data.title}">
${data.vip ? `<div class="card-badge" data-i18n="vipTitle">VIP</div>` : ""}
</div>
<div class="card-info">
<h3>${data.title}</h3>
<p class="meta">${data.version}</p>
</div>
<button class="card-cta open-modal-btn" data-id="${data.id}">
<span data-i18n="installBtn">Открыть</span>
</button>
</article>
`;
}
function attachModalOpenListeners(carousel) {
carousel.addEventListener("click", (event) => {
const btn = event.target.closest(".open-modal-btn");
if (!btn) return;
const id = btn.dataset.id;
const data = appsData.find(app => app.id === id);
if (data) openModal(data);
});
}
// ===============================
// Отрисовка коллекций
// ===============================
export function displayCatalog() {
const lang = currentLang; // 🚀 Используем текущий язык
const rows = document.querySelectorAll(".collection-row");
const LIMIT = 12;
rows.forEach(row => {
const carousel = row.querySelector(".card-carousel");
const section = row.querySelector(".collection-title").textContent.trim();
carousel.innerHTML = "";
let filtered = appsData.filter(app => app.tags.includes(currentCategory));
if (section === "Popular" || section === "Популярные") { // Учитываем старый/новый текст
filtered = filtered.sort((a, b) => b.downloadCount - a.downloadCount);
} else if (section === "Update" || section === "Обновления") {
filtered = filtered.sort((a, b) => b.updatedTime - a.updatedTime);
} else if (section === "VIP") {
filtered = filtered
.filter(app => app.vip)
.sort((a, b) => b.downloadCount - a.downloadCount);
}
filtered.slice(0, LIMIT).forEach(app =>
carousel.insertAdjacentHTML("beforeend", createCardHtml(app))
);
attachModalOpenListeners(carousel);
for (let i = filtered.length; i < LIMIT; i++) {
carousel.insertAdjacentHTML("beforeend", `<article class="card placeholder"></article>`);
}
});
// 🚀 Важно: после ре-рендера нужно перевести новые кнопки "Открыть" и бейджи "VIP"
import('./i18n.js').then(module => module.translatePage());
}
// ===============================
// Загрузка из Firestore
// ===============================
async function loadDataFromFirestore() {
// ... (остальной код загрузки остаётся прежним)
    try {
        const snapshot = await getDocs(collection(db, "ursa_ipas"));
        appsData = snapshot.docs.map(doc => {
            const item = doc.data();
            const langSuffix = currentLang === 'en' ? '_en' : '_ru'; // Определяем суффикс
            return {
                id: doc.id,
                title: item.NAME || "Без названия",
                version: item.Version || "N/A",
                // 🚀 Динамический выбор описания и фич
                desc_ru: item.description_ru || item.description_en || "",
                desc_en: item.description_en || item.description_ru || "",
                features_ru: item.features_ru || item.features_en || "",
                features_en: item.features_en || item.features_ru || "",
                // ----------------------------------------
                img: item.iconUrl || "https://placehold.co/200x200",
                // ✅ МЕГА-НАДЕЖНАЯ обработка tags
                tags: (Array.isArray(item.tags) ? item.tags : [item.tags])
                    .filter(Boolean)
                    .map(t => String(t).toLowerCase().trim()),
                link: item.DownloadUrl || "#",
                size: item.sizeBytes ? `${(item.sizeBytes / 1048576).toFixed(1)} MB` : "N/A",
                vip: item.vipOnly === true,
                downloadCount: item.downloadCount ?? 0,
                updatedTime: item.updatedAt
                    ? new Date(item.updatedAt).getTime()
                    : item.createdAt
                    ? new Date(item.createdAt).getTime()
                    : Date.now()
            };
        });
        console.log(`✅ Загружено приложений: ${appsData.length}`);
        displayCatalog();
    } catch (err) {
        console.error("❌ Ошибка загрузки Firestore:", err);
    }
}
loadDataFromFirestore();

// 🚀 СЛУШАТЕЛЬ ДЛЯ СМЕНЫ ЯЗЫКА
window.addEventListener('langChange', displayCatalog);
