// assets/js/app.js
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// === КОНТЕЙНЕР КАТАЛОГА ===
const catalogContainer = document.getElementById("catalog");

// === ФУНКЦИЯ СОЗДАНИЯ КАРТОЧКИ ===
function createCard(app) {
  const article = document.createElement("article");
  article.className = "card";
  article.dataset.title = app.name || "Без названия";
  article.dataset.subtitle = app.version || "";
  article.dataset.desc = app.description_ru || "";
  article.dataset.img = app.iconUrl || "";
  article.dataset.tags = (app.tags || []).join(",");
  article.dataset.cta = "Скачать";
  article.dataset.link = app.downloadUrl || "#";
  if (app.vipOnly) article.dataset.badge = "VIP";

  article.innerHTML = `
    <div class="row">
      <div class="thumb">
        <img src="${app.iconUrl || "https://via.placeholder.com/80"}" alt="">
      </div>
      <div>
        <h3>${app.name || "Без имени"}</h3>
        <div class="meta">v${app.version || "—"}</div>
        ${app.vipOnly ? `<div class="meta" style="color:#ffb300;">⭐ VIP</div>` : ""}
      </div>
    </div>
  `;
  return article;
}

// === ФУНКЦИЯ СОЗДАНИЯ СЕКЦИИ ===
function createSection(title, apps) {
  const section = document.createElement("section");
  section.className = "collection-row";
  section.innerHTML = `
    <h2 class="collection-title">${title}</h2>
    <div class="card-carousel"></div>
    <button class="view-all-btn">Смотреть все</button>
  `;
  const carousel = section.querySelector(".card-carousel");
  apps.forEach((app) => carousel.appendChild(createCard(app)));
  catalogContainer.appendChild(section);
}

// === ЗАГРУЗКА ИГР И ПРИЛОЖЕНИЙ ===
async function loadCollections() {
  try {
    const qRef = query(collection(db, "ursa_ipas"), orderBy("updatedAt", "desc"), limit(20));
    const snap = await getDocs(qRef);
    const apps = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // === ГРУППИРОВКА ===
    const popular = [...apps].sort((a, b) => (b.installCount || 0) - (a.installCount || 0));
    const updates = [...apps].sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
    const vip = apps.filter((a) => a.vipOnly);

    catalogContainer.innerHTML = ""; // Очистить заглушки
    createSection("Popular", popular.slice(0, 8));
    createSection("Update", updates.slice(0, 8));
    createSection("VIP", vip.slice(0, 8));

    console.log("🔥 Firestore loaded", apps.length, "items");
  } catch (err) {
    console.error("Firestore load error:", err);
    catalogContainer.innerHTML = `<div style="opacity:.7;text-align:center;padding:40px;">Ошибка загрузки Firestore</div>`;
  }
}

document.addEventListener("DOMContentLoaded", loadCollections);
