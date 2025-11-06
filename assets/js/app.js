// ===============================
// Firebase + Catalog App Loader
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { openModal } from "./modal.js";

// 1. Firebase Config
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
// ГЛАВНЫЕ ДАННЫЕ
// ===============================
export let appsData = [];
export let currentCategory = "apps"; // "apps" | "games"

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
                ${data.badge === "VIP" ? `<div class="card-badge">VIP</div>` : ""}
            </div>

            <div class="card-info">
                <h3>${data.title}</h3>
                <p class="meta">${data.version}</p>
            </div>

            <button class="card-cta open-modal-btn" data-id="${data.id}">
                <span>Открыть</span>
            </button>
        </article>
    `;
}

function attachModalOpenListeners(carousel) {
    carousel.addEventListener("click", (event) => {
        // Проверяем, был ли клик по кнопке "Открыть"
        const btn = event.target.closest(".open-modal-btn");
        
        // Если клик не по кнопке, проверяем, был ли клик по самой карточке,
        // но убеждаемся, что это не клик по плейсхолдеру
        const card = event.target.closest(".card:not(.placeholder)");

        const targetElement = btn || card;
        if (!targetElement) return;

        const id = targetElement.dataset.id;
        const data = appsData.find(app => app.id === id);
        
        if (data) openModal(data);
    });
}

// ===============================
// Рендер секций
// ===============================
export function displayCatalog() {
    const rows = document.querySelectorAll(".collection-row");
    // 💡 Уменьшаем лимит для лучшей совместимости с мобильными,
    // так как в CSS используется grid-template-rows: repeat(3, 1fr);
    // и 12 карточек могут выглядеть как 4 столбца по 3 ряда
    const LIMIT = 12; 

    rows.forEach(row => {
        const carousel = row.querySelector(".card-carousel");
        const sectionTitleElement = row.querySelector(".collection-title");
        
        // Используем текст заголовка для фильтрации
        const section = sectionTitleElement ? sectionTitleElement.textContent.trim() : "";

        // Сбрасываем карусель перед заполнением
        carousel.innerHTML = "";

        let items = appsData.filter(app => {
            const tags = (app.tags || "").toLowerCase().split(",").map(t => t.trim());
            
            // Фильтруем по текущей категории (apps/games)
            if (!tags.includes(currentCategory)) return false;
            
            // Фильтруем по секции (VIP/Update/Popular)
            if (section === "VIP") return app.badge === "VIP";
            // 'Popular' и 'Update' не должны быть VIP, но должны быть 'apps' или 'games'
            if (section === "Popular" || section === "Update") return app.badge !== "VIP";
            
            return true;
        }).slice(0, LIMIT);

        items.forEach(app => carousel.insertAdjacentHTML("beforeend", createCardHtml(app)));
        
        // 💡 Здесь мы просто добавляем плейсхолдеры, чтобы сетка сохранила структуру 3 ряда
        // Если элементов 10, нужно 2 плейсхолдера для заполнения 12 ячеек в 3 ряда (4 столбца)
        const placeholdersNeeded = LIMIT - items.length;
        for (let i = 0; i < placeholdersNeeded; i++) {
            carousel.insertAdjacentHTML("beforeend", `<article class="card placeholder"></article>`);
        }
        
        // 💡 Аттачим слушатель один раз после заполнения
        attachModalOpenListeners(carousel);
    });
}

// ===============================
// Загрузка Firestore
// ===============================
async function loadDataFromFirestore() {
    try {
        const snapshot = await getDocs(collection(db, "ursa_ipas"));
        appsData = snapshot.docs.map(doc => {
            const item = doc.data();
            return {
                id: doc.id,
                // Используем NAME как title
                title: item.NAME || "Без названия", 
                version: item.Version || "N/A",
                desc: item.description_ru || item.description_en || "",
                img: item.iconUrl || "https://placehold.co/200x200",
                // Убеждаемся, что tags всегда строка
                tags: Array.isArray(item.tags) ? item.tags.join(",").toLowerCase() : (item.tags || "").toLowerCase(),
                link: item.DownloadUrl || "#",
                size: item.sizeBytes ? `${(item.sizeBytes / 1048576).toFixed(1)} MB` : "N/A",
                features: item.features_ru || item.features_en || "",
                badge: item.vipOnly ? "VIP" : "",
                uploadTime: item.createdAt ? new Date(item.createdAt).getTime() : Date.now()
            };
        });

        displayCatalog();
        console.log(`✅ Загружено ${appsData.length} приложений`);
    } catch (err) {
        console.error("❌ Ошибка загрузки Firestore:", err);
    }
}

loadDataFromFirestore();
