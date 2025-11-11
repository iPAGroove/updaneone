const buyBtn = document.getElementById("buy-btn");
const plans = document.querySelectorAll(".plan");
const modal = document.getElementById("pay-modal");
const accordionTitles = document.querySelectorAll(".accordion-title");

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

// Логика Аккордеона
accordionTitles.forEach(title => {
    title.addEventListener("click", () => {
        const content = title.nextElementSibling;
        const item = title.parentElement;
        
        // Закрыть все остальные
        accordionTitles.forEach(otherTitle => {
            if (otherTitle !== title && otherTitle.classList.contains("active")) {
                otherTitle.classList.remove("active");
                otherTitle.nextElementSibling.style.maxHeight = null;
            }
        });

        // Открыть/закрыть текущий
        if (title.classList.contains("active")) {
            title.classList.remove("active");
            content.style.maxHeight = null;
        } else {
            title.classList.add("active");
            // Устанавливаем max-height равным высоте контента
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
});
