// ======================================================================
// PART 0 — DOM ELEMENTS + GLOBAL STATE + HELPERS
// ======================================================================

import { auth, db } from "./app.js";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// ========== STATE ==========
const state = {
  user: null,
  apps: [],
  users: [],
  orders: [],
  chat: {
    orderId: null,
    type: null,
    unsub: null
  }
};

// ========== DOM SELECTORS ==========
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

// Auth
const authScreen = $("#admin-auth");
const appShell = $("#admin-app");
const loginBtn = $("#auth-login-btn");
const logoutBtn = $("#admin-logout-btn");
const authError = $("#auth-error");

// Sidebar + views
const sideLinks = $$(".side-link");
const topbarTitle = $("#topbar-title");

const views = {
  dashboard: $("#view-dashboard"),
  apps: $("#view-apps"),
  users: $("#view-users"),
  orders: $("#view-orders"),
};

const ordersCounter = $("#orders-counter");

// Dashboard cards
const statApps = $("#stat-apps");
const statVip = $("#stat-vip");
const statOrders = $("#stat-orders");
const statSigners = $("#stat-signers");

// Apps
const appsGrid = $("#apps-grid");
const appsSkeleton = $("#apps-skeleton");
const appSearch = $("#app-search");
const appFilter = $("#app-filter");
const addAppBtn = $("#add-app-btn");

// Modal
const appModal = $("#app-modal");
const appForm = $("#app-edit-form");

const fAppId = $("#app-id");
const fAppName = $("#app-name");
const fAppBundle = $("#app-bundle");
const fAppVersion = $("#app-version");
const fAppMinIOS = $("#app-min-ios");
const fAppSizeMb = $("#app-size-mb");
const fAppUrl = $("#app-url");
const fAppIcon = $("#app-icon");
const fAppIconPreview = $("#app-icon-preview");
const fAppFeaturesRu = $("#app-features-ru");
const fAppFeaturesEn = $("#app-features-en");
const fAppTag = $("#app-tag");
const tagButtons = $$(".tag-btn");
const fAppVipOnly = $("#app-vip-only");
const appDeleteBtn = $("#app-delete-btn");

// Users
const usersTableBody = $("#users-table");
const usersSkeleton = $("#users-skeleton");
const userSearch = $("#user-search");

// Orders
const ordersList = $("#orders-list");
const ordersSkeleton = $("#orders-skeleton");
const ordersStatus = $("#orders-status");
const orderSearch = $("#order-search");

// Chat panel
const chatPanel = $("#chat-panel");
const chatClose = $("#chat-close");
const chatOrderIdEl = $("#chat-order-id");
const chatOrderMeta = $("#chat-order-meta");
const chatStatusSelect = $("#order-status-select");
const setVipBtn = $("#set-vip-btn");
const chatArea = $("#admin-chat-area");
const chatForm = $("#chat-form");
const chatInput = $("#admin-chat-input");

// Auth provider
const provider = new GoogleAuthProvider();

// ======================================================================
// PART 1 — APPS VIEW + IPA MODAL (full old-style editor)
// ======================================================================

// ===============================
// APPS (GRID)
// ===============================
function initApps() {
  appsSkeleton.style.display = "grid";
  appsGrid.setAttribute("aria-busy", "true");

  loadApps().then(() => {
    appsSkeleton.style.display = "none";
    appsGrid.removeAttribute("aria-busy");
  });

  appSearch?.addEventListener("input", renderApps);
  appFilter?.addEventListener("change", renderApps);
  addAppBtn?.addEventListener("click", () => openAppModal(null));

  // Live icon preview
  if (fAppIcon && fAppIconPreview) {
    fAppIcon.addEventListener("input", () => {
      const url = fAppIcon.value.trim();
      fAppIconPreview.src = url || "https://placehold.co/120x120";
      fAppIconPreview.style.opacity = url ? "1" : ".35";
    });
  }

  // Category selection (Apps/Games)
  tagButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tag = btn.dataset.tag || "";
      tagButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (fAppTag) fAppTag.value = tag;
    });
  });
}

async function loadApps() {
  const snap = await getDocs(collection(db, "ursa_ipas"));
  state.apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderApps();
}

