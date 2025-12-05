// home/home.js
console.log("PWA Home UI Loaded");

const tabs = document.querySelectorAll(".nav-btn");
const content = document.getElementById("content");

function setTab(type) {
    if (type === "apps") {
        content.innerHTML = `<p>📱 Раздел приложений</p>`;
    } else if (type === "games") {
        content.innerHTML = `<p>🎮 Раздел игр</p>`;
    } else if (type === "profile") {
        content.innerHTML = `<p>👤 Профиль пользователя</p>`;
    }
}

tabs.forEach(btn => {
    btn.addEventListener("click", () => {
        tabs.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        setTab(btn.dataset.tab);
    });
});

// стартовое состояние
setTab("apps");
