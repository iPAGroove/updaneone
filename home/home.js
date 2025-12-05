console.log("PWA Home Loaded");

const tabs = document.querySelectorAll(".nav-btn");
const content = document.getElementById("content");

function render(tab) {
  if (tab==="apps") return content.innerHTML="📱 Apps";
  if (tab==="games") return content.innerHTML="🎮 Games";
  if (tab==="profile") return content.innerHTML="👤 Profile";
}

tabs.forEach(b=>b.addEventListener("click",()=>{
  tabs.forEach(t=>t.classList.remove("active"));
  b.classList.add("active");
  render(b.dataset.tab);
}));

render("apps");
