// assets/js/vip.js (логика оплаты и чата)

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
        details: "Т-банк: 2200702048905611\nСПБ (Т-банк): 89933303390\nПолучатель: Онищенко Пётр А.\n\n⚠️ Комментарий оплаты: @viibbee_17"
    }
};

// --- 2. ЭЛЕМЕНТЫ ---
const buyBtn = document.getElementById("vip-buy-btn");
const modalStep1 = document.getElementById("modal-step-1");
const btnRead = document.getElementById("btn-read");
const modalStep2 = document.getElementById("modal-step-2");
const modalChat = document.getElementById("modal-chat");

const btnBackToInfo = document.getElementById("btn-back-to-info");
const btnBackToOptions = document.getElementById("btn-back-to-options");
const paymentOptions = document.querySelectorAll('.option-btn');
const chatArea = document.getElementById("chat-area");

// --- 3. МОДАЛКИ ---
function openModal(modal) {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}
function closeModal(modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";
}

// --- 4. ОТОБРАЖЕНИЕ РЕКВИЗИТОВ ---
function displayPaymentDetails(method) {
    const details = PAYMENT_DETAILS[method];
    if (!details) return;

    chatArea.innerHTML = ""; // Чистим чат

    const template = document.getElementById("system-message-template");
    const message = template.cloneNode(true);
    message.style.display = "block";

    message.querySelector(".chat-method-name").textContent = details.name;
    message.querySelector(".chat-details").textContent = details.details;

    chatArea.appendChild(message);

    // --- КНОПКА ДЕЙСТВИЯ ---
    const actionBtn = document.createElement("button");
    actionBtn.className = "copy-btn";

    if (method === "ua_card") {
        actionBtn.textContent = "Оплатить";
        actionBtn.onclick = () => window.open(details.details.replace("Ссылка для оплаты: ", ""), "_blank");
    } else {
        actionBtn.textContent = "Скопировать реквизиты";
        actionBtn.onclick = () => {
            navigator.clipboard.writeText(details.details);
            actionBtn.textContent = "✅ Скопировано!";
            setTimeout(() => actionBtn.textContent = "Скопировать реквизиты", 1500);
        };
    }

    chatArea.appendChild(actionBtn);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// --- 5. КЛИКИ ---
buyBtn.onclick = (e) => { e.preventDefault(); openModal(modalStep1); };
btnRead.onclick = () => { closeModal(modalStep1); openModal(modalStep2); };

paymentOptions.forEach(btn => {
    btn.onclick = (e) => {
        e.preventDefault();
        const method = e.currentTarget.dataset.method;
        closeModal(modalStep2);
        displayPaymentDetails(method);
        openModal(modalChat);
    };
});

btnBackToInfo.onclick = () => { closeModal(modalStep2); openModal(modalStep1); };
btnBackToOptions.onclick = () => { closeModal(modalChat); openModal(modalStep2); };

window.onclick = (event) => {
    if (event.target === modalStep1) closeModal(modalStep1);
    if (event.target === modalStep2) closeModal(modalStep2);
    if (event.target === modalChat) closeModal(modalChat);
};
