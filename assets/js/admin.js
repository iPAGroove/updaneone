// assets/js/admin.js
// ===============================
// URSA ADMIN PANEL LOGIC (v3 - Refactored List Rendering)
// ===============================

// Импортируем Firebase Init из app.js
import { auth, db } from "./app.js"; 

import {
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import { 
    onAuthStateChanged, 
    signOut,
    GoogleAuthProvider, 
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";


// === СПИСОК АДМИНОВ ===
const ADMIN_EMAILS = [
    "vibemusic1712@gmail.com", 
    "kotvlad400@gmail.com",
    "olesyazardina@gmail.com"
];

// Глобальные переменные и кэш
let allApps = [];
let allUsers = [];
let allOrders = [];
let currentChatUnsubscribe = null;

// === Элементы UI Auth/Layout ===
const authScreen = document.getElementById("admin-auth");
const dashboard = document.getElementById("admin-dashboard");
const loginBtn = document.getElementById("auth-login-btn");
const errorEl = document.getElementById("auth-error");

// ===============================
// 0. АВТОРИЗАЦИЯ И ИНИЦИАЛИЗАЦИЯ
// ===============================
function showAuthScreen() {
    authScreen.style.display = "block";
    dashboard.style.display = "none";
}

function showDashboard() {
    authScreen.style.display = "none";
    dashboard.style.display = "block";
    initAdminPanel();
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        // 🔥 Проверка прав администратора
        if (ADMIN_EMAILS.includes(user.email)) {
            console.log(`✅ Admin access granted for: ${user.email}`);
            showDashboard();
        } else {
            console.warn(`❌ Access denied for: ${user.email}`);
            signOut(auth); // Выкидываем не-админа
            errorEl.textContent = "Нет прав администратора (неверный Google аккаунт).";
            showAuthScreen();
        }
    } else {
        showAuthScreen();
    }
});

// --- GOOGLE SIGN-IN ---
loginBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    errorEl.textContent = "";
    try {
        await signInWithPopup(auth, provider);
    } catch (err) {
        // Обработка ошибок, например, закрытие окна или network error
        console.error("Auth Error:", err);
        errorEl.textContent = "Ошибка входа: " + err.message;
    }
});

document.getElementById("admin-logout-btn").addEventListener("click", () => {
    signOut(auth);
});

// ===============================
// 1. УПРАВЛЕНИЕ ВИДАМИ / НАВИГАЦИЯ
// ===============================
function initAdminPanel() {
    document.querySelectorAll(".admin-nav .nav-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const view = e.target.dataset.view;
            document.querySelectorAll(".admin-nav .nav-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
            document.getElementById(`view-${view}`).classList.add("active");
            
            // Обновление данных при смене вкладки
            if (view === 'apps') loadApps();
            if (view === 'users') loadUsers();
            if (view === 'orders') loadVipOrders();
            if (view === 'dashboard') loadDashboardStats();
        });
    });
    
    // Загружаем стартовые данные (Dashboard активен по умолчанию)
    loadDashboardStats();
    setupAppModalListeners();
    setupSearchListeners();
}

// ===============================
// 2. ЗАГРУЗКА ДАННЫХ
// ===============================

async function loadDashboardStats() {
    // Скрытие скелетонов в Dashboard не требуется, т.к. данные загружаются сразу
    try {
        // Apps
        const appsSnap = await getDocs(collection(db, "ursa_ipas"));
        document.getElementById("stat-apps").textContent = appsSnap.size;

        // Users & VIP
        const usersSnap = await getDocs(collection(db, "ursa_users"));
        const vipCount = usersSnap.docs.filter(d => d.data().status === 'vip').length;
        document.getElementById("stat-vip").textContent = vipCount;
        
        // Orders
        const ordersSnap = await getDocs(collection(db, "vip_orders"));
        const pendingOrders = ordersSnap.docs.filter(d => d.data().status === 'pending' || d.data().status === 'processing').length;
        document.getElementById("stat-orders").textContent = pendingOrders;

        // Signers (Certificates)
        const signersSnap = await getDocs(collection(db, "ursa_signers"));
        document.getElementById("stat-signers").textContent = signersSnap.size;

    } catch (err) {
        console.error("Ошибка загрузки статистики:", err);
    }
}


// --- Приложения: Рендеринг в список (КАРТОЧКИ) ---
async function loadApps(query = '') {
    document.getElementById('apps-skeleton').style.display = 'flex';
    document.getElementById('apps-list').innerHTML = '';

    const snap = await getDocs(collection(db, "ursa_ipas"));
    allApps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAppsList(allApps, query);

    document.getElementById('apps-skeleton').style.display = 'none';
}

