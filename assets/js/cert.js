const plans = document.querySelectorAll(".plan");
const buyBtn = document.getElementById("buy-btn");
const modal = document.getElementById("pay-modal");

let selectedPlan = null;

// Выбор плана
plans.forEach(btn => {
  btn.addEventListener("click", () => {
    plans.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedPlan = btn.dataset.months;
    buyBtn.disabled = false;
    buyBtn.innerText = `Оформить (${selectedPlan} мес)`;
  });
});

// Открыть оплату
buyBtn.addEventListener("click", () => {
  modal.classList.add("show");
});

// Закрытие
document.querySelectorAll("[data-close]").forEach(btn =>
  btn.addEventListener("click", () => modal.classList.remove("show"))
);

// Выбор метода оплаты
document.querySelectorAll(".method").forEach(btn => {
  btn.addEventListener("click", () => {
    const method = btn.dataset.method;
    window.location.href = `./pay.html?plan=${selectedPlan}&method=${method}`;
  });
});
