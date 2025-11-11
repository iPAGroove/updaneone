// ===============================
// VIP — логика входа, проверка сертификата, шаги, чат и создание заявки
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
// 0) Ждём восстановление сессии и сертификата
// ------------------------------------------------
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("⚠️ Чтобы оформить VIP, сначала войдите в аккаунт.");
    window.location.href = "./";
    return;
  }

  const udid = localStorage.getItem("ursa_cert_udid");
  const exp = localStorage.getItem("ursa_cert_exp");

  if (!udid || !exp) {
    alert("⚠️ Добавьте сертификат в меню.");
    window.location.href = "./#menu";
    return;
  }

  localStorage.setItem("ursa_vip_uid", user.uid);
  localStorage.setItem("ursa_vip_udid", udid);

  initVIP();
});

// ------------------------------------------------
// 1) Создаём VIP-заявку
// ------------------------------------------------
async function createVipOrder(methodKey) {
  const uid = localStorage.getItem("ursa_vip_uid");
  const udid = localStorage.getItem("ursa_vip_udid");

  const docRef = await addDoc(collection(db, "vip_orders"), {
    uid,
    udid,
    method: methodKey,
    status: "pending",
    createdAt: serverTimestamp()
  });

  localStorage.setItem("ursa_vip_order_id", docRef.id);
  return docRef.id;
}

// ------------------------------------------------
// 2) UI + CHAT
// ------------------------------------------------
function initVIP() {
  const PAYMENT = {
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

  const buyBtn = document.getElementById("vip-buy-btn");
  const modal1 = document.getElementById("modal-step-1");
  const modal2 = document.getElementById("modal-step-2");
  const modalChat = document.getElementById("modal-chat");

  const open = (m) => { m.style.display = "flex"; document.body.style.overflow = "hidden"; };
  const close = (m) => { m.style.display = "none"; document.body.style.overflow = ""; };

  buyBtn?.addEventListener("click", () => open(modal1));
  document.getElementById("btn-read")?.addEventListener("click", () => { close(modal1); open(modal2); });
  document.getElementById("btn-back-to-info")?.addEventListener("click", () => { close(modal2); open(modal1); });
  document.getElementById("btn-back-to-options")?.addEventListener("click", () => { close(modalChat); open(modal2); });

  // ------------------------------------------------
  // ЕДИНЫЙ ЛОВЕЦ 🍪 (решает проблему кликов)
  // ------------------------------------------------
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".pay-chip, .option-btn");
    if (!btn) return;

    const method = btn.dataset.method;
    if (!method) return;

    await createVipOrder(method);
    renderSystemMessage(method);
    close(modal1); close(modal2);
    open(modalChat);
    bindChat();
  });

  const chatArea = document.getElementById("chat-area");
  const msgTpl = document.getElementById("system-message-template");

  function renderSystemMessage(methodKey) {
    chatArea.innerHTML = "";
    const d = PAYMENT[methodKey];
    const node = msgTpl.cloneNode(true);
    node.style.display = "block";
    node.querySelector(".chat-method-name").textContent = d.name;
    node.querySelector(".chat-details").textContent = d.show;

    const uid = localStorage.getItem("ursa_vip_uid");
    const udid = localStorage.getItem("ursa_vip_udid");

    const idBlock = document.createElement("div");
    idBlock.style.marginTop = "14px";
    idBlock.style.fontSize = "13px";
    idBlock.style.opacity = "0.82";
    idBlock.innerHTML = `👤 <b>${uid}</b><br>🔗 UDID: <b>${udid}</b>`;
    node.appendChild(idBlock);

    chatArea.appendChild(node);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  // ------------------------------------------------
  // CHAT
  // ------------------------------------------------
  let chatBound = false;

  function bindChat() {
    if (chatBound) return;
    chatBound = true;

    const orderId = localStorage.getItem("ursa_vip_order_id");
    const q = query(collection(db, "vip_orders", orderId, "messages"), orderBy("timestamp"));

    onSnapshot(q, (snap) => {
      const system = chatArea.querySelector(".system-message")?.cloneNode(true);
      chatArea.innerHTML = "";
      if (system) chatArea.appendChild(system);

      snap.forEach((doc) => {
        const m = doc.data();
        const el = document.createElement("div");
        el.className = (m.sender === "admin") ? "msg admin" : "msg user";
        if (m.text) el.textContent = m.text;

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

    const input = document.querySelector(".chat-input");
    const sendBtn = document.querySelector(".chat-send-btn");
    const attachBtn = document.querySelector(".chat-attach-btn");

    sendBtn.addEventListener("click", sendText);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); sendText(); } });

    async function sendText() {
      const txt = input.value.trim();
      if (!txt) return;
      const orderId = localStorage.getItem("ursa_vip_order_id");
      await addDoc(collection(db, "vip_orders", orderId, "messages"), {
        sender: "user",
        text: txt,
        timestamp: serverTimestamp(),
      });
      input.value = "";
    }

    const hiddenFile = Object.assign(document.createElement("input"), { type: "file", style: "display:none" });
    document.body.appendChild(hiddenFile);

    attachBtn.addEventListener("click", () => hiddenFile.click());
    hiddenFile.addEventListener("change", async () => {
      const file = hiddenFile.files[0];
      if (!file) return;

      const orderId = localStorage.getItem("ursa_vip_order_id");
      const refPath = ref(storage, `vip_chats/${orderId}/${Date.now()}_${file.name}`);
      await uploadBytes(refPath, file);
      const url = await getDownloadURL(refPath);

      await addDoc(collection(db, "vip_orders", orderId, "messages"), {
        sender: "user",
        fileUrl: url,
        fileName: file.name,
        mime: file.type,
        timestamp: serverTimestamp(),
      });
    });
  }

  // ------------------------------------------------
  // FIX клавиатуры
  // ------------------------------------------------
  const chatModal = modalChat;
  let baseHeight = window.innerHeight;
  window.addEventListener("resize", () => {
    chatModal.style.height = (window.innerHeight < baseHeight - 100) ? window.innerHeight + "px" : "";
  });
}