function renderApps() {
  const q = (appSearch?.value || "").toLowerCase();
  const tag = appFilter?.value || "all";

  appsGrid.innerHTML = "";

  const apps = state.apps.filter((a) => {
    const byName = (a.NAME || "").toLowerCase().includes(q);
    const byTag =
      tag === "all"
        ? true
        : tag === "vip"
        ? a.vipOnly === true
        : Array.isArray(a.tags)
        ? a.tags.includes(tag)
        : (a.tags || "")
            .split(",")
            .map((t) => t.trim())
            .includes(tag);

    return byName && byTag;
  });

  if (!apps.length) {
    appsGrid.innerHTML = `<div class="empty">Нет приложений по фильтру</div>`;
    return;
  }

  apps.forEach((app) => {
    const card = document.createElement("div");
    card.className = "app-card";
    card.innerHTML = `
      <img class="icon" src="${app.iconUrl || "https://placehold.co/160"}" alt="${
      app.NAME || "App"
    }"/>
      <div class="ttl">${app.NAME || "N/A"}</div>
      <div class="meta">
        <span class="pill ${app.vipOnly ? "vip" : "free"}">${
      app.vipOnly ? "VIP" : "FREE"
    }</span>
        <span class="cnt">${app.downloadCount || 0}</span>
      </div>
      <div class="row-actions">
        <button class="btn btn-ghost small" data-edit="${app.id}">✏️ Редактировать</button>
      </div>`;

    appsGrid.appendChild(card);
  });

  // One-time listener per render
  appsGrid.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest("[data-edit]");
      if (!btn) return;
      const id = btn.getAttribute("data-edit");
      openAppModal(id);
    },
    { once: true }
  );
}

// ===============================
// OPEN IPA MODAL
// ===============================
function openAppModal(appId) {
  const app = state.apps.find((a) => a.id === appId) || null;

  $("#app-modal-title").textContent = appId
    ? "Редактировать IPA"
    : "Добавить IPA";

  appForm.reset();

  // Basic fields
  fAppId.value = appId || "";
  fAppName.value = app?.NAME || "";
  fAppBundle.value = app?.["Bundle ID"] || "";
  fAppVersion.value = app?.Version || "";
  fAppMinIOS.value = app?.["minimal iOS"] || "";

  // Size MB → bytes
  fAppSizeMb.value = app?.sizeBytes ? Math.round(app.sizeBytes / 1000000) : "";

  // Media
  fAppUrl.value = app?.DownloadUrl || "";
  fAppIcon.value = app?.iconUrl || "";

  // Preview
  fAppIconPreview.src = fAppIcon.value || "https://placehold.co/120x120";
  fAppIconPreview.style.opacity = fAppIcon.value ? "1" : ".35";

  // Features
  fAppFeaturesRu.value = app?.features_ru || "";
  fAppFeaturesEn.value = app?.features_en || "";

  // Category
  let currentTag = Array.isArray(app?.tags) ? app.tags[0] : "";
  fAppTag.value = currentTag;

  tagButtons.forEach((btn) => {
    if (btn.dataset.tag === currentTag) btn.classList.add("active");
    else btn.classList.remove("active");
  });

  // VIP only
  fAppVipOnly.checked = app?.vipOnly === true;

  // Delete button
  appDeleteBtn.style.display = appId ? "inline-block" : "none";

  // Show modal
  appModal.classList.add("visible");
}

// Close modal
appModal?.addEventListener("click", (e) => {
  if (e.target === appModal || e.target.closest("[data-action='close']")) {
    appModal.classList.remove("visible");
  }
});

// ===============================
// SAVE IPA
// ===============================
appForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = fAppId.value.trim();

  const name = fAppName.value.trim();
  const bundleId = fAppBundle.value.trim();
  const version = fAppVersion.value.trim();
  const minIOS = fAppMinIOS.value.trim();

  const sizeMb = parseFloat((fAppSizeMb.value || "0").replace(",", ".")) || 0;
  const iconUrl = fAppIcon.value.trim();
  const downloadUrl = fAppUrl.value.trim();

  const featuresRu = fAppFeaturesRu.value.trim();
  const featuresEn = fAppFeaturesEn.value.trim();

  const tag = fAppTag?.value || "";
  const vipOnly = !!fAppVipOnly.checked;

  if (!name || !bundleId || !version || !downloadUrl) {
    alert("Name, Bundle ID, Version и Download URL обязательны.");
    return;
  }

  const nowIso = new Date().toISOString();

  const docData = {
    ID: `${bundleId}_${version}`,
    NAME: name,
    "Bundle ID": bundleId,
    Version: version,
    "minimal iOS": minIOS,
    sizeBytes: Math.round(sizeMb * 1000000),
    iconUrl,
    DownloadUrl: downloadUrl,
    description_ru: "Функции мода",
    description_en: "Hack Features",
    features_ru: featuresRu,
    features_en: featuresEn,
    tags: tag ? [tag] : [],
    vipOnly,
    updatedAt: nowIso
  };

  try {
    if (id) {
      await updateDoc(doc(db, "ursa_ipas", id), docData);
      alert("Приложение обновлено");
    } else {
      const newRef = doc(collection(db, "ursa_ipas"));
      await setDoc(newRef, {
        ...docData,
        createdAt: nowIso,
        downloadCount: 0
      });
      alert("Приложение добавлено");
    }

    appModal.classList.remove("visible");
    await loadApps();
  } catch (e) {
    alert("Ошибка сохранения: " + e.message);
  }
});

