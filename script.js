document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const udid = urlParams.get('udid');
    const resultDiv = document.getElementById('result');
    const udidDisplay = document.getElementById('udid-display');
    const copyBtn = document.getElementById('copy-btn');
    const enrollBtn = document.getElementById('enroll-btn');
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
            copyBtn.textContent = 'Copied!';
            copyBtn.style.borderColor = '#32d74b';
            copyBtn.style.color = '#32d74b';
            copyBtn.style.textShadow = '0 0 8px rgba(50, 215, 75, 0.4)';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.borderColor = '';
                copyBtn.style.color = '';
                copyBtn.style.textShadow = '';
            }, 2000);
        });
    });
});
