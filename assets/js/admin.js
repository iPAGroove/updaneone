// assets/js/admin.js — v5 (Classic IPA View + Unified Orders)
// ======================================================
// Requirements: Firebase v9 (modular), app.js exports { auth, db }
// Focus: VIP Orders + Cert Orders + universal chat panel + Classic IPA Edit

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
  serverTimestamp,
  deleteField
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
const COLLECTIONS = {
  vip: "vip_orders",
  cert: "cert_orders"
};

// ===============================
// STATE
// ===============================
const state = {
  user: null,
  apps: [],
  users: [],
  orders: [], // VIP Orders
  certOrders: [], // Cert Orders
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
const certOrdersCounter = $("#cert-orders-counter"); 

// Views
const views = {
  dashboard: $("#view-dashboard"),
  apps: $("#view-apps"),
  users: $("#view-users"),
  orders: $("#view-orders"), 
  "cert-orders": $("#view-cert-orders") 
};

// Dashboard stats
const statApps = $("#stat-apps");
const statVip = $("#stat-vip");
const statOrders = $("#stat-orders");
const statSigners = $("#stat-signers");

// Apps view (Classic)
const appsGrid = $("#apps-grid");
const appsSkeleton = $("#apps-skeleton");
const appSearch = $("#app-search");
const addAppBtn = $("#add-app-btn");

// Users view
const usersTableBody = $("#user-list"); // Updated to match user-list in HTML
const usersSkeleton = $("#users-skeleton");
const userSearch = $("#user-search");

// VIP Orders view
const ordersList = $("#orders-list");
const ordersSkeleton = $("#orders-skeleton");
const ordersStatus = $("#orders-status");
const orderSearch = $("#order-search");

// Cert Orders view
const certOrdersList = $("#cert-orders-list");
const certOrdersSkeleton = $("#cert-orders-skeleton");
const certOrdersStatus = $("#cert-orders-status");
const certOrderSearch = $("#cert-order-search");

// Modals (App - Classic Form)
const appModal = $("#app-modal");
const appForm = $("#ipa-form");
const modalTitle = $("#modal-title");
const appDeleteBtn = $("#app-delete-btn");

// App form fields (for reference in functions)
const fAppId = $("#app-id");
const fIconInput = $("#iconUrl");
const fIconPreview = $("#icon-preview");

// User Modal fields
const userModal = $("#user-modal");
const userSearchInput = $("#user-search");

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
  // Default view: apps (as per old admin)
  activateView("apps");
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
      else if (activeView === "cert-orders") certOrderSearch?.focus();
    }
  });
}

function getActiveView() {
  return Object.entries(views).find(([k, el]) => el.classList.contains("active"))?.[0] || "apps";
}

async function activateView(view) {
  Object.values(views).forEach((v) => v.classList.remove("active"));
  views[view].classList.add("active");

  const titles = {
    dashboard: "📊 Дашборд",
    apps: "📱 Каталог приложений",
    users: "👥 Пользователи",
    orders: "💸 VIP Заявки",
    "cert-orders": "🔐 Cert Заявки"
  };
  topbarTitle.textContent = titles[view] || "URSA Admin";

  if (view === "dashboard") loadDashboard();
  else if (view === "apps") initApps();
  else if (view === "users") initUsers();
  else if (view === "orders") initOrders("vip");
  else if (view === "cert-orders") initOrders("cert");
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

// ===============================
// APPS (CLASSIC LIST)
// ===============================

function formatSize(bytes) {
  if (!bytes) return "-";
  const megabytes = bytes / 1000000;
  return `${megabytes.toFixed(0)} MB`;
}

function initApps() {
  appsSkeleton.style.display = "block";
  appsGrid.setAttribute("aria-busy", "true");
  loadApps().then(() => {
    appsSkeleton.style.display = "none";
    appsGrid.removeAttribute("aria-busy");
  });

  appSearch?.addEventListener("input", () => loadApps(appSearch.value));
  addAppBtn?.addEventListener("click", () => openAppModal(null));

  fIconInput.addEventListener("input", () => {
    fIconPreview.src = fIconInput.value;
    fIconPreview.style.display = fIconInput.value ? "block" : "none";
  });

  document.querySelectorAll(".tag-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tag-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      appForm.tag.value = btn.dataset.tag;
    });
  });
}

async function loadApps(query = "") {
  const snap = await getDocs(collection(db, "ursa_ipas"));
  let apps = snap.docs.map(d => ({ __docId: d.id, ...d.data() }));

  if (query) {
    const q = query.toLowerCase();
    apps = apps.filter(app =>
      (app["NAME"] || "").toLowerCase().includes(q) ||
      (app["Bundle ID"] || "").toLowerCase().includes(q) ||
      (app["tags"] || []).join(",").toLowerCase().includes(q)
    );
  }

  state.apps = apps;
  renderApps(apps);
}

