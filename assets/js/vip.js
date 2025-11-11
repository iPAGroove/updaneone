// assets/js/vip.js — надёжная логика шагов и чата, с защитой и делегированием

document.addEventListener("DOMContentLoaded", () => {
  // --- 1. РЕКВИЗИТЫ ---
  const PAYMENT_DETAILS = {
    crypto: {
      name: "USDT TRC20 (Crypto World)",
      details: "Адрес кошелька: TJCQQHMhKExEuyMXA78mXBAbj1YkMNL3NS\nСеть: TRC20"
    },
    binance_pay: {
      name: "Binance Pay ID",
      details: "ID получателя: 583984119"
    },
    gift_card: {
      name: "Binance Gift Card",
      details: "Отправьте код подарочной карты в чат."
    },
    paypal: {
      name: "PayPal",
      details: "Адрес: swvts6@gmail.com"
    },
    ua_card: {
      name: "UA Card (Приват24)",
      details: "Ссылка для оплаты: https://www.privat24.ua/send/373a0"
    },
    ru_card: {
      name: "RU Card (Т-банк/СПБ)",
      details:
        "Т-банк: 2200702048905611\nСПБ (Т-банк): 89933303390\nПолучатель: Онищенко Пётр А.\n\n⚠️ Комментарий оплаты: @viibbee_17"
    }
  };

  // Отдельно храним прямую ссылку для UA Card
  const UA_CARD_LINK = "https://www.privat24.ua/send/373a0";

  // --- 2. ЭЛЕМЕНТЫ DOM ---
  const buyBtn = document.getElementById("vip-buy-btn");
  const modalStep1 = document.getElementById("modal-step-1");
  const btnRead = document.getElementById("btn-read");
  const modalStep2 = document.getElementById("modal-step-2");
  const modalChat = document.getElementById("modal-chat");

  const btnBackToInfo = document.getElementById("btn-back-to-info");
  const btnBackToOptions = document.getElementById("btn-back-to-options");
  const paymentOptionsWrap = document.querySelector("#modal-step-2 .payment-options");
  const chatArea = document.getElementById("chat-area");

  // --- 3. БАЗОВЫЕ ФУНКЦИИ МОДАЛОК ---
  function openModal(modal) {
    if (!modal) return;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.style.display = "none";
    document.body.style.overflow = "";
  }

  // --- 4. БЕЗОПАСНЫЙ РЕНДЕР СООБЩЕНИЯ С РЕКВИЗИТАМИ ---
  function renderSystemMessage(methodKey) {
    const details = PAYMENT_DETAILS[methodKey];
    if (!details) return null;

    // Пытаемся использовать шаблон, если он есть
    const template = document.getElementById("system-message-template");
    let node;

    if (template) {
      node = template.cloneNode(true);
      node.style.display = "block";

      const nameEl = node.querySelector(".chat-method-name");
      const detEl = node.querySelector(".chat-details");

      // Если классы отсутствуют — создаём fallback
      if (!nameEl || !detEl) {
        node.innerHTML = ""; // чистим
        const name = document.createElement("div");
        name.className = "chat-method-name";
        name.textContent = details.name;

        const det = document.createElement("div");
        det.className = "chat-details";
        det.textContent = details.details;

        node.appendChild(name);
        node.appendChild(det);
      } else {
        nameEl.textContent = details.name;
        detEl.textContent = details.details;
      }
    } else {
      // Полный fallback без шаблона
      node = document.createElement("div");
      node.className = "system-message";
      const name = document.createElement("div");
      name.className = "chat-method-name";
      name.textContent = details.name;
      const det = document.createElement("div");
      det.className = "chat-details";
      det.textContent = details.details;
      node.appendChild(name);
      node.appendChild(det);
    }

    return node;
  }

  // --- 5. ОТОБРАЖЕНИЕ РЕКВИЗИТОВ + КНОПКА ДЕЙСТВИЯ ---
  function displayPaymentDetails(methodKey) {
    const details = PAYMENT_DETAILS[methodKey];
    if (!details || !chatArea) return;

    // Полное обновление чата
    chatArea.innerHTML = "";

    const messageNode = renderSystemMessage(methodKey);
    if (messageNode) chatArea.appendChild(messageNode);

    // Кнопка действия
    const actionBtn = document.createElement("button");
    actionBtn.className = methodKey === "ua_card" ? "modal-btn" : "copy-btn";
    actionBtn.style.marginTop = "14px";

    if (methodKey === "ua_card") {
      actionBtn.textContent = "Оплатить";
      actionBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(UA_CARD_LINK, "_blank", "noopener,noreferrer");
      });
    } else {
      actionBtn.textContent = "Скопировать реквизиты";
      actionBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(details.details);
          actionBtn.textContent = "✅ Скопировано";
          setTimeout(() => (actionBtn.textContent = "Скопировать реквизиты"), 1500);
        } catch {
          actionBtn.textContent = "⚠️ Не удалось скопировать";
          setTimeout(() => (actionBtn.textContent = "Скопировать реквизиты"), 1500);
        }
      });
    }

    chatArea.appendChild(actionBtn);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  // --- 6. ОБРАБОТЧИКИ ---
  if (buyBtn) {
    buyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(modalStep1);
    });
  }

  if (btnRead) {
    btnRead.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal(modalStep1);
      openModal(modalStep2);
    });
  }

  if (btnBackToInfo) {
    btnBackToInfo.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal(modalStep2);
      openModal(modalStep1);
    });
  }

  if (btnBackToOptions) {
    btnBackToOptions.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal(modalChat);
      openModal(modalStep2);
    });
  }

  // Делегирование для всех .option-btn (надёжнее, чем вешать на каждую ссылку)
  if (paymentOptionsWrap) {
    paymentOptionsWrap.addEventListener("click", (e) => {
      const anchor = e.target.closest(".option-btn");
      if (!anchor) return;

      e.preventDefault();
      e.stopPropagation();

      const method = anchor.dataset.method;
      // Порядок важен: сначала закрываем шаг 2, потом заполняем чат, затем открываем чат
      closeModal(modalStep2);
      displayPaymentDetails(method);
      openModal(modalChat);
    });
  }

  // Закрытие по клику на подложку
  window.addEventListener("click", (event) => {
    if (event.target === modalStep1) closeModal(modalStep1);
    if (event.target === modalStep2) closeModal(modalStep2);
    if (event.target === modalChat) closeModal(modalChat);
  });
});
