console.log("PWA Home UI Loaded");

const tabs = document.querySelectorAll(".nav-btn");
const content = document.getElementById("content");

tabs.forEach(btn => {
    btn.addEventListener("click", () => {
        tabs.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const type = btn.dataset.tab;

        if (type === "apps") content.innerHTML = `<p>📱 Раздел приложений</p>`;
        if (type === "games") content.innerHTML = `<p>🎮 Раздел игр</p>`;
        if (type === "profile") content.innerHTML = `<p>👤 Профиль пользователя</p>`;
    });
});
