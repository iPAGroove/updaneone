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
// 2. Функции рендеринга
// =========================================================================

/**
 * Генерирует HTML-разметку для одной карточки приложения.
 * @param {object} data - Объект с данными приложения.
 */
function createCardHtml(data) {
    const title = data.title || 'Unknown App';
    const subtitle = data.subtitle || 'No Info';
    const img = data.img || 'https://picsum.photos/seed/default/52';
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
 * Распределяет и рендерит карточки по секциям каталога.
 * @param {Array<object>} itemsData - Массив объектов с данными приложений.
 */
function renderCatalog(itemsData) {
    const catalogContainer = document.getElementById('catalog');
    if (!catalogContainer) return;

    // Находим все секции коллекций
    const collectionRows = catalogContainer.querySelectorAll('.collection-row');
    const LIMIT = 12; // Увеличиваем лимит выборки до 12

    collectionRows.forEach(row => {
        const carousel = row.querySelector('.card-carousel');
        const collectionTitle = row.querySelector('.collection-title').textContent.trim();
        
        // Очищаем карусель, чтобы удалить все заглушки, включая плейсхолдеры
        carousel.innerHTML = ''; 

        let filteredData = [];
        
        // --- ОБНОВЛЕННАЯ ЛОГИКА ФИЛЬТРАЦИИ ---
        if (collectionTitle === 'Popular') {
            // Фильтруем: не VIP И не 'games' (предполагаем, что tags - это строка, разделенная запятыми, 
            // но в transformedData мы используем join, поэтому тут можно фильтровать по массиву, если его восстановить)
            
            // NOTE: item.tags в transformedData - это строка. Лучше фильтровать по исходному массиву в Firestore (если он доступен)
            // Но в нашей структуре, где мы не можем изменить преобразование данных, мы будем работать со строкой.
            
            filteredData = itemsData.filter(item => {
                // Преобразуем строку tags обратно в массив для точной проверки
                const tagsArray = item.tags.split(',');
                // Проверяем, что не VIP и не игра
                const isNotVip = item.badge !== 'VIP';
                const isApp = tagsArray.includes('apps') && !tagsArray.includes('games');
                return isNotVip && isApp;
            }).slice(0, LIMIT);
             // Если не нашли 'apps', берем просто не VIP, как резервный вариант
            if (filteredData.length === 0) {
                 filteredData = itemsData.filter(item => item.badge !== 'VIP').slice(0, LIMIT);
            }
        } else if (collectionTitle === 'Update') {
            // Берем 12 самых новых (все, кроме VIP, которые являются играми)
             filteredData = itemsData.filter(item => {
                const tagsArray = item.tags.split(',');
                // Проверяем, что не VIP И игра
                const isNotVip = item.badge !== 'VIP';
                const isGame = tagsArray.includes('games') && !tagsArray.includes('apps');
                return isNotVip && isGame;
            }).slice(0, LIMIT);
             // Если не нашли 'games', берем просто не VIP, как резервный вариант
            if (filteredData.length === 0) {
                 filteredData = itemsData.filter(item => item.badge !== 'VIP').slice(0, LIMIT);
            }
        } else if (collectionTitle === 'VIP') {
            // Только элементы с бейджем 'VIP', берем 12
            filteredData = itemsData.filter(item => item.badge === 'VIP').slice(0, LIMIT);
        }

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

// =========================================================================
// 3. Загрузка данных из Firestore (КРИТИЧЕСКИЙ БЛОК)
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

        console.log(`Успешно загружено ${transformedData.length} приложений. Начинаю рендеринг.`);
        renderCatalog(transformedData);

    } catch (error) {
        console.error("❌ Критическая ошибка при загрузке данных из Firestore: ", error);
        // Если ошибка, рендерим только пустые заглушки
        renderCatalog([]); 
    }
}


// Запуск скрипта
loadDataFromFirestore();