function renderAppsList(apps, query) {
    const listContainer = document.getElementById("apps-list");
    listContainer.innerHTML = "";
    
    const filtered = apps.filter(app => 
        !query || (app.NAME || '').toLowerCase().includes(query.toLowerCase())
    );

    filtered.forEach(app => {
        const item = document.createElement("div");
        item.className = "item app-item";
        item.dataset.id = app.id;
        
        const vipStatusTag = app.vipOnly
            ? '<span class="status-tag vip">⭐ VIP</span>'
            : '<span class="status-tag free">FREE</span>';

        item.innerHTML = `
            <img src="${app.iconUrl || 'https://placehold.co/48x48'}" class="item-icon" alt="${app.NAME || 'Приложение'}">
            <div class="item-body">
                <div class="item-title">${app.NAME || 'N/A'}</div>
                <div class="item-meta">
                    <span>Версия: ${app.Version || 'N/A'}</span>
                    <span>Загрузки: ${app.downloadCount || 0}</span>
                </div>
            </div>
            <div class="item-actions">
                ${vipStatusTag}
                <button class="btn small-btn edit-app-btn" data-id="${app.id}" aria-label="Редактировать">✏️</button>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

// --- Пользователи: Рендеринг в список (КАРТОЧКИ) ---
async function loadUsers(query = '') {
    document.getElementById('users-skeleton').style.display = 'flex';
    document.getElementById('users-list').innerHTML = '';

    const usersSnap = await getDocs(collection(db, "ursa_users"));
    const signersSnap = await getDocs(collection(db, "ursa_signers"));
    
    const signersMap = signersSnap.docs.reduce((map, doc) => {
        map[doc.id] = doc.data();
        return map;
    }, {});

    allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data(), signer: signersMap[d.id] }));
    renderUsersList(allUsers, query);

    document.getElementById('users-skeleton').style.display = 'none';
}

function renderUsersList(users, query) {
    const listContainer = document.getElementById("users-list");
    listContainer.innerHTML = "";
    
    const filtered = users.filter(user => 
        !query || 
        user.email?.toLowerCase().includes(query.toLowerCase()) || 
        user.id.toLowerCase().includes(query.toLowerCase())
    );

    filtered.forEach(user => {
        const certActive = user.signer && new Date(user.signer.expires) > new Date();
        const certStatusText = user.signer ? (certActive ? 'Активен' : 'Истек') : 'Нет';
        const certStatusTagClass = user.signer ? (certActive ? 'completed' : 'canceled') : 'free';

        const vipStatus = user.status === 'vip' ? 'vip' : 'free';

        const item = document.createElement("div");
        item.className = "item user-item";
        
        item.innerHTML = `
            <div class="item-icon" style="background:#4a5568; display:flex; justify-content:center; align-items:center; color:white; font-size:24px; border-radius: 12px;">👤</div>
            <div class="item-body">
                <div class="item-title">${user.email || 'N/A'}</div>
                <div class="item-sub">UID: ${user.id.substring(0, 8)}...</div>
                <div class="item-meta">
                    <span>Сертификат: <span class="status-tag ${certStatusTagClass}">${certStatusText}</span></span>
                </div>
            </div>
            <div class="item-actions">
                <span class="status-tag ${vipStatus}">${vipStatus.toUpperCase()}</span>
                <button class="btn small-btn set-vip-status-btn" data-id="${user.id}" data-status="${user.status}">
                    ${user.status === 'vip' ? '↓ FREE' : '↑ VIP'}
                </button>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

// --- VIP Заявки: Рендеринг в таблицу (с новыми статусами) ---
async function loadVipOrders() {
    document.getElementById('orders-skeleton').style.display = 'flex';
    document.getElementById('orders-table').querySelector("tbody").innerHTML = '';

    const q = query(collection(db, "vip_orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderOrdersTable(allOrders);

    document.getElementById('orders-skeleton').style.display = 'none';
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById("orders-table").querySelector("tbody");
    tbody.innerHTML = "";
    
    orders.forEach(order => {
        const date = order.createdAt?.toDate()?.toLocaleString() || 'N/A';
        const statusMap = {
            pending: { text: 'Ожидает', tag: 'pending' }, 
            processing: { text: 'В работе', tag: 'processing' }, 
            completed: { text: 'Завершено', tag: 'completed' }, 
            canceled: { text: 'Отменено', tag: 'canceled' }
        };
        const status = statusMap[order.status] || { text: order.status, tag: 'free' };
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${order.id.substring(0, 8)}...</td>
            <td>${order.uid.substring(0, 8)}...</td>
            <td>${order.method}</td>
            <td><span class="status-tag ${status.tag}">${status.text}</span></td>
            <td>${date}</td>
            <td>
                <button class="btn small-btn open-chat-btn" data-id="${order.id}">💬 Чат</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ===============================
// 3. ОБРАБОТЧИКИ СОБЫТИЙ
// ===============================

function setupSearchListeners() {
    document.getElementById("app-search")?.addEventListener("input", (e) => 
        renderAppsList(allApps, e.target.value) // ИЗМЕНЕНО ИМЯ ФУНКЦИИ
    );
    document.getElementById("user-search")?.addEventListener("input", (e) => 
        renderUsersList(allUsers, e.target.value) // ИЗМЕНЕНО ИМЯ ФУНКЦИИ
    );
}

document.addEventListener("click", (e) => {
    // Редактировать приложение (кнопка)
    if (e.target.classList.contains("edit-app-btn")) {
        const appId = e.target.dataset.id;
        openAppModal(appId);
    }
    // Редактировать приложение (клик по карточке, исключая кнопки)
    const item = e.target.closest('.app-item');
    if (item && !e.target.closest('.item-actions')) {
        openAppModal(item.dataset.id);
    }
    // Открыть VIP-чат
    if (e.target.classList.contains("open-chat-btn")) {
        const orderId = e.target.dataset.id;
        openChatModal(orderId);
    }
    // Изменить VIP статус пользователя
    if (e.target.classList.contains("set-vip-status-btn")) {
        const userId = e.target.dataset.id;
        const currentStatus = e.target.dataset.status;
        toggleUserVipStatus(userId, currentStatus);
    }
});

document.getElementById("add-app-btn")?.addEventListener("click", () => openAppModal(null));

// ===============================
// 4. CRUD ДЛЯ ПРИЛОЖЕНИЙ (Логика не изменена)
// ===============================
function setupAppModalListeners() {
    const modal = document.getElementById("app-modal");
    modal.addEventListener("click", (e) => {
        if (e.target === modal || e.target.closest("[data-action='close']")) modal.classList.remove("visible");
    });

    document.getElementById("app-edit-form").addEventListener("submit", saveApp);
    document.getElementById("app-delete-btn").addEventListener("click", deleteApp);
}

function openAppModal(appId) {
    const modal = document.getElementById("app-modal");
    const app = allApps.find(a => a.id === appId);

    document.getElementById("app-id").value = appId || "";
    document.getElementById("app-modal-title").textContent = appId ? "Редактировать приложение" : "Добавить новое приложение";
    
    document.getElementById("app-name").value = app?.NAME || "";
    document.getElementById("app-version").value = app?.Version || "";
    document.getElementById("app-url").value = app?.DownloadUrl || "";
    document.getElementById("app-icon").value = app?.iconUrl || "";
    document.getElementById("app-tags").value = Array.isArray(app?.tags) ? app.tags.join(", ") : app?.tags || "";
    document.getElementById("app-vip-only").checked = app?.vipOnly === true;
    document.getElementById("app-desc").value = app?.description_ru || app?.description_en || app?.desc || "";

    document.getElementById("app-delete-btn").style.display = appId ? "inline-block" : "none";

    modal.classList.add("visible");
}

async function saveApp(e) {
    e.preventDefault();
    
    const id = document.getElementById("app-id").value;
    const data = {
        NAME: document.getElementById("app-name").value,
        Version: document.getElementById("app-version").value,
        DownloadUrl: document.getElementById("app-url").value,
        iconUrl: document.getElementById("app-icon").value,
        tags: document.getElementById("app-tags").value.split(",").map(t => t.trim().toLowerCase()).filter(Boolean),
        vipOnly: document.getElementById("app-vip-only").checked,
        description_ru: document.getElementById("app-desc").value,
        updatedAt: new Date().toISOString()
    };

    try {
        if (id) {
            await updateDoc(doc(db, "ursa_ipas", id), data);
            alert("Приложение обновлено!");
        } else {
            const newDocRef = doc(collection(db, "ursa_ipas"));
            await setDoc(newDocRef, { ...data, createdAt: new Date().toISOString(), downloadCount: 0 });
            alert("Приложение добавлено!");
        }
        
        document.getElementById("app-modal").classList.remove("visible");
        loadApps(); // Обновляем список
    } catch (err) {
        alert("Ошибка сохранения: " + err.message);
    }
}

async function deleteApp() {
    const id = document.getElementById("app-id").value;
    if (!id || !confirm("Вы уверены, что хотите удалить это приложение?")) return;

    try {
        await deleteDoc(doc(db, "ursa_ipas", id));
        alert("Приложение удалено.");
        
        document.getElementById("app-modal").classList.remove("visible");
        loadApps();
    } catch (err) {
        alert("Ошибка удаления: " + err.message);
    }
}


// ===============================
// 5. VIP ЧАТ И УПРАВЛЕНИЕ (Логика не изменена)
// ===============================

function openChatModal(orderId) {
    const modal = document.getElementById("chat-modal");
    const order = allOrders.find(o => o.id === orderId);

    document.getElementById("chat-order-id").textContent = orderId.substring(0, 8) + '...';
    document.getElementById("order-status-select").value = order?.status || 'pending';
    
    modal.classList.add("visible");
    
    // Отписка от предыдущего чата (если был)
    if (currentChatUnsubscribe) currentChatUnsubscribe();
    
    // Подписка на новый чат
    const chatRef = collection(db, "vip_orders", orderId, "messages");
    const q = query(chatRef, orderBy("timestamp"));
    currentChatUnsubscribe = onSnapshot(q, (snap) => renderChat(snap, order));
    
    // Обработчик отправки сообщения админа
    document.getElementById("admin-chat-send").onclick = () => sendAdminMessage(orderId);
    document.getElementById("admin-chat-input").onkeydown = (e) => {
        if (e.key === "Enter") { e.preventDefault(); sendAdminMessage(orderId); }
    };
    
    // Обработчик смены статуса
    document.getElementById("order-status-select").onchange = (e) => 
        updateDoc(doc(db, "vip_orders", orderId), { status: e.target.value })
        .then(() => loadVipOrders()); // Обновляем список заказов
    
    // Обработчик выдачи VIP
    document.getElementById("set-vip-btn").onclick = () => 
        setVipStatusForUser(order.uid, orderId);
}

function renderChat(snap, order) {
    const chatArea = document.getElementById("admin-chat-area");
    chatArea.innerHTML = `
        <div class="system-message">
            💸 Заявка: ${order.id.substring(0, 8)}... (Метод: ${order.method})<br>
            👤 UID: ${order.uid.substring(0, 8)}...<br>
            🔗 UDID: ${order.udid.substring(0, 8)}...
        </div>
    `;
    
    snap.forEach((doc) => {
        const m = doc.data();
        const el = document.createElement("div");
        el.className = (m.sender === "admin") ? "msg admin" : "msg user";
        el.textContent = m.text || (m.fileName || m.mime || "Файл");
        
        // Добавление ссылки на файл
        if (m.fileUrl) {
            const a = document.createElement("a");
            a.href = m.fileUrl;
            a.target = "_blank";
            a.textContent = m.fileName || "Файл";
            a.style.display = "block";
            el.innerHTML = m.text ? `${m.text}<br>` : ''; // Сохраняем текст, если есть
            el.appendChild(a);
        }
        chatArea.appendChild(el);
    });

    chatArea.scrollTop = chatArea.scrollHeight;
}

async function sendAdminMessage(orderId) {
    const input = document.getElementById("admin-chat-input");
    const text = input.value.trim();
    if (!text) return;
    
    await setDoc(doc(collection(db, "vip_orders", orderId, "messages")), {
        sender: "admin",
        text: text,
        timestamp: serverTimestamp(),
    });
    input.value = "";
}

// ===============================
// 6. УПРАВЛЕНИЕ СТАТУСАМИ (Логика не изменена)
// ===============================

async function setVipStatusForUser(uid, orderId = null) {
    if (!confirm(`Вы уверены, что хотите присвоить VIP-статус пользователю ${uid.substring(0, 8)}...?`)) return;

    try {
        // 1. Обновляем статус пользователя в ursa_users
        await updateDoc(doc(db, "ursa_users", uid), {
            status: "vip",
            vip_activated_at: new Date().toISOString()
        });
        
        // 2. Обновляем статус заказа (если есть)
        if (orderId) {
            await updateDoc(doc(db, "vip_orders", orderId), {
                status: "completed"
            });
            document.getElementById("chat-modal")?.classList.remove("visible");
        }

        alert(`VIP-статус для пользователя ${uid.substring(0, 8)}... успешно установлен.`);
        loadUsers();
        loadVipOrders();

    } catch (err) {
        alert("Ошибка выдачи VIP: " + err.message);
    }
}

async function toggleUserVipStatus(uid, currentStatus) {
    const newStatus = currentStatus === 'vip' ? 'free' : 'vip';
    if (!confirm(`Изменить статус пользователя ${uid.substring(0, 8)}... на ${newStatus.toUpperCase()}?`)) return;

    try {
        await updateDoc(doc(db, "ursa_users", uid), {
            status: newStatus,
            vip_activated_at: newStatus === 'vip' ? new Date().toISOString() : arrayRemove("vip_activated_at")
        });

        alert(`Статус изменен на ${newStatus.toUpperCase()}`);
        loadUsers(); // Обновляем список
    } catch (err) {
        alert("Ошибка: " + err.message);
    }
}
