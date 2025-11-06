import { currentCategory, setCurrentCategory, displayCatalog } from './app.js';

function setupNavigationEvents() {
    const tabbar = document.getElementById('tabbar');
    if (!tabbar) return;

    tabbar.addEventListener('click', (event) => {
        const button = event.target.closest('.nav-btn');
        if (!button) return;

        const newCategory = button.getAttribute('data-tab');

        if (newCategory === 'apps' || newCategory === 'games') {
            tabbar.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            if (newCategory !== currentCategory) {
                setCurrentCategory(newCategory);
                console.log(`Категория изменена на: ${newCategory}`);
                displayCatalog();
            }
        }
    });
}

setupNavigationEvents();
