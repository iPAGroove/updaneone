// assets/js/admin.js — v4 (sidebar + grid + slide chat + Cert Orders)
// ======================================================
// Requirements: Firebase v9 (modular), app.js exports { auth, db }
// Focus: VIP Orders + Cert Orders + universal chat panel

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

// ===============================
// CONFIG
// ===============================
const ADMIN_EMAILS = [
  "vibemusic1712@gmail.com",
  "kotvlad400@gmail.com",
  "olesyazardina@gmail.com"
];

// ===============================
// STATE
// ===============================
const state = {
  user: null,
  apps: [],
  users: [],
  orders: [], // VIP Orders
  certOrders: [], // Cert Orders <-- NEW
  chat: {
    orderId: null,
    orderType: null, // 'vip' or 'cert'
    unsub: null
  }
};

// ===============================
// DOM
// ===============================
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const authScreen = $("#admin-auth");
const appShell = $("#admin-app");
const topbarTitle = $("#topbar-title");

// Sidebar
const sideLinks = $$(".side-link");
const ordersCounter = $("#orders-counter");
const certOrdersCounter = $("#cert-orders-counter"); // <-- NEW

// Views
const views = {
  dashboard: $("#view-dashboard"),
  apps: $("#view-apps"),
  users: $("#view-users"),
  orders: $("#view-orders"), // VIP Orders
  "cert-orders": $("#view-cert-orders") // Cert Orders <-- NEW
};

// Dashboard stats
const statApps = $("#stat-apps");
const statVip = $("#stat-vip");
const statOrders = $("#stat-orders");
const statSigners = $("#stat-signers");

// Apps view
const appsGrid = $("#apps-grid");
const appsSkeleton = $("#apps-skeleton");
const appSearch = $("#app-search");
const appFilter = $("#app-filter");
const addAppBtn = $("#add-app-btn");

// Users view
const usersTableBody = $("#users-table tbody");
const usersSkeleton = $("#users-skeleton");
const userSearch = $("#user-search");

// VIP Orders view
const ordersList = $("#orders-list");
const ordersSkeleton = $("#orders-skeleton");
const ordersStatus = $("#orders-status");
const orderSearch = $("#order-search");

// Cert Orders view <-- NEW
const certOrdersList = $("#cert-orders-list");
const certOrdersSkeleton = $("#cert-orders-skeleton");
const certOrdersStatus = $("#cert-orders-status");
const certOrderSearch = $("#cert-order-search");

// Modals (App)
const appModal = $("#app-modal");
const appForm = $("#app-edit-form");
const appDeleteBtn = $("#app-delete-btn");

// App form fields
const fAppId = $("#app-id");
const fAppName = $("#app-name");
const fAppVersion = $("#app-version");
const fAppUrl = $("#app-url");
const fAppIcon = $("#app-icon");
const fAppTags = $("#app-tags");
const fAppVipOnly = $("#app-vip-only");
const fAppDesc = $("#app-desc");

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

// Auth buttons
const loginBtn = $("#auth-login-btn");
const logoutBtn = $("#admin-logout-btn");
const authError = $("#auth-error");

// ===============================
// AUTH
// ===============================
const provider = new GoogleAuthProvider();

loginBtn?.addEventListener("click", async () => {
  authError.textContent = "";
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error(e);
    authError.textContent = "Ошибка входа: " + e.message;
  }
});

logoutBtn?.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  if (!user) return showAuth();
  if (!ADMIN_EMAILS.includes(user.email)) {
    await signOut(auth);
    authError.textContent = "Нет прав администратора (неверный Google аккаунт).";
    return showAuth();
  }
  state.user = user;
  showApp();
  initNavigation();
  // Default view: orders
  activateView("orders");
});

function showAuth() {
  authScreen.style.display = "flex";
  appShell.style.display = "none";
}
function showApp() {
  authScreen.style.display = "none";
  appShell.style.display = "grid";
}

// ===============================
// NAVIGATION
// ===============================
function initNavigation() {
  sideLinks.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      sideLinks.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activateView(view);
    });
  });

  // Focus search via '/'
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
      e.preventDefault();
      const activeView = getActiveView();
      if (activeView === "apps") appSearch?.focus();
      else if (activeView === "users") userSearch?.focus();
      else if (activeView === "orders") orderSearch?.focus();
      else if (activeView === "cert-orders") certOrderSearch?.focus(); // <-- NEW
    }
  });
}

function getActiveView() {
  return Object.entries(views).find(([k, el]) => el.classList.contains("active"))?.[0] || "orders";
}

