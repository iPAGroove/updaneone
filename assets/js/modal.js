const modalOverlay = document.getElementById('app-modal');

/**
 * Функция для расчета прошедшего времени "X ... назад".
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
 */
export function openModal(data) {
    if (!modalOverlay || !data) return;

    // Иконка + название
    document.getElementById('modal-icon').src = data.img;
    document.getElementById('modal-icon').alt = `Іконка ${data.title}`;
    document.getElementById('modal-title').textContent = data.title;

    // Мета
    document.getElementById('modal-version').textContent = data.version;
    document.getElementById('modal-size').textContent = data.size;
    document.getElementById('modal-time-ago').textContent = timeSince(new Date(data.uploadTime));

    // ✅ ФУНКЦИИ МОДА — ЧИСТО И ЦЕНТРИРОВАНО
    document.getElementById('modal-features').textContent =
        (data.features || '')
            .replace(/функции мода/gi, '') // убираем дубли
            .replace(/,\s*/g, '\n')        // запятые → перенос строки
            .replace(/\n{2,}/g, '\n')      // убираем двойные пустые строки
            .trim();

    // Описание
    document.getElementById('modal-desc').textContent = data.desc;

    // CTA
    const ctaButton = document.getElementById('modal-cta');
    ctaButton.href = data.link;
    ctaButton.textContent = `Установить`;

    // Показ модалки
    modalOverlay.classList.add('visible');
    document.body.classList.add('modal-open');
}

/**
 * Закрытие модального окна.
 */
function closeModal() {
    modalOverlay.classList.remove('visible');
    document.body.classList.remove('modal-open');
}

// Закрытие по клику и Escape
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
