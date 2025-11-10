// assets/js/vip.js (Логика двухшагового открытия модальных окон)

// 1. Получаем ссылки на элементы
const buyBtn = document.getElementById("vip-buy-btn");
const modalStep1 = document.getElementById("modal-step-1");
const btnRead = document.getElementById("btn-read");
const modalStep2 = document.getElementById("modal-step-2");

// 2. Функция для открытия модального окна
function openModal(modal) {
    if (modal) {
        modal.style.display = "flex";
        // Опционально: предотвращаем прокрутку фона
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

// 4. Логика шагов

// При нажатии "Оформить подписку" -> Открываем Шаг 1
if (buyBtn) {
    buyBtn.onclick = (e) => {
        e.preventDefault();
        openModal(modalStep1);
    };
}

// При нажатии "Я прочитал(а)" -> Закрываем Шаг 1 и Открываем Шаг 2
if (btnRead) {
    btnRead.onclick = () => {
        closeModal(modalStep1);
        openModal(modalStep2);
    };
}

// 5. Закрытие модальных окон при клике вне их области (UX улучшение)
window.onclick = (event) => {
    // Проверяем, был ли клик по модальному окну Шага 1
    if (event.target === modalStep1) {
        closeModal(modalStep1);
    }
    // Проверяем, был ли клик по модальному окну Шага 2
    if (event.target === modalStep2) {
        closeModal(modalStep2);
    }
};

// ТВОЙ СТАРЫЙ FIREBASE КОД (оставлен закомментированным, чтобы не мешать)
// import { auth, db } from "./app.js";
// import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

/* document.getElementById("vip-buy-btn").onclick = async () => {
    // Эта логика будет реализована позже, когда появится внутренний механизм активации.
};
*/

