// ===============================
// VIP — логика входа, проверка сертификата, шаги и чат
// ===============================
import { auth } from "./app.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {

  // ждем пока Firebase восстановит сессию
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

  // ✅ для отображения в чате
  localStorage.setItem("ursa_vip_uid", user.uid);
  localStorage.setItem("ursa_vip_udid", udid);

  initVIP();
});

function initVIP() {

  // ===============================
  // 1) Реквизиты
  // ===============================
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

  // ===============================
  // 2) DOM элементы
  // ===============================
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

  // ===============================
  // 3) Helpers
  // ===============================
  const open = (m) => { m.style.display = "flex"; document.body.style.overflow = "hidden"; };
  const close = (m) => { m.style.display = "none"; document.body.style.overflow = ""; };

  // ===============================
  // 4) ЧАТ + идентификация
  // ===============================
  function renderMessage(methodKey) {
    const d = PAYMENT[methodKey];
    if (!d) return;

    chatArea.innerHTML = "";
    const node = msgTpl.cloneNode(true);
    node.style.display = "block";

    node.querySelector(".chat-method-name").textContent = d.name;
    node.querySelector(".chat-details").textContent = d.show;

    const uid = localStorage.getItem("ursa_vip_uid");
    const udidStored = localStorage.getItem("ursa_vip_udid");

    const idBlock = document.createElement("div");
    idBlock.style.marginTop = "14px";
    idBlock.style.fontSize = "13px";
    idBlock.style.opacity = "0.82";
    idBlock.innerHTML = `👤 <b>${uid}</b><br>🔗 UDID: <b>${udidStored}</b>`;
    node.appendChild(idBlock);

    chatArea.appendChild(node);

    if (d.noCopy) return chatArea.scrollTop = chatArea.scrollHeight;

    if (d.link) {
      const payBtn = document.createElement("button");
      payBtn.className = "modal-btn";
      payBtn.textContent = "Оплатить";
      payBtn.onclick = () => window.open(d.link, "_blank", "noopener,noreferrer");
      chatArea.appendChild(payBtn);
      return chatArea.scrollTop = chatArea.scrollHeight;
    }

    if (methodKey === "ru_card") {
      const b1 = document.createElement("button");
      b1.className = "modal-btn";
      b1.textContent = "Скопировать Т-банк";
      b1.onclick = async () => {
        await navigator.clipboard.writeText(d.tBank);
        b1.textContent = "✅ Скопировано";
        setTimeout(() => b1.textContent = "Скопировать Т-банк", 1400);
      };
      chatArea.appendChild(b1);

      const b2 = document.createElement("button");
      b2.className = "modal-btn";
      b2.textContent = "Скопировать СПБ";
      b2.onclick = async () => {
        await navigator.clipboard.writeText(d.spb);
        b2.textContent = "✅ Скопировано";
        setTimeout(() => b2.textContent = "Скопировать СПБ", 1400);
      };
      chatArea.appendChild(b2);

      return chatArea.scrollTop = chatArea.scrollHeight;
    }

    const copyBtn = document.createElement("button");
    copyBtn.className = "modal-btn";
    copyBtn.textContent = "Скопировать реквизиты";
    copyBtn.onclick = async () => {
      await navigator.clipboard.writeText(d.copy);
      copyBtn.textContent = "✅ Скопировано";
      setTimeout(() => copyBtn.textContent = "Скопировать реквизиты", 1400);
    };
    chatArea.appendChild(copyBtn);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  // ===============================
  // 5) Шаги
  // ===============================
  buyBtn?.addEventListener("click", () => open(modal1));
  btnRead?.addEventListener("click", () => { close(modal1); open(modal2); });
  btnBackToInfo?.addEventListener("click", () => { close(modal2); open(modal1); });
  btnBackToOptions?.addEventListener("click", () => { close(modalChat); open(modal2); });

  // ===============================
  // 6) Выбор способов
  // ===============================
  document.querySelector("#payments")?.addEventListener("click", (e) => {
    const chip = e.target.closest(".pay-chip");
    if (!chip) return;
    renderMessage(chip.dataset.method);
    open(modalChat);
  });

  payOptions?.addEventListener("click", (e) => {
    const btn = e.target.closest(".option-btn");
    if (!btn) return;
    renderMessage(btn.dataset.method);
    close(modal2);
    open(modalChat);
  });

  // ===============================
  // 7) Закрытия
  // ===============================
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
}
