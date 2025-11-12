// ======================================================================
// URSA ADMIN — v5 (full)
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

// ======================================================================
// STATE + DOM
// ======================================================================

const state = {
  user: null,
  apps: [],
  users: [],
  orders: [],
  chat: {
    orderId: null,
    type: null,
    unsub: null
  },
  inited: {
    apps: false,
    users: false,
    orders: false
  }
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

// Auth
const authScreen = $("#admin-auth");
const appShell = $("#admin-app");
const loginBtn = $("#auth-login-btn");
const logoutBtn = $("#admin-logout-btn");
const authError = $("#auth-error");

// Sidebar / views
const sideLinks = $$(".side-link");
const topbarTitle = $("#topbar-title");

const views = {
  dashboard: $("#view-dashboard"),
  apps: $("#view-apps"),
  users: $("#view-users"),
  orders: $("#view-orders")
};

const ordersCounter = $("#orders-counter");

// Dashboard
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

// IPA modal
const appModal = $("#app-modal");
const appForm = $("#app-edit-form");

const fAppIdEl = $("#app-id"); // может быть null (в v4 html его нет)
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
// в admin.html у тебя <tbody id="users-table">, поэтому берём по id
const usersTableBody = $("#users-table");
const usersSkeleton = $("#users-skeleton");
const userSearch = $("#user-search");

// Orders
const ordersList = $("#orders-list");
const ordersSkeleton = $("#orders-skeleton");
const ordersStatus = $("#orders-status");
const orderSearch = $("#order-search");

// Chat
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
// AUTH
// ======================================================================

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

  const allowed = [
    "vibemusic1712@gmail.com",
    "kotvlad400@gmail.com",
    "olesyazardina@gmail.com",
    "admin@ursaipa.live",
    "support@ursaipa.live"
  ];

  if (!allowed.includes(user.email)) {
    await signOut(auth);
    authError.textContent = "Нет прав администратора.";
    return showAuth();
  }

  state.user = user;
  showApp();
  initNavigation();
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

// ======================================================================
// NAVIGATION
// ======================================================================

function initNavigation() {
  sideLinks.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      sideLinks.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activateView(view);
    });
  });

  // Фокус на поиск по /
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
      e.preventDefault();
      const v = getActiveView();
      if (v === "apps") appSearch?.focus();
      if (v === "users") userSearch?.focus();
      if (v === "orders") orderSearch?.focus();
    }
  });
}

function getActiveView() {
  return (
    Object.entries(views).find(([_, el]) => el?.classList.contains("active"))?.[0] ||
    "orders"
  );
}

async function activateView(view) {
  Object.values(views).forEach((v) => v?.classList.remove("active"));
  views[view]?.classList.add("active");

  const titles = {
    dashboard: "📊 Дашборд",
    apps: "📱 Каталог приложений",
    users: "👥 Пользователи",
    orders: "💸 Все заявки"
  };
  topbarTitle.textContent = titles[view] || "URSA Admin";

  if (view === "dashboard") loadDashboard();
  if (view === "apps") initApps();
  if (view === "users") initUsers();
  if (view === "orders") initOrders();
}

// ======================================================================
// APPS (GRID + MODAL)
// ======================================================================

function initApps() {
  if (state.inited.apps) {
    renderApps();
    return;
  }
  state.inited.apps = true;

  appsSkeleton.style.display = "grid";
  appsGrid.setAttribute("aria-busy", "true");

  loadApps().then(() => {
    appsSkeleton.style.display = "none";
    appsGrid.removeAttribute("aria-busy");
  });

  appSearch?.addEventListener("input", renderApps);
  appFilter?.addEventListener("change", renderApps);
  addAppBtn?.addEventListener("click", () => openAppModal(null));

  // Live preview иконки
  if (fAppIcon && fAppIconPreview) {
    fAppIcon.addEventListener("input", () => {
      const url = fAppIcon.value.trim();
      fAppIconPreview.src = url || "https://placehold.co/120x120";
      fAppIconPreview.style.opacity = url ? "1" : ".35";
    });
  }

  // Категория — Games/Apps
  tagButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tag = btn.dataset.tag || "";
      tagButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (fAppTag) fAppTag.value = tag;
    });
  });

  // Закрытие модалки по клику на фон / X
  appModal?.addEventListener("click", (e) => {
    if (e.target === appModal || e.target.closest("[data-action='close']")) {
      appModal.classList.remove("visible");
    }
  });

  // Сохранение IPA
  appForm?.addEventListener("submit", onSaveIPA);
  appDeleteBtn?.addEventListener("click", onDeleteIPA);
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

  // Один обработчик на грид
  appsGrid.onclick = (e) => {
    const btn = e.target.closest("[data-edit]");
    if (!btn) return;
    openAppModal(btn.getAttribute("data-edit"));
  };
}

