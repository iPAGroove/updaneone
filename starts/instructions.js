// starts/instructions.js

document.addEventListener('DOMContentLoaded', () => {
    const promptEl = document.getElementById('pwa-install-prompt');
    const mainAppEl = document.getElementById('pwa-main-app');
    const installedBtn = document.getElementById('i-already-installed');

    // 1. Проверка режима PWA (standalone)
    const isStandalone = (window.matchMedia('(display-mode: standalone)').matches || 
                          document.referrer.includes('android-app://') || 
                          navigator.standalone);

    if (isStandalone) {
        // ✅ В режиме PWA: немедленно перенаправляем на основной каталог
        window.location.replace('/app.html'); 
        
    } else {
        // ⚠️ Не в режиме PWA: показываем инструкцию
        promptEl.style.display = 'block';
        mainAppEl.style.display = 'none';
    }
    
    // 2. Обработчик кнопки "Я уже добавил" (Fallback, если PWA не зарегистрировалось)
    installedBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Временно перенаправляем, пока пользователь не добавит сайт корректно
        window.location.replace('/app.html');
    });
});
