document.addEventListener("DOMContentLoaded", () => {
    // Ищем параметр udid в адресной строке
    const urlParams = new URLSearchParams(window.location.search);
    const udid = urlParams.get('udid');

    if (udid) {
        // Если UDID есть, показываем его
        document.getElementById('udid-display').textContent = udid;
        document.getElementById('result').classList.remove('hidden');
    }
});
