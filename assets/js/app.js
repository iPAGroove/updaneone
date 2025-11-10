// assets/js/app.js
// ===============================
// Firebase + Catalog Loader + Collections Sorting
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { openModal } from "./modal.js";

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
// Данные
// ===============================
export let appsData = [];
export let currentCategory = "apps"; // apps | games

export function setCurrentCategory(type) {
    currentCategory = type;
    displayCatalog();
}

// ===============================
// Карточка приложения
// ===============================
function createCardHtml(data) {
    return `
        <article class="card" data-id="${data.id}">
            <div class="card-media">
                <img src="${data.img}" class="card-icon" alt="${data.title}">
                ${data.vip ? `<div class="card-badge">VIP</div>` : ""}
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
// Рендер коллекций на главной
// ===============================
export function displayCatalog() {
    const rows = document.querySelectorAll(".collection-row");
    const LIMIT = 12;

    rows.forEach(row => {
        const carousel = row.querySelector(".card-carousel");
        const section = row.querySelector(".collection-title").textContent.trim();
        carousel.innerHTML = "";

        // Фильтруем по категории
        let filtered = appsData.filter(app => app.tags.includes(currentCategory));

        // 🔥 Popular → самые скачиваемые
        if (section === "Popular") {
            filtered = filtered.sort((a, b) => b.downloadCount - a.downloadCount);
        }

        // 🔥 Update → самые свежие
        else if (section === "Update") {
            filtered = filtered.sort((a, b) => b.updatedTime - a.updatedTime);
        }

        // 🔥 VIP → только vip = true + сортировка как popular
        else if (section === "VIP") {
            filtered = filtered
                .filter(app => app.vip)
                .sort((a, b) => b.downloadCount - a.downloadCount);
        }

        // Отрисовка
        filtered.slice(0, LIMIT).forEach(app =>
            carousel.insertAdjacentHTML("beforeend", createCardHtml(app))
        );

        attachModalOpenListeners(carousel);

        // Заполнители (чтобы сетка была ровной)
        for (let i = filtered.length; i < LIMIT; i++) {
            carousel.insertAdjacentHTML("beforeend", `<article class="card placeholder"></article>`);
        }
    });
}

// ===============================
// Загрузка из Firestore
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
                tags: Array.isArray(item.tags) ? item.tags.map(t => t.toLowerCase()) : ["apps"],
                link: item.DownloadUrl || "#",
                size: item.sizeBytes ? `${(item.sizeBytes / 1048576).toFixed(1)} MB` : "N/A",
                features: item.features_ru || item.features_en || "",
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
