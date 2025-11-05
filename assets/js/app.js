// ===============================
// Firebase + Catalog App Loader
// ===============================

// Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===============================
// ГЛАВНЫЕ ДАННЫЕ ДЛЯ ВСЕГО САЙТА
// ===============================
export let appsData = [];  // <— теперь доступно в all-catalog.js
export let currentCategory = "apps";

export function setCurrentCategory(type) {
    currentCategory = type;
    displayCatalog();
}

// ===============================
// Генерация карточек
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
        const btn = event.target.closest(".open-modal-btn");
        if (!btn) return;

        const id = btn.dataset.id;
        const data = appsData.find(app => app.id === id);
        if (data) openModal(data);
    });
}

// ===============================
// Рендер 3 секций (Popular / Update / VIP)
// ===============================
export function displayCatalog() {
    const rows = document.querySelectorAll(".collection-row");
    const LIMIT = 12;

    rows.forEach(row => {
        const carousel = row.querySelector(".card-carousel");
        const title = row.querySelector(".collection-title").textContent.trim();
        carousel.innerHTML = "";

        let items = appsData.filter(app => {
            const tagList = (app.tags || "").split(",").map(t => t.trim());

            if (title === "VIP") return app.badge === "VIP";
            return app.badge !== "VIP" && (tagList.includes("apps") || tagList.includes("games"));
        }).slice(0, LIMIT);

        items.forEach(app => carousel.insertAdjacentHTML("beforeend", createCardHtml(app)));

        attachModalOpenListeners(carousel);

        // placeholders
        for (let i = items.length; i < LIMIT; i++) {
            carousel.insertAdjacentHTML("beforeend", `<article class="card placeholder"></article>`);
        }
    });
}

// ===============================
// Загрузка данных из Firestore
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
                tags: Array.isArray(item.tags) ? item.tags.join(",") : "",
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
