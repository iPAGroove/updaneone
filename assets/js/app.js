// Импорт необходимых модулей Firebase через CDN (ES Modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// 1. Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDFj9gOYU49Df6ohUR5CnbRv3qdY2i_OmU",
    authDomain: "ipa-panel.firebaseapp.com",
    databaseURL: "https://ipa-panel-default-rtdb.firebaseio.com",
    projectId: "ipa-panel",
    storageBucket: "ipa-panel.firebasestorage.app",
    messagingSenderId: "239982196215",
    appId: "1:239982196215:web:9de387c51952da428daaf2",
    measurementId: "G-YP1XRFEDXM"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Получаем инстанс Firestore

// =========================================================================
// Глобальное состояние
// =========================================================================
let __ALL_ITEMS_DATA = []; // Для хранения всех загруженных данных
let currentCategory = 'apps'; // Текущая активная категория (по умолчанию 'apps')

// =========================================================================
// 2. Функции рендеринга
// =========================================================================

/**
 * Генерирует HTML-разметку для одной карточки приложения.
 * @param {object} data - Объект с данными приложения.
 */
function createCardHtml(data) {
    const title = data.title || 'Unknown App';
    const subtitle = data.subtitle || 'No Info';
    const img = data.img || 'https://placehold.co/52x52/141a24/9aa7bd?text=APP'; // Использовано placeholder-изображение
    const cta = data.cta || 'Открыть';
    const link = data.link || '#';
    const badge = data.badge || '';
    
    const badgeHtml = badge 
        ? `<div class="card-badge">${badge}</div>` 
        : '';

    return `
        <article class="card"
            data-title="${title}"
            data-subtitle="${subtitle}"
            data-desc="${data.desc || ''}"
            data-img="${img}"
            data-tags="${data.tags || ''}"
            data-cta="${cta}"
            data-link="${link}">
            
            <div class="card-media">
                <img src="${img}" alt="${title} Icon" class="card-icon">
                ${badgeHtml}
            </div>
            <div class="card-info">
                <h3>${title}</h3>
                <p class="meta">${subtitle}</p>
            </div>
            <a href="${link}" class="card-cta" target="_blank">
                <span>${cta}</span>
            </a>
        </article>
    `;
}

/**
 * Распределяет и рендерит карточки по секциям каталога, основываясь на активной категории.
 * @param {Array<object>} itemsData - Массив объектов с данными приложений.
 * @param {string} category - Текущая активная категория ('apps' или 'games').
 */
function renderCatalog(itemsData, category) {
    const catalogContainer = document.getElementById('catalog');
    if (!catalogContainer) return;

    const collectionRows = catalogContainer.querySelectorAll('.collection-row');
    const LIMIT = 12; // Лимит выборки для заполнения 3 рядов

    collectionRows.forEach(row => {
        const carousel = row.querySelector('.card-carousel');
        const collectionTitle = row.querySelector('.collection-title').textContent.trim();
        
        // Очищаем карусель, чтобы удалить все заглушки
        carousel.innerHTML = ''; 

        // Фильтрация данных по категории и типу коллекции
        let filteredData = itemsData.filter(item => {
            // Преобразуем строку tags обратно в массив для точной проверки
            const tagsArray = item.tags.split(',').map(tag => tag.trim());
            const isVip = item.badge === 'VIP';
            
            // 1. Основной фильтр: элемент должен иметь тег текущей категории
            const matchesCategory = tagsArray.includes(category);
            if (!matchesCategory) return false;

            // 2. Вторичный фильтр: по типу коллекции
            if (collectionTitle === 'VIP') {
                return isVip; // В VIP-секции только VIP
            } else {
                // Popular и Update должны содержать не-VIP элементы
                return !isVip;
            }
        });
        
        // Сортировка (например, 'Update' по дате, 'Popular' по популярности - здесь просто срез)
        filteredData = filteredData.slice(0, LIMIT);

        // Рендеринг карточек
        filteredData.forEach(item => {
            carousel.insertAdjacentHTML('beforeend', createCardHtml(item));
        });
        
        // Добавляем заглушки для визуального заполнения (до 12 элементов)
        const numItems = filteredData.length;
        const totalPlaceholders = LIMIT; 
        for (let i = numItems; i < totalPlaceholders; i++) {
            carousel.insertAdjacentHTML('beforeend', '<article class="card placeholder"></article>');
        }
    });
}

/**
 * Обертка для рендеринга с использованием текущего состояния.
 */
function displayCatalog() {
    renderCatalog(__ALL_ITEMS_DATA, currentCategory);
}


// =========================================================================
// 3. Загрузка данных и обработка навигации
// =========================================================================

/**
 * Загружает данные из коллекции 'ursa_ipas' и преобразует их.
 */
async function loadDataFromFirestore() {
    try {
        const collectionRef = collection(db, 'ursa_ipas');
        const snapshot = await getDocs(collectionRef);
        
        const rawData = snapshot.docs.map(doc => doc.data());
        
        // --- ПРЕОБРАЗОВАНИЕ ПОЛЕЙ ПО ТВОЕЙ СТРУКТУРЕ ---
        const transformedData = rawData.map(item => ({
             // Маппинг полей из Firestore (левая сторона) в JS-объект (правая сторона)
             title: item.NAME || 'N/A', 
             subtitle: item.Version || 'N/A', 
             desc: item.description_ru || item.description_en || '', 
             img: item.iconUrl || 'https://placehold.co/52x52/141a24/9aa7bd?text=APP', 
             tags: Array.isArray(item.tags) ? item.tags.join(',') : '', // Массив в строку
             cta: 'Скачать', 
             link: item.DownloadUrl || '#', 
             // Логика бейджа: если vipOnly: true, ставим 'VIP'
             badge: item.vipOnly === true ? 'VIP' : (item.Badge || '') 
        }));

        __ALL_ITEMS_DATA = transformedData; // Сохраняем все данные
        console.log(`Успешно загружено ${__ALL_ITEMS_DATA.length} приложений. Начинаю рендеринг.`);
        displayCatalog(); // Отображаем каталог

    } catch (error) {
        console.error("❌ Критическая ошибка при загрузке данных из Firestore: ", error);
        // Если ошибка, очищаем данные и рендерим пустые заглушки
        __ALL_ITEMS_DATA = [];
        displayCatalog(); 
    }
}

/**
 * Устанавливает обработчики событий для кнопок навигации.
 */
function setupNavigationEvents() {
    const tabbar = document.getElementById('tabbar');
    if (!tabbar) return;

    tabbar.addEventListener('click', (event) => {
        const button = event.target.closest('.nav-btn');
        if (!button) return;

        const newCategory = button.getAttribute('data-tab');
        
        // Реагируем только на кнопки 'apps' и 'games'
        if (newCategory === 'apps' || newCategory === 'games') {
             // 1. Обновление активного класса
            tabbar.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 2. Обновление категории и рендеринг, только если категория изменилась
            if (newCategory !== currentCategory) {
                currentCategory = newCategory;
                console.log(`Категория изменена на: ${currentCategory}`);
                displayCatalog(); 
            }
        }
    });
}


// Запуск скрипта
setupNavigationEvents();
loadDataFromFirestore();