function renderApps(apps) {
  appsGrid.innerHTML = "";
  if (!apps.length) {
    appsGrid.innerHTML = `<div class="empty">Нет приложений по фильтру</div>`;
    return;
  }

  apps.forEach(app => {
    const card = document.createElement("div");
    card.className = "app-card";

    const vipTag = app.vipOnly ? '<span class="badge vip">VIP</span>' : '';
    const tags = Array.isArray(app.tags) ? app.tags.join(', ') : app.tags || '';

    card.innerHTML = `
      <div class="app-info">
        <img src="${app.iconUrl || "https://placehold.co/44x44/1e2633/9aa7bd?text=?"}" alt="" class="app-icon" onerror="this.src='https://placehold.co/44x44/1e2633/9aa7bd?text=?'">
        <div>
          <div class="app-title">${app["NAME"] || "Без названия"}</div>
          <div class="app-meta">${vipTag} ${tags} • v${app.Version || '—'}</div>
        </div>
      </div>
      <div class="app-actions">
        <button class="btn small blue" data-action="edit" data-id="${app.__docId}">✏️</button>
        <button class="btn small red" data-action="delete" data-id="${app.__docId}">🗑</button>
      </div>
    `;
    appsGrid.appendChild(card);
  });
}

function openAppModal(appId) {
  const app = state.apps.find((a) => a.__docId === appId);

  modalTitle.textContent = appId ? "Редактировать IPA" : "Добавить IPA";
  appForm.reset();
  fAppId.value = appId || "";

  // Populate form if editing
  if (app) {
    appForm.name.value = app["NAME"] || "";
    appForm.bundleId.value = app["Bundle ID"] || "";
    appForm.version.value = app["Version"] || "";
    appForm.minIOS.value = app["minimal iOS"] || "";
    appForm.sizeMB.value = app["sizeBytes"] ? (app["sizeBytes"] / 1000000).toFixed(0) : "";
    appForm.iconUrl.value = app.iconUrl || "";
    appForm.downloadUrl.value = app.DownloadUrl || "";
    appForm.features_ru.value = app.features_ru || "";
    appForm.features_en.value = app.features_en || "";
    appForm.vipOnly.checked = !!app.vipOnly;

    fIconPreview.src = app.iconUrl || "";
    fIconPreview.style.display = app.iconUrl ? "block" : "none";

    // Tags
    document.querySelectorAll(".tag-btn").forEach(btn => btn.classList.remove("active"));
    if (Array.isArray(app.tags) && app.tags.length > 0) {
      const tag = app.tags[0];
      const btn = document.querySelector(`.tag-btn[data-tag="${tag}"]`);
      if (btn) {
        btn.classList.add("active");
        appForm.tag.value = tag;
      }
    }
  } else {
    document.querySelectorAll(".tag-btn").forEach(btn => btn.classList.remove("active"));
    appForm.tag.value = '';
  }

  appDeleteBtn.style.display = appId ? "inline-block" : "none";
  appModal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeAppModal() {
  appModal.classList.remove("open");
  document.body.style.overflow = "";
}

appModal.addEventListener("click", (e) => {
  if (e.target.hasAttribute("data-close") || e.target.closest(".close") || e.target.classList.contains('backdrop')) {
    closeAppModal();
  }
});

appsGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".app-actions button");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "edit") openAppModal(id);
  else if (action === "delete") deleteAppItem(id);
});

async function deleteAppItem(id) {
  if (confirm("Удалить запись?")) {
    try {
      await deleteDoc(doc(db, "ursa_ipas", id));
      loadApps();
    } catch (e) {
      console.error("Error deleting document: ", e);
      alert("Ошибка удаления.");
    }
  }
}

appDeleteBtn?.addEventListener("click", async () => {
  const id = fAppId.value.trim();
  if (!id) return;
  closeAppModal();
  deleteAppItem(id);
});


appForm?.addEventListener("submit", async e => {
  e.preventDefault();
  const id = fAppId.value.trim();
  const values = Object.fromEntries(new FormData(appForm));

  const ipa = {
    ID: values.bundleId && values.version ? `${values.bundleId}_${values.version}` : values.bundleId,
    NAME: values.name,
    "Bundle ID": values.bundleId,
    Version: values.version,
    "minimal iOS": values.minIOS,
    sizeBytes: Number(values.sizeMB || 0) * 1000000,
    iconUrl: values.iconUrl,
    DownloadUrl: values.downloadUrl,
    // description_ru: "Функции мода", // Эти поля не нужны, если есть features
    // description_en: "Hack Features", 
    features_ru: values.features_ru || "",
    features_en: values.features_en || "",
    tags: values.tag ? [values.tag] : [],
    updatedAt: new Date().toISOString(),
    vipOnly: values.vipOnly === "on" ? true : false,
  };

  try {
    if (id) {
      await updateDoc(doc(db, "ursa_ipas", id), ipa);
      alert("Приложение обновлено");
    } else {
      await addDoc(collection(db, "ursa_ipas"), { ...ipa, createdAt: new Date().toISOString(), downloadCount: 0 });
      alert("Приложение добавлено");
    }
    closeAppModal();
    loadApps();
  } catch (e) {
    alert("Ошибка сохранения: " + e.message);
  }
});