async function activateView(view) {
  Object.values(views).forEach((v) => v.classList.remove("active"));
  views[view].classList.add("active");

  const titles = {
    dashboard: "📊 Дашборд",
    apps: "📱 Каталог приложений",
    users: "👥 Пользователи",
    orders: "💸 VIP Заявки",
    "cert-orders": "🔐 Cert Заявки" // <-- NEW
  };
  topbarTitle.textContent = titles[view] || "URSA Admin";

  if (view === "dashboard") loadDashboard();
  else if (view === "apps") initApps();
  else if (view === "users") initUsers();
  else if (view === "orders") initOrders("vip"); // Pass type
  else if (view === "cert-orders") initOrders("cert"); // Pass type
}

// ===============================
// DASHBOARD
// ===============================
async function loadDashboard() {
  try {
    const appsSnap = await getDocs(collection(db, "ursa_ipas"));
    const usersSnap = await getDocs(collection(db, "ursa_users"));
    const vipOrdersSnap = await getDocs(collection(db, "vip_orders"));
    const certOrdersSnap = await getDocs(collection(db, "cert_orders"));
    const signersSnap = await getDocs(collection(db, "ursa_signers"));

    const vipCount = usersSnap.docs.filter((d) => d.data().status === "vip").length;
    const activeOrders = [...vipOrdersSnap.docs, ...certOrdersSnap.docs].filter((d) => {
      const s = d.data().status;
      return s === "pending" || s === "processing";
    }).length;

    statApps.textContent = appsSnap.size;
    statVip.textContent = vipCount;
    statOrders.textContent = activeOrders;
    statSigners.textContent = signersSnap.size;
  } catch (e) {
    console.error("Dashboard error:", e);
  }
}

// (Остальные функции APPS и USERS без изменений)

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
        : (a.tags || "").split(",").map((t) => t.trim()).includes(tag);
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
      <img class="icon" src="${app.iconUrl || "https://placehold.co/120x120"}" alt="${app.NAME || "App"}"/>
      <div class="ttl" title="${app.NAME || "N/A"}">${app.NAME || "N/A"}</div>
      <div class="meta">
        <span class="pill ${app.vipOnly ? "vip" : "free"}">${app.vipOnly ? "VIP" : "FREE"}</span>
        <span class="cnt" title="Скачивания">${app.downloadCount || 0}</span>
      </div>
      <div class="row-actions">
        <button class="btn btn-ghost small" data-edit="${app.id}">✏️ Редактировать</button>
      </div>`;
    appsGrid.appendChild(card);
  });

  // Bind edit buttons
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

function openAppModal(appId) {
  const app = state.apps.find((a) => a.id === appId);

  $("#app-modal-title").textContent = appId ? "Редактировать приложение" : "Добавить новое приложение";
  fAppId.value = appId || "";
  fAppName.value = app?.NAME || "";
  fAppVersion.value = app?.Version || "";
  fAppUrl.value = app?.DownloadUrl || "";
  fAppIcon.value = app?.iconUrl || "";
  fAppTags.value = Array.isArray(app?.tags) ? app.tags.join(", ") : app?.tags || "";
  fAppVipOnly.checked = app?.vipOnly === true;
  fAppDesc.value = app?.description_ru || app?.description_en || app?.desc || "";

  appDeleteBtn.style.display = appId ? "inline-block" : "none";
  appModal.classList.add("visible");
}

appModal?.addEventListener("click", (e) => {
  if (e.target === appModal || e.target.closest("[data-action='close']")) {
    appModal.classList.remove("visible");
  }
});

appForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = fAppId.value.trim();
  const data = {
    NAME: fAppName.value.trim(),
    Version: fAppVersion.value.trim(),
    DownloadUrl: fAppUrl.value.trim(),
    iconUrl: fAppIcon.value.trim(),
    tags: fAppTags.value
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
    vipOnly: !!fAppVipOnly.checked,
    description_ru: fAppDesc.value.trim(),
    updatedAt: new Date().toISOString()
  };

  try {
    if (id) {
      await updateDoc(doc(db, "ursa_ipas", id), data);
      alert("Приложение обновлено");
    } else {
      const newRef = doc(collection(db, "ursa_ipas"));
      await setDoc(newRef, { ...data, createdAt: new Date().toISOString(), downloadCount: 0 });
      alert("Приложение добавлено");
    }
    appModal.classList.remove("visible");
    await loadApps();
  } catch (e) {
    alert("Ошибка сохранения: " + e.message);
  }
});

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

// ===============================
// USERS
// ===============================
function initUsers() {
  usersSkeleton.style.display = "block";
  loadUsers().then(() => (usersSkeleton.style.display = "none"));
  userSearch?.addEventListener("input", renderUsers);
}

async function loadUsers() {
  const usersSnap = await getDocs(collection(db, "ursa_users"));
  const signersSnap = await getDocs(collection(db, "ursa_signers"));

  const signersMap = Object.create(null);
  signersSnap.docs.forEach((d) => (signersMap[d.id] = d.data()));

  state.users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data(), signer: signersMap[d.id] }));
  renderUsers();
}

function renderUsers() {
  const q = (userSearch?.value || "").toLowerCase();
  usersTableBody.innerHTML = "";
  const filtered = state.users.filter((u) =>
    !q || u.email?.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)
  );

  filtered.forEach((u) => {
    const cert = u.signer
      ? new Date(u.signer.expires) > new Date()
        ? "✅ Активен"
        : "❌ Истек"
      : "Нет";
    const vip = u.status === "vip" ? "⭐ VIP" : "FREE";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.email || "N/A"}</td>
      <td>${u.id.substring(0, 8)}...</td>
      <td>${vip}</td>
      <td>${cert}</td>
      <td><button class="btn btn-ghost small" data-toggle-vip="${u.id}" data-status="${u.status}">${
        u.status === "vip" ? "↓ FREE" : "↑ VIP"
      }</button></td>`;
    usersTableBody.appendChild(tr);
  });

  usersTableBody.addEventListener(
    "click",
    async (e) => {
      const btn = e.target.closest("[data-toggle-vip]");
      if (!btn) return;
      const uid = btn.getAttribute("data-toggle-vip");
      const cur = btn.getAttribute("data-status");
      await toggleUserVipStatus(uid, cur);
      await loadUsers();
    },
    { once: true }
  );
}

