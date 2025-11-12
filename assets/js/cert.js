// assets/js/cert.js
// ===============================
// URSA SIGNER — покупка сертификата
// Шаги: выбор сертификата → получение UDID → способ оплаты → чат сертификата
// ===============================

import { auth, db } from "./app.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  doc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const storage = getStorage();

// ------------------------------------------------
// 🔑 Авторизация
// ------------------------------------------------
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
  const modal1 = document.getElementById("modal-step-1");
  const modal2 = document.getElementById("modal-step-2");
  const modalChat = document.getElementById("modal-chat");
  const btnNext = document.getElementById("btn-next-step-2");
  const btnBack1 = document.getElementById("btn-back-step-1");
  const btnCloseAll = document.querySelectorAll("[data-close]");
  const btnBackToOptions = document.getElementById("btn-back-to-options");

  const open = (m) => { m.style.display = "flex"; document.body.style.overflow = "hidden"; };
  const close = (m) => { m.style.display = "none"; document.body.style.overflow = ""; };

  btnCloseAll.forEach(btn => btn.addEventListener("click", () => {
    close(modal1); close(modal2); close(modalChat);
  }));

  buyButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const plan = btn.dataset.plan;
      localStorage.setItem("ursa_cert_plan", plan);
      open(modal1);
    });
  });

  btnNext?.addEventListener("click", () => { close(modal1); open(modal2); });
  btnBack1?.addEventListener("click", () => { close(modal2); open(modal1); });
  btnBackToOptions?.addEventListener("click", () => { close(modalChat); open(modal2); chatBound = false; });

  // ------------------------------------------------
  // 💸 Методы оплаты
  // ------------------------------------------------
  const methods = document.querySelectorAll(".option-btn");
  const PAYMENT = {
    crypto: { name: "USDT (TRC20)", show: "Адрес:\nTJCQQHMhKExEuyMXA78mXBAbj1YkMNL3NS\nСеть: TRC20", copy: "TJCQQHMhKExEuyMXA78mXBAbj1YkMNL3NS" },
    binance_pay: { name: "Binance Pay ID", show: "ID: 583984119", copy: "583984119" },
    gift_card: { name: "Binance Gift Card", show: "Отправьте код подарочной карты в чат.", noCopy: true },
    paypal: { name: "PayPal", show: "Email: swvts6@gmail.com", copy: "swvts6@gmail.com" },
    ua_card: { name: "UA Card (Privat / Monobank)", show: "Ссылка: https://www.privat24.ua/send/373a0", copy: "https://www.privat24.ua/send/373a0" },
    ru_card: { name: "RU Card (Т-Банк / СПБ)", show: "Т-Банк: 2200702048905611\nСПБ: 89933303390\nКомментарий: @viibbee_17", copy: "2200702048905611" }
  };

  methods.forEach(btn => {
    btn.addEventListener("click", async () => {
      const method = btn.dataset.method;
      localStorage.setItem("ursa_cert_method", method);

      try {
        const orderId = await createCertOrder(method);
        if (!orderId) throw new Error("orderId missing");

        localStorage.setItem("ursa_cert_order_id", orderId);
        setTimeout(() => {
          renderSystemMessage(method);
          close(modal1); close(modal2);
          open(modalChat);
          bindChat();
        }, 300);
      } catch (e) {
        console.error("❌ Ошибка создания заявки:", e);
        alert("Не удалось создать заявку. Попробуйте снова.");
      }
    });
  });

  // ------------------------------------------------
  // 🧾 Создание заявки
  // ------------------------------------------------
  async function createCertOrder(method) {
    while (!auth.currentUser) await new Promise(r => setTimeout(r, 100));
    const uid = auth.currentUser.uid;
    const plan = localStorage.getItem("ursa_cert_plan");

    const docRef = await addDoc(collection(db, "cert_orders"), {
      uid: String(uid),
      plan: plan || "standard",
      method,
      status: "pending",
      createdAt: serverTimestamp()
    });

    console.log("✅ cert_order создан:", docRef.id);
    return docRef.id;
  }

  // ------------------------------------------------
  // 💬 Системное сообщение (реквизиты)
  // ------------------------------------------------
  const chatArea = document.getElementById("chat-area");
  const msgTpl = document.getElementById("system-message-template");

  function renderSystemMessage(methodKey) {
    chatArea.innerHTML = "";
    const data = PAYMENT[methodKey];
    if (!data) return;

    const node = msgTpl.cloneNode(true);
    node.style.display = "block";
    node.classList.add("system-message");
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
  }

  // ------------------------------------------------
  // 📡 Чат сертификата
  // ------------------------------------------------
  let chatBound = false;

  function bindChat() {
    if (chatBound) return;
    chatBound = true;

    const orderId = localStorage.getItem("ursa_cert_order_id");
    if (!orderId) {
      alert("⚠️ Чат не инициализирован. Повторите выбор способа оплаты.");
      return;
    }

    if (!auth.currentUser) {
      alert("⚠️ Авторизуйтесь, чтобы использовать чат сертификата.");
      return;
    }

    const q = query(collection(db, "cert_orders", orderId, "messages"), orderBy("timestamp"));

    try {
      onSnapshot(q, (snap) => {
        // ⚡ если уже есть системное сообщение — не очищаем реквизиты
        const hasSystemMessage = chatArea.querySelector(".system-message");
        if (!hasSystemMessage) chatArea.innerHTML = "";

        snap.forEach((doc) => {
          const m = doc.data();
          const el = document.createElement("div");
          el.className = m.sender === "admin" ? "msg admin" : "msg user";

          if (m.text) {
            const textNode = document.createElement("p");
            textNode.textContent = m.text;
            el.appendChild(textNode);
          }

          if (m.fileUrl) {
            if (m.mime?.startsWith("image/")) {
              const img = document.createElement("img");
              img.src = m.fileUrl;
              img.style.maxWidth = "220px";
              img.style.borderRadius = "10px";
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
    } catch (e) {
      console.error("❌ Ошибка snapshot:", e);
      alert("Нет доступа к чату. Повторите вход.");
    }

    // ------------------------------------------------
    // ✉️ Отправка текста
    // ------------------------------------------------
    const input = document.querySelector(".chat-input");
    const sendBtn = document.querySelector(".chat-send-btn");
    const attachBtn = document.querySelector(".chat-attach-btn");

    sendBtn.addEventListener("click", sendText);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); sendText(); }
    });

    async function sendText() {
      const txt = input.value.trim();
      if (!txt) return;
      try {
        await addDoc(collection(db, "cert_orders", orderId, "messages"), {
          sender: auth.currentUser.uid,
          text: txt,
          timestamp: serverTimestamp()
        });
        input.value = "";
      } catch (e) {
        console.error("Ошибка отправки:", e);
        alert("Не удалось отправить сообщение.");
      }
    }

    // ------------------------------------------------
    // 📎 Отправка файла
    // ------------------------------------------------
    const hiddenFile = Object.assign(document.createElement("input"), { type: "file", style: "display:none" });
    document.body.appendChild(hiddenFile);

    attachBtn.addEventListener("click", () => hiddenFile.click());
    hiddenFile.addEventListener("change", async () => {
      const file = hiddenFile.files[0];
      if (!file) return;
      try {
        const refPath = ref(storage, `cert_chats/${orderId}/${Date.now()}_${file.name}`);
        await uploadBytes(refPath, file);
        const url = await getDownloadURL(refPath);

        await addDoc(collection(db, "cert_orders", orderId, "messages"), {
          sender: auth.currentUser.uid,
          fileUrl: url,
          fileName: file.name,
          mime: file.type,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.error("Ошибка отправки файла:", e);
        alert("Не удалось загрузить файл.");
      }
    });
  }
}