function openAppModal(appId) {
  const app = state.apps.find((a) => a.id === appId) || null;

  const titleEl = $("#app-modal-title");
  if (titleEl) {
    titleEl.textContent = appId ? "Редактировать IPA" : "Добавить IPA";
  }

  appForm?.reset();

  if (fAppIdEl) fAppIdEl.value = appId || "";
  if (fAppName) fAppName.value = app?.NAME || "";
  if (fAppBundle) fAppBundle.value = app?.["Bundle ID"] || "";
  if (fAppVersion) fAppVersion.value = app?.Version || "";
  if (fAppMinIOS) fAppMinIOS.value = app?.["minimal iOS"] || "";

  if (fAppSizeMb)
    fAppSizeMb.value = app?.sizeBytes ? Math.round(app.sizeBytes / 1000000) : "";

  if (fAppUrl) fAppUrl.value = app?.DownloadUrl || "";
  if (fAppIcon) fAppIcon.value = app?.iconUrl || "";

  if (fAppFeaturesRu) fAppFeaturesRu.value = app?.features_ru || "";
  if (fAppFeaturesEn) fAppFeaturesEn.value = app?.features_en || "";

  let currentTag = "";
  if (Array.isArray(app?.tags) && app.tags.length) {
    currentTag = app.tags[0];
  }
  if (fAppTag) fAppTag.value = currentTag;

  tagButtons.forEach((btn) => {
    if (btn.dataset.tag === currentTag) btn.classList.add("active");
    else btn.classList.remove("active");
  });

  if (fAppVipOnly) fAppVipOnly.checked = app?.vipOnly === true;

  if (fAppIconPreview) {
    const url = fAppIcon?.value.trim() || "";
    fAppIconPreview.src = url || "https://placehold.co/120x120";
    fAppIconPreview.style.opacity = url ? "1" : ".35";
  }

  if (appDeleteBtn) appDeleteBtn.style.display = appId ? "inline-block" : "none";

  appModal?.classList.add("visible");
}

async function onSaveIPA(e) {
  e.preventDefault();

  const id = fAppIdEl?.value.trim() || "";

  const name = fAppName?.value.trim() || "";
  const bundleId = fAppBundle?.value.trim() || "";
  const version = fAppVersion?.value.trim() || "";
  const minIOS = fAppMinIOS?.value.trim() || "";
  const sizeMb =
    parseFloat((fAppSizeMb?.value || "0").replace(",", ".")) || 0;
  const iconUrl = fAppIcon?.value.trim() || "";
  const downloadUrl = fAppUrl?.value.trim() || "";
  const featuresRu = fAppFeaturesRu?.value.trim() || "";
  const featuresEn = fAppFeaturesEn?.value.trim() || "";
  const tag = fAppTag?.value || "";
  const vipOnly = !!fAppVipOnly?.checked;

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
    appModal?.classList.remove("visible");
    await loadApps();
  } catch (err) {
    alert("Ошибка сохранения: " + err.message);
  }
}

async function onDeleteIPA() {
  const id = fAppIdEl?.value.trim();
  if (!id) return;
  if (!confirm("Удалить приложение?")) return;

  try {
    await deleteDoc(doc(db, "ursa_ipas", id));
    alert("Удалено");
    appModal?.classList.remove("visible");
    await loadApps();
  } catch (err) {
    alert("Ошибка удаления: " + err.message);
  }
}

// ======================================================================
// USERS
// ======================================================================

function initUsers() {
  if (state.inited.users) {
    renderUsers();
    return;
  }
  state.inited.users = true;

  usersSkeleton.style.display = "block";
  loadUsers().then(() => {
    usersSkeleton.style.display = "none";
  });

  userSearch?.addEventListener("input", renderUsers);
}

async function loadUsers() {
  const usersSnap = await getDocs(collection(db, "ursa_users"));
  const signersSnap = await getDocs(collection(db, "ursa_signers"));

  const signersMap = Object.create(null);
  signersSnap.docs.forEach((d) => (signersMap[d.id] = d.data()));

  state.users = usersSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    signer: signersMap[d.id] || null
  }));

  renderUsers();
}

