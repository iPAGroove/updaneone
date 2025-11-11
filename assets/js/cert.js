// ===============================
// URSA CERT PAGE — PLANS + PAYMENT MODAL
// ===============================

const buyBtn = document.getElementById("buy-btn");
const plans = document.querySelectorAll(".plan");
const modal = document.getElementById("pay-modal");
const faqOpenBtn = document.querySelector("[data-open-pay]");
let selectedMonths = null;

// -------------------------------
// Выбор срока сертификата
// -------------------------------
plans.forEach((btn) => {
  btn.addEventListener("click", () => {
    // снимаем active со всех
    plans.forEach((b) => b.classList.remove("active"));

    // ставим active на выбранный
    btn.classList.add("active");

    // сохраняем выбранный срок
    selectedMonths = btn.dataset.months;

    // активируем кнопку "Купить"
    buyBtn.disabled = false;
    buyBtn.classList.add("ready");
    buyBtn.textContent = `Купить (${btn.textContent})`;
  });
});

// -------------------------------
// Открыть окно оплаты
// -------------------------------
function openModal() {
  if (!selectedMonths) return;
  modal.classList.add("show");
}

buyBtn.addEventListener("click", openModal);

// CTA в FAQ → тоже открывает модал
faqOpenBtn?.addEventListener("click", openModal);

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
