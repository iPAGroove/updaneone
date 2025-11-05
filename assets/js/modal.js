const modalOverlay = document.getElementById('app-modal');

/**
 * Открывает модальное окно и наполняет его данными.
 * @param {object} data - Полный объект данных приложения.
 */
export function openModal(data) {
    if (!modalOverlay || !data) return;

    // 1. Наполнение контентом
    document.getElementById('modal-icon').src = data.img;
    document.getElementById('modal-icon').alt = `Іконка ${data.title}`;
    document.getElementById('modal-title').textContent = data.title;
    document.getElementById('modal-subtitle').textContent = data.subtitle;
    document.getElementById('modal-desc').textContent = data.desc;

    document.getElementById('modal-version').textContent = data.version;
    document.getElementById('modal-ios').textContent = data.ios;
    document.getElementById('modal-tags').textContent = data.tags.replace(/,/g, ', ');
    document.getElementById('modal-size').textContent = data.size;
    document.getElementById('modal-features').textContent = data.features;

    // 2. Настройка кнопки CTA
    const ctaButton = document.getElementById('modal-cta');
    ctaButton.href = data.link; 
    ctaButton.textContent = `Открыть ${data.title}`;

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
        // Закрытие при клике на оверлей или кнопку "✕"
        if (event.target === modalOverlay || event.target.closest('[data-action="close"]')) {
            closeModal();
        }
    });

    // Закрытие по клавише Esc
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modalOverlay.classList.contains('visible')) {
            closeModal();
        }
    });
}
