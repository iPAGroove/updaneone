const buyBtn = document.getElementById("buy-btn");
const plans = document.querySelectorAll(".plan");
const modal = document.getElementById("pay-modal");

let selectedMonths = null;

// выбор срока
plans.forEach(btn => {
  btn.addEventListener("click", () => {
    plans.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedMonths = btn.dataset.months;
    buyBtn.disabled = false;
    buyBtn.classList.add("ready");
    buyBtn.textContent = `Купить (${btn.textContent})`;
  });
});

// открыть модал
buyBtn.addEventListener("click", () => {
  if (!selectedMonths) return;
  modal.classList.add("show");
});

// закрытие
modal.addEventListener("click", (e) => {
  if (e.target.dataset.close || e.target === modal)
    modal.classList.remove("show");
});

// переход в чат оплаты
document.querySelectorAll(".method").forEach(btn =>
  btn.addEventListener("click", () => {
    const method = btn.dataset.method;
    // === ЛОГИКА ТАКАЯ ЖЕ КАК В vip.js ===
    localStorage.setItem("ursa_buy_cert_months", selectedMonths);
    localStorage.setItem("ursa_buy_cert_method", method);

    window.location.href = "./vip.html#chat"; // временно → потом сделаем свой чат
  })
);