function getCertStatus(cert) {
  if (!cert) return "Нет";
  try {
    const expires = new Date(cert.expires);
    return expires > new Date() ? "✅ Активен" : "❌ Истек";
  } catch {
    return "Нет";
  }
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

  usersTableBody.onclick = async (e) => {
    const btn = e.target.closest("[data-toggle-vip]");
    if (!btn) return;
    const uid = btn.getAttribute("data-toggle-vip");
    const cur = btn.getAttribute("data-status");
    await toggleUserVip(uid, cur);
    await loadUsers();
  };
}

async function toggleUserVip(uid, currentStatus) {
  const next = currentStatus === "vip" ? "free" : "vip";
  if (!confirm(`Изменить статус на ${next.toUpperCase()}?`)) return;
  await updateDoc(doc(db, "ursa_users", uid), {
    status: next,
    vip_activated_at: next === "vip" ? new Date().toISOString() : null
  });
}

// ======================================================================
// DASHBOARD
// ======================================================================

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

    if (statApps) statApps.textContent = appsSnap.size;
    if (statVip) statVip.textContent = vipCount;
    if (statOrders) statOrders.textContent = activeOrders;
    if (statSigners) statSigners.textContent = signersSnap.size;
  } catch (e) {
    console.error("Dashboard error:", e);
  }
}

// ======================================================================
// ORDERS + CHAT (vip + cert + support)
// ======================================================================

function initOrders() {
  if (state.inited.orders) {
    renderOrders();
    return;
  }
  state.inited.orders = true;

  ordersSkeleton.style.display = "block";
  loadOrders().then(() => (ordersSkeleton.style.display = "none"));

  ordersStatus?.addEventListener("change", renderOrders);
  orderSearch?.addEventListener("input", renderOrders);

  chatClose?.addEventListener("click", closeChat);

  chatForm?.addEventListener("submit", onChatSend);
  chatStatusSelect?.addEventListener("change", onChatStatusChange);
  setVipBtn?.addEventListener("click", onSetVipFromChat);
}

function toMs(v) {
  if (!v) return 0;
  if (typeof v.toDate === "function") return v.toDate().getTime();
  const t = Date.parse(v);
  return isNaN(t) ? 0 : t;
}

function typeText(t) {
  return (
    {
      vip: "VIP",
      cert: "CERT",
      support: "SUPPORT"
    }[t] || "—"
  );
}

function collectionNameByType(type) {
  if (type === "vip") return "vip_orders";
  if (type === "cert") return "cert_orders";
  return "support_orders";
}

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
      console.warn(`Orders: ${colName} →`, e.message);
    }
  };

  await loadCol("vip_orders", "vip");
  await loadCol("cert_orders", "cert");
  await loadCol("support_orders", "support");

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
  if (ordersCounter) ordersCounter.textContent = String(activeCount);

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

  ordersList.onclick = (e) => {
    const btn = e.target.closest("[data-chat]");
    if (!btn) return;
    openChat(btn.getAttribute("data-chat"));
  };
}

// ---- CHAT ----

function openChat(orderId) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;

  const colName = collectionNameByType(order.type);

  chatOrderIdEl.textContent = orderId.substring(0, 8) + "…";
  chatOrderMeta.textContent = `Тип: ${typeText(order.type)} • Метод: ${
    order.method || "—"
  } • UID: ${order.uid?.substring(0, 8) || "—"}…`;
  chatStatusSelect.value = order.status || "pending";

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

async function onChatSend(e) {
  e.preventDefault();
  if (!state.chat.orderId || !state.chat.type) return;

  const text = chatInput.value.trim();
  if (!text) return;

  const colName = collectionNameByType(state.chat.type);

  try {
    await addDoc(collection(db, colName, state.chat.orderId, "messages"), {
      sender: "admin",
      text,
      timestamp: serverTimestamp()
    });
    chatInput.value = "";
  } catch (e) {
    alert("Не удалось отправить сообщение: " + e.message);
  }
}

async function onChatStatusChange(e) {
  if (!state.chat.orderId || !state.chat.type) return;

  const colName = collectionNameByType(state.chat.type);

  try {
    await updateDoc(doc(db, colName, state.chat.orderId), {
      status: e.target.value
    });
    await loadOrders();
  } catch (err) {
    alert("Не удалось обновить статус: " + err.message);
  }
}

async function onSetVipFromChat() {
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
  } catch (err) {
    alert("Ошибка выдачи VIP: " + err.message);
  }
}

// ======================================================================
// END
// ======================================================================
