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
        // ✅ В режиме PWA: показываем заглушку запуска
        promptEl.style.display = 'none';
        mainAppEl.style.display = 'block';
        
        // 🔥 ВНИМАНИЕ: Здесь нужно будет выполнить перенаправление на основной интерфейс PWA.
        // Например: window.location.replace('/app.html');
        // На этом этапе оставляем просто консоль-лог, чтобы видеть, что логика сработала.
        console.log("✅ Обнаружен режим PWA. Готов к загрузке основного контента.");

    } else {
        // ⚠️ Не в режиме PWA: показываем инструкцию
        promptEl.style.display = 'block';
        mainAppEl.style.display = 'none';
        console.log("⚠️ Не обнаружен режим PWA. Отображаем инструкцию по установке.");
    }
    
    // 2. Обработчик кнопки "Я уже добавил"
    installedBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Временно просто скрываем инструкцию, чтобы дать пользователю пройти
        promptEl.style.display = 'none';
        mainAppEl.style.display = 'block';
    });
});

// 3. Регистрация Service Worker (Обязательно для PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('✅ Service Worker зарегистрирован:', reg.scope))
            .catch(err => console.error('❌ Service Worker ошибка:', err));
    });
}
