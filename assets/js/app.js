// assets/js/app.js
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
    // 💡 ПРОФИКСЕНО: Привязываем слушатель к родительскому элементу. 
    // Клик обрабатывается только если нажат именно CTA.
    carousel.addEventListener("click", (event) => {
        const btn = event.target.closest(".open-modal-btn");
        if (!btn) return;
        const id = btn.dataset.id;
        const data = appsData.find(app => app.id === id);
        if (data) openModal(data);
    });
}

// ===============================
// Рендер секций
// ===============================
export function displayCatalog() {
    const rows = document.querySelectorAll(".collection-row");
    const LIMIT = 12;

    rows.forEach(row => {
        const carousel = row.querySelector(".card-carousel");
        const sectionTitleElement = row.querySelector(".collection-title");
        const section = sectionTitleElement ? sectionTitleElement.textContent.trim() : "";
        
        carousel.innerHTML = "";

        let items = appsData.filter(app => {
            const tags = (app.tags || "").toLowerCase().split(",").map(t => t.trim());
            
            if (!tags.includes(currentCategory)) return false;
            
            if (section === "VIP") return app.badge === "VIP";
            // Включаем non-VIP элементы в Popular/Update
            if (section === "Popular" || section === "Update") return app.badge !== "VIP";
            
            return true;
        }).slice(0, LIMIT);

        items.forEach(app => carousel.insertAdjacentHTML("beforeend", createCardHtml(app)));
        
        // Добавляем плейсхолдеры для сохранения сетки 3x4
        const placeholdersNeeded = LIMIT - items.length;
        for (let i = 0; i < placeholdersNeeded; i++) {
            carousel.insertAdjacentHTML("beforeend", `<article class="card placeholder"></article>`);
        }
        
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
                title: item.NAME || "Без названия",
                version: item.Version || "N/A",
                desc: item.description_ru || item.description_en || "",
                img: item.iconUrl || "https://placehold.co/200x200",
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
