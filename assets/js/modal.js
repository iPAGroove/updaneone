assets/js/modal.js
const modalOverlay = document.getElementById('app-modal');
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
export function openModal(data) {
    if (!modalOverlay || !data) return;
    document.getElementById('modal-icon').src = data.img;
    document.getElementById('modal-title').textContent = data.title;
    document.getElementById('modal-version').textContent = data.version;
    document.getElementById('modal-size').textContent = data.size;
    document.getElementById('modal-time-ago').textContent = timeSince(new Date(data.uploadTime));
    // ✅ Форматируем функции
    const featuresFormatted = (data.features || "")
        .replace(/,\s*/g, '\n')
        .trim();
    document.getElementById('modal-features').textContent = featuresFormatted;
    // ✅ Убираем описание, если оно дублирует "Функции мода"
    let desc = (data.desc || "").trim();
    if (
        desc.toLowerCase() === "функции мода" ||
        desc.toLowerCase() === "hack features" ||
        desc === "" ||
        desc === featuresFormatted ||
        desc.replace(/\s+/g, '') === featuresFormatted.replace(/\s+/g, '')
    ) {
        desc = "";
    }
    document.getElementById('modal-desc').textContent = desc;
    const ctaButton = document.getElementById('modal-cta');
    ctaButton.href = data.link;
    ctaButton.textContent = "Установить";
    modalOverlay.classList.add('visible');
    document.body.classList.add('modal-open');
}
function closeModal() {
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
