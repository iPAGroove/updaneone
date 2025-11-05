assets/js/app.js

// =========================================================================
// !!! НАСТРОЙКИ FIREBASE !!!
// 1. Раскомментируй Firebase SDK в index.html
// 2. Вставь сюда свою конфигурацию проекта:
const FIREBASE_CONFIG = {
    // apiKey: "...",
    // authDomain: "...",
    // projectId: "ipa-panel", // Проверь, что этот ID совпадает
    // storageBucket: "...",
    // messagingSenderId: "...",
    // appId: "..."
};
// const app = firebase.initializeApp(FIREBASE_CONFIG);
// const db = firebase.firestore();
// =========================================================================


// Функция для создания HTML-разметки одной карточки
function createCardHtml(data) {
    // Разметка для бейджа (если есть data.badge)
    const badgeHtml = data.badge 
        ? `<div class="card-badge">${data.badge}</div>` 
        : '';
        
    // data-badge нужен для CSS, но для пустого значения мы его не выводим
    const dataBadgeAttr = data.badge ? `data-badge="${data.badge}"` : '';

    return `
        <article class="card"
            data-title="${data.title || ''}"
            data-subtitle="${data.subtitle || ''}"
            data-desc="${data.desc || ''}"
            data-img="${data.img || ''}"
            data-tags="${data.tags || ''}"
            data-cta="${data.cta || 'Скачать'}"
            data-link="${data.link || '#'}">
            
            <div class="card-media">
                <img src="${data.img || 'https://picsum.photos/52'}" alt="${data.title || 'App'} Icon" class="card-icon">
                ${badgeHtml}
            </div>
            <div class="card-info">
                <h3>${data.title || 'Название не указано'}</h3>
                <p class="meta">${data.subtitle || 'Описание отсутствует'}</p>
            </div>
            <a href="${data.link || '#'}" class="card-cta" target="_blank">
                <span>${data.cta || 'Открыть'}</span>
            </a>
        </article>
    `;
}

// ГЛАВНАЯ ФУНКЦИЯ: Загрузка данных и рендеринг каталога
async function loadAndRenderCatalog(itemsData) {
    const catalogContainer = document.getElementById('catalog');
    if (!catalogContainer) return;

    // --- MOCKUP ДАННЫХ (УДАЛИ ЭТОТ БЛОК после подключения Firebase) ---
    // Этот массив имитирует данные, которые ты получишь из Firestore
    const mockData = [
        { title: "Subway Surfers", subtitle: "v3.17 • Mod Menu", desc: "...", img: "https://picsum.photos/seed/ursa1/800/420", tags: "Runner,Offline", cta: "Скачать", link: "#", badge: "VIP" },
        { title: "Minecraft PE", subtitle: "v1.20 • Full Unlock", desc: "...", img: "https://picsum.photos/seed/ursa2/800/420", tags: "Sandbox,Paid", cta: "Установить", link: "#", badge: "New" },
        { title: "Shadow Fight 3", subtitle: "v1.28 • Unlimited", desc: "...", img: "https://picsum.photos/seed/ursa3/800/420", tags: "Fighting", cta: "Скачать", link: "#", badge: "" },
        // Дублируем для заполнения
        { title: "Game 4", subtitle: "v1.0", desc: "...", img: "https://picsum.photos/seed/ursa4/800/420", tags: "Game", cta: "Скачать", link: "#", badge: "" },
        { title: "Game 5", subtitle: "v1.1", desc: "...", img: "https://picsum.photos/seed/ursa5/800/420", tags: "Game", cta: "Скачать", link: "#", badge: "VIP" },
        { title: "Game 6", subtitle: "v1.2", desc: "...", img: "https://picsum.photos/seed/ursa6/800/420", tags: "Game", cta: "Скачать", link: "#", badge: "" },
        { title: "Game 7", subtitle: "v1.3", desc: "...", img: "https://picsum.photos/seed/ursa7/800/420", tags: "Game", cta: "Скачать", link: "#", badge: "" },
        { title: "Game 8", subtitle: "v1.4", desc: "...", img: "https://picsum.photos/seed/ursa8/800/420", tags: "Game", cta: "Скачать", link: "#", badge: "" },
    ];
    itemsData = mockData;
    // -----------------------------------------------------------------


    // Находим все секции коллекций
    const collectionRows = catalogContainer.querySelectorAll('.collection-row');

    collectionRows.forEach(row => {
        const carousel = row.querySelector('.card-carousel');
        const collectionTitle = row.querySelector('.collection-title').textContent.trim();
        
        // 1. Очищаем карусель, чтобы удалить все заглушки
        carousel.innerHTML = ''; 

        // 2. Фильтрация данных для конкретной секции
        let filteredData = [];
        
        if (collectionTitle === 'Popular') {
            // Например, первые 8 элементов
            filteredData = itemsData.slice(0, 8); 
        } else if (collectionTitle === 'Update') {
            // Элементы, помеченные как 'New' или отфильтрованные по дате
            filteredData = itemsData.filter(item => item.badge === 'New' || item.subtitle.includes('v1.20')).slice(0, 8);
        } else if (collectionTitle === 'VIP') {
            // Только элементы с бейджем 'VIP'
            filteredData = itemsData.filter(item => item.badge === 'VIP').slice(0, 8);
        }

        // 3. Рендеринг карточек
        filteredData.forEach(item => {
            carousel.insertAdjacentHTML('beforeend', createCardHtml(item));
        });
        
        // 4. Добавляем заглушки для визуального заполнения (до 12 элементов)
        const numItems = filteredData.length;
        const totalPlaceholders = 12; // 3 ряда по 4 на десктопе, или просто для заполнения
        for (let i = numItems; i < totalPlaceholders; i++) {
            carousel.insertAdjacentHTML('beforeend', '<article class="card placeholder"></article>');
        }
    });
}

// -------------------------------------------------------------------------
// Адаптация для Firestore (после настройки)
// -------------------------------------------------------------------------
async function loadDataFromFirestore() {
    // В Firestore у тебя путь: /ursa_ipas/{docId}. 
    // Предположим, что все данные находятся в одной коллекции 'ursa_ipas'
    /*
    try {
        const snapshot = await db.collection('ursa_ipas').get();
        const rawData = snapshot.docs.map(doc => doc.data());
        
        // Тут нужно преобразовать поля из Firestore в формат, который ожидает createCardHtml:
        // { title: '...', subtitle: '...', img: '...', link: '...', badge: '...' }
        // Если структура твоих документов Firestore отличается от этого, 
        // измени логику преобразования (например, item.app_name -> item.title)
        
        const transformedData = rawData.map(item => ({
             title: item.Name, // Пример, если в базе поле называется Name
             subtitle: item.Version, // Пример
             desc: item.Description, // Пример
             img: item.IconURL, // Пример
             tags: item.Tags, // Пример
             cta: 'Скачать', // Фиксированное значение
             link: item.DownloadLink, // Пример
             badge: item.Badge || '' // Если поля нет, будет пустая строка
        }));

        loadAndRenderCatalog(transformedData);

    } catch (error) {
        console.error("Ошибка загрузки данных из Firestore: ", error);
        // Если ошибка, можно запустить рендеринг с пустыми данными или заглушками
        loadAndRenderCatalog([]); 
    }
    */
    
    // Пока Firebase не подключен, запускаем с мок-данными:
    loadAndRenderCatalog();
}


// Запуск скрипта после загрузки DOM
document.addEventListener('DOMContentLoaded', loadDataFromFirestore);
