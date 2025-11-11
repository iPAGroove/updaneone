// assets/js/vip.js — идеальная финальная версия

document.addEventListener("DOMContentLoaded", () => {

  // --- 1. РЕКВИЗИТЫ И ТО, ЧТО КОПИРУЕМ ---
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
      show: "Оплатить по ссылке:",
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

  // --- 2. DOM ---
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

  // --- 3. Модалки ---
  function open(m) { m.style.display = "flex"; document.body.style.overflow = "hidden"; }
  function close(m) { m.style.display = "none"; document.body.style.overflow = ""; }

  // --- 4. Вывод реквизитов (НЕ ЛОМАЕМ РАЗМЕТКУ!) ---
  function display(method) {
    const d = PAYMENT_DETAILS[method];
    chatArea.innerHTML = "";

    // ✅ сохраняем оригинальную разметку карточки
    const box = template.cloneNode(true);
    box.style.display = "block";
    box.querySelector(".chat-method-name").textContent = d.name;
    box.querySelector(".chat-details").textContent = d.show;
    chatArea.appendChild(box);

    // --- Кнопки действий ---
    // Binance Gift Card → вообще без кнопок
    if (d.noCopy) {
      chatArea.scrollTop = chatArea.scrollHeight;
      return;
    }

    // UA Card → кнопка "Оплатить"
    if (d.link) {
      const payBtn = document.createElement("button");
      payBtn.className = "modal-btn";
      payBtn.textContent = "Оплатить";
      payBtn.onclick = () => window.open(d.link, "_blank");
      chatArea.appendChild(payBtn);
      chatArea.scrollTop = chatArea.scrollHeight;
      return;
    }

    // RU Card → две отдельные кнопки
    if (method === "ru_card") {
      const btn1 = document.createElement("button");
      btn1.className = "modal-btn";
      btn1.textContent = "Скопировать Т-банк";
      btn1.onclick = () => {
        navigator.clipboard.writeText(d.tBank);
        btn1.textContent = "✅ Скопировано";
        setTimeout(() => btn1.textContent = "Скопировать Т-банк", 1500);
      };
      chatArea.appendChild(btn1);

      const btn2 = document.createElement("button");
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

    // Все остальные → одна кнопка "Скопировать реквизиты"
    const copyBtn = document.createElement("button");
    copyBtn.className = "modal-btn";
    copyBtn.textContent = "Скопировать реквизиты";
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(d.copy);
      copyBtn.textContent = "✅ Скопировано";
      setTimeout(() => copyBtn.textContent = "Скопировать реквизиты", 1500);
    };
    chatArea.appendChild(copyBtn);

    chatArea.scrollTop = chatArea.scrollHeight;
  }

  // --- 5. События ---
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
