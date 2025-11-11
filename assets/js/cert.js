// ===============================
// URSA CERT PAGE — PLANS + PAYMENT + NAV ACTIVE HIGHLIGHT
// ===============================

const buyBtn = document.getElementById("buy-btn");
const plans = document.querySelectorAll(".plan");
const modal = document.getElementById("pay-modal");
const faqOpenBtn = document.querySelector("[data-open-pay]");
const bottomNavLinks = document.querySelectorAll(".bottom-nav a");
let selectedMonths = null;

// -------------------------------
// ВЫБОР ПЛАНА
// -------------------------------
plans.forEach((btn) => {
  btn.addEventListener("click", () => {
    plans.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    selectedMonths = btn.dataset.months;

    buyBtn.disabled = false;
    buyBtn.classList.add("ready");
    buyBtn.textContent = `Купить (${btn.textContent})`;
  });
});

// -------------------------------
// ОТКРЫТЬ ОКНО ОПЛАТЫ
// -------------------------------
function openModal() {
  if (!selectedMonths) return;
  modal.classList.add("show");
}

buyBtn.addEventListener("click", openModal);
faqOpenBtn?.addEventListener("click", openModal);

// -------------------------------
// ЗАКРЫТЬ МОДАЛ (крест/фон/назад)
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
// ВЫБОР СПОСОБА ОПЛАТЫ
// -------------------------------
document.querySelectorAll(".method").forEach((btn) =>
  btn.addEventListener("click", () => {
    const method = btn.dataset.method;

    localStorage.setItem("ursa_buy_cert_months", selectedMonths);
    localStorage.setItem("ursa_buy_cert_method", method);

    window.location.href = "./vip.html#chat";
  })
);

// -------------------------------
// ПЛАВНЫЕ ПЕРЕХОДЫ ПО ЯКОРЯМ
// -------------------------------
bottomNavLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href");
    if (href.startsWith("#")) {
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// -------------------------------
// ПОДСВЕТКА АКТИВНОГО РАЗДЕЛА
// -------------------------------
const sections = document.querySelectorAll("section[id]");

const highlightActiveNav = () => {
  let scrollY = window.scrollY + window.innerHeight / 3;

  sections.forEach((section) => {
    const id = section.getAttribute("id");
    const top = section.offsetTop;
    const height = section.offsetHeight;

    if (scrollY >= top && scrollY < top + height) {
      bottomNavLinks.forEach((link) => link.classList.remove("active"));
      document
        .querySelector(`.bottom-nav a[href="#${id}"]`)
        ?.classList.add("active");
    }
  });
};

window.addEventListener("scroll", highlightActiveNav);
highlightActiveNav(); // запустить на старте
