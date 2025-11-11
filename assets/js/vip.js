// assets/js/vip.js (Логика трехшагового процесса и чата)

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

// --- 2. ЭЛЕМЕНТЫ DOM ---
const buyBtn = document.getElementById("vip-buy-btn");
const modalStep1 = document.getElementById("modal-step-1");
const btnRead = document.getElementById("btn-read");
const modalStep2 = document.getElementById("modal-step-2");
const modalChat = document.getElementById("modal-chat");

const btnBackToInfo = document.getElementById("btn-back-to-info");
const btnBackToOptions = document.getElementById("btn-back-to-options");
const paymentOptions = document.querySelectorAll('.option-btn');
const chatArea = document.getElementById("chat-area");

// --- 3. МОДАЛЬНЫЕ ОКНА ---
function openModal(modal) {
    if (modal) {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
    }
}

function closeModal(modal) {
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "";
    }
}

// --- 4. ЛОГИКА ЧАТА + КНОПКИ ДЕЙСТВИЙ ---
function displayPaymentDetails(method) {
    const details = PAYMENT_DETAILS[method];
    if (!details) return;

    const template = document.getElementById('system-message-template');
    const messageClone = template.cloneNode(true);

    messageClone.querySelector('.chat-method-name').textContent = details.name;
    messageClone.querySelector('.chat-details').textContent = details.details;

    chatArea.innerHTML = '';
    messageClone.style.display = 'block';
    chatArea.appendChild(messageClone);

    // === ДОБАВЛЯЕМ КНОПКУ ДЕЙСТВИЯ ===
    let actionBtn = document.createElement("button");
    actionBtn.className = "modal-btn";
    actionBtn.style.marginTop = "15px";

    if (method === "ua_card") {
        actionBtn.textContent = "Оплатить";
        actionBtn.onclick = () => {
            window.open("https://www.privat24.ua/send/373a0", "_blank");
        };
    } else {
        actionBtn.textContent = "Скопировать реквизиты";
        actionBtn.onclick = () => {
            navigator.clipboard.writeText(details.details);
            actionBtn.textContent = "✅ Скопировано!";
            setTimeout(() => actionBtn.textContent = "Скопировать реквизиты", 2000);
        };
    }

    chatArea.appendChild(actionBtn);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// --- 5. ОБРАБОТКА КЛИКОВ ---

if (buyBtn) {
    buyBtn.onclick = (e) => {
        e.preventDefault();
        openModal(modalStep1);
    };
}

if (btnRead) {
    btnRead.onclick = () => {
        closeModal(modalStep1);
        openModal(modalStep2);
    };
}

paymentOptions.forEach(btn => {
    btn.onclick = (e) => {
        e.preventDefault();
        const method = e.currentTarget.getAttribute('data-method');

        closeModal(modalStep2);
        displayPaymentDetails(method);
        openModal(modalChat);
    };
});

if (btnBackToInfo) {
    btnBackToInfo.onclick = () => {
        closeModal(modalStep2);
        openModal(modalStep1);
    };
}

if (btnBackToOptions) {
    btnBackToOptions.onclick = () => {
        closeModal(modalChat);
        openModal(modalStep2);
    };
}

window.onclick = (event) => {
    if (event.target === modalStep1) closeModal(modalStep1);
    if (event.target === modalStep2) closeModal(modalStep2);
    if (event.target === modalChat) closeModal(modalChat);
};
