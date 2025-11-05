// Импортируем состояние и функцию рендеринга из основного модуля (app.js)
import { currentCategory, setCurrentCategory, displayCatalog } from './app.js';

/**
 * Устанавливает обработчики событий для кнопок навигации.
 */
function setupNavigationEvents() {
    const tabbar = document.getElementById('tabbar');
    if (!tabbar) return;

    tabbar.addEventListener('click', (event) => {
        // Ищем ближайшую кнопку с классом .nav-btn
        const button = event.target.closest('.nav-btn');
        if (!button) return;

        const newCategory = button.getAttribute('data-tab');
        
        // Реагируем только на кнопки 'apps' и 'games'
        if (newCategory === 'apps' || newCategory === 'games') {
             // 1. Обновление активного класса
            tabbar.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 2. Обновление категории и рендеринг, только если категория изменилась
            // Используем экспортированную функцию для обновления состояния в app.js
            if (newCategory !== currentCategory) {
                setCurrentCategory(newCategory);
                console.log(`Категория изменена на: ${newCategory}`);
                // Вызываем экспортированную функцию рендеринга
                displayCatalog(); 
            }
        }
    });
}


// Запуск обработчиков
setupNavigationEvents();
