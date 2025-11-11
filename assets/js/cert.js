// ===============================
// URSA CERT PAGE — PLANS + PAYMENT MODAL (v2)
// ===============================

const buyBtn = document.getElementById("buy-btn");
const plans = document.querySelectorAll(".plan");
const modal = document.getElementById("pay-modal");
const planDisplay = document.getElementById("plan-display"); // Новый элемент
const faqOpenBtn = document.querySelector("[data-open-pay]");

let selectedMonths = null;
let selectedPlanText = null; // Новый элемент для текста плана

// -------------------------------
// Выбор срока сертификата
// -------------------------------
plans.forEach((btn) => {
  btn.addEventListener("click", () => {
    // снимаем active со всех
    plans.forEach((b) => b.classList.remove("active"));

    // ставим active на выбранный
    btn.classList.add("active");

    // сохраняем выбранный срок и текст
    selectedMonths = btn.dataset.months;
    
    // Получаем чистый текст (убираем бейдж, если есть)
    selectedPlanText = btn.textContent.replace(/🔥 Выгодно/g, '').trim(); 

    // активируем кнопку "Купить"
    buyBtn.disabled = false;
    buyBtn.classList.add("ready");
    buyBtn.textContent = `Купить (${selectedPlanText})`;
  });
});

// -------------------------------
// Открыть окно оплаты
// -------------------------------
function openModal() {
  if (!selectedMonths) return;
  
  // Обновляем текст в модальном окне перед открытием
  if (planDisplay && selectedPlanText) {
    planDisplay.textContent = `Вы выбрали: ${selectedPlanText}`;
  }
  
  modal.classList.add("show");
}

buyBtn.addEventListener("click", openModal);

// CTA в FAQ → тоже открывает модал (хук в HTML)

// -------------------------------
// Закрытие модала (крест + фон)
// -------------------------------
modal.addEventListener("click", (e) => {
  if (e.target.dataset.close || e.target === modal) {
    modal.classList.remove("show");
  }
});

// -------------------------------
// Выбор способа оплаты
// -------------------------------
document.querySelectorAll(".method").forEach((btn) =>
  btn.addEventListener("click", () => {
    const method = btn.dataset.method;

    // сохраняем выбранные параметры
    localStorage.setItem("ursa_buy_cert_months", selectedMonths);
    localStorage.setItem("ursa_buy_cert_method", method);

    // временно отправляем в чат оплаты
    // позже заменим на "pay.html"
    window.location.href = "./vip.html#chat";
  })
);

// -------------------------------
// Accessibility (Esc закрывает модал)
// -------------------------------
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") modal.classList.remove("show");
});
