// assets/js/app.js
// URSA IPA — Dynamic Firestore + Modal System

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// === Firebase Config ===
const firebaseConfig = {
  apiKey: "AIzaSyDFj9gOYU49Df6ohUR5CnbRv3qdY2i_OmU",
  authDomain: "ipa-panel.firebaseapp.com",
  projectId: "ipa-panel",
  storageBucket: "ipa-panel.firebasestorage.app",
  messagingSenderId: "239982196215",
  appId: "1:239982196215:web:9de387c51952da428daaf2"
};

// === Initialize Firebase ===
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === Elements ===
const catalog = document.querySelector("#catalog");

// === Load Collection ===
async function loadCollection(name) {
  const col = collection(db, name);
  const snap = await getDocs(col);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// === Render Card ===
function createCard(data) {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.title = data.name || "Без названия";
  card.dataset.desc = data.description || "Описание отсутствует";
  card.dataset.img = data.image || "";
  card.dataset.tags = data.tags?.join(",") || "";
  card.dataset.cta = data.button || "Скачать";
  card.dataset.link = data.link || "#";
  card.dataset.badge = data.vip ? "VIP" : "";
  card.innerHTML = `
    <div style="width:100%;height:100%;display:flex;justify-content:center;align-items:center;color:var(--muted);">
      ${data.name || "App"}
    </div>`;
  return card;
}

// === Render Section ===
function renderSection(title, data) {
  const section = document.createElement("section");
  section.className = "collection-row";
  section.innerHTML = `
    <h2 class="collection-title">${title}</h2>
    <div class="card-carousel"></div>
    <button class="view-all-btn">Смотреть все</button>
  `;
  const container = section.querySelector(".card-carousel");
  data.forEach(item => container.appendChild(createCard(item)));
  catalog.appendChild(section);
}

// === Modal System ===
let modalOverlay;
function buildModal() {
  if (modalOverlay) return;
  modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  modalOverlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">Информация</h3>
        <button class="modal-close">&times;</button>
      </div>
      <img class="modal-image" style="display:none;width:100%;border-radius:12px;border:1px solid var(--border);" />
      <div class="modal-content"></div>
      <button class="modal-btn">Открыть</button>
    </div>
  `;
  document.body.appendChild(modalOverlay);
  modalOverlay.addEventListener("click", e => {
    if (e.target === modalOverlay) modalOverlay.classList.remove("active");
  });
  modalOverlay.querySelector(".modal-close").addEventListener("click", () => modalOverlay.classList.remove("active"));
  modalOverlay.querySelector(".modal-btn").addEventListener("click", () => {
    const link = modalOverlay.dataset.link;
    if (link && link !== "#") window.open(link, "_blank");
    modalOverlay.classList.remove("active");
  });
}

// === Open Modal ===
function openModal(card) {
  buildModal();
  const title = card.dataset.title;
  const desc = card.dataset.desc;
  const img = card.dataset.img;
  const link = card.dataset.link;
  const modal = modalOverlay.querySelector(".modal");
  modal.querySelector(".modal-title").textContent = title;
  modalOverlay.querySelector(".modal-content").textContent = desc;
  const image = modalOverlay.querySelector(".modal-image");
  if (img) {
    image.src = img;
    image.style.display = "block";
  } else {
    image.style.display = "none";
  }
  modalOverlay.dataset.link = link;
  modalOverlay.classList.add("active");
}

// === Bind Clicks ===
function bindCardClicks() {
  catalog.addEventListener("click", e => {
    const card = e.target.closest(".card");
    if (card) openModal(card);
  });
}

// === Init ===
(async function init() {
  try {
    const [apps, games] = await Promise.all([loadCollection("apps"), loadCollection("games")]);
    renderSection("Popular Apps", apps.slice(0, 15));
    renderSection("Games", games.slice(0, 15));
    bindCardClicks();
  } catch (err) {
    console.error("Ошибка загрузки Firestore:", err);
  }
})();
