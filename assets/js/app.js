// Импорт модулей
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { openModal } from './modal.js';

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
const db = getFirestore(app); 

// Глобальное состояние
let __ALL_ITEMS_DATA = []; 
export let currentCategory = 'apps'; 

export function setCurrentCategory(newCategory) {
    currentCategory = newCategory;
}

// Функции рендеринга
function createCardHtml(data) {
    const title = data.title || 'Unknown App';
    const subtitle = data.subtitle || 'No Info';
    const img = data.img || 'https://placehold.co/52x52/141a24/9aa7bd?text=APP'; 
    const badge = data.badge || '';
    
    const badgeHtml = badge 
        ? `<div class="card-badge">${badge}</div>` 
        : '';

    return `
        <article class="card"
            data-id="${data.id}" 
            data-title="${title}"
            data-subtitle="${subtitle}"
            data-desc="${data.desc || ''}"
            data-img="${img}"
            data-tags="${data.tags || ''}"
            data-cta="Открыть"
            data-link="${data.link || '#'}">
            
            <div class="card-media">
                <img src="${img}" alt="Іконка ${title}" class="card-icon">
                ${badgeHtml}
            </div>
            <div class="card-info">
                <h3>${title}</h3>
                <p class="meta">${subtitle}</p>
            </div>
            
            <button class="card-cta open-modal-btn" data-id="${data.id}">
                <span>Открыть</span>
            </button>
        </article>
    `;
}

function attachModalOpenListeners(carousel) {
    carousel.addEventListener('click', (event) => {
        const button = event.target.closest('.open-modal-btn');
        if (button) {
            const itemId = button.getAttribute('data-id');
            const itemData = __ALL_ITEMS_DATA.find(item => item.id === itemId);
            if (itemData) {
                openModal(itemData);
            }
        }
    });
}

export function displayCatalog() {
    const catalogContainer = document.getElementById('catalog');
    if (!catalogContainer) return;

    const collectionRows = catalogContainer.querySelectorAll('.collection-row');
    const LIMIT = 12;

    collectionRows.forEach(row => {
        const carousel = row.querySelector('.card-carousel');
        const collectionTitle = row.querySelector('.collection-title').textContent.trim();
        
        carousel.innerHTML = ''; 

        let filteredData = __ALL_ITEMS_DATA.filter(item => {
            const tagsArray = item.tags.split(',').map(tag => tag.trim());
            const isVip = item.badge === 'VIP';
            
            const matchesCategory = tagsArray.includes(currentCategory);
            if (!matchesCategory) return false;

            if (collectionTitle === 'VIP') {
                return isVip; 
            } else {
                return !isVip;
            }
        }).slice(0, LIMIT);

        filteredData.forEach(item => {
            carousel.insertAdjacentHTML('beforeend', createCardHtml(item));
        });
        
        attachModalOpenListeners(carousel);
        
        // Добавляем заглушки
        const numItems = filteredData.length;
        const totalPlaceholders = LIMIT; 
        for (let i = numItems; i < totalPlaceholders; i++) {
            carousel.insertAdjacentHTML('beforeend', '<article class="card placeholder"></article>');
        }
    });
}

// Загрузка данных
async function loadDataFromFirestore() {
    try {
        const collectionRef = collection(db, 'ursa_ipas');
        const snapshot = await getDocs(collectionRef);
        
        const rawData = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id 
        }));
        
        // Преобразование полей по твоей структуре
        const transformedData = rawData.map(item => ({
             id: item.id,
             title: item.NAME || 'N/A', 
             subtitle: item.Version || 'N/A', 
             desc: item.description_ru || item.description_en || 'Опис відсутній.', 
             img: item.iconUrl || 'https://placehold.co/52x52/141a24/9aa7bd?text=APP', 
             tags: Array.isArray(item.tags) ? item.tags.join(',') : '', 
             cta: 'Открыть', 
             link: item.DownloadUrl || '#', 
             version: item.Version || 'N/A', 
             ios: item['minimal iOS'] || 'N/A',
             size: item.sizeBytes ? `${(item.sizeBytes / 1048576).toFixed(1)} MB` : 'N/A',
             features: item.features_ru || item.features_en || 'Немає',
             badge: item.vipOnly === true ? 'VIP' : (item.Badge || ''),
             // Используем item.createdAt (строка ISO) для расчета времени
             uploadTime: item.createdAt ? new Date(item.createdAt).getTime() : new Date().getTime()
        }));

        __ALL_ITEMS_DATA = transformedData; 
        console.log(`Успешно загружено ${__ALL_ITEMS_DATA.length} приложений. Начинаю рендеринг.`);
        displayCatalog(); 

    } catch (error) {
        console.error("❌ Критическая ошибка при загрузке данных из Firestore: ", error);
        __ALL_ITEMS_DATA = [];
        displayCatalog(); 
    }
}

loadDataFromFirestore();
