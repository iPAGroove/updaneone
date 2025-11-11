// ===============================
// URSA CERT PAGE — PLANS + PAYMENT MODAL + NAV
// ===============================

const buyBtn = document.getElementById("buy-btn");
const plans = document.querySelectorAll(".plan");
const modal = document.getElementById("pay-modal");
const faqOpenBtn = document.querySelector("[data-open-pay]");
const navLinks = document.querySelectorAll(".top-nav a, .mobile-menu a[data-section-link]");
const sections = document.querySelectorAll("section[data-section]");
const mobileToggle = document.querySelector(".mobile-nav-toggle");
const mobileMenu = document.getElementById("mobile-menu");
const header = document.querySelector(".header");

let selectedMonths = null;

// -------------------------------
// 1. Выбор срока сертификата
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
// 2. Открыть окно оплаты
// -------------------------------
function openModal() {
  if (!selectedMonths) return;
  modal.classList.add("show");
}

buyBtn.addEventListener("click", openModal);

// CTA в FAQ → тоже открывает модал
faqOpenBtn?.addEventListener("click", openModal);

// -------------------------------
// 3. Закрытие модала (крест + фон + Esc)
// -------------------------------
modal.addEventListener("click", (e) => {
  if (e.target.dataset.close || e.target === modal) {
    modal.classList.remove("show");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") modal.classList.remove("show");
});

// -------------------------------
// 4. Выбор способа оплаты
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
// 5. Intersection Observer (Подсветка активного раздела)
// -------------------------------
const observerOptions = {
    root: null,
    rootMargin: "-25% 0px -75% 0px", // Секция активна, когда ее начало находится в верхней четверти экрана
    threshold: 0
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const id = entry.target.getAttribute("id");
        const link = document.querySelector(`.top-nav a[href="#${id}"]`);
        const mobileLink = document.querySelector(`.mobile-menu a[href="#${id}"]`);

        if (entry.isIntersecting) {
            // Удаляем класс current со всех
            navLinks.forEach(l => l.classList.remove("current"));
            
            // Добавляем класс current к активному
            link?.classList.add("current");
            mobileLink?.classList.add("current");
        }
    });
}, observerOptions);

// Наблюдаем за каждой секцией
sections.forEach(section => {
    observer.observe(section);
});

// -------------------------------
// 6. Mobile Nav Logic
// -------------------------------
mobileToggle.addEventListener("click", () => {
    const isOpen = mobileMenu.getAttribute('aria-hidden') === 'false';
    
    if (isOpen) {
        mobileMenu.setAttribute('aria-hidden', 'true');
        header.removeAttribute('data-menu-open');
    } else {
        mobileMenu.setAttribute('aria-hidden', 'false');
        header.setAttribute('data-menu-open', '');
    }
});

// Закрываем мобильное меню при клике на ссылку
document.querySelectorAll(".mobile-menu a").forEach(link => {
    link.addEventListener("click", () => {
        mobileMenu.setAttribute('aria-hidden', 'true');
        header.removeAttribute('data-menu-open');
    });
});
