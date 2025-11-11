document.addEventListener("DOMContentLoaded", () => {

  // --- 1. ДАННЫЕ ДЛЯ ОТОБРАЖЕНИЯ + ЧТО КОПИРУЕМ ---
  const PAYMENT_DETAILS = {
    crypto: {
      name: "USDT TRC20 (Crypto World)",
      show: "Адрес кошелька:\nTJCQQHMhKExEuyMXA78mXBAbj1YkMNL3NS\nСеть: TRC20",
      copy: "TJCQQHMhKExEuyMXA78mXBAbj1YkMNL3NS"
    },
    binance_pay: {
      name: "Binance Pay ID",
      show: "ID получателя:\n583984119",
      copy: "583984119"
    },
    gift_card: {
      name: "Binance Gift Card",
      show: "Отправьте код подарочной карты в чат.",
      noCopy: true
    },
    paypal: {
      name: "PayPal",
      show: "Адрес:\nsvwts6@gmail.com",
      copy: "svwts6@gmail.com"
    },
    ua_card: {
      name: "UA Card (Приват24)",
      show: "Оплата по ссылке:",
      link: "https://www.privat24.ua/send/373a0"
    },
    ru_card: {
      name: "RU Card (Т-банк / СПБ)",
      show:
`Т-банк: 2200702048905611
СПБ (Т-банк): 89933303390
Получатель: Онищенко Пётр А.
⚠️ Комментарий: @viibbee_17`,
      tBank: "2200702048905611",
      spb: "89933303390"
    }
  };

  // --- 2. DOM ЭЛЕМЕНТЫ ---
  const buyBtn = document.getElementById("vip-buy-btn");
  const modal1 = document.getElementById("modal-step-1");
  const modal2 = document.getElementById("modal-step-2");
  const modalChat = document.getElementById("modal-chat");
  const btnRead = document.getElementById("btn-read");
  const btnBackToInfo = document.getElementById("btn-back-to-info");
  const btnBackToOptions = document.getElementById("btn-back-to-options");
  const paymentOptions = document.querySelector("#modal-step-2 .payment-options");
  const chatArea = document.getElementById("chat-area");
  const template = document.getElementById("system-message-template");

  // --- 3. ФУНКЦИИ МОДАЛОК ---
  function open(m) { m.style.display = "flex"; document.body.style.overflow = "hidden"; }
  function close(m) { m.style.display = "none"; document.body.style.overflow = ""; }

  // --- 4. ВЫВОД РЕКВИЗИТОВ В ЧАТ ---
  function display(method) {
    const d = PAYMENT_DETAILS[method];
    chatArea.innerHTML = "";

    // карточка
    const box = template.cloneNode(true);
    box.style.display = "block";
    box.querySelector(".chat-method-name").textContent = d.name;
    box.querySelector(".chat-details").textContent = d.show;
    chatArea.appendChild(box);

    // --- КНОПКИ ДЕЙСТВИЙ ---
    // Gift Card → без кнопок
    if (d.noCopy) {
      chatArea.scrollTop = chatArea.scrollHeight;
      return;
    }

    // UA Card → кнопка открыть ссылку
    if (d.link) {
      let btn = document.createElement("button");
      btn.className = "modal-btn";
      btn.textContent = "Оплатить";
      btn.onclick = () => window.open(d.link, "_blank");
      chatArea.appendChild(btn);
      chatArea.scrollTop = chatArea.scrollHeight;
      return;
    }

    // RU CARD → две отдельные кнопки
    if (method === "ru_card") {
      let btn1 = document.createElement("button");
      btn1.className = "modal-btn";
      btn1.textContent = "Скопировать Т-банк";
      btn1.onclick = () => {
        navigator.clipboard.writeText(d.tBank);
        btn1.textContent = "✅ Скопировано";
        setTimeout(() => btn1.textContent = "Скопировать Т-банк", 1500);
      };
      chatArea.appendChild(btn1);

      let btn2 = document.createElement("button");
      btn2.className = "modal-btn";
      btn2.textContent = "Скопировать СПБ";
      btn2.onclick = () => {
        navigator.clipboard.writeText(d.spb);
        btn2.textContent = "✅ Скопировано";
        setTimeout(() => btn2.textContent = "Скопировать СПБ", 1500);
      };
      chatArea.appendChild(btn2);

      chatArea.scrollTop = chatArea.scrollHeight;
      return;
    }

    // Остальные методы → одна кнопка копирования
    let btn = document.createElement("button");
    btn.className = "modal-btn";
    btn.textContent = "Скопировать реквизиты";
    btn.onclick = () => {
      navigator.clipboard.writeText(d.copy);
      btn.textContent = "✅ Скопировано";
      setTimeout(() => btn.textContent = "Скопировать реквизиты", 1500);
    };
    chatArea.appendChild(btn);

    chatArea.scrollTop = chatArea.scrollHeight;
  }

  // --- 5. СЛУШАТЕЛИ ---
  buyBtn.onclick = (e) => { e.preventDefault(); open(modal1); };
  btnRead.onclick = () => { close(modal1); open(modal2); };
  btnBackToInfo.onclick = () => { close(modal2); open(modal1); };
  btnBackToOptions.onclick = () => { close(modalChat); open(modal2); };

  paymentOptions.onclick = (e) => {
    const btn = e.target.closest(".option-btn");
    if (!btn) return;
    e.preventDefault();
    display(btn.dataset.method);
    close(modal2);
    open(modalChat);
  };

  window.onclick = (e) => {
    if (e.target === modal1) close(modal1);
    if (e.target === modal2) close(modal2);
    if (e.target === modalChat) close(modalChat);
  };

});
