const modalOverlay = document.getElementById('app-modal');

/**
 * Функция для расчета прошедшего времени в формате "X ... назад".
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
 * Открывает модалку и заполняет её контент.
 */
export function openModal(data) {
    if (!modalOverlay || !data) return;

    document.getElementById('modal-icon').src = data.img;
    document.getElementById('modal-icon').alt = `Іконка ${data.title}`;
    document.getElementById('modal-title').textContent = data.title;

    document.getElementById('modal-version').textContent = data.version;
    document.getElementById('modal-size').textContent = data.size;

    const timeAgo = timeSince(new Date(data.uploadTime));
    document.getElementById('modal-time-ago').textContent = timeAgo;

    // ✅ Ровное форматирование списка функций без лишних пробелов
    document.getElementById('modal-features').textContent =
        (data.features || '')
            .replace(/,\s*/g, '\n') // запятые → перенос строки
            .trim();                // убираем лишние пустые строки
    
    // Описание
    document.getElementById('modal-desc').textContent = data.desc;

    // CTA кнопка
    const ctaButton = document.getElementById('modal-cta');
    ctaButton.href = data.link;
    ctaButton.textContent = `Установить`;

    modalOverlay.classList.add('visible');
    document.body.classList.add('modal-open');
}

/**
 * Закрытие модалки
 */
function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('visible');
    document.body.classList.remove('modal-open');
}

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