async function toggleUserVipStatus(uid, currentStatus) {
  const next = currentStatus === "vip" ? "free" : "vip";
  if (!confirm(`Изменить статус на ${next.toUpperCase()}?`)) return;
  await updateDoc(doc(db, "ursa_users", uid), {
    status: next,
    vip_activated_at: next === "vip" ? new Date().toISOString() : null
  });
}

// ===============================
// ORDERS + REALTIME CHAT (Универсальная реализация)
// ===============================

// Названия коллекций
const COLLECTIONS = {
  vip: "vip_orders",
  cert: "cert_orders"
};

function initOrders(type) {
  const ordersListEl = type === 'vip' ? ordersList : certOrdersList;
  const ordersSkeletonEl = type === 'vip' ? ordersSkeleton : certOrdersSkeleton;
  const statusSelectEl = type === 'vip' ? ordersStatus : certOrdersStatus;
  const searchInputEl = type === 'vip' ? orderSearch : certOrderSearch;

  ordersSkeletonEl.style.display = "block";
  loadOrders(type).then(() => (ordersSkeletonEl.style.display = "none"));

  statusSelectEl?.addEventListener("change", () => renderOrders(type));
  searchInputEl?.addEventListener("input", () => renderOrders(type));
}

async function loadOrders(type) {
  const collectionName = COLLECTIONS[type];
  const qRef = query(collection(db, collectionName), orderBy("createdAt", "desc"));
  const snap = await getDocs(qRef);
  
  if (type === 'vip') {
    state.orders = snap.docs.map((d) => ({ id: d.id, type: 'vip', ...d.data() }));
  } else {
    state.certOrders = snap.docs.map((d) => ({ id: d.id, type: 'cert', ...d.data() }));
  }
  
  renderOrders(type);
}

function renderOrders(type) {
  const orders = type === 'vip' ? state.orders : state.certOrders;
  const ordersListEl = type === 'vip' ? ordersList : certOrdersList;
  const statusSelectEl = type === 'vip' ? ordersStatus : certOrdersStatus;
  const searchInputEl = type === 'vip' ? orderSearch : certOrderSearch;
  const counterEl = type === 'vip' ? ordersCounter : certOrdersCounter;

  const st = statusSelectEl?.value || "all";
  const q = (searchInputEl?.value || "").toLowerCase();

  ordersListEl.innerHTML = "";
  let filteredOrders = orders.filter((o) => (st === "all" ? true : o.status === st));
  filteredOrders = filteredOrders.filter(
    (o) => !q || o.id.toLowerCase().includes(q) || o.uid?.toLowerCase().includes(q)
  );

  const activeCount = orders.filter(
    (o) => o.status === "pending" || o.status === "processing"
  ).length;
  counterEl.textContent = String(activeCount);

  if (!filteredOrders.length) {
    ordersListEl.innerHTML = `<li class="empty">Заявок не найдено</li>`;
    return;
  }

  filteredOrders.forEach((o) => {
    const date = o.createdAt?.toDate?.()?.toLocaleString?.() || o.createdAt || "—";
    const orderTypeLabel = o.type === 'cert' ? `План: ${o.plan || '—'}` : `Метод: ${o.method || "—"}`;
    
    const li = document.createElement("li");
    li.className = "order-row";
    li.innerHTML = `
      <div class="col main">
        <div class="id">#${o.id.substring(0, 8)}…</div>
        <div class="meta">UID: ${o.uid?.substring(0, 8) || "—"}… • ${orderTypeLabel}</div>
      </div>
      <div class="col mid">
        <span class="status ${o.status}">${statusText(o.status)}</span>
        <div class="time">${date}</div>
      </div>
      <div class="col actions">
        <button class="btn btn-ghost small" data-chat="${o.id}" data-type="${o.type}">💬 Чат</button>
      </div>`;
    ordersListEl.appendChild(li);
  });

  ordersListEl.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest("[data-chat]");
      if (!btn) return;
      const orderId = btn.getAttribute("data-chat");
      const orderType = btn.getAttribute("data-type");
      openChat(orderId, orderType);
    },
    { once: true }
  );
}

