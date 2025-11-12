// ===============================
// URSA SIGNER — покупка сертификатов (4 шага + чат)
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
// 0) Проверка пользователя и UDID
// ------------------------------------------------
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("⚠️ Чтобы купить сертификат, войдите в аккаунт.");
    window.location.href = "./";
    return;
  }

  const udid = localStorage.getItem("ursa_cert_udid");
  if (!udid) {
    alert("⚠️ Добавьте сертификат в меню URSA IPA, чтобы получить UDID.");
    window.location.href = "./#menu";
    return;
  }

  localStorage.setItem("ursa_cert_uid", user.uid);
  initCertFlow();
});

// ------------------------------------------------
// 1) Логика шагов
// ------------------------------------------------
function initCertFlow() {
  const modal1 = document.getElementById("modal-step-1");
  const modal2 = document.getElementById("modal-step-2");
  const modalChat = document.getElementById("modal-chat");

  const open = (m) => { m.style.display = "flex"; document.body.style.overflow = "hidden"; };
  const close = (m) => { m.style.display = "none"; document.body.style.overflow = ""; };

  // Открытие по кнопке “Оформить”
  document.querySelectorAll(".plan-card .buy").forEach(btn => {
    btn.addEventListener("click", () => {
      const plan = btn.dataset.plan;
      localStorage.setItem("ursa_cert_plan", plan);
      open(modal1);
    });
  });

  // Кнопки переходов
  document.getElementById("btn-next-step-2")?.addEventListener("click", () => { close(modal1); open(modal2); });
  document.getElementById("btn-back-step-1")?.addEventListener("click", () => { close(modal2); open(modal1); });

  // Универсальные крестики ✕
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      const parentModal = btn.closest(".payment-modal");
      if (parentModal) close(parentModal);
    });
  });

  // Назад из чата
  document.getElementById("btn-back-to-options")?.addEventListener("click", () => { close(modalChat); open(modal2); });

  // ------------------------------------------------
  // Методы оплаты → создаём заказ
  // ------------------------------------------------
  document.querySelectorAll(".option-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const method = btn.dataset.method;
      const plan = localStorage.getItem("ursa_cert_plan");
      const uid = localStorage.getItem("ursa_cert_uid");
      const udid = localStorage.getItem("ursa_cert_udid");

      const orderRef = await addDoc(collection(db, "ursa_cert_orders"), {
        uid,
        udid,
        plan,
        method,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      localStorage.setItem("ursa_cert_order_id", orderRef.id);

      renderSystemMessage(method);
      close(modal1); close(modal2);
      open(modalChat);
      bindChat();
    });
  });

  // ------------------------------------------------
  // Данные об оплате
  // ------------------------------------------------
  const PAYMENT = {
    crypto: {
      name: "USDT (TRC20)",
      show: "Адрес:\nTJCQQHMhKExEuyMXA78mXBAbj1YkMNL3NS\nСеть: TRC20",
      copy: "TJCQQHMhKExEuyMXA78mXBAbj1YkMNL3NS",
    },
    binance_pay: {
      name: "Binance Pay",
      show: "ID:\n583984119",
      copy: "583984119",
    },
    ua_card: {
      name: "Карта (UA)",
      show: "https://www.privat24.ua/send/373a0",
      copy: "https://www.privat24.ua/send/373a0",
    },
    ru_card: {
      name: "Карта (RU)",
      show: "Т-банк: 2200702048905611\nСПБ: 89933303390\nКомментарий: @viibbee_17",
      copy: "2200702048905611",
    },
  };

  const chatArea = document.getElementById("chat-area");
  const msgTpl = document.getElementById("system-message-template");

  // ------------------------------------------------
  // Стартовое сообщение в чате
  // ------------------------------------------------
  function renderSystemMessage(methodKey) {
    chatArea.innerHTML = "";
    const d = PAYMENT[methodKey];
    const node = msgTpl.cloneNode(true);
    node.style.display = "block";

    node.querySelector(".chat-method-name").textContent = d.name;

    const details = document.createElement("div");
    details.className = "chat-details";
    details.textContent = d.show;

    if (d.copy) {
      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-btn";
      copyBtn.textContent = "📋 Скопировать";
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(d.copy);
          copyBtn.textContent = "✅ Скопировано";
          setTimeout(() => (copyBtn.textContent = "📋 Скопировать"), 2000);
        } catch {
          copyBtn.textContent = "❌ Ошибка";
          setTimeout(() => (copyBtn.textContent = "📋 Скопировать"), 2000);
        }
      });
      details.appendChild(copyBtn);
    }

    node.appendChild(details);

    const uid = localStorage.getItem("ursa_cert_uid");
    const udid = localStorage.getItem("ursa_cert_udid");
    const plan = localStorage.getItem("ursa_cert_plan");

    const idBlock = document.createElement("div");
    idBlock.style.marginTop = "14px";
    idBlock.style.fontSize = "13px";
    idBlock.style.opacity = "0.82";
    idBlock.innerHTML = `🧾 План: <b>${plan}</b><br>👤 UID: <b>${uid}</b><br>🔗 UDID: <b>${udid}</b>`;
    node.appendChild(idBlock);

    chatArea.appendChild(node);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  // ------------------------------------------------
  // ЧАТ Firestore
  // ------------------------------------------------
  let chatBound = false;
  function bindChat() {
    if (chatBound) return;
    chatBound = true;

    const orderId = localStorage.getItem("ursa_cert_order_id");
    const q = query(collection(db, "ursa_cert_orders", orderId, "messages"), orderBy("timestamp"));

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
      const orderId = localStorage.getItem("ursa_cert_order_id");
      await addDoc(collection(db, "ursa_cert_orders", orderId, "messages"), {
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

      const orderId = localStorage.getItem("ursa_cert_order_id");
      const refPath = ref(storage, `cert_chats/${orderId}/${Date.now()}_${file.name}`);
      await uploadBytes(refPath, file);
      const url = await getDownloadURL(refPath);

      await addDoc(collection(db, "ursa_cert_orders", orderId, "messages"), {
        sender: "user",
        fileUrl: url,
        fileName: file.name,
        mime: file.type,
        timestamp: serverTimestamp(),
      });
    });
  }

  // ------------------------------------------------
  // FIX клавиатуры на iOS
  // ------------------------------------------------
  const chatModal = modalChat;
  let baseHeight = window.innerHeight;
  window.addEventListener("resize", () => {
    chatModal.style.height = (window.innerHeight < baseHeight - 100) ? window.innerHeight + "px" : "";
  });
}
