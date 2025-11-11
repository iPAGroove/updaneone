// ===============================
// URSA SIGNER — FIXED CERT PLANS
// ===============================

(() => {
  const modal = document.getElementById("pay-modal");
  const closeBtn = modal?.querySelector("[data-close]");
  const planButtons = document.querySelectorAll(".plan-card .buy");
  const openFromFAQ = document.querySelector("[data-open-pay]");
  const methodButtons = document.querySelectorAll(".method");

  let selectedPlan = null; // standard | instant | free

  // ---------------------------------
  // Открытие модального окна оплаты
  // ---------------------------------
  function openModal() {
    if (!selectedPlan) return;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }

  // ---------------------------------
  // Закрытие модального окна
  // ---------------------------------
  function closeModal() {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }

  closeBtn?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // ---------------------------------
  // Выбор сертификата
  // ---------------------------------
  planButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedPlan = btn.dataset.plan;

      // Сохраняем выбор
      localStorage.setItem("ursa_cert_type", selectedPlan);

      // Открываем модал оплаты
      openModal();
    });
  });

  // ---------------------------------
  // Открытие модала из FAQ (если план не выбран — мягкая подсветка)
  // ---------------------------------
  openFromFAQ?.addEventListener("click", () => {
    if (!selectedPlan) {
      const block = document.getElementById("types");
      if (block) {
        block.scrollIntoView({ behavior: "smooth", block: "center" });
        block.classList.add("pulse");
        setTimeout(() => block.classList.remove("pulse"), 900);
      }
      return;
    }
    openModal();
  });

  // ---------------------------------
  // Выбор способа оплаты
  // ---------------------------------
  methodButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const method = btn.dataset.method;
      if (!method || !selectedPlan) return;

      // Сохраняем
      localStorage.setItem("ursa_buy_method", method);

      // (Временно) переход в страницу оплаты / чата
      window.location.href = "./vip.html#chat";
    });
  });

})();
