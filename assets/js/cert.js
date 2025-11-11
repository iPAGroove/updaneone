(() => {
  const modal = document.getElementById("pay-modal");
  const closeBtn = modal?.querySelector("[data-close]");
  const planButtons = document.querySelectorAll(".plan-card .buy");
  const openFromFAQ = document.querySelector("[data-open-pay]");
  const methodButtons = document.querySelectorAll(".method");

  let selectedPlan = null;

  function openModal() {
    if (!selectedPlan) return;
    modal.classList.add("show");
  }

  function closeModal() {
    modal.classList.remove("show");
  }

  closeBtn?.addEventListener("click", closeModal);
  modal?.addEventListener("click", e => { if(e.target === modal) closeModal(); });
  document.addEventListener("keydown", e => { if(e.key === "Escape") closeModal(); });

  planButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedPlan = btn.dataset.plan;
      localStorage.setItem("ursa_cert_type", selectedPlan);
      openModal();
    });
  });

  openFromFAQ?.addEventListener("click", () => {
    if (!selectedPlan) {
      document.getElementById("types").scrollIntoView({ behavior:"smooth", block:"center" });
      return;
    }
    openModal();
  });

  methodButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      localStorage.setItem("ursa_buy_method", btn.dataset.method);
      window.location.href = "./vip.html#chat";
    });
  });
})();