function statusText(s) {
  return (
    {
      pending: "🟡 Ожидает",
      processing: "🟠 В работе",
      completed: "🟢 Завершено",
      canceled: "⚫ Отменено"
    }[s] || s
  );
}

// ---- Chat panel
function openChat(orderId, orderType) {
  const ordersList = orderType === 'vip' ? state.orders : state.certOrders;
  const order = ordersList.find((o) => o.id === orderId);
  const collectionName = COLLECTIONS[orderType];

  if (!order) return;

  // Обновляем UI чата
  chatOrderIdEl.textContent = orderId.substring(0, 8) + "…";
  chatOrderMeta.textContent = `Тип: ${orderType.toUpperCase()} • Метод: ${order.method || order.plan || "—"} • UID: ${
    order.uid?.substring(0, 8) || "—"
  }…`;
  chatStatusSelect.value = order.status || "pending";
  
  // Скрываем кнопку "Выдать VIP" для Cert Orders
  setVipBtn.style.display = orderType === 'vip' ? 'inline-block' : 'none';

  chatPanel.setAttribute("aria-hidden", "false");
  chatPanel.classList.add("open");

  // Cleanup previous
  if (state.chat.unsub) state.chat.unsub();
  state.chat.orderId = orderId;
  state.chat.orderType = orderType;

  const chatRef = collection(db, collectionName, orderId, "messages");
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
  state.chat.orderType = null;
  chatArea.innerHTML = "";
}

function renderChatMessages(snap, order) {
  // Общий системный блок для VIP и CERT
  chatArea.innerHTML = `
    <div class="system-message">
      ${order.type.toUpperCase()} Заявка: #${order.id.substring(0, 8)}…<br/>
      👤 UID: ${order.uid?.substring(0, 8) || "—"}…<br/>
      🔗 UDID: ${order.udid?.substring(0, 8) || "—"}…
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

chatForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.chat.orderId || !state.chat.orderType) return;
  const collectionName = COLLECTIONS[state.chat.orderType];
  
  const text = chatInput.value.trim();
  if (!text) return;
  try {
    await addDoc(collection(db, collectionName, state.chat.orderId, "messages"), {
      sender: "admin",
      text,
      timestamp: serverTimestamp()
    });
    chatInput.value = "";
  } catch (e) {
    alert("Не удалось отправить сообщение: " + e.message);
  }
});

chatStatusSelect?.addEventListener("change", async (e) => {
  if (!state.chat.orderId || !state.chat.orderType) return;
  const collectionName = COLLECTIONS[state.chat.orderType];
  
  try {
    await updateDoc(doc(db, collectionName, state.chat.orderId), { status: e.target.value });
    // refresh orders list to reflect new status/pill & counter
    if (state.chat.orderType === 'vip') await loadOrders('vip');
    else await loadOrders('cert');
  } catch (e) {
    alert("Не удалось обновить статус: " + e.message);
  }
});

setVipBtn?.addEventListener("click", async () => {
  if (!state.chat.orderId || state.chat.orderType !== 'vip') return;
  
  // get order to know uid
  const order = state.orders.find((o) => o.id === state.chat.orderId);
  if (!order?.uid) return alert("У заказа нет UID");
  if (!confirm(`Выдать VIP пользователю ${order.uid.substring(0, 8)}…?`)) return;
  
  try {
    await updateDoc(doc(db, "ursa_users", order.uid), {
      status: "vip",
      vip_activated_at: new Date().toISOString()
    });
    await updateDoc(doc(db, COLLECTIONS.vip, state.chat.orderId), { status: "completed" });
    
    await loadUsers();
    await loadOrders('vip');
    closeChat();
    alert("VIP выдан");
  } catch (e) {
    alert("Ошибка выдачи VIP: " + e.message);
  }
});

// ===============================
// UTIL
// ===============================
function srAlert(text) {
  const el = document.createElement("div");
  el.className = "sr-only";
  el.setAttribute("role", "status");
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
