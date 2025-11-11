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
// 0) Ждём восстановления сессии
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
    alert("⚠️ Добавьте сертификат в меню, чтобы мы могли связать ваш UDID с VIP.");
    window.location.href = "./#menu";
    return;
  }

  // ✅ сохраняем
  localStorage.setItem("ursa_vip_uid", user.uid);
  localStorage.setItem("ursa_vip_udid", udid);

  initVIP();
});

// ------------------------------------------------
// 1) Создание VIP-заявки (возвращает ID)
// ------------------------------------------------
async function createVipOrder(methodKey) {
  try {
    const uid = localStorage.getItem("ursa_vip_uid");
    const udid = localStorage.getItem("ursa_vip_udid");

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
    throw err;
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

  const buyBtn = document.getElementById("vip-buy-btn");
  const modal1 = document.getElementById("modal-step-1");
  const modal2 = document.getElementById("modal-step-2");
  const modalChat = document.getElementById("modal-chat");
  const btnRead = document.getElementById("btn-read");
  const btnBackToInfo = document.getElementById("btn-back-to-info");
  const btnBackToOptions = document.getElementById("btn-back-to-options");
  const payOptions = document.querySelector("#modal-step-2 .payment-options");
  const chatArea = document.getElementById("chat-area");
  const msgTpl = document.getElementById("system-message-template");

  const open = (m) => { m.style.display = "flex"; document.body.style.overflow = "hidden"; };
  const close = (m) => { m.style.display = "none"; document.body.style.overflow = ""; };

  function renderSystemMessage(methodKey) {
    const d = PAYMENT[methodKey];
    if (!d) return;

    chatArea.innerHTML = "";
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

  // ---- Шаги ----
  buyBtn?.addEventListener("click", () => open(modal1));
  btnRead?.addEventListener("click", () => { close(modal1); open(modal2); });
  btnBackToInfo?.addEventListener("click", () => { close(modal2); open(modal1); });
  btnBackToOptions?.addEventListener("click", () => { close(modalChat); open(modal2); });

  // ------------------------------------------------
  // ЧАТ: биндим realtime только после создания заявки
  // ------------------------------------------------
  let chatBound = false;
  let unsubs = null;

  const input = document.querySelector(".chat-input");
  const sendBtn = document.querySelector(".chat-send-btn");

  // создаём (если нет) кнопку-скрепку и скрытый input[type=file]
  // В HTML уже есть элементы с id="chat-attach" и id="chat-file", используем их
  // или оставляем твой код, чтобы гарантировать наличие элементов:
  let attachBtn = document.querySelector(".chat-attach-btn");
  if (!attachBtn) {
    // В оригинальном HTML есть <button id="chat-attach" class="chat-attach">📎</button>
    // и <input type="file" id="chat-file" hidden .../>
    // Для совместимости используем то, что есть в DOM:
    attachBtn = document.getElementById("chat-attach");
    if (attachBtn) {
        attachBtn.className = "chat-attach-btn"; // Добавляем класс, который стилизован
    }
  }
  const hiddenFile = document.getElementById("chat-file");

  if (!attachBtn || !hiddenFile) {
    console.warn("⚠️ Элементы чата (скрепка/input) не найдены. Создание элементов...");
    // Твой код для создания элементов, если их нет в DOM (хотя они есть в HTML)
    // Это может быть причиной, по которой ты их создаёшь
    if (!attachBtn) {
      attachBtn = document.createElement("button");
      attachBtn.type = "button";
      attachBtn.className = "chat-attach-btn";
      attachBtn.textContent = "📎";
      const container = document.querySelector(".chat-input-container");
      container?.insertBefore(attachBtn, input);
    }
    if (!hiddenFile) {
        hiddenFile = document.createElement("input");
        hiddenFile.type = "file";
        hiddenFile.accept = "image/*,application/pdf,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        hiddenFile.style.display = "none";
        document.body.appendChild(hiddenFile);
    }
  }
  
  // Добавляем правильный атрибут типа, если его нет
  if (attachBtn) { attachBtn.type = "button"; }


  function bindChatIfNeeded() {
    if (chatBound) return;
    const orderId = localStorage.getItem("ursa_vip_order_id");
    if (!orderId) return;

    const messagesRef = collection(db, "vip_orders", orderId, "messages");
    const q = query(messagesRef, orderBy("timestamp"));

    unsubs = onSnapshot(q, (snap) => {
      // если на экране системное сообщение — не стираем его, а добавляем ниже
      // но для простоты — перерисуем весь чат: системку покажем отдельно
      // рендерим поток сообщений
      const existingSystem = chatArea.querySelector(".system-message")?.cloneNode(true);
      chatArea.innerHTML = "";
      if (existingSystem) {
        existingSystem.style.display = "block";
        chatArea.appendChild(existingSystem);
      }

      snap.forEach((doc) => {
        const m = doc.data();

        const wrap = document.createElement("div");
        wrap.className = (m.sender === "admin") ? "msg admin" : "msg user";

        if (m.text) {
          const t = document.createElement("div");
          t.textContent = m.text;
          wrap.appendChild(t);
        }

        if (m.fileUrl) {
          // если картинка — превью, иначе — ссылка
          if (m.mime?.startsWith("image/")) {
            const img = document.createElement("img");
            img.src = m.fileUrl;
            img.alt = m.fileName || "image";
            img.style.maxWidth = "220px";
            img.style.borderRadius = "10px";
            img.style.display = "block";
            img.style.marginTop = "6px";
            wrap.appendChild(img);
          } else {
            const a = document.createElement("a");
            a.href = m.fileUrl;
            a.target = "_blank";
            a.rel = "noopener";
            a.textContent = m.fileName || "Файл";
            a.style.display = "inline-block";
            a.style.marginTop = "6px";
            a.style.color = "#9fdfff";
            wrap.appendChild(a);
          }
        }

        chatArea.appendChild(wrap);
      });

      chatArea.scrollTop = chatArea.scrollHeight;
    });

    // включаем инпуты
    sendBtn?.removeAttribute("disabled");
    input?.removeAttribute("disabled");
    attachBtn?.removeAttribute("disabled");

    // отправка текста
    const sendText = async () => {
      const text = input.value.trim();
      if (!text) return;
      await addDoc(collection(db, "vip_orders", orderId, "messages"), {
        sender: "user",
        text,
        timestamp: serverTimestamp()
      });
      input.value = "";
    };
    sendBtn?.addEventListener("click", sendText);
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendText();
      }
    });

    // загрузка файла
    attachBtn?.addEventListener("click", () => hiddenFile.click());
    hiddenFile.addEventListener("change", async () => {
      const file = hiddenFile.files?.[0];
      if (!file) return;
      try {
        const path = `vip_chats/${orderId}/${Date.now()}_${file.name}`;
        const sref = ref(storage, path);
        await uploadBytes(sref, file);
        const url = await getDownloadURL(sref);

        await addDoc(collection(db, "vip_orders", orderId, "messages"), {
          sender: "user",
          fileUrl: url,
          fileName: file.name,
          mime: file.type || "application/octet-stream",
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.error("Ошибка загрузки файла:", e);
        alert("Не удалось загрузить файл.");
      } finally {
        hiddenFile.value = "";
      }
    });

    chatBound = true;
  }

  // --- ИСПРАВЛЕНИЕ: Прямая привязка к кнопкам оплаты в секции #payments ---
  document.querySelectorAll("#payments .pay-chip").forEach(chip => {
    chip.addEventListener("click", async () => {
      const method = chip.dataset.method;
      const orderId = await createVipOrder(method);
      renderSystemMessage(method);
      open(modalChat);
      bindChatIfNeeded(orderId);
    });
  });

  payOptions?.addEventListener("click", async (e) => {
    const btn = e.target.closest(".option-btn");
    if (!btn) return;
    const orderId = await createVipOrder(btn.dataset.method);
    renderSystemMessage(btn.dataset.method);
    close(modal2);
    open(modalChat);
    bindChatIfNeeded(orderId);
  });
  // -----------------------------------------------------------------------

  // ---- Закрытия ----
  window.addEventListener("click", (e) => {
    if (e.target === modal1) close(modal1);
    if (e.target === modal2) close(modal2);
    if (e.target === modalChat) close(modalChat);
  });

  document.querySelectorAll("[data-close]").forEach(btn =>
    btn.addEventListener("click", () => {
      close(modal1); close(modal2); close(modalChat);
    })
  );

  // ------------------------------------------------
  // FIX: iOS/Android клавиатура не ломает layout
  // ------------------------------------------------
  const chatModal = modalChat;
  let baseHeight = window.innerHeight;

  window.addEventListener("resize", () => {
    const h = window.innerHeight;
    const keyboard = h < baseHeight - 100;
    chatModal.style.height = keyboard ? h + "px" : "";
  });
}
