// assets/js/vip.js (Логика открытия модальных окон)

// 1. Получаем ссылки на элементы
const buyBtn = document.getElementById("vip-buy-btn");
const modalStep1 = document.getElementById("modal-step-1");
const btnRead = document.getElementById("btn-read");
const modalStep2 = document.getElementById("modal-step-2");

// 2. Функция для открытия модального окна
function openModal(modal) {
    modal.style.display = "flex";
    // Опционально: предотвращаем прокрутку фона
    document.body.style.overflow = "hidden";
}

// 3. Функция для закрытия модального окна
function closeModal(modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";
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
    if (event.target === modalStep1) {
        closeModal(modalStep1);
    }
    if (event.target === modalStep2) {
        closeModal(modalStep2);
    }
};

// ТВОЙ СТАРЫЙ FIREBASE КОД (теперь не используется для кнопки)
// import { auth, db } from "./app.js";
// import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

/* document.getElementById("vip-buy-btn").onclick = async () => {
    // Эта логика будет перемещена на страницу, куда ведет ссылка оплаты,
    // или будет выполняться после ручной проверки чека саппортом.
    // Пока оставляем ее закомментированной, чтобы не мешала новой логике.
};
*/
