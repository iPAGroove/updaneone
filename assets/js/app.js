assets/js/app.js

// Импорт необходимых модулей Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// 1. Твоя конфигурация Firebase
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
// getAnalytics(app); // Аналитику можно не импортировать, если она не нужна прямо сейчас

// =========================================================================
// 2. Функции рендеринга
// =========================================================================

/**
 * Генерирует HTML-разметку для одной карточки приложения.
 * @param {object} data - Объект с данными приложения.
 */
function createCardHtml(data) {
    // Безопасное получение данных с дефолтными значениями
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

    collectionRows.forEach(row => {
        const carousel = row.querySelector('.card-carousel');
        const collectionTitle = row.querySelector('.collection-title').textContent.trim();
        
        // Очищаем карусель, чтобы удалить все заглушки
        carousel.innerHTML = ''; 

        // Логика фильтрации по коллекциям:
        let filteredData = [];
        
        if (collectionTitle === 'Popular') {
            // Берем 8 самых популярных (можно добавить поле 'popular' в Firestore)
            filteredData = itemsData.slice(0, 8); 
        } else if (collectionTitle === 'Update') {
            // Элементы, помеченные как 'New' или отфильтрованные по дате/версии
            filteredData = itemsData.filter(item => item.badge === 'New' || (item.subtitle && item.subtitle.includes('v3'))).slice(0, 8);
        } else if (collectionTitle === 'VIP') {
            // Только элементы с бейджем 'VIP'
            filteredData = itemsData.filter(item => item.badge === 'VIP').slice(0, 8);
        }

        // Рендеринг карточек
        filteredData.forEach(item => {
            carousel.insertAdjacentHTML('beforeend', createCardHtml(item));
        });
        
        // Добавляем заглушки для визуального заполнения (до 12 элементов)
        const numItems = filteredData.length;
        const totalPlaceholders = 12; 
        for (let i = numItems; i < totalPlaceholders; i++) {
            carousel.insertAdjacentHTML('beforeend', '<article class="card placeholder"></article>');
        }
    });
}

// =========================================================================
// 3. Загрузка данных из Firestore
// =========================================================================

/**
 * Загружает данные из коллекции 'ursa_ipas' и преобразует их.
 */
async function loadDataFromFirestore() {
    try {
        // Указываем путь к коллекции 'ursa_ipas'
        const collectionRef = collection(db, 'ursa_ipas');
        const snapshot = await getDocs(collectionRef);
        
        // Преобразуем документы Firestore в нужный формат
        const rawData = snapshot.docs.map(doc => doc.data());
        
        // Преобразование полей (нужно адаптировать, если поля в базе называются иначе!)
        const transformedData = rawData.map(item => ({
             // ПРОВЕРЬ эти названия полей! Они должны совпадать с твоей структурой Firestore.
             title: item.Name || item.title, 
             subtitle: item.Version || item.subtitle, 
             desc: item.Description || item.desc, 
             img: item.IconURL || item.iconUrl, 
             tags: item.Tags || item.tags,
             cta: item.CTA || 'Скачать', // Используй твой CTA, если есть
             link: item.DownloadLink || item.link, 
             badge: item.Badge || '' 
        }));

        console.log(`Успешно загружено ${transformedData.length} приложений.`);
        renderCatalog(transformedData);

    } catch (error) {
        console.error("❌ Ошибка загрузки данных из Firestore: ", error);
        // Если ошибка, можно показать пустой каталог
        renderCatalog([]); 
    }
}


// Запуск скрипта
loadDataFromFirestore();
