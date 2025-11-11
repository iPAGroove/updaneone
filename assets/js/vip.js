// Готовая логика шагов + чат поддержки с аккуратным рендером и точным копированием

document.addEventListener("DOMContentLoaded", () => {
  // 1) Данные (что показываем и что копируем)
  const PAYMENT = {
    crypto: {
      name: "USDT TRC20 (Crypto World)",
      show:
        "Адрес кошелька:\nTJCQQHMhKExEuyMXA78mXBAbj1YkMNL3NS\nСеть: TRC20",
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
        "Т-банк: 2200702048905611\nСПБ (Т-банк): 89933303390\nПолучатель: Онищенко Пётр А.\n⚠️ Комментарий: @viibbee_17",
      tBank: "2200702048905611",
      spb: "89933303390",
    },
  };

  // 2) DOM
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

  // 3) Хелперы модалок
  const open = (m) => { if (!m) return; m.style.display = "flex"; document.body.style.overflow = "hidden"; };
  const close = (m) => { if (!m) return; m.style.display = "none"; document.body.style.overflow = ""; };

  // 4) Рендер сообщения
  function renderMessage(methodKey) {
    const d = PAYMENT[methodKey];
    if (!d) return;

    chatArea.innerHTML = ""; // очистить чат

    // клонируем шаблон 1:1 (никаких лишних контейнеров)
    const node = msgTpl.cloneNode(true);
    node.style.display = "block";
    node.querySelector(".chat-method-name").textContent = d.name;
    node.querySelector(".chat-details").textContent = d.show;
    chatArea.appendChild(node);

    // Кнопки действий:
    // 4.1 gift_card — без кнопки копирования
    if (d.noCopy) {
      chatArea.scrollTop = chatArea.scrollHeight;
      return;
    }

    // 4.2 ua_card — кнопка "Оплатить"
    if (d.link) {
      const payBtn = document.createElement("button");
      payBtn.className = "modal-btn";
      payBtn.textContent = "Оплатить";
      payBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.open(d.link, "_blank", "noopener,noreferrer");
      });
      chatArea.appendChild(payBtn);
      chatArea.scrollTop = chatArea.scrollHeight;
      return;
    }

    // 4.3 ru_card — две кнопки копирования
    if (methodKey === "ru_card") {
      const b1 = document.createElement("button");
      b1.className = "modal-btn";
      b1.textContent = "Скопировать Т-банк";
      b1.onclick = async () => {
        try { await navigator.clipboard.writeText(d.tBank); b1.textContent = "✅ Скопировано"; }
        catch { b1.textContent = "⚠️ Не удалось"; }
        setTimeout(() => (b1.textContent = "Скопировать Т-банк"), 1400);
      };
      chatArea.appendChild(b1);

      const b2 = document.createElement("button");
      b2.className = "modal-btn";
      b2.textContent = "Скопировать СПБ";
      b2.onclick = async () => {
        try { await navigator.clipboard.writeText(d.spb); b2.textContent = "✅ Скопировано"; }
        catch { b2.textContent = "⚠️ Не удалось"; }
        setTimeout(() => (b2.textContent = "Скопировать СПБ"), 1400);
      };
      chatArea.appendChild(b2);

      chatArea.scrollTop = chatArea.scrollHeight;
      return;
    }

    // 4.4 прочие — одна кнопка «Скопировать реквизиты»
    const copyBtn = document.createElement("button");
    copyBtn.className = "modal-btn";
    copyBtn.textContent = "Скопировать реквизиты";
    copyBtn.onclick = async () => {
      try { await navigator.clipboard.writeText(d.copy); copyBtn.textContent = "✅ Скопировано"; }
      catch { copyBtn.textContent = "⚠️ Не удалось"; }
      setTimeout(() => (copyBtn.textContent = "Скопировать реквизиты"), 1400);
    };
    chatArea.appendChild(copyBtn);

    chatArea.scrollTop = chatArea.scrollHeight;
  }

  // 5) Слушатели — шаги
  buyBtn?.addEventListener("click", (e) => { e.preventDefault(); open(modal1); });
  btnRead?.addEventListener("click", () => { close(modal1); open(modal2); });
  btnBackToInfo?.addEventListener("click", () => { close(modal2); open(modal1); });
  btnBackToOptions?.addEventListener("click", () => { close(modalChat); open(modal2); });

  // 6) Выбор из блока оплат на странице (превью)
  document.querySelector("#payments")?.addEventListener("click", (e) => {
    const chip = e.target.closest(".pay-chip");
    if (!chip) return;
    renderMessage(chip.dataset.method);
    open(modalChat);
  });

  // 7) Выбор способа в шаге 2
  payOptions?.addEventListener("click", (e) => {
    const btn = e.target.closest(".option-btn");
    if (!btn) return;
    e.preventDefault();
    renderMessage(btn.dataset.method);
    close(modal2);
    open(modalChat);
  });

  // 8) Закрытие по клику на подложку
  window.addEventListener("click", (e) => {
    if (e.target === modal1) close(modal1);
    if (e.target === modal2) close(modal2);
    if (e.target === modalChat) close(modalChat);
  });
  
  // 9) Закрытие по кнопке X (добавлено для решения проблем с закрытием модалок)
  document.querySelectorAll(".close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-target");
      const modal = document.getElementById(modalId);
      close(modal);
    });
  });
});
