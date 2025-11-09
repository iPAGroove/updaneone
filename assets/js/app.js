// ===============================
// Firebase + Catalog App Loader (v2 with POPULAR / UPDATE / VIP logic)
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { openModal } from "./modal.js";

const firebaseConfig = {
    apiKey: "AIzaSyDFj9gOYU49Df6ohUR5CnbRv3qdY2i_OmU",
    authDomain: "ipa-panel.firebaseapp.com",
    databaseURL: "https://ipa-panel-default-rtdb.firebaseio.com",
    projectId: "ipa-panel",
    storageBucket: "ipa-panel.appspot.com",   // ✅ фикс
    messagingSenderId: "239982196215",
    appId: "1:239982196215:web:9de387c51952da428daaf2",
    measurementId: "G-YP1XRFEDXM"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export let appsData = [];
export let currentCategory = "apps";

export function setCurrentCategory(type) {
    currentCategory = type;
    displayCatalog();
}

// ===============================
// Карточка
// ===============================
function createCardHtml(data) {
    return `
        <article class="card" data-id="${data.id}">
            <div class="card-media">
                <img src="${data.img}" class="card-icon" alt="${data.title}">
                ${data.vipOnly ? `<div class="card-badge">VIP</div>` : ""}
            </div>
            <div class="card-info">
                <h3>${data.title}</h3>
                <p class="meta">${data.version}</p>
            </div>
            <button class="card-cta open-modal-btn" data-id="${data.id}"><span>Открыть</span></button>
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
// Рендер секций
// ===============================
export function displayCatalog() {
    const rows = document.querySelectorAll(".collection-row");
    const LIMIT = 12;

    rows.forEach(row => {
        const carousel = row.querySelector(".card-carousel");
        const section = row.querySelector(".collection-title").textContent.trim();
        carousel.innerHTML = "";

        let items = appsData.filter(app => {
            const tags = (app.tags || "").split(",").map(t => t.trim());
            if (!tags.includes(currentCategory)) return false;

            // VIP ROW
            if (section === "VIP") return app.vipOnly === true;

            return true;
        });

        // ✅ POPULAR
        if (section === "Popular") {
            items = items.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
        }

        // ✅ UPDATE (новое и обновлённое сверху)
        if (section === "Update") {
            items = items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        }

        // ✅ VIP ALREADY FILTERED ABOVE — просто сорт по updatedAt
        if (section === "VIP") {
            items = items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        }

        items = items.slice(0, LIMIT);

        items.forEach(app => carousel.insertAdjacentHTML("beforeend", createCardHtml(app)));
        attachModalOpenListeners(carousel);

        for (let i = items.length; i < LIMIT; i++) {
            carousel.insertAdjacentHTML("beforeend", `<article class="card placeholder"></article>`);
        }
    });
}

// ===============================
// Загрузка Firestore
// ===============================
async function loadDataFromFirestore() {
    try {
        // 🎯 Берём ВСЕ записи, сортируем потом сами
        const snapshot = await getDocs(collection(db, "ursa_ipas"));
        appsData = snapshot.docs.map(doc => {
            const item = doc.data();
            return {
                id: doc.id,
                title: item.NAME || "Без названия",
                version: item.Version || "N/A",
                img: item.iconUrl || "https://placehold.co/200x200",
                desc: item.description_ru || item.description_en || "",
                tags: Array.isArray(item.tags) ? item.tags.join(",").toLowerCase() : "",
                link: item.DownloadUrl || "",
                size: item.sizeBytes ? `${(item.sizeBytes / 1048576).toFixed(1)} MB` : "N/A",
                features: item.features_ru || item.features_en || "",
                vipOnly: item.vipOnly || false,
                // ✅ Для POPULAR
                downloadCount: item.downloadCount || 0,
                // ✅ Для UPDATE / VIP сортировки
                updatedAt: item.updatedAt ? new Date(item.updatedAt).getTime() : 0
            };
        });

        displayCatalog();
        console.log(`✅ Загружено ${appsData.length} приложений`);
    } catch (err) {
        console.error("❌ Ошибка загрузки Firestore:", err);
    }
}

loadDataFromFirestore();
