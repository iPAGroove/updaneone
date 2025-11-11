// ===============================
// URSA CERT PAGE — PLANS + PAYMENT MODAL
// ===============================

const buyBtn = document.getElementById("buy-btn");
const plans = document.querySelectorAll(".plan");
const modal = document.getElementById("pay-modal");
const faqOpenBtn = document.querySelector("[data-open-pay]");
const methodButtons = document.querySelectorAll(".method");

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
    const planText = btn.textContent;

    // активируем кнопку "Купить"
    buyBtn.disabled = false;
    buyBtn.classList.add("ready");
    buyBtn.textContent = `Купить (${planText.split('/')[0].trim()} / ${planText.split('/')[1].trim()})`;
  });
});

// -------------------------------
// Открыть окно оплаты
// -------------------------------
function openModal() {
  if (!selectedMonths) {
    // Если план не выбран, не открываем модал, можно добавить alert
    // alert("Пожалуйста, выберите срок действия сертификата.");
    return; 
  }
  modal.classList.add("show");
}

buyBtn.addEventListener("click", openModal);

// CTA в FAQ → тоже открывает модал
faqOpenBtn?.addEventListener("click", openModal);

// -------------------------------
// Закрытие модала (крест + фон)
// -------------------------------
modal.addEventListener("click", (e) => {
  if (e.target.dataset.close !== undefined || e.target === modal) {
    modal.classList.remove("show");
  }
});

// -------------------------------
// Выбор способа оплаты (редирект с параметрами)
// -------------------------------
methodButtons.forEach((btn) =>
  btn.addEventListener("click", () => {
    const method = btn.dataset.method;

    if (selectedMonths && method) {
        // Передаем выбранные параметры через URL для чистой интеграции
        // Замените './pay.html' на актуальный адрес страницы оплаты.
        window.location.href = `./pay.html?months=${selectedMonths}&method=${method}`;
    } else {
        alert("Произошла ошибка: не выбран план или способ оплаты.");
    }
  })
);

// -------------------------------
// Accessibility (Esc закрывает модал)
// -------------------------------
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") modal.classList.remove("show");
});
