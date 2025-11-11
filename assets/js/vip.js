// ===============================
// VIP — логика, оплата, чат, заявки
// ===============================
import { auth, db } from "./app.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

const storage = getStorage();

// ------------------------------------------------
// 0) Авторизация + данные сертификата (НЕ БЛОКИРУЕМ)
// ------------------------------------------------
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("⚠️ Чтобы оформить VIP, сначала войдите в аккаунт.");
    window.location.href = "./";
    return;
  }

  const udid = localStorage.getItem("ursa_cert_udid");
  const exp = localStorage.getItem("ursa_cert_exp");

  // ⚠️ Не уходим со страницы — просто продолжаем
  if (!udid || !exp) {
    console.warn("Сертификат не найден. Привязка произойдёт позже.");
  }

  localStorage.setItem("ursa_vip_uid", user.uid);
  if (udid) localStorage.setItem("ursa_vip_udid", udid);

  initVIP();
});

// ------------------------------------------------
// 1) Создание VIP-заявки
// ------------------------------------------------
async function createVipOrder(methodKey) {
  try {
    const uid = localStorage.getItem("ursa_vip_uid");
    const udid = localStorage.getItem("ursa_vip_udid") || "NO_CERT";

    const docRef = await addDoc(collection(db, "vip_orders"), {
      uid,
      udid,
      method: methodKey,
      status: "pending",
      createdAt: serverTimestamp()
    });

    const orderId = docRef.id;
    console.log("✅ VIP-заявка создана:", orderId);
    localStorage.setItem("ursa_vip_order_id", orderId);
    return orderId;
  } catch (err) {
    console.error("❌ Ошибка создания VIP-заявки:", err);
  }
}

// ------------------------------------------------
// 2) UI + Чат
// ------------------------------------------------
function initVIP() {
  const PAYMENT = {
    crypto: {
      name: "USDT TRC20 (Crypto World)",
      show: "Адрес кошелька:\nTJCQQHMhKExEuyMXA78mXBAbj1YkMNL3NS\nСеть: TRC20",
      copy: "TJCQQHMhKExEuyMXA78mXBAbj1YkMNL3NS",
    },
    binance_pay: {
      name: "Binance Pay ID",
      show: "ID получателя:\n583984119",
      copy: "583984119",
    },
    gift_card: {
      name: "Binance Gift Card",
      show: "Отправьте код подарочной карты в чат.",
      noCopy: true,
    },
    paypal: {
      name: "PayPal",
      show: "Адрес:\nswvts6@gmail.com",
      copy: "swvts6@gmail.com",
    },
    ua_card: {
      name: "UA Card (Приват24)",
      show: "Оплатить по ссылке:",
      link: "https://www.privat24.ua/send/373a0",
    },
    ru_card: {
      name: "RU Card (Т-банк / СПБ)",
      show:
        "Т-банк: 2200702048905611\nСПБ: 89933303390\nПолучатель: Онищенко Пётр А.\n⚠️ Комментарий: @viibbee_17",
      tBank: "2200702048905611",
      spb: "89933303390",
    },
  };

  const modal1 = document.getElementById("modal-step-1");
  const modal2 = document.getElementById("modal-step-2");
  const modalChat = document.getElementById("modal-chat");
  const chatArea = document.getElementById("chat-area");
  const msgTpl = document.getElementById("system-message-template");

  const open = (m) => { m.style.display = "flex"; document.body.style.overflow = "hidden"; };
  const close = () => {
    modal1.style.display = "none";
    modal2.style.display = "none";
    modalChat.style.display = "none";
    document.body.style.overflow = "";
  };

  // ---- Основная кнопка ----
  document.getElementById("vip-buy-btn")?.addEventListener("click", () => open(modal1));
  document.getElementById("btn-read")?.addEventListener("click", () => { modal1.style.display = "none"; open(modal2); });
  document.getElementById("btn-back-to-info")?.addEventListener("click", () => { modal2.style.display = "none"; open(modal1); });
  document.getElementById("btn-back-to-options")?.addEventListener("click", () => { modalChat.style.display = "none"; open(modal2); });

  // ---- Закрытия ----
  document.querySelectorAll("[data-close]").forEach(btn =>
    btn.addEventListener("click", close)
  );

  // ------------------------------------------------
  // CHAT
  // ------------------------------------------------
  let chatBound = false;

  function renderSystemMessage(methodKey) {
    const d = PAYMENT[methodKey];
    chatArea.innerHTML = "";
    const node = msgTpl.cloneNode(true);
    node.style.display = "block";

    node.querySelector(".chat-method-name").textContent = d.name;
    node.querySelector(".chat-details").textContent = d.show;

    chatArea.appendChild(node);
  }

  async function startChat(methodKey) {
    const orderId = await createVipOrder(methodKey);
    renderSystemMessage(methodKey);
    modal2.style.display = "none";
    open(modalChat);
    bindChat(orderId);
  }

  function bindChat(orderId) {
    if (chatBound) return;
    chatBound = true;

    const input = document.querySelector(".chat-input");
    const sendBtn = document.querySelector(".chat-send-btn");
    const attachBtn = document.querySelector(".chat-attach-btn");
    const hiddenFile = document.getElementById("chat-file");

    const messagesRef = collection(db, "vip_orders", orderId, "messages");
    const q = query(messagesRef, orderBy("timestamp"));

    onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        const m = change.doc.data();
        const wrap = document.createElement("div");
        wrap.className = (m.sender === "admin") ? "msg admin" : "msg user";
        wrap.textContent = m.text || "";
        chatArea.appendChild(wrap);
      });
      chatArea.scrollTop = chatArea.scrollHeight;
    });

    sendBtn.addEventListener("click", async () => {
      const t = input.value.trim();
      if (!t) return;
      await addDoc(messagesRef, { sender: "user", text: t, timestamp: serverTimestamp() });
      input.value = "";
    });

    attachBtn.addEventListener("click", () => hiddenFile.click());
    hiddenFile.addEventListener("change", async () => {
      const file = hiddenFile.files[0];
      if (!file) return;
      const path = `vip_chats/${orderId}/${Date.now()}_${file.name}`;
      const sref = ref(storage, path);
      await uploadBytes(sref, file);
      const url = await getDownloadURL(sref);

      await addDoc(messagesRef, {
        sender: "user",
        fileUrl: url,
        fileName: file.name,
        mime: file.type,
        timestamp: serverTimestamp()
      });
      hiddenFile.value = "";
    });
  }

  // ------------------------------------------------
  // ✅ Глобальные обработчики оплаты (работают всегда)
  // ------------------------------------------------
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".pay-chip");
    if (!chip) return;
    open(modal1);
  });

  document.querySelector("#modal-step-2 .payment-options")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".option-btn");
    if (!btn) return;
    startChat(btn.dataset.method);
  });

  document.querySelector("#payments")?.addEventListener("click", (e) => {
    const chip = e.target.closest(".pay-chip");
    if (!chip) return;
    startChat(chip.dataset.method);
  });
}
