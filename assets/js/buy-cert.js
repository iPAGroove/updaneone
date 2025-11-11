// assets/js/buy-cert.js
// ===============================
// CERT BUY — логика входа, проверка входа, шаги, чат и создание заявки на сертификат
// ===============================
import { auth, db } from "./app.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
    collection,
    addDoc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

const storage = getStorage();

const PRODUCT_NAME = "Private Certificate";
const ORDER_COLLECTION = "cert_orders"; // Отдельная коллекция для заказов сертификатов

// ------------------------------------------------
// 0) Проверка входа и UDID
// ------------------------------------------------
onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("⚠️ Чтобы купить сертификат, сначала войдите в аккаунт.");
        window.location.href = "./";
        return;
    }
    
    // В отличие от VIP, UDID не обязателен, но желательно
    const udid = localStorage.getItem("ursa_cert_udid") || "UDID_UNKNOWN";
    
    // Сохраняем UID и UDID (на случай, если пользователь закроет/откроет страницу)
    localStorage.setItem("ursa_cert_uid", user.uid);
    localStorage.setItem("ursa_cert_udid_for_order", udid);

    initCertBuy();
});

// ------------------------------------------------
// 1) Создаём заявку на сертификат
// ------------------------------------------------
async function createCertOrder(methodKey) {
    const uid = localStorage.getItem("ursa_cert_uid");
    const udid = localStorage.getItem("ursa_cert_udid_for_order"); // Используем сохраненный UDID

    if (!uid) return alert("Ошибка: пользователь не авторизован.");

    // Ищем открытый заказ, чтобы не создавать новый
    const existingOrderId = localStorage.getItem("ursa_cert_order_id");

    if (existingOrderId) {
        // Если уже есть заказ, просто обновляем метод оплаты и открываем чат
        return existingOrderId;
    }

    const docRef = await addDoc(collection(db, ORDER_COLLECTION), {
        uid,
        udid,
        method: methodKey,
        product: PRODUCT_NAME,
        status: "pending",
        createdAt: serverTimestamp()
    });

    localStorage.setItem("ursa_cert_order_id", docRef.id);
    return docRef.id;
}

