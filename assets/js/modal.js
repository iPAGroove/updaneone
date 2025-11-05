const modalOverlay = document.getElementById('app-modal');

/**
 * Функция для расчета времени, прошедшего с даты, в формате "X (дни/часы/минуты) назад".
 * @param {Date} date - Дата в миллисекундах или объект Date.
 * @returns {string} Строка с относительным временем.
 */
function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} г. назад`;
    
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} мес. назад`;
    
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} дн. назад`;
    
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} ч. назад`;
    
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} мин. назад`;
    
    return `${Math.floor(seconds)} сек. назад`;
}


/**
 * Открывает модальное окно и наполняет его данными.
 * @param {object} data - Полный объект данных приложения, включая uploadTime.
 */
export function openModal(data) {
    if (!modalOverlay || !data) return;

    // 1. Наполнение контентом
    document.getElementById('modal-icon').src = data.img;
    document.getElementById('modal-icon').alt = `Іконка ${data.title}`;
    document.getElementById('modal-title').textContent = data.title;
    
    // Метаданные (Версия / Размер / Время)
    document.getElementById('modal-version').textContent = data.version;
    document.getElementById('modal-size').textContent = data.size;
    
    const timeAgo = timeSince(new Date(data.uploadTime));
    document.getElementById('modal-time-ago').textContent = timeAgo;
    
    // Функции мода: Заменяем запятые на переносы строк И УДАЛЯЕМ ЗАПЯТЫЕ
    // Заменяем запятую и пробел на перенос строки
    document.getElementById('modal-features').textContent = data.features.replace(/, /g, '\n').replace(/,/g, '\n');
    
    // Описание (центрированное)
    document.getElementById('modal-desc').textContent = data.desc;
    
    // 2. Настройка кнопки CTA: "УСТАНОВИТЬ"
    const ctaButton = document.getElementById('modal-cta');
    ctaButton.href = data.link; 
    ctaButton.textContent = `Установить`; 

    // 3. Отображение
    modalOverlay.classList.add('visible');
    document.body.classList.add('modal-open'); 
}

/**
 * Закрывает модальное окно.
 */
function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('visible');
    document.body.classList.remove('modal-open');
}

// 4. Обработчики закрытия
if (modalOverlay) {
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay || event.target.closest('[data-action="close"]')) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modalOverlay.classList.contains('visible')) {
            closeModal();
        }
    });
}
