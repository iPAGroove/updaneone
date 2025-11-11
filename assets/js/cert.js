// assets/js/cert.js
// ===============================
// Выбор плана, модал оплаты, аккордеоны FAQ, плавная прокрутка, hash-навигация
// ===============================
const buyBtn = document.getElementById("buy-btn");
const plans = document.querySelectorAll(".plan");
const modal = document.getElementById("pay-modal");
const modalContent = modal?.querySelector(".modal-content");
let selectedMonths = null;

// ========== Выбор срока ==========
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

// ========== Открытие модала ==========
function openModal() {
  if (!selectedMonths) return;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  // фокус на первый метод
  const firstMethod = modal.querySelector(".method");
  firstMethod && firstMethod.focus();
}

function closeModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

buyBtn.addEventListener("click", openModal);

// закрытие кликом по фону/кнопке
modal.addEventListener("click", (e) => {
  if (e.target.dataset.close || e.target === modal) closeModal();
});
modalContent.addEventListener("click", (e) => e.stopPropagation());

// Esc для закрытия
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("show")) closeModal();
});

// ========== Переход к оплате (пока в vip.html#chat) ==========
document.querySelectorAll(".method").forEach((btn) =>
  btn.addEventListener("click", () => {
    const method = btn.dataset.method;
    localStorage.setItem("ursa_buy_cert_months", selectedMonths);
    localStorage.setItem("ursa_buy_cert_method", method);
    window.location.href = "./vip.html#chat"; // временный маршрут
  })
);

// ========== Аккордеоны FAQ ==========
const accHeaders = document.querySelectorAll(".acc-h");
accHeaders.forEach((h) => {
  h.addEventListener("click", () => {
    const expanded = h.getAttribute("aria-expanded") === "true";
    h.setAttribute("aria-expanded", String(!expanded));
    h.parentElement.classList.toggle("open", !expanded);
  });
});

// ========== Плавная прокрутка для якорных ссылок ==========
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href").slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", `#${id}`);
    }
  });
});

// ========== Подсветка пункта в шапке при прокрутке ==========
const sections = ["how", "faq", "compare", "guarantee"];
const navLinks = [...document.querySelectorAll(".top-nav .nav-link")];

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach((l) =>
          l.classList.toggle("active", l.getAttribute("href") === `#${id}`)
        );
      }
    });
  },
  { threshold: 0.2 }
);

sections.forEach((id) => {
  const el = document.getElementById(id);
  if (el) observer.observe(el);
});

// ========== Автопрокрутка к секции по hash при входе ==========
if (location.hash) {
  const el = document.querySelector(location.hash);
  if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 80);
}