// ------------------------------------------------
// 2) UI + CHAT
// ------------------------------------------------
function initCertBuy() {
    const PAYMENT_INFO = {
        crypto: {
            name: "USDT TRC20 (Crypto)",
            show: "Адрес:\nTJCQQHMhKExEuyMXA78mXBAbj1YkMNL3NS\nСеть: TRC20",
            copy: "TJCQQHMhKExEuyMXA78mXBAbj1YkMNL3NS",
        },
        binance_pay: {
            name: "Binance Pay ID",
            show: "ID:\n583984119",
            copy: "583984119",
        },
        gift_card: {
            name: "Binance Gift Card",
            show: "Отправьте код подарочной карты в чат.",
            noCopy: true,
        },
        paypal: {
            name: "PayPal",
            show: "Почта:\nswvts6@gmail.com",
            copy: "swvts6@gmail.com",
        },
        ua_card: {
            name: "UA Card",
            show: "Оплатить по ссылке:",
            link: "https://www.privat24.ua/send/373a0",
        },
        ru_card: {
            name: "RU Card (Т-банк / СПБ)",
            show:
                "Т-банк: 2200702048905611\nСПБ: 89933303390\nКомментарий: @viibbee_17",
            tBank: "2200702048905611",
            spb: "89933303390",
        },
    };

    const buyBtn = document.getElementById("cert-buy-btn");
    const modal1 = document.getElementById("modal-step-1");
    const modal2 = document.getElementById("modal-step-2");
    const modalChat = document.getElementById("modal-chat");

    const open = (m) => { m.style.display = "flex"; document.body.style.overflow = "hidden"; };
    const close = (m) => { m.style.display = "none"; document.body.style.overflow = ""; };

    document.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", () => {
        close(modal1); close(modal2); close(modalChat);
    }));

    buyBtn?.addEventListener("click", () => open(modal1));
    document.getElementById("btn-read")?.addEventListener("click", () => { close(modal1); open(modal2); });
    document.getElementById("btn-back-to-info")?.addEventListener("click", () => { close(modal2); open(modal1); });
    document.getElementById("btn-back-to-options")?.addEventListener("click", () => { close(modalChat); open(modal2); });

    // ------------------------------------------------
    // Обработка выбора способа оплаты
    // ------------------------------------------------
    document.addEventListener("click", async (e) => {
        const btn = e.target.closest(".pay-chip, .option-btn");
        if (!btn) return;

        const method = btn.dataset.method;
        if (!method) return;

        const orderId = await createCertOrder(method);
        
        // Пересоздание системного сообщения с актуальной информацией
        renderSystemMessage(method);
        
        close(modal1); close(modal2);
        open(modalChat);
        bindChat(orderId);
    });

    const chatArea = document.getElementById("chat-area");
    const msgTpl = document.getElementById("system-message-template");

    function renderSystemMessage(methodKey) {
        chatArea.innerHTML = "";
        const d = PAYMENT_INFO[methodKey];
        const node = msgTpl.cloneNode(true);
        node.style.display = "block";
        node.querySelector(".chat-method-name").textContent = d.name;
        node.querySelector(".chat-details").textContent = d.show;

        const uid = localStorage.getItem("ursa_cert_uid");
        const udid = localStorage.getItem("ursa_cert_udid_for_order");
        const orderId = localStorage.getItem("ursa_cert_order_id");

        const idBlock = document.createElement("div");
        idBlock.style.marginTop = "14px";
        idBlock.style.fontSize = "13px";
        idBlock.style.opacity = "0.82";
        idBlock.innerHTML = `🛒 Заказ: <b>${orderId}</b><br>👤 UID: <b>${uid}</b><br>🔗 Ваш UDID: <b>${udid}</b>`;
        node.appendChild(idBlock);

        chatArea.appendChild(node);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    // ------------------------------------------------
    // CHAT BINDING (для заказов сертификатов)
    // ------------------------------------------------
    let chatUnsubscribe = null;

    function bindChat(orderId) {
        // Отписываемся от предыдущего слушателя, если он есть
        if (chatUnsubscribe) chatUnsubscribe(); 

        const q = query(collection(db, ORDER_COLLECTION, orderId, "messages"), orderBy("timestamp"));

        chatUnsubscribe = onSnapshot(q, (snap) => {
            // Клонируем системное сообщение (оно всегда должно быть первым)
            const system = chatArea.querySelector(".system-message")?.cloneNode(true);
            chatArea.innerHTML = "";
            if (system) chatArea.appendChild(system);

            snap.forEach((doc) => {
                const m = doc.data();
                const el = document.createElement("div");
                el.className = (m.sender === "admin") ? "msg admin" : "msg user";
                if (m.text) el.textContent = m.text;

                // Логика отображения файлов (та же, что и в vip.js)
                if (m.fileUrl) {
                    if (m.mime?.startsWith("image/")) {
                        const img = document.createElement("img");
                        img.src = m.fileUrl;
                        img.style.maxWidth = "220px";
                        img.style.borderRadius = "10px";
                        img.style.marginTop = "6px";
                        el.appendChild(img);
                    } else {
                        const a = document.createElement("a");
                        a.href = m.fileUrl;
                        a.target = "_blank";
                        a.textContent = m.fileName || "Файл";
                        a.style.color = "#9fdfff";
                        el.appendChild(a);
                    }
                }
                chatArea.appendChild(el);
            });

            chatArea.scrollTop = chatArea.scrollHeight;
        });
        
        // Устанавливаем обработчики ввода только один раз
        setupChatHandlers(orderId);
    }
    
    // ------------------------------------------------
    // Chat Input Handlers
    // ------------------------------------------------
    let handlersSetup = false;
    
    function setupChatHandlers(orderId) {
        if (handlersSetup) return;
        handlersSetup = true;

        const input = document.querySelector(".chat-input");
        const sendBtn = document.querySelector(".chat-send-btn");
        const attachBtn = document.querySelector(".chat-attach-btn");

        async function sendMessage(text) {
            const orderId = localStorage.getItem("ursa_cert_order_id");
            if (!orderId) return;

            await addDoc(collection(db, ORDER_COLLECTION, orderId, "messages"), {
                sender: "user",
                text: text,
                timestamp: serverTimestamp(),
            });
            input.value = "";
        }

        sendBtn.addEventListener("click", () => {
            const txt = input.value.trim();
            if (txt) sendMessage(txt);
        });
        
        input.addEventListener("keydown", (e) => { 
            if (e.key === "Enter") { 
                e.preventDefault(); 
                const txt = input.value.trim();
                if (txt) sendMessage(txt);
            } 
        });

        const hiddenFile = Object.assign(document.createElement("input"), { type: "file", style: "display:none" });
        document.body.appendChild(hiddenFile);

        attachBtn.addEventListener("click", () => hiddenFile.click());
        hiddenFile.addEventListener("change", async () => {
            const file = hiddenFile.files[0];
            if (!file) return;

            const orderId = localStorage.getItem("ursa_cert_order_id");
            if (!orderId) return;

            const refPath = ref(storage, `cert_chats/${orderId}/${Date.now()}_${file.name}`);
            await uploadBytes(refPath, file);
            const url = await getDownloadURL(refPath);

            await addDoc(collection(db, ORDER_COLLECTION, orderId, "messages"), {
                sender: "user",
                fileUrl: url,
                fileName: file.name,
                mime: file.type,
                timestamp: serverTimestamp(),
            });
            hiddenFile.value = "";
        });
    }
}