// ===============================
// DELETE IPA
// ===============================
appDeleteBtn?.addEventListener("click", async () => {
  const id = fAppId.value.trim();
  if (!id) return;
  if (!confirm("Удалить приложение?")) return;

  try {
    await deleteDoc(doc(db, "ursa_ipas", id));
    alert("Удалено");
    appModal.classList.remove("visible");
    await loadApps();
  } catch (e) {
    alert("Ошибка удаления: " + e.message);
  }
});
// ======================================================================
// PART 2 — USERS VIEW (full support: signers + VIP toggle)
// ======================================================================

function initUsers() {
  usersSkeleton.style.display = "block";
  loadUsers().then(() => {
    usersSkeleton.style.display = "none";
  });

  userSearch?.addEventListener("input", renderUsers);
}

// Загрузка всех пользователей + их сертификатов
async function loadUsers() {
  const usersSnap = await getDocs(collection(db, "ursa_users"));
  const signersSnap = await getDocs(collection(db, "ursa_signers"));

  // Создаём map: uid → сертификат
  const signersMap = Object.create(null);
  signersSnap.docs.forEach((d) => (signersMap[d.id] = d.data()));

  state.users = usersSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    signer: signersMap[d.id] || null
  }));

  renderUsers();
}

function renderUsers() {
  const q = (userSearch?.value || "").toLowerCase();
  usersTableBody.innerHTML = "";

  const filtered = state.users.filter(
    (u) =>
      !q ||
      u.email?.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
  );

  filtered.forEach((u) => {
    const certStatus = getCertStatus(u.signer);
    const vip = u.status === "vip" ? "⭐ VIP" : "FREE";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.email || "N/A"}</td>
      <td>${u.id.substring(0, 10)}...</td>
      <td>${vip}</td>
      <td>${certStatus}</td>
      <td>
        <button class="btn btn-ghost small"
          data-toggle-vip="${u.id}"
          data-status="${u.status}">
          ${u.status === "vip" ? "↓ FREE" : "↑ VIP"}
        </button>
      </td>`;
    usersTableBody.appendChild(tr);
  });

  // Toggle VIP (один раз на рендер)
  usersTableBody.addEventListener(
    "click",
    async (e) => {
      const btn = e.target.closest("[data-toggle-vip]");
      if (!btn) return;

      const uid = btn.getAttribute("data-toggle-vip");
      const cur = btn.getAttribute("data-status");

      await toggleUserVip(uid, cur);
      await loadUsers();
    },
    { once: true }
  );
}

// Проверка сертификата
function getCertStatus(cert) {
  if (!cert) return "Нет";

  try {
    const expires = new Date(cert.expires);
    return expires > new Date() ? "✅ Активен" : "❌ Истек";
  } catch {
    return "Нет";
  }
}

// Смена статуса VIP ↔ FREE
async function toggleUserVip(uid, currentStatus) {
  const next = currentStatus === "vip" ? "free" : "vip";

  if (!confirm(`Изменить статус на ${next.toUpperCase()}?`)) return;

  await updateDoc(doc(db, "ursa_users", uid), {
    status: next,
    vip_activated_at: next === "vip" ? new Date().toISOString() : null
  });
}
// ======================================================================
// PART 3 — DASHBOARD + ORDERS (vip_orders + cert_orders + support_orders) + CHAT
// ======================================================================

// ===============================
// DASHBOARD (обновлённый, учитывает все типы заявок)
// ===============================
async function loadDashboard() {
  try {
    const appsSnap = await getDocs(collection(db, "ursa_ipas"));
    const usersSnap = await getDocs(collection(db, "ursa_users"));
    const signersSnap = await getDocs(collection(db, "ursa_signers"));

    const vipCount = usersSnap.docs.filter((d) => d.data().status === "vip").length;

    let activeOrders = 0;

    const countActive = async (colName) => {
      try {
        const snap = await getDocs(collection(db, colName));
        snap.docs.forEach((d) => {
          const s = d.data().status;
          if (s === "pending" || s === "processing") activeOrders++;
        });
      } catch (e) {
        console.warn(`Dashboard: не удалось прочитать ${colName}:`, e.message);
      }
    };

    await countActive("vip_orders");
    await countActive("cert_orders");
    await countActive("support_orders");

    statApps.textContent = appsSnap.size;
    statVip.textContent = vipCount;
    statOrders.textContent = activeOrders;
    statSigners.textContent = signersSnap.size;
  } catch (e) {
    console.error("Dashboard error:", e);
  }
}

// ===============================
// ORDERS + REALTIME CHAT
// ===============================
function initOrders() {
  ordersSkeleton.style.display = "block";
  loadOrders().then(() => (ordersSkeleton.style.display = "none"));

  ordersStatus?.addEventListener("change", renderOrders);
  orderSearch?.addEventListener("input", renderOrders);
}

// Helper: конвертация createdAt → миллисекунды
function toMs(v) {
  if (!v) return 0;
  if (typeof v.toDate === "function") return v.toDate().getTime();
  const t = Date.parse(v);
  return isNaN(t) ? 0 : t;
}

// Helper: label для type
function typeText(t) {
  return (
    {
      vip: "VIP",
      cert: "CERT",
      support: "SUPPORT"
    }[t] || "—"
  );
}

// Коллекция по типу
function collectionNameByType(type) {
  if (type === "vip") return "vip_orders";
  if (type === "cert") return "cert_orders";
  return "support_orders";
}

// Загрузка всех заявок из трёх коллекций
async function loadOrders() {
  const allOrders = [];

  const loadCol = async (colName, type) => {
    try {
      const qRef = query(collection(db, colName), orderBy("createdAt", "desc"));
      const snap = await getDocs(qRef);
      snap.docs.forEach((d) => {
        allOrders.push({
          id: d.id,
          type,
          ...d.data()
        });
      });
    } catch (e) {
      console.warn(`Orders: не удалось прочитать ${colName}:`, e.message);
    }
  };

  await loadCol("vip_orders", "vip");
  await loadCol("cert_orders", "cert");
  await loadCol("support_orders", "support");

  // Глобальная сортировка по дате (desc)
  allOrders.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));

  state.orders = allOrders;
  renderOrders();
}

function statusText(s) {
  return (
    {
      pending: "🟡 Ожидает",
      processing: "🟠 В работе",
      completed: "🟢 Завершено",
      canceled: "⚫ Отменено"
    }[s] || (s || "—")
  );
}

function renderOrders() {
  const stFilter = ordersStatus?.value || "all";
  const q = (orderSearch?.value || "").toLowerCase();

  ordersList.innerHTML = "";

  let orders = state.orders.slice();

  orders = orders.filter((o) => {
    const status = o.status || "pending";
    if (stFilter !== "all" && status !== stFilter) return false;

    const inSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      (o.uid && o.uid.toLowerCase().includes(q));

    return inSearch;
  });

  const activeCount = state.orders.filter((o) => {
    const s = o.status || "pending";
    return s === "pending" || s === "processing";
  }).length;
  ordersCounter.textContent = String(activeCount);

  if (!orders.length) {
    ordersList.innerHTML = `<li class="empty">Заявок не найдено</li>`;
    return;
  }

  orders.forEach((o) => {
    const date =
      o.createdAt?.toDate?.()?.toLocaleString?.() || o.createdAt || "—";
    const typeLabel = typeText(o.type);
    const statusVal = o.status || "pending";

    const li = document.createElement("li");
    li.className = "order-row";
    li.innerHTML = `
      <div class="col main">
        <div class="id">#${o.id.substring(0, 8)}…</div>
        <div class="meta">
          Тип: ${typeLabel} • UID: ${o.uid?.substring(0, 8) || "—"}… • Метод: ${
      o.method || "—"
    }
        </div>
      </div>
      <div class="col mid">
        <span class="status ${statusVal}">${statusText(statusVal)}</span>
        <div class="time">${date}</div>
      </div>
      <div class="col actions">
        <button class="btn btn-ghost small" data-chat="${o.id}">💬 Чат</button>
      </div>`;
    ordersList.appendChild(li);
  });

  ordersList.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest("[data-chat]");
      if (!btn) return;
      const orderId = btn.getAttribute("data-chat");
      openChat(orderId);
    },
    { once: true }
  );
}

// ---- Chat panel
function openChat(orderId) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;

  const colName = collectionNameByType(order.type);

  chatOrderIdEl.textContent = orderId.substring(0, 8) + "…";
  chatOrderMeta.textContent = `Тип: ${typeText(order.type)} • Метод: ${
    order.method || "—"
  } • UID: ${order.uid?.substring(0, 8) || "—"}…`;
  chatStatusSelect.value = order.status || "pending";

  // Кнопка VIP только для vip_orders с uid
  if (order.type === "vip" && order.uid) {
    setVipBtn.disabled = false;
  } else {
    setVipBtn.disabled = true;
  }

  chatPanel.setAttribute("aria-hidden", "false");
  chatPanel.classList.add("open");

  if (state.chat.unsub) state.chat.unsub();
  state.chat.orderId = orderId;
  state.chat.type = order.type;

  const chatRef = collection(db, colName, orderId, "messages");
  const qRef = query(chatRef, orderBy("timestamp"));
  state.chat.unsub = onSnapshot(qRef, (snap) => {
    renderChatMessages(snap, order);
  });
}

chatClose?.addEventListener("click", closeChat);

function closeChat() {
  chatPanel.classList.remove("open");
  chatPanel.setAttribute("aria-hidden", "true");
  if (state.chat.unsub) {
    state.chat.unsub();
    state.chat.unsub = null;
  }
  state.chat.orderId = null;
  state.chat.type = null;
  chatArea.innerHTML = "";
}

function renderChatMessages(snap, order) {
  chatArea.innerHTML = `
    <div class="system-message">
      💸 Заявка: #${order.id.substring(0, 8)}…<br/>
      👤 UID: ${order.uid?.substring(0, 8) || "—"}…<br/>
      🔗 UDID: ${order.udid?.substring(0, 18) || "—"}…
    </div>`;

  snap.forEach((d) => {
    const m = d.data();
    const el = document.createElement("div");
    el.className = m.sender === "admin" ? "msg admin" : "msg user";

    if (m.text) {
      el.textContent = m.text;
    }
    if (m.fileUrl) {
      const a = document.createElement("a");
      a.href = m.fileUrl;
      a.target = "_blank";
      a.rel = "noreferrer noopener";
      a.textContent = m.fileName || "Файл";
      if (m.text) el.appendChild(document.createElement("br"));
      el.appendChild(a);
    }

    chatArea.appendChild(el);
  });
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Отправка сообщения админом
chatForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.chat.orderId || !state.chat.type) return;

  const text = chatInput.value.trim();
  if (!text) return;

  const colName = collectionNameByType(state.chat.type);

  try {
    await addDoc(
      collection(db, colName, state.chat.orderId, "messages"),
      {
        sender: "admin",
        text,
        timestamp: serverTimestamp()
      }
    );
    chatInput.value = "";
  } catch (e) {
    alert("Не удалось отправить сообщение: " + e.message);
  }
});

// Изменение статуса заявки из чата
chatStatusSelect?.addEventListener("change", async (e) => {
  if (!state.chat.orderId || !state.chat.type) return;

  const colName = collectionNameByType(state.chat.type);

  try {
    await updateDoc(doc(db, colName, state.chat.orderId), {
      status: e.target.value
    });
    await loadOrders();
  } catch (e) {
    alert("Не удалось обновить статус: " + e.message);
  }
});

// Выдать VIP (только для vip_orders)
setVipBtn?.addEventListener("click", async () => {
  if (!state.chat.orderId || !state.chat.type) return;
  if (state.chat.type !== "vip") return;

  const order = state.orders.find((o) => o.id === state.chat.orderId);
  if (!order?.uid) return alert("У заказа нет UID");

  if (!confirm(`Выдать VIP пользователю ${order.uid.substring(0, 8)}…?`)) return;

  try {
    await updateDoc(doc(db, "ursa_users", order.uid), {
      status: "vip",
      vip_activated_at: new Date().toISOString()
    });

    await updateDoc(doc(db, "vip_orders", state.chat.orderId), {
      status: "completed"
    });

    await loadUsers();
    await loadOrders();
    closeChat();
    alert("VIP выдан");
  } catch (e) {
    alert("Ошибка выдачи VIP: " + e.message);
  }
});
