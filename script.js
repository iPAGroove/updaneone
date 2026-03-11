document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const udid = urlParams.get('udid');
    const resultDiv = document.getElementById('result');
    const udidDisplay = document.getElementById('udid-display');
    const copyBtn = document.getElementById('copy-btn');
    const enrollBtn = document.querySelector('.btn:not(.secondary)');
    const pText = document.querySelector('p');

    if (udid) {
        udidDisplay.textContent = udid;
        resultDiv.classList.remove('hidden');
        enrollBtn.classList.add('hidden');
        pText.classList.add('hidden');
    }

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(udid).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Скопировано!';
            copyBtn.style.background = 'rgba(50, 215, 75, 0.15)';
            copyBtn.style.color = '#32d74b';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
                copyBtn.style.color = '';
            }, 2000);
        });
    });
});
