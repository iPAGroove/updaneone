console.log("URSA App Loaded");

const tabs = document.querySelectorAll(".nav-btn");
const content = document.getElementById("content");

function setTab(tab) {
  if (tab === "apps") content.innerHTML = "📱 Apps";
  if (tab === "games") content.innerHTML = "🎮 Games";
  if (tab === "profile") content.innerHTML = "👤 Profile";
}

tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    setTab(btn.dataset.tab);
  });
});

setTab("apps");
