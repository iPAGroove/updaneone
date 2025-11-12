// ===============================
// URSA SIGNER — покупка сертификата
// Шаги: выбор сертификата → получение UDID → способ оплаты → чат поддержки
// ===============================

import { auth, db } from "./app.js";
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
// ⚡ Авторизация (если не вошёл — редирект)
// ------------------------------------------------
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("⚠️ Чтобы оформить сертификат, войдите в аккаунт через меню URSA IPA.");
    window.location.href = "./";
    return;
  }
  localStorage.setItem("ursa_signer_uid", user.uid);
  initCertFlow();
});

// ------------------------------------------------
// 💰 Основная логика
// ------------------------------------------------
function initCertFlow() {
  const buyButtons = document.querySelectorAll(".plan-card .buy");
  const modal1 = document.getElementById("modal-step-1"); // Получение UDID
  const modal2 = document.getElementById("modal-step-2"); // Оплата
  const modalChat = document.getElementById("modal-chat"); // Чат
  const btnNext = document.getElementById("btn-next-step-2");
  const btnBack1 = document.getElementById("btn-back-step-1");
  const btnCloseAll = document.querySelectorAll("[data-close]");
  const btnBackToOptions = document.getElementById("btn-back-to-options");

  const open = (m) => { m.style.display = "flex"; document.body.style.overflow = "hidden"; };
  const close = (m) => { m.style.display = "none"; document.body.style.overflow = ""; };

  // Закрытие всех окон
  btnCloseAll.forEach(btn => btn.addEventListener("click", () => {
    close(modal1); close(modal2); close(modalChat);
  }));

  // Открыть первое окно (получение UDID)
  buyButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const plan = btn.dataset.plan;
      localStorage.setItem("ursa_cert_plan", plan);
      open(modal1);
    });
  });

  // Переход: "У меня уже есть UDID"
  btnNext?.addEventListener("click", () => {
    close(modal1);
    open(modal2);
  });

  // Назад из оплаты к UDID
  btnBack1?.addEventListener("click", () => {
    close(modal2);
    open(modal1);
  });

  // Назад из чата к оплате
  btnBackToOptions?.addEventListener("click", () => {
    close(modalChat);
    open(modal2);
  });

  // ------------------------------------------------
  // 💸 Методы оплаты
  // ------------------------------------------------
  const methods = document.querySelectorAll(".option-btn");

  const PAYMENT = {
    crypto: {
      name: "USDT (TRC20)",
      show: "Адрес:\nTJCQQHMhKExEuyMXA78mXBAbj1YkMNL3NS\nСеть: TRC20",
      copy: "TJCQQHMhKExEuyMXA78mXBAbj1YkMNL3NS"
    },
    binance_pay: {
      name: "Binance Pay ID",
      show: "ID: 583984119",
      copy: "583984119"
    },
    gift_card: {
      name: "Binance Gift Card",
      show: "Отправьте код подарочной карты в чат.",
      noCopy: true
    },
    paypal: {
      name: "PayPal",
      show: "Email: swvts6@gmail.com",
      copy: "swvts6@gmail.com"
    },
    ua_card: {
      name: "UA Card (Privat / Monobank)",
      show: "Ссылка на оплату: https://www.privat24.ua/send/373a0",
      copy: "https://www.privat24.ua/send/373a0"
    },
    ru_card: {
      name: "RU Card (Т-Банк / СПБ)",
      show: "Т-Банк: 2200702048905611\nСПБ: 89933303390\nКомментарий: @viibbee_17",
      copy: "2200702048905611"
    }
  };

  methods.forEach(btn => {
    btn.addEventListener("click", async () => {
      const method = btn.dataset.method;
      localStorage.setItem("ursa_cert_method", method);

      const orderId = await createCertOrder(method);
      localStorage.setItem("ursa_cert_order_id", orderId);

      renderSystemMessage(method);
      close(modal1); close(modal2);
      open(modalChat);
      bindChat();
    });
  });

  // ------------------------------------------------
  // 🧾 Создание заявки
  // ------------------------------------------------
  async function createCertOrder(method) {
    const uid = localStorage.getItem("ursa_signer_uid");
    const plan = localStorage.getItem("ursa_cert_plan");

    const docRef = await addDoc(collection(db, "cert_orders"), {
      uid,
      plan,
      method,
      status: "pending",
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }

  // ------------------------------------------------
  // 💬 Отображение реквизитов в чате
  // ------------------------------------------------
  const chatArea = document.getElementById("chat-area");
  const msgTpl = document.getElementById("system-message-template");

  function renderSystemMessage(methodKey) {
    chatArea.innerHTML = "";
    const data = PAYMENT[methodKey];
    const node = msgTpl.cloneNode(true);
    node.style.display = "block";
    node.querySelector(".chat-method-name").textContent = data.name;

    const details = document.createElement("div");
    details.className = "chat-details";
    details.textContent = data.show;

    if (data.copy && !data.noCopy) {
      const copyBtn = document.createElement("button");
      copyBtn.textContent = "📋 Скопировать";
      copyBtn.className = "copy-btn";
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(data.copy);
          copyBtn.textContent = "✅ Скопировано";
          setTimeout(() => (copyBtn.textContent = "📋 Скопировать"), 2000);
        } catch {
          copyBtn.textContent = "❌ Ошибка";
        }
      });
      details.appendChild(copyBtn);
    }

    node.appendChild(details);
    chatArea.appendChild(node);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  // ------------------------------------------------
  // 📡 Чат
  // ------------------------------------------------
  let chatBound = false;
  function bindChat() {
    if (chatBound) return;
    chatBound = true;

    const orderId = localStorage.getItem("ursa_cert_order_id");
    const q = query(collection(db, "cert_orders", orderId, "messages"), orderBy("timestamp"));

    onSnapshot(q, (snap) => {
      const systemMsg = chatArea.querySelector(".system-message")?.cloneNode(true);
      chatArea.innerHTML = "";
      if (systemMsg) chatArea.appendChild(systemMsg);

      snap.forEach((doc) => {
        const m = doc.data();
        const el = document.createElement("div");
        el.className = m.sender === "admin" ? "msg admin" : "msg user";
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
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendText();
      }
    });

    async function sendText() {
      const txt = input.value.trim();
      if (!txt) return;
      const orderId = localStorage.getItem("ursa_cert_order_id");
      await addDoc(collection(db, "cert_orders", orderId, "messages"), {
        sender: "user",
        text: txt,
        timestamp: serverTimestamp()
      });
      input.value = "";
    }

    const hiddenFile = Object.assign(document.createElement("input"), {
      type: "file",
      style: "display:none"
    });
    document.body.appendChild(hiddenFile);

    attachBtn.addEventListener("click", () => hiddenFile.click());
    hiddenFile.addEventListener("change", async () => {
      const file = hiddenFile.files[0];
      if (!file) return;
      const orderId = localStorage.getItem("ursa_cert_order_id");
      const refPath = ref(storage, `cert_chats/${orderId}/${Date.now()}_${file.name}`);
      await uploadBytes(refPath, file);
      const url = await getDownloadURL(refPath);
      await addDoc(collection(db, "cert_orders", orderId, "messages"), {
        sender: "user",
        fileUrl: url,
        fileName: file.name,
        mime: file.type,
        timestamp: serverTimestamp()
      });
    });
  }
}
