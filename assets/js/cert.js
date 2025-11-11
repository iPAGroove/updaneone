// assets/js/cert.js
// ===============================
// URSA CERT — Plans, Smooth Scroll, Pay Modal, A11y
// ===============================

(() => {
  // ---- ELEMENTS
  const header = document.querySelector(".header");
  const buyBtn = document.getElementById("buy-btn");
  const planBtns = Array.from(document.querySelectorAll(".plan"));
  const modal = document.getElementById("pay-modal");
  const modalCloseBtn = modal?.querySelector(".close");
  const methodBtns = Array.from(document.querySelectorAll(".method"));
  const faqOpenBtn = document.querySelector("[data-open-pay]");
  const nav = document.querySelector(".nav");
  const navLinks = nav ? Array.from(nav.querySelectorAll("a[href^='#']")) : [];

  // ---- STATE
  let selectedMonths = null;
  let lastFocusedElement = null;

  // ===============================
  // Plans: selection + CTA enable
  // ===============================
  function setPlanActive(btn) {
    planBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedMonths = btn.dataset.months || null;

    if (selectedMonths) {
      const title = btn.querySelector(".title")?.textContent?.trim() || "";
      const price = btn.querySelector(".price")?.textContent?.trim() || "";
      buyBtn.disabled = false;
      buyBtn.classList.add("ready");
      buyBtn.textContent = `Купить — ${price} / ${title}`;
    } else {
      buyBtn.disabled = true;
      buyBtn.classList.remove("ready");
      buyBtn.textContent = "Выберите план";
    }
  }

  planBtns.forEach(btn => {
    btn.addEventListener("click", () => setPlanActive(btn));
  });

  // Предзаполнение из URL (например ?plan=3)
  (function preselectFromURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      const plan = params.get("plan"); // 1|3|6|12
      if (!plan) return;
      const target = planBtns.find(b => (b.dataset.months || "") === String(plan));
      if (target) setPlanActive(target);
    } catch (_) {}
  })();

  // ===============================
  // Smooth scroll for header nav
  // ===============================
  function smoothScrollTo(id) {
    const el = document.querySelector(id);
    if (!el) return;
    const headerH = header?.offsetHeight || 0;
    const top = el.getBoundingClientRect().top + window.scrollY - (headerH + 8);
    window.scrollTo({ top, behavior: "smooth" });
  }

  navLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const hash = link.getAttribute("href");
      if (hash && hash.startsWith("#")) {
        smoothScrollTo(hash);
        history.replaceState(null, "", hash);
      }
    });
  });

  // Активное состояние пункта меню по секции
  (function observeSections() {
    if (!("IntersectionObserver" in window) || navLinks.length === 0) return;
    const sections = navLinks
      .map(a => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);

    const map = new Map(); // section -> link
    sections.forEach((s, i) => map.set(s, navLinks[i]));

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const link = map.get(entry.target);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0.01 }
    );

    sections.forEach(s => io.observe(s));
  })();

  // ===============================
  // Modal open/close + focus management
  // ===============================
  function getFocusable(container) {
    return Array.from(
      container.querySelectorAll(
        'a[href],button,textarea,input,select,[tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
  }

  function openModal() {
    if (!selectedMonths) return; // не даём открыть без выбора плана
    lastFocusedElement = document.activeElement;
    modal?.classList.add("show");
    modal?.setAttribute("aria-hidden", "false");

    // Фокус на первый элемент
    const f = getFocusable(modal);
    if (f.length) f[0].focus();
    // Клик по подложке
    modal.addEventListener("click", backdropClose, { once: true });
  }

  function closeModal() {
    modal?.classList.remove("show");
    modal?.setAttribute("aria-hidden", "true");
    // Возврат фокуса
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  function backdropClose(e) {
    // Закрываем, если клик по фону (не по содержимому)
    if (e.target === modal) {
      closeModal();
    } else {
      // если не фон — снова повесим слушатель для следующего клика
      modal.addEventListener("click", backdropClose, { once: true });
    }
  }

  buyBtn?.addEventListener("click", openModal);
  faqOpenBtn?.addEventListener("click", () => {
    // Если пользователь жмёт “Купить” в FAQ без выбранного плана — мягко подсветим блок с планами
    if (!selectedMonths) {
      const plansWrap = document.querySelector(".pricing");
      if (plansWrap) {
        smoothScrollTo("#plans");
        plansWrap.classList.add("pulse");
        setTimeout(() => plansWrap.classList.remove("pulse"), 900);
      }
      return;
    }
    openModal();
  });
  modalCloseBtn?.addEventListener("click", closeModal);

  // Esc закрывает модал
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal?.classList.contains("show")) {
      closeModal();
    }
  });

  // Трап фокуса внутри модала (минимал)
  modal?.addEventListener("keydown", e => {
    if (e.key !== "Tab") return;
    const f = getFocusable(modal);
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // ===============================
  // Payment method selection
  // ===============================
  methodBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const method = btn.dataset.method;
      if (!method || !selectedMonths) return;

      // Сохраняем выбор для следующего шага
      localStorage.setItem("ursa_buy_cert_months", String(selectedMonths));
      localStorage.setItem("ursa_buy_cert_method", method);

      // Пока ведём в vip.html#chat (как и раньше). Можно заменить на pay.html, когда будет готово.
      window.location.href = "./vip.html#chat";
    });
  });

  // ===============================
  // Deep links (hash)
  // ===============================
  // #buy → открыть модал, если план уже выбран
  if (window.location.hash === "#buy" && buyBtn) {
    if (selectedMonths) openModal();
    else smoothScrollTo("#plans");
  }
})();
