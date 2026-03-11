document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const udid = urlParams.get('udid');

    if (udid) {
        document.getElementById('udid-display').textContent = udid;
        document.getElementById('result').classList.remove('hidden');
    }
});