// ===============================
// USERS
// ===============================
function initUsers() {
  usersSkeleton.style.display = "block";
  loadUsers().then(() => (usersSkeleton.style.display = "none"));
  userSearchInput?.addEventListener("input", e => loadUsers(e.target.value));

  document.getElementById("save-user-status").onclick = async () => {
    const id = userModal.dataset.id;
    const newStatus = document.getElementById("edit-user-status").value;
    try {
      await updateDoc(doc(db, "ursa_users", id), {
        status: newStatus,
        statusExpiry: deleteField()
      });
      console.log(`✅ User ${id} status changed to ${newStatus} (Permanent)`);
    } catch (err) {
      console.error("❌ Ошибка при обновлении статуса:", err);
    }
    userModal.classList.remove("open");
    document.body.style.overflow = "";
    loadUsers();
  };

  document.getElementById("save-user-vip-31").onclick = async () => {
    const id = userModal.dataset.id;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 31);
    const expiryISO = expiryDate.toISOString();
    try {
      await updateDoc(doc(db, "ursa_users", id), {
        status: "vip",
        statusExpiry: expiryISO
      });
      console.log(`✅ User ${id} status changed to VIP until ${expiryISO}`);
    } catch (err) {
      console.error("❌ Ошибка при обновлении статуса:", err);
    }
    userModal.classList.remove("open");
    document.body.style.overflow = "";
    loadUsers();
  };

  userModal.addEventListener("click", e => {
    if (e.target.hasAttribute("data-close") || e.target.closest(".close") || e.target.classList.contains('backdrop')) {
      userModal.classList.remove("open");
      document.body.style.overflow = "";
    }
  });
}

async function loadUsers(query = "") {
  usersTableBody.innerHTML = "<tr><td colspan='5' style='color:#888'>Загрузка...</td></tr>";

  const usersSnap = await getDocs(collection(db, "ursa_users"));
  const signersSnap = await getDocs(collection(db, "ursa_signers"));
  const signersMap = Object.create(null);
  signersSnap.docs.forEach((d) => (signersMap[d.id] = d.data()));

  let users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data(), signer: signersMap[d.id] }));
  
  if (query) {
    const q = query.toLowerCase();
    users = users.filter(u =>
      (u.email || "").toLowerCase().includes(q) ||
      (u.name || "").toLowerCase().includes(q)
    );
  }

  state.users = users;
  renderUsers(users);
}

function renderUsers(users) {
  usersTableBody.innerHTML = "";
  if (!users.length) {
    usersTableBody.innerHTML = "<tr><td colspan='5' class='empty-row'>Нет пользователей</td></tr>";
    return;
  }
  users.forEach(u => {
    const tr = document.createElement("tr");
    let expiryText = "";
    if (u.status === "vip" && u.statusExpiry) {
      const expiryDate = new Date(u.statusExpiry);
      const isExpired = expiryDate < new Date();
      const dateString = expiryDate.toLocaleDateString('ru-RU');
      expiryText = isExpired
        ? `<span class="expiry-date" style="color:var(--red)">Истёк ${dateString}</span>`
        : `<span class="expiry-date">до ${dateString}</span>`;
    }
    tr.innerHTML = `
      <td>${u.email || "—"}</td>
      <td>${u.name || "—"}</td>
      <td class="muted">${u.id.substring(0, 8)}...</td>
      <td>
        <span class="badge ${u.status === "vip" ? "vip" : "free"}">${u.status || "free"}</span>
        ${expiryText}
      </td>
      <td><button class="btn small" data-action="edit-user" data-id="${u.id}" data-email="${u.email || ''}" data-name="${u.name || ''}" data-status="${u.status || 'free'}">✏️</button></td>
    `;
    usersTableBody.appendChild(tr);
  });

  usersTableBody.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest("[data-action='edit-user']");
      if (!btn) return;
      userModal.dataset.id = btn.dataset.id;
      document.getElementById("edit-user-email").textContent = btn.dataset.email;
      document.getElementById("edit-user-name").textContent = btn.dataset.name;
      document.getElementById("edit-user-status").value = btn.dataset.status;
      userModal.classList.add("open");
      document.body.style.overflow = "hidden";
    },
    { once: true }
  );
}

// ===============================
// ORDERS + REALTIME CHAT (Универсальная реализация)
// ===============================

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
  chatOrderMeta.textContent = `Тип: ${orderType.toUpperCase()} • Метод/План: ${order.method || order.plan || "—"} • UID: ${
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
