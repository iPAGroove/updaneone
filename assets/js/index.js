document.getElementById('checkPwaBtn').addEventListener('click', () => {
    const isPwa = window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone;

    if (isPwa) {
        window.location.href = "home.html";
    } else {
        alert("⚠️ Пожалуйста, установите приложение на главный экран!");
    }
});
