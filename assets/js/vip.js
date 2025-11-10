// assets/js/vip.js (Логика открытия модальных окон - Прямой переход к Шагу 2)

// 1. Получаем ссылки на элементы
const buyBtn = document.getElementById("vip-buy-btn");
// Нам нужен только модальный блок для выбора оплаты
const modalStep2 = document.getElementById("modal-step-2"); 

// 2. Функция для открытия модального окна
function openModal(modal) {
    if (modal) {
        modal.style.display = "flex";
        // Предотвращаем прокрутку фона
        document.body.style.overflow = "hidden";
    }
}

// 3. Функция для закрытия модального окна
function closeModal(modal) {
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "";
    }
}

// 4. Логика: Кнопка "Оформить подписку" СРАЗУ открывает окно выбора оплаты
if (buyBtn) {
    buyBtn.onclick = (e) => {
        e.preventDefault();
        openModal(modalStep2); 
    };
}

// 5. Закрытие модального окна при клике вне его области (UX улучшение)
window.onclick = (event) => {
    if (event.target === modalStep2) {
        closeModal(modalStep2);
    }
};

// ТВОИ СТАРЫЕ ИМПОРТЫ FIREBASE
// import { auth, db } from "./app.js";
// import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
